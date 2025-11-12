<script lang="ts" setup>
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { JSONContent } from '@tiptap/vue-3';
import type { Database } from '@/types/database.types';
import SpecialsBlocksEditor from '@/components/SpecialsBlocksEditor.client.vue';

const router = useRouter();
const supabase = useSupabaseClient();
const toast = useToast();

type SpecialsPayload =
  Database['public']['Tables']['specials']['Row']['specials'];

const emptyDoc: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
};

function normalizeSpecials(
  value: SpecialsPayload | string | null | undefined
): SpecialsPayload {
  if (!value) return emptyDoc as SpecialsPayload;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as JSONContent;
      return parsed.type === 'doc'
        ? (parsed as SpecialsPayload)
        : (emptyDoc as SpecialsPayload);
    } catch {
      return emptyDoc as SpecialsPayload;
    }
  }
  if (
    typeof value === 'object' &&
    'type' in value &&
    (value as JSONContent).type === 'doc'
  ) {
    return value as SpecialsPayload;
  }
  return emptyDoc as SpecialsPayload;
}

const specialSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  venue: z.string().min(1, 'Venue is required'),
  timeslot: z.string().optional(),
  order: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  additional_info: z.string().optional(),
  crawl: z.string().optional(),
  theme: z.string().optional(),
  map: z.string().optional(),
  specials: z.custom<SpecialsPayload>().optional(),
});

type SpecialSchema = z.output<typeof specialSchema>;

const formState = reactive<SpecialSchema>({
  slug: '',
  venue: '',
  timeslot: undefined,
  order: undefined,
  additional_info: undefined,
  crawl: undefined,
  theme: undefined,
  map: undefined,
  specials: emptyDoc as SpecialsPayload,
});

// Ensure venue is always a string, never an object
watch(
  () => formState.venue,
  (newValue) => {
    if (newValue) {
      if (typeof newValue === 'object' && newValue !== null) {
        // If it's an object, try to extract the ID
        const obj = newValue as Record<string, unknown>;
        const id = obj.id || obj.value;
        formState.venue = id ? String(id) : '';
        console.warn('Venue value is not a string, converting:', newValue);
      } else if (typeof newValue !== 'string') {
        formState.venue = String(newValue);
        console.warn('Venue value converted to string:', newValue);
      }
    }
  },
  { immediate: true }
);

const isSaving = ref(false);

// Fetch all options for dropdowns
const { data: venues } = await useAsyncData('venues', async () => {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, slug')
    .order('name');

  if (error) {
    console.error('Error loading venues:', error);
    return [];
  }

  return data ?? [];
});

const { data: crawls } = await useAsyncData('crawls', async () => {
  const { data, error } = await supabase
    .from('crawls')
    .select('id, name, slug, event_date_start')
    .order('name');
  return data ?? [];
});

const { data: themes } = await useAsyncData('themes', async () => {
  const { data, error } = await supabase
    .from('themes')
    .select('id, slug, display_name, name')
    .order('display_name');
  return data ?? [];
});

const { data: maps } = await useAsyncData('maps', async () => {
  const { data, error } = await supabase
    .from('maps')
    .select('id, name, slug, date')
    .order('date', { ascending: false });
  return data ?? [];
});

const venueOptions = computed(() => {
  if (!venues.value || venues.value.length === 0) {
    return [];
  }
  return venues.value.map((venue) => ({
    label: venue.name ?? 'Unnamed Venue',
    value: String(venue.id), // Ensure value is always a string for consistent matching
  }));
});

const crawlOptions = computed(
  () =>
    crawls.value?.map((crawl) => ({
      label: crawl.name ?? 'Untitled Crawl',
      value: String(crawl.id), // Ensure value is always a string for consistent matching
    })) ?? []
);

const themeOptions = computed(
  () =>
    themes.value?.map((theme) => ({
      label: theme.display_name ?? theme.name ?? 'Untitled Theme',
      value: String(theme.id), // Ensure value is always a string for consistent matching
    })) ?? []
);

const mapOptions = computed(
  () =>
    maps.value?.map((map) => ({
      label: map.name ?? map.slug ?? `Map ${map.id}`,
      value: String(map.id), // Ensure value is always a string for consistent matching
    })) ?? []
);

// Computed property to auto-generate slug: theme-slug-venue-slug-MM-DD
const generatedSlug = computed(() => {
  const parts: string[] = [];

  // Get theme slug (always first)
  if (formState.theme && themes.value) {
    const theme = themes.value.find(
      (t) =>
        t.id === formState.theme || String(t.id) === String(formState.theme)
    );
    if (theme?.slug) {
      parts.push(theme.slug);
    }
  }

  // Get venue slug
  if (formState.venue && venues.value) {
    const venue = venues.value.find(
      (v) => v.id === formState.venue || String(v.id) === String(formState.venue)
    );
    if (venue?.slug) {
      parts.push(venue.slug);
    }
  }

  // Get event date from crawl and format as MM-DD
  if (formState.crawl && crawls.value) {
    const crawl = crawls.value.find(
      (c) =>
        c.id === formState.crawl || String(c.id) === String(formState.crawl)
    );
    if (crawl?.event_date_start) {
      const date = new Date(crawl.event_date_start);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      parts.push(`${month}-${day}`);
    }
  }

  return parts.join('-');
});

