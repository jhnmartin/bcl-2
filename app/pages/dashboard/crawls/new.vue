<script lang="ts" setup>
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

const router = useRouter();
const supabase = useSupabaseClient();
const toast = useToast();

const crawlSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  alt_name: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  short_description: z.string().optional(),
  city: z.string().optional(),
  theme: z.string().optional(),
  checkin_venue_1: z.string().optional(),
  collection: z.string().optional(),
  event_date_start: z.string().optional(),
  event_date_end: z.string().optional(),
  event_date_start_2: z.string().optional(),
  event_date_end_2: z.string().optional(),
  event_date_start_3: z.string().optional(),
  event_date_end_3: z.string().optional(),
  price: z.string().optional(),
  neighborhood: z.string().optional(),
  keywords_h2: z.string().optional(),
  keywords_paragraph: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  eventbrite_id: z.string().optional(),
  crawl_image_1: z.string().optional(),
  crawl_image_1_alt: z.string().optional(),
  crawl_image_2: z.string().optional(),
  crawl_image_2_alt: z.string().optional(),
  crawl_image_3: z.string().optional(),
  crawl_image_3_alt: z.string().optional(),
  crawl_image_4: z.string().optional(),
  crawl_image_4_alt: z.string().optional(),
  crawl_image_vertical_url: z.string().optional(),
  crawl_image_vertical_alt: z.string().optional(),
});

type CrawlSchema = z.output<typeof crawlSchema>;

const formState = reactive<CrawlSchema>({
  name: '',
  alt_name: undefined,
  slug: '',
  short_description: undefined,
  city: undefined,
  theme: undefined,
  checkin_venue_1: undefined,
  collection: undefined,
  event_date_start: undefined,
  event_date_end: undefined,
  event_date_start_2: undefined,
  event_date_end_2: undefined,
  event_date_start_3: undefined,
  event_date_end_3: undefined,
  price: undefined,
  neighborhood: undefined,
  keywords_h2: undefined,
  keywords_paragraph: undefined,
  seo_title: undefined,
  seo_description: undefined,
  eventbrite_id: undefined,
  crawl_image_1: undefined,
  crawl_image_1_alt: undefined,
  crawl_image_2: undefined,
  crawl_image_2_alt: undefined,
  crawl_image_3: undefined,
  crawl_image_3_alt: undefined,
  crawl_image_4: undefined,
  crawl_image_4_alt: undefined,
  crawl_image_vertical_url: undefined,
  crawl_image_vertical_alt: undefined,
});

const isSaving = ref(false);

