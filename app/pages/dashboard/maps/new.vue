<script lang="ts" setup>
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

const router = useRouter();
const supabase = useSupabaseClient();
const toast = useToast();

const mapSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  date: z.string().optional(),
  time_slot: z.string().optional(),
  city: z.string().optional(),
  crawl: z.string().optional(),
  theme: z.string().optional(),
  additional_info: z.string().optional(),
  cancelled_redirect: z.string().optional(),
  checkin_timeslot_1: z.string().optional(),
  checkin_timeslot_2: z.string().optional(),
  checkin_timeslot_3: z.string().optional(),
  checkin_venue_1: z.string().optional(),
  checkin_venue_2: z.string().optional(),
  checkin_venue_3: z.string().optional(),
  early_checkin_date: z.string().optional(),
  early_checkin_date_2: z.string().optional(),
  early_checkin_message: z.string().optional(),
  early_checkin_timeslot: z.string().optional(),
  early_checkin_timeslot_2: z.string().optional(),
  early_checkin_venue: z.string().optional(),
  early_checkin_venue_2: z.string().optional(),
  eventbrite_id: z.string().optional(),
});

type MapSchema = z.output<typeof mapSchema>;

const formState = reactive<MapSchema>({
  name: '',
  slug: '',
  date: undefined,
  time_slot: undefined,
  city: undefined,
  crawl: undefined,
  theme: undefined,
  additional_info: undefined,
  cancelled_redirect: undefined,
  checkin_timeslot_1: undefined,
  checkin_timeslot_2: undefined,
  checkin_timeslot_3: undefined,
  checkin_venue_1: undefined,
  checkin_venue_2: undefined,
  checkin_venue_3: undefined,
  early_checkin_date: undefined,
  early_checkin_date_2: undefined,
  early_checkin_message: undefined,
  early_checkin_timeslot: undefined,
  early_checkin_timeslot_2: undefined,
  early_checkin_venue: undefined,
  early_checkin_venue_2: undefined,
  eventbrite_id: undefined,
});

const isSaving = ref(false);

// Fetch cities, crawls, themes, and venues for dropdowns
const { data: cities } = await useAsyncData('cities', async () => {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name')
    .order('name');
  return data ?? [];
});

const { data: crawls } = await useAsyncData('crawls', async () => {
  const { data, error } = await supabase
    .from('crawls')
    .select('id, name')
    .order('name');
  return data ?? [];
});

const { data: themes } = await useAsyncData('themes', async () => {
  const { data, error } = await supabase
    .from('themes')
    .select('id, display_name, name')
    .order('display_name');
  return data ?? [];
});

const { data: venues } = await useAsyncData('venues', async () => {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name')
    .order('name');
  return data ?? [];
});

const cityOptions = computed(
  () =>
    cities.value?.map((city) => ({
      label: city.name ?? 'Untitled City',
      value: String(city.id),
    })) ?? []
);

const crawlOptions = computed(
  () =>
    crawls.value?.map((crawl) => ({
      label: crawl.name ?? 'Untitled Crawl',
      value: String(crawl.id),
    })) ?? []
);

const themeOptions = computed(
  () =>
    themes.value?.map((theme) => ({
      label: theme.display_name ?? theme.name ?? 'Untitled Theme',
      value: String(theme.id),
    })) ?? []
);

const venueOptions = computed(
  () =>
    venues.value?.map((venue) => ({
      label: venue.name ?? 'Untitled Venue',
      value: String(venue.id),
    })) ?? []
);

