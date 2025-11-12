<script lang="ts" setup>
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();
const toast = useToast();

const crawlId = computed(() => route.params.id as string);

// Fetch the crawl with relationships
const {
  data: crawl,
  status,
  error,
  refresh,
} = await useAsyncData(
  () => `dashboard-crawl-${crawlId.value}`,
  async () => {
    if (!crawlId.value) {
      return null;
    }

    const { data, error } = await supabase
      .from('crawls')
      .select(
        `
        *,
        cityData:cities (
          id,
          name
        ),
        themeData:themes (
          id,
          display_name,
          name
        ),
        checkinVenueData:venues!crawls_checkin_venue_1_fkey (
          id,
          name
        )
      `
      )
      .eq('id', crawlId.value)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
  {
    watch: [crawlId],
  }
);

// Set up real-time subscription to listen for changes
onMounted(() => {
  if (!crawlId.value) return;

  const channel = supabase
    .channel(`crawl-${crawlId.value}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'crawls',
        filter: `id=eq.${crawlId.value}`,
      },
      () => {
        // Refresh the data when changes are detected
        refresh();
      }
    )
    .subscribe();

  // Cleanup subscription on unmount
  onUnmounted(() => {
    supabase.removeChannel(channel);
  });
});

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

// Helper function to format datetime for input fields
function formatDateTimeForInput(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
}

// Watch for crawl data and populate form
watch(
  [crawl, cities, themes, venues],
  () => {
    if (!crawl.value) return;

    const c = crawl.value;

    formState.name = c.name ?? '';
    formState.alt_name = c.alt_name ?? undefined;
    formState.slug = c.slug ?? '';
    formState.short_description = c.short_description ?? undefined;
    formState.collection = c.collection ?? undefined;
    formState.price = c.price ?? undefined;
    formState.neighborhood = c.neighborhood ?? undefined;
    formState.keywords_h2 = c.keywords_h2 ?? undefined;
    formState.keywords_paragraph = c.keywords_paragraph ?? undefined;
    formState.seo_title = c.seo_title ?? undefined;
    formState.seo_description = c.seo_description ?? undefined;
    formState.eventbrite_id = c.eventbrite_id ?? undefined;

    formState.crawl_image_1 = c.crawl_image_1 ?? undefined;
    formState.crawl_image_1_alt = c.crawl_image_1_alt ?? undefined;
    formState.crawl_image_2 = c.crawl_image_2 ?? undefined;
    formState.crawl_image_2_alt = c.crawl_image_2_alt ?? undefined;
    formState.crawl_image_3 = c.crawl_image_3 ?? undefined;
    formState.crawl_image_3_alt = c.crawl_image_3_alt ?? undefined;
    formState.crawl_image_4 = c.crawl_image_4 ?? undefined;
    formState.crawl_image_4_alt = c.crawl_image_4_alt ?? undefined;
    formState.crawl_image_vertical_url = c.crawl_image_vertical_url ?? undefined;
    formState.crawl_image_vertical_alt = c.crawl_image_vertical_alt ?? undefined;

    formState.event_date_start = formatDateTimeForInput(c.event_date_start);
    formState.event_date_end = formatDateTimeForInput(c.event_date_end);
    formState.event_date_start_2 = formatDateTimeForInput(c.event_date_start_2);
    formState.event_date_end_2 = formatDateTimeForInput(c.event_date_end_2);
    formState.event_date_start_3 = formatDateTimeForInput(c.event_date_start_3);
    formState.event_date_end_3 = formatDateTimeForInput(c.event_date_end_3);

    if (c.city && typeof c.city === 'string') {
      formState.city = c.city;
    } else if (c.cityData?.id) {
      formState.city = String(c.cityData.id);
    }

    if (c.theme && typeof c.theme === 'string') {
      formState.theme = c.theme;
    } else if (c.themeData?.id) {
      formState.theme = String(c.themeData.id);
    }

    if (c.checkin_venue_1 && typeof c.checkin_venue_1 === 'string') {
      formState.checkin_venue_1 = c.checkin_venue_1;
    } else if (c.checkinVenueData?.id) {
      formState.checkin_venue_1 = String(c.checkinVenueData.id);
    }
  },
  { immediate: true }
);

// Computed properties for current names
const currentCityName = computed(() => {
  if (!crawl.value) return '';
  if (crawl.value.cityData?.name) return crawl.value.cityData.name;
  return '';
});

const currentThemeName = computed(() => {
  if (!crawl.value) return '';
  if (crawl.value.themeData?.display_name) return crawl.value.themeData.display_name;
  if (crawl.value.themeData?.name) return crawl.value.themeData.name;
  return '';
});

const currentVenueName = computed(() => {
  if (!crawl.value) return '';
  if (crawl.value.checkinVenueData?.name) return crawl.value.checkinVenueData.name;
  return '';
});

async function onSubmit(event: FormSubmitEvent<CrawlSchema>) {
  const payload = event.data;

  isSaving.value = true;

  const formatDateTimeForDB = (dateString: string | undefined): string | null => {
    if (!dateString || dateString.trim() === '') return null;
    try {
      return new Date(dateString).toISOString();
    } catch {
      return null;
    }
  };

  const { error: updateError } = await supabase
    .from('crawls')
    .update({
      name: payload.name,
      alt_name: payload.alt_name ?? null,
      slug: payload.slug,
      short_description: payload.short_description ?? null,
      city: payload.city ?? null,
      theme: payload.theme ?? null,
      checkin_venue_1: payload.checkin_venue_1 ?? null,
      collection: payload.collection ?? null,
      event_date_start: formatDateTimeForDB(payload.event_date_start),
      event_date_end: formatDateTimeForDB(payload.event_date_end),
      event_date_start_2: formatDateTimeForDB(payload.event_date_start_2),
      event_date_end_2: formatDateTimeForDB(payload.event_date_end_2),
      event_date_start_3: formatDateTimeForDB(payload.event_date_start_3),
      event_date_end_3: formatDateTimeForDB(payload.event_date_end_3),
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
      updated_at: new Date().toISOString(),
    })
    .eq('id', crawlId.value);

  if (updateError) {
    toast.add({
      title: 'Failed to update crawl',
      description: updateError.message,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    isSaving.value = false;
  } else {
    toast.add({
      title: 'Crawl updated',
      description: 'The crawl has been updated successfully.',
      color: 'success',
      icon: 'i-lucide-check',
    });
    await refresh();
  }
}
</script>

<template>
  <UDashboardNavbar />
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="status === 'pending'">
      <UPageCard variant="subtle">
        <div class="flex items-center justify-center p-8">
          <UIcon
            name="i-lucide-loader-2"
            class="size-8 animate-spin text-muted"
          />
        </div>
      </UPageCard>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error || !crawl"
      color="error"
      icon="i-lucide-triangle-alert"
      title="Error loading crawl"
      :description="error?.message || 'Crawl not found'"
    />

    <!-- Form -->
    <UForm
      v-else
      id="crawl-edit"
      :schema="crawlSchema"
      :state="formState"
      @submit="onSubmit"
    >
      <UPageCard
        :title="`Edit Crawl: ${crawl.name ?? 'Untitled'}`"
        description="Update the details for this crawl."
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <div class="flex items-center gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            :to="'/dashboard/crawls'"
          >
            Back
          </UButton>
          <UButton
            form="crawl-edit"
            label="Save Changes"
            color="neutral"
            type="submit"
            class="w-fit lg:ms-auto"
            :loading="isSaving"
            :disabled="isSaving"
          />
        </div>
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
            :placeholder="currentCityName || 'Select a city (optional)'"
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
            :placeholder="currentThemeName || 'Select a theme (optional)'"
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
            :placeholder="currentVenueName || 'Select check-in venue (optional)'"
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

        <USeparator />

        <UFormField
          name="created_at"
          label="Created At"
          description="When this crawl was created."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            :value="crawl.created_at ? new Date(crawl.created_at).toLocaleString() : '—'"
            readonly
            class="min-w-[350px]"
          />
        </UFormField>
      </UPageCard>
    </UForm>
  </div>
</template>