// Fetch cities, themes, and venues for dropdowns
const { data: cities } = await useAsyncData('cities', async () => {
  const { data, error } = await supabase
    .from('cities')
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

async function onSubmit(event: FormSubmitEvent<CrawlSchema>) {
  const payload = event.data;

  isSaving.value = true;

  const { error: insertError } = await supabase
    .from('crawls')
    .insert({
      name: payload.name,
      alt_name: payload.alt_name ?? null,
      slug: payload.slug,
      short_description: payload.short_description ?? null,
      city: payload.city ?? null,
      theme: payload.theme ?? null,
      checkin_venue_1: payload.checkin_venue_1 ?? null,
      collection: payload.collection ?? null,
      event_date_start: payload.event_date_start ?? null,
      event_date_end: payload.event_date_end ?? null,
      event_date_start_2: payload.event_date_start_2 ?? null,
      event_date_end_2: payload.event_date_end_2 ?? null,
      event_date_start_3: payload.event_date_start_3 ?? null,
      event_date_end_3: payload.event_date_end_3 ?? null,
      price: payload.price ?? null,
      neighborhood: payload.neighborhood ?? null,
      keywords_h2: payload.keywords_h2 ?? null,
      keywords_paragraph: payload.keywords_paragraph ?? null,
      seo_title: payload.seo_title ?? null,
      seo_description: payload.seo_description ?? null,
      eventbrite_id: payload.eventbrite_id ?? null,
      crawl_image_1: payload.crawl_image_1 ?? null,
      crawl_image_1_alt: payload.crawl_image_1_alt ?? null,
      crawl_image_2: payload.crawl_image_2 ?? null,
      crawl_image_2_alt: payload.crawl_image_2_alt ?? null,
      crawl_image_3: payload.crawl_image_3 ?? null,
      crawl_image_3_alt: payload.crawl_image_3_alt ?? null,
      crawl_image_4: payload.crawl_image_4 ?? null,
      crawl_image_4_alt: payload.crawl_image_4_alt ?? null,
      crawl_image_vertical_url: payload.crawl_image_vertical_url ?? null,
      crawl_image_vertical_alt: payload.crawl_image_vertical_alt ?? null,
    });

  if (insertError) {
    toast.add({
      title: 'Failed to create crawl',
      description: insertError.message,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    isSaving.value = false;
  } else {
    toast.add({
      title: 'Crawl created',
      description: 'The new crawl has been created successfully.',
      color: 'success',
      icon: 'i-lucide-check',
    });
    // Redirect back to the crawls list
    await router.push('/dashboard/crawls');
  }
}
</script>

<template>
  <UDashboardNavbar />
  <div class="space-y-4">
    <UForm
      id="crawl-new"
      :schema="crawlSchema"
      :state="formState"
      @submit="onSubmit"
    >
      <UPageCard
        title="Create New Crawl"
        description="Fill in the details for the new crawl."
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <UButton
          form="crawl-new"
          label="Create Crawl"
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
          description="The name of the crawl."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.name"
            autocomplete="off"
            placeholder="Enter crawl name"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="alt_name"
          label="Alt Name"
          description="Optional: Alternative name for the crawl."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.alt_name"
            autocomplete="off"
            placeholder="Enter alt name (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="slug"
          label="Slug"
          description="Unique identifier for the crawl."
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
          name="short_description"
          label="Short Description"
          description="Optional: Brief description of the crawl."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.short_description"
            :rows="3"
            autoresize
            class="w-full min-w-[350px]"
            placeholder="Enter short description (optional)"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="city"
          label="City"
          description="Optional: Associate this crawl with a city."
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
          name="theme"
          label="Theme"
          description="Optional: Associate this crawl with a theme."
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
          name="checkin_venue_1"
          label="Check-in Venue"
          description="Optional: Primary check-in venue for the crawl."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <USelectMenu
            v-model="formState.checkin_venue_1"
            :items="venueOptions"
            value-key="value"
            searchable
            clearable
            placeholder="Select check-in venue (optional)"
            class="w-full min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="neighborhood"
          label="Neighborhood"
          description="Optional: Neighborhood for the crawl."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.neighborhood"
            autocomplete="off"
            placeholder="Enter neighborhood (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="price"
          label="Price"
          description="Optional: Price for the crawl."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.price"
            autocomplete="off"
            placeholder="Enter price (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="collection"
          label="Collection"
          description="Optional: Collection identifier."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.collection"
            autocomplete="off"
            placeholder="Enter collection (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <h3 class="text-lg font-semibold mt-6 mb-4">Event Dates</h3>

        <UFormField
          name="event_date_start"
          label="Event Date Start"
          description="Optional: Start date for the first event."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.event_date_start"
            type="datetime-local"
            autocomplete="off"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="event_date_end"
          label="Event Date End"
          description="Optional: End date for the first event."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.event_date_end"
            type="datetime-local"
            autocomplete="off"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="event_date_start_2"
          label="Event Date Start 2"
          description="Optional: Start date for the second event."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.event_date_start_2"
            type="datetime-local"
            autocomplete="off"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="event_date_end_2"
          label="Event Date End 2"
          description="Optional: End date for the second event."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.event_date_end_2"
            type="datetime-local"
            autocomplete="off"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="event_date_start_3"
          label="Event Date Start 3"
          description="Optional: Start date for the third event."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.event_date_start_3"
            type="datetime-local"
            autocomplete="off"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="event_date_end_3"
          label="Event Date End 3"
          description="Optional: End date for the third event."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.event_date_end_3"
            type="datetime-local"
            autocomplete="off"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <h3 class="text-lg font-semibold mt-6 mb-4">Images</h3>

        <UFormField
          name="crawl_image_1"
          label="Crawl Image 1 URL"
          description="Optional: URL for the first crawl image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.crawl_image_1"
            autocomplete="off"
            placeholder="Enter crawl image 1 URL (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="crawl_image_1_alt"
          label="Crawl Image 1 Alt Text"
          description="Optional: Alt text for the first crawl image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.crawl_image_1_alt"
            autocomplete="off"
            placeholder="Enter crawl image 1 alt text (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="crawl_image_2"
          label="Crawl Image 2 URL"
          description="Optional: URL for the second crawl image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.crawl_image_2"
            autocomplete="off"
            placeholder="Enter crawl image 2 URL (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="crawl_image_2_alt"
          label="Crawl Image 2 Alt Text"
          description="Optional: Alt text for the second crawl image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.crawl_image_2_alt"
            autocomplete="off"
            placeholder="Enter crawl image 2 alt text (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="crawl_image_3"
          label="Crawl Image 3 URL"
          description="Optional: URL for the third crawl image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.crawl_image_3"
            autocomplete="off"
            placeholder="Enter crawl image 3 URL (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="crawl_image_3_alt"
          label="Crawl Image 3 Alt Text"
          description="Optional: Alt text for the third crawl image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.crawl_image_3_alt"
            autocomplete="off"
            placeholder="Enter crawl image 3 alt text (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="crawl_image_4"
          label="Crawl Image 4 URL"
          description="Optional: URL for the fourth crawl image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.crawl_image_4"
            autocomplete="off"
            placeholder="Enter crawl image 4 URL (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="crawl_image_4_alt"
          label="Crawl Image 4 Alt Text"
          description="Optional: Alt text for the fourth crawl image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.crawl_image_4_alt"
            autocomplete="off"
            placeholder="Enter crawl image 4 alt text (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="crawl_image_vertical_url"
          label="Crawl Vertical Image URL"
          description="Optional: URL for the vertical crawl image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.crawl_image_vertical_url"
            autocomplete="off"
            placeholder="Enter vertical image URL (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="crawl_image_vertical_alt"
          label="Crawl Vertical Image Alt Text"
          description="Optional: Alt text for the vertical crawl image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.crawl_image_vertical_alt"
            autocomplete="off"
            placeholder="Enter vertical image alt text (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <h3 class="text-lg font-semibold mt-6 mb-4">SEO & Keywords</h3>

        <UFormField
          name="seo_title"
          label="SEO Title"
          description="Optional: SEO title for the crawl page."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.seo_title"
            autocomplete="off"
            placeholder="Enter SEO title (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="seo_description"
          label="SEO Description"
          description="Optional: Meta description for SEO."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.seo_description"
            :rows="3"
            autoresize
            class="w-full min-w-[350px]"
            placeholder="Enter SEO description (optional)"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="keywords_h2"
          label="Keywords H2"
          description="Optional: H2 heading for keywords section."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.keywords_h2"
            autocomplete="off"
            placeholder="Enter keywords H2 (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="keywords_paragraph"
          label="Keywords Paragraph"
          description="Optional: Paragraph text for keywords section."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.keywords_paragraph"
            :rows="3"
            autoresize
            class="w-full min-w-[350px]"
            placeholder="Enter keywords paragraph (optional)"
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
      </UPageCard>
    </UForm>
  </div>
</template>