async function onSubmit(event: FormSubmitEvent<MapSchema>) {
  const payload = event.data;

  isSaving.value = true;

  const { error: insertError } = await supabase
    .from('maps')
    .insert({
      name: payload.name,
      slug: payload.slug,
      date: payload.date ?? null,
      time_slot: payload.time_slot ?? null,
      city: payload.city ?? null,
      crawl: payload.crawl ?? null,
      theme: payload.theme ?? null,
      additional_info: payload.additional_info ?? null,
      cancelled_redirect: payload.cancelled_redirect ?? null,
      checkin_timeslot_1: payload.checkin_timeslot_1 ?? null,
      checkin_timeslot_2: payload.checkin_timeslot_2 ?? null,
      checkin_timeslot_3: payload.checkin_timeslot_3 ?? null,
      checkin_venue_1: payload.checkin_venue_1 ?? null,
      checkin_venue_2: payload.checkin_venue_2 ?? null,
      checkin_venue_3: payload.checkin_venue_3 ?? null,
      early_checkin_date: payload.early_checkin_date ?? null,
      early_checkin_date_2: payload.early_checkin_date_2 ?? null,
      early_checkin_message: payload.early_checkin_message ?? null,
      early_checkin_timeslot: payload.early_checkin_timeslot ?? null,
      early_checkin_timeslot_2: payload.early_checkin_timeslot_2 ?? null,
      early_checkin_venue: payload.early_checkin_venue ?? null,
      early_checkin_venue_2: payload.early_checkin_venue_2 ?? null,
      eventbrite_id: payload.eventbrite_id ?? null,
    });

  if (insertError) {
    toast.add({
      title: 'Failed to create map',
      description: insertError.message,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    isSaving.value = false;
  } else {
    toast.add({
      title: 'Map created',
      description: 'The new map has been created successfully.',
      color: 'success',
      icon: 'i-lucide-check',
    });
    // Redirect back to the maps list
    await router.push('/dashboard/maps');
  }
}
</script>

<template>
  <UDashboardNavbar />
  <div class="space-y-4">
    <UForm
      id="map-new"
      :schema="mapSchema"
      :state="formState"
      @submit="onSubmit"
    >
      <UPageCard
        title="Create New Map"
        description="Fill in the details for the new map."
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <UButton
          form="map-new"
          label="Create Map"
          color="neutral"
          type="submit"
          class="w-fit lg:ms-auto"
          :loading="isSaving"
          :disabled="isSaving"
        />
      </UPageCard>

      <UPageCard variant="subtle">
        <UFormField
          name="name"
          label="Name"
          description="The name of the map."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.name"
            autocomplete="off"
            placeholder="Enter map name"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="slug"
          label="Slug"
          description="Unique identifier for the map."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.slug"
            autocomplete="off"
            placeholder="Enter slug"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="date"
          label="Date"
          description="Optional: Date for the map event."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.date"
            type="date"
            autocomplete="off"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="time_slot"
          label="Time Slot"
          description="Optional: Time slot for the map event."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.time_slot"
            autocomplete="off"
            placeholder="Enter time slot (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="city"
          label="City"
          description="Optional: Associate this map with a city."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <USelectMenu
            v-model="formState.city"
            :items="cityOptions"
            value-key="value"
            searchable
            clearable
            placeholder="Select a city (optional)"
            class="w-full min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="crawl"
          label="Crawl"
          description="Optional: Associate this map with a crawl."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <USelectMenu
            v-model="formState.crawl"
            :items="crawlOptions"
            value-key="value"
            searchable
            clearable
            placeholder="Select a crawl (optional)"
            class="w-full min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="theme"
          label="Theme"
          description="Optional: Associate this map with a theme."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <USelectMenu
            v-model="formState.theme"
            :items="themeOptions"
            value-key="value"
            searchable
            clearable
            placeholder="Select a theme (optional)"
            class="w-full min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="eventbrite_id"
          label="Eventbrite ID"
          description="Optional: Eventbrite event ID."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.eventbrite_id"
            autocomplete="off"
            placeholder="Enter Eventbrite ID (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="additional_info"
          label="Additional Info"
          description="Optional: Additional information for the map."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.additional_info"
            :rows="3"
            autoresize
            class="w-full min-w-[350px]"
            placeholder="Enter additional info (optional)"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="cancelled_redirect"
          label="Cancelled Redirect"
          description="Optional: Redirect URL when event is cancelled."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.cancelled_redirect"
            autocomplete="off"
            placeholder="Enter redirect URL (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <h3 class="text-lg font-semibold mt-6 mb-4">Check-in Venues</h3>

        <UFormField
          name="checkin_venue_1"
          label="Check-in Venue 1"
          description="Optional: First check-in venue."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <USelectMenu
            v-model="formState.checkin_venue_1"
            :items="venueOptions"
            value-key="value"
            searchable
            clearable
            placeholder="Select venue 1 (optional)"
            class="w-full min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="checkin_timeslot_1"
          label="Check-in Time Slot 1"
          description="Optional: Time slot for first check-in venue."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.checkin_timeslot_1"
            autocomplete="off"
            placeholder="Enter time slot (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="checkin_venue_2"
          label="Check-in Venue 2"
          description="Optional: Second check-in venue."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <USelectMenu
            v-model="formState.checkin_venue_2"
            :items="venueOptions"
            value-key="value"
            searchable
            clearable
            placeholder="Select venue 2 (optional)"
            class="w-full min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="checkin_timeslot_2"
          label="Check-in Time Slot 2"
          description="Optional: Time slot for second check-in venue."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.checkin_timeslot_2"
            autocomplete="off"
            placeholder="Enter time slot (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="checkin_venue_3"
          label="Check-in Venue 3"
          description="Optional: Third check-in venue."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <USelectMenu
            v-model="formState.checkin_venue_3"
            :items="venueOptions"
            value-key="value"
            searchable
            clearable
            placeholder="Select venue 3 (optional)"
            class="w-full min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="checkin_timeslot_3"
          label="Check-in Time Slot 3"
          description="Optional: Time slot for third check-in venue."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.checkin_timeslot_3"
            autocomplete="off"
            placeholder="Enter time slot (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <h3 class="text-lg font-semibold mt-6 mb-4">Early Check-in</h3>

        <UFormField
          name="early_checkin_venue"
          label="Early Check-in Venue"
          description="Optional: Venue for early check-in."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <USelectMenu
            v-model="formState.early_checkin_venue"
            :items="venueOptions"
            value-key="value"
            searchable
            clearable
            placeholder="Select early check-in venue (optional)"
            class="w-full min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="early_checkin_date"
          label="Early Check-in Date"
          description="Optional: Date for early check-in."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.early_checkin_date"
            type="date"
            autocomplete="off"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="early_checkin_timeslot"
          label="Early Check-in Time Slot"
          description="Optional: Time slot for early check-in."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.early_checkin_timeslot"
            autocomplete="off"
            placeholder="Enter time slot (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="early_checkin_venue_2"
          label="Early Check-in Venue 2"
          description="Optional: Second venue for early check-in."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <USelectMenu
            v-model="formState.early_checkin_venue_2"
            :items="venueOptions"
            value-key="value"
            searchable
            clearable
            placeholder="Select early check-in venue 2 (optional)"
            class="w-full min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="early_checkin_date_2"
          label="Early Check-in Date 2"
          description="Optional: Second date for early check-in."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.early_checkin_date_2"
            type="date"
            autocomplete="off"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="early_checkin_timeslot_2"
          label="Early Check-in Time Slot 2"
          description="Optional: Second time slot for early check-in."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.early_checkin_timeslot_2"
            autocomplete="off"
            placeholder="Enter time slot (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="early_checkin_message"
          label="Early Check-in Message"
          description="Optional: Message for early check-in."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.early_checkin_message"
            :rows="3"
            autoresize
            class="w-full min-w-[350px]"
            placeholder="Enter early check-in message (optional)"
          />
        </UFormField>
      </UPageCard>
    </UForm>
  </div>
</template>
