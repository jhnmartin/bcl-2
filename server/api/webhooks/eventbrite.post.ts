import { createHmac, timingSafeEqual } from 'node:crypto';
import { serverSupabaseClient } from '#supabase/server';
import { useRuntimeConfig } from '#imports';
import { createError, defineEventHandler, getHeader, readRawBody } from 'h3';
import { z } from 'zod';
import type { Database, TablesInsert } from '~/types/database.types';

const eventbritePayloadSchema = z
  .object({
    api_url: z.string().url().optional(),
    action: z.string().optional(),
    event_id: z.string().optional(),
    config: z
      .object({
        action: z.string().optional(),
        endpoint_url: z.string().optional(),
        event_id: z.string().optional(),
        event_name: z.string().optional(),
        organization_id: z.string().optional(),
        user_id: z.string().optional(),
        webhook_id: z.string().optional(),
      })
      .partial()
      .optional(),
    resource: z
      .object({
        attendee_id: z.string().optional(),
        event_id: z.string().optional(),
        order_id: z.string().optional(),
        quantity: z.coerce.number().optional(),
        status: z.string().optional(),
        ticket_class_id: z.string().optional(),
        ticket_class_name: z.string().optional(),
      })
      .partial()
      .optional(),
  })
  .passthrough();

type EventbriteMoney = {
  currency?: string | null;
  display?: string | null;
  value?: number | null;
};

type EventbriteOrder = {
  id?: string;
  event_id?: string;
  status?: string;
  created?: string;
  changed?: string;
  costs?: {
    base_price?: EventbriteMoney | null;
    gross?: EventbriteMoney | null;
    fees?: EventbriteMoney | null;
    net?: EventbriteMoney | null;
    tax?: EventbriteMoney | null;
    total?: EventbriteMoney | null;
  } | null;
  email?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile?: {
    name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  attendees?: Array<{
    id?: string;
    status?: string;
    quantity?: number | null;
    ticket_class_id?: string | null;
    ticket_class_name?: string | null;
  }>;
};

type OrderInsert = TablesInsert<'orders'>;
type CrawlInsert = TablesInsert<'crawls'>;

type EventbriteEvent = {
  id?: string;
  name?: {
    text?: string;
    html?: string;
  };
  description?: {
    text?: string;
    html?: string;
  };
  start?: {
    timezone?: string;
    local?: string;
    utc?: string;
  };
  end?: {
    timezone?: string;
    local?: string;
    utc?: string;
  };
  url?: string;
  currency?: string;
  online_event?: boolean;
  organization_id?: string;
  organizer_id?: string;
  venue_id?: string;
  venue?: {
    id?: string;
    name?: string;
    address?: {
      address_1?: string;
      address_2?: string;
      city?: string;
      region?: string;
      postal_code?: string;
      country?: string;
    };
  };
  ticket_availability?: {
    has_available_tickets?: boolean;
    minimum_ticket_price?: EventbriteMoney | null;
    maximum_ticket_price?: EventbriteMoney | null;
    is_sold_out?: boolean;
  };
  status?: string;
  created?: string;
  changed?: string;
  published?: string;
};

type EventbriteSeries = {
  id?: string;
  name?: {
    text?: string;
    html?: string;
  };
  events?: Array<{
    id?: string;
    name?: {
      text?: string;
    };
  }>;
};

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const rawBody = await readRawBody(event);

  if (!rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Eventbrite webhook missing body.',
    });
  }

  const payloadString = typeof rawBody === 'string' ? rawBody : String(rawBody);

  let parsedPayload: z.infer<typeof eventbritePayloadSchema>;
  try {
    parsedPayload = eventbritePayloadSchema.parse(JSON.parse(payloadString));
  } catch (error) {
    console.error('Failed to parse Eventbrite webhook payload', error);
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Eventbrite payload.',
    });
  }

  const action =
    parsedPayload.config?.action ?? parsedPayload.action ?? 'unknown';

  console.log('Eventbrite webhook action:', action);
  console.log('Eventbrite webhook parsed payload:', parsedPayload);

  // Handle event.published action
  if (action === 'event.published') {
    const apiUrl = parsedPayload.api_url;
    const apiToken = runtimeConfig.eventbrite?.apiToken;

    if (!apiToken) {
      console.warn('Eventbrite API token is not configured.');
      return { ok: true, skipped: 'API token not configured' };
    }

    if (!apiUrl) {
      console.warn('No API URL provided in webhook payload.');
      return { ok: true, skipped: 'No API URL' };
    }

    // Fetch event details from Eventbrite
    const eventDetails = await fetchEventbriteEvent(apiUrl, apiToken);

    if (eventDetails) {
      console.log(
        'Eventbrite event details:',
        JSON.stringify(eventDetails, null, 2)
      );
      // TODO: Map eventDetails to crawls table and upsert
    } else {
      console.warn('Failed to fetch event details from Eventbrite.');
    }
  }

  // Return a simple OK so Eventbrite considers the webhook delivered
  return { ok: true };
});

function validateSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret?: string
) {
  if (!secret) {
    // Signature validation disabled until secret is configured.
    return;
  }

  if (!signatureHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing Eventbrite signature.',
    });
  }

  const [scheme, signature] = signatureHeader.split('=');
  if (scheme !== 'sha256' || !signature) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid Eventbrite signature format.',
    });
  }

  const expected = createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  const providedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Eventbrite signature mismatch.',
    });
  }
}

async function fetchEventbriteOrder(
  apiUrl?: string,
  token?: string
): Promise<EventbriteOrder | null> {
  if (!apiUrl || !token) {
    if (!token) {
      console.warn('Eventbrite API token is not configured.');
    }
    return null;
  }

  try {
    return await $fetch<EventbriteOrder>(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Unable to fetch Eventbrite order details', error);
    return null;
  }
}

async function fetchEventbriteEvent(
  apiUrl: string,
  token: string
): Promise<EventbriteEvent | null> {
  try {
    // Check if the URL is a series or an event
    const isSeries = apiUrl.includes('/series/');

    if (isSeries) {
      // Fetch the series first
      const series = await $fetch<EventbriteSeries>(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Fetched series:', series);

      // If series has events, fetch the most recent one
      // Or you might want to fetch all events and handle them
      if (series.events && series.events.length > 0) {
        // Get the first event (you might want to get the published one specifically)
        const eventId = series.events[0].id;
        if (eventId) {
          const eventUrl = `https://www.eventbriteapi.com/v3/events/${eventId}/`;
          return await $fetch<EventbriteEvent>(eventUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }

      // If no events in series, try fetching events endpoint
      const eventsUrl = `${apiUrl.replace(/\/$/, '')}/events/`;
      const eventsResponse = await $fetch<{ events?: EventbriteEvent[] }>(
        eventsUrl,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (eventsResponse.events && eventsResponse.events.length > 0) {
        // Return the first event (you might want to filter by status or date)
        return eventsResponse.events[0];
      }

      return null;
    } else {
      // It's an event URL, fetch it directly
      return await $fetch<EventbriteEvent>(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error('Unable to fetch Eventbrite event details', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return null;
  }
}

function buildOrderRecord(
  payload: z.infer<typeof eventbritePayloadSchema>,
  orderDetails: EventbriteOrder | null
): OrderInsert {
  const costs = orderDetails?.costs ?? undefined;
  const createdAt =
    orderDetails?.created ?? orderDetails?.changed ?? new Date().toISOString();

  return {
    created_at: createdAt,
    email: orderDetails?.profile?.email ?? orderDetails?.email ?? null,
    event_id:
      payload.event_id ??
      payload.resource?.event_id ??
      orderDetails?.event_id ??
      null,
    first_name:
      orderDetails?.profile?.first_name ?? orderDetails?.first_name ?? null,
    gross: formatMoney(costs?.gross),
    last_name:
      orderDetails?.profile?.last_name ?? orderDetails?.last_name ?? null,
    order_id:
      orderDetails?.id ??
      payload.resource?.order_id ??
      extractIdFromUrl(payload.api_url) ??
      null,
  };
}

function parseMoney(value?: EventbriteMoney | null) {
  if (!value || typeof value.value !== 'number') {
    return null;
  }
  // Eventbrite returns monetary values in the smallest currency unit.
  return value.value / 100;
}

function extractIdFromUrl(url?: string | null) {
  if (!url) {
    return null;
  }
  const sanitized = url.split('?')[0];
  const parts = sanitized.split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
}

function formatMoney(value?: EventbriteMoney | null) {
  const amount = parseMoney(value);
  if (amount === null) {
    return null;
  }
  return amount.toFixed(2);
}