// Watch the generated slug computed property directly to update formState
watch(
  generatedSlug,
  (newSlug) => {
    if (newSlug && newSlug.trim() !== '') {
      formState.slug = newSlug;
    }
  },
  { immediate: true }
);

async function onSubmit(event: FormSubmitEvent<SpecialSchema>) {
  const payload = event.data;
  
  // Ensure slug is generated if it's empty
  if (!payload.slug || payload.slug.trim() === '') {
    const autoSlug = generatedSlug.value;
    if (autoSlug) {
      payload.slug = autoSlug;
      formState.slug = autoSlug;
    } else {
      toast.add({
        title: 'Slug required',
        description: 'Please select a theme and venue to auto-generate the slug, or enter a slug manually.',
        color: 'error',
        icon: 'i-lucide-triangle-alert',
      });
      return;
    }
  }
  
  const specialsPayload = normalizeSpecials(payload.specials);

  const orderValue =
    payload.order !== undefined &&
    payload.order !== null &&
    payload.order !== ''
      ? Number(payload.order)
      : null;

  if (orderValue !== null && Number.isNaN(orderValue)) {
    toast.add({
      title: 'Invalid order value',
      description: 'Order must be a valid number.',
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    return;
  }

  isSaving.value = true;

  const { error: insertError, data: newSpecial } = await supabase
    .from('specials')
    .insert({
      slug: payload.slug,
      venue: payload.venue,
      timeslot: payload.timeslot ?? null,
      order: orderValue,
      additional_info: payload.additional_info ?? null,
      crawl: payload.crawl ?? null,
      theme: payload.theme ?? null,
      map: payload.map ?? null,
      specials: specialsPayload,
    })
    .select('id')
    .single();

  if (insertError) {
    toast.add({
      title: 'Failed to create special',
      description: insertError.message,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    isSaving.value = false;
  } else {
    toast.add({
      title: 'Special created',
      description: 'The new special has been created successfully.',
      color: 'success',
      icon: 'i-lucide-check',
    });
    // Redirect to the edit page for the newly created special
    if (newSpecial?.id) {
      await router.push(`/dashboard/specials/${newSpecial.id}`);
    }
  }
}
</script>

<template>
  <UDashboardNavbar> </UDashboardNavbar>
  <div class="space-y-4">
    <UForm
      id="special-new"
      :schema="specialSchema"
      :state="formState"
      @submit="onSubmit"
    >
      <UPageCard
        title="Create New Special"
        description="Fill in the details for the new special."
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <UButton
          form="special-new"
          label="Create Special"
          color="neutral"
          type="submit"
          class="w-fit lg:ms-auto"
          :loading="isSaving"
          :disabled="isSaving"
        />
      </UPageCard>

      <UPageCard variant="subtle">
        <UFormField
          name="venue"
          label="Venue"
          description="Select the venue for this special."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <USelectMenu
            v-model="formState.venue"
            :items="venueOptions"
            value-key="value"
            searchable
            placeholder="Select a venue"
            class="w-full min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="slug"
          label="Slug"
          description="Auto-generated from theme slug, venue slug, and event date (MM-DD). You can manually edit if needed."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.slug"
            autocomplete="off"
            placeholder="Will be auto-generated..."
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="crawl"
          label="Crawl"
          description="Optional: Associate this special with a crawl event."
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
          description="Optional: Associate this special with a theme."
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
          name="map"
          label="Map"
          description="Optional: Associate this special with a map."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <USelectMenu
            v-model="formState.map"
            :items="mapOptions"
            value-key="value"
            searchable
            clearable
            placeholder="Select a map (optional)"
            class="w-full min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="timeslot"
          label="Time Slot"
          description="Displayed time slot for this special."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.timeslot"
            autocomplete="off"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="order"
          label="Display Order"
          description="Used to sort specials. Lower numbers appear first."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.order"
            type="number"
            inputmode="numeric"
            autocomplete="off"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="additional_info"
          label="Additional Info"
          description="Optional additional details shown with the special."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.additional_info"
            :rows="3"
            autoresize
            class="w-full"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="specials"
          label="Specials Content"
          description="Manage specials content with rich text blocks."
          :ui="{ container: 'w-full' }"
        >
          <SpecialsBlocksEditor v-model="formState.specials" />
        </UFormField>
      </UPageCard>
    </UForm>
  </div>
</template>
