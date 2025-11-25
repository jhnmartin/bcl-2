import { createHmac, timingSafeEqual } from 'node:crypto';
import { serverSupabaseClient } from '#supabase/server';
import { useRuntimeConfig } from '#imports';
import {
  createError,
  defineEventHandler,
  getHeader,
  readRawBody,
} from 'h3';
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

const supportedActions = new Set([
  'order.placed',
  'order.updated',
  'order.refunded',
]);

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const rawBody = await readRawBody(event);

  if (!rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Eventbrite webhook missing body.',
    });
  }

  const payloadString =
    typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

  validateSignature(
    payloadString,
    getHeader(event, 'x-eventbrite-signature'),
    runtimeConfig.eventbrite?.webhookSecret,
  );

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

  if (!supportedActions.has(action)) {
    return {
      ok: true,
      skipped: `Unhandled action ${action}`,
    };
  }

  const supabase = await serverSupabaseClient<Database>(event);
  const orderDetails = await fetchEventbriteOrder(
    parsedPayload.api_url,
    runtimeConfig.eventbrite?.apiToken,
  );

  const record = buildOrderRecord(parsedPayload, orderDetails);
  const { error } = await supabase
    .from('orders')
    .upsert(record, { onConflict: 'order_id' });

  if (error) {
    console.error('Failed to persist Eventbrite ticket sale', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to store ticket sale.',
    });
  }

  return { ok: true };
});

function validateSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret?: string,
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
  token?: string,
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

function buildOrderRecord(
  payload: z.infer<typeof eventbritePayloadSchema>,
  orderDetails: EventbriteOrder | null,
): OrderInsert {
  const costs = orderDetails?.costs ?? undefined;
  const createdAt =
    orderDetails?.created ??
    orderDetails?.changed ??
    new Date().toISOString();

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

