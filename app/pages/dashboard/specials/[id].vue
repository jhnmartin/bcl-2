<script lang="ts" setup>
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { JSONContent } from '@tiptap/vue-3';
import type { Database } from '@/types/database.types';
import SpecialsBlocksEditor from '@/components/SpecialsBlocksEditor.client.vue';

const route = useRoute();
const supabase = useSupabaseClient();
const toast = useToast();

const specialId = computed(() => route.params.id as string);

const {
  data: special,
  status,
  error,
  refresh,
} = await useAsyncData(
  () => `dashboard-special-${specialId.value}`,
  async () => {
    if (!specialId.value) {
      return null;
    }

    const { data, error } = await supabase
      .from('specials')
      .select(
        `
          id,
          slug,
          created_at,
          timeslot,
          order,
          specials,
          additional_info,
          venue,
          crawl,
          theme,
          map,
          crawlData:crawls (
            id,
            name,
            slug,
            crawl_image_1,
            event_date_start
          ),
          mapData:maps (
            id,
            name,
            slug,
            date
          ),
          themeData:themes (
            id,
            slug,
            display_name
          ),
          venueData:venues (
            id,
            name,
            slug
          )
        `
      )
      .eq('id', specialId.value)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
  {
    watch: [specialId],
  }
);

// Set up real-time subscription to listen for changes
onMounted(() => {
  if (!specialId.value) return;

  const channel = supabase
    .channel(`special-${specialId.value}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'specials',
        filter: `id=eq.${specialId.value}`,
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
  venue: '', // Will be set to venue ID string
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
        console.warn('Venue was an object, extracted ID:', id);
      } else if (typeof newValue !== 'string') {
        formState.venue = String(newValue);
        console.warn('Venue value converted to string:', newValue);
      }
    }
  },
  { immediate: true }
);

watch(
  special,
  (value) => {
    if (!value) return;

    // Required fields
    formState.slug = value.slug ?? '';
    // Set venue ID as string - ensure it's the ID field, not the relationship object
    // value.venue should be the ID string from the database
    if (value.venue) {
      // If it's an object (shouldn't happen but safety check), extract the ID
      if (
        typeof value.venue === 'object' &&
        value.venue !== null &&
        !Array.isArray(value.venue)
      ) {
        const venueObj = value.venue as Record<string, unknown>;
        formState.venue = venueObj.id ? String(venueObj.id) : '';
      } else {
        formState.venue = String(value.venue);
      }
    } else {
      formState.venue = '';
    }

    // Optional string fields - convert null/empty to undefined
    formState.timeslot =
      value.timeslot &&
      typeof value.timeslot === 'string' &&
      value.timeslot.trim() !== ''
        ? value.timeslot
        : undefined;
    formState.additional_info =
      value.additional_info &&
      typeof value.additional_info === 'string' &&
      value.additional_info.trim() !== ''
        ? value.additional_info
        : undefined;

    // Optional relationship fields (IDs) - convert null to undefined for SelectMenu compatibility
    if (value.crawl) {
      // If it's an object (shouldn't happen but safety check), extract the ID
      if (
        typeof value.crawl === 'object' &&
        value.crawl !== null &&
        !Array.isArray(value.crawl)
      ) {
        const crawlObj = value.crawl as Record<string, unknown>;
        formState.crawl = crawlObj.id ? String(crawlObj.id) : undefined;
      } else if (typeof value.crawl === 'string' && value.crawl.trim() !== '') {
        formState.crawl = value.crawl;
      } else {
        formState.crawl = undefined;
      }
    } else {
      formState.crawl = undefined;
    }
    formState.theme =
      value.theme &&
      typeof value.theme === 'string' &&
      value.theme.trim() !== ''
        ? value.theme
        : undefined;
    formState.map =
      value.map && typeof value.map === 'string' && value.map.trim() !== ''
        ? value.map
        : undefined;

    // Order field - handle number conversion
    if (typeof value.order === 'number') {
      formState.order = String(value.order);
    } else if (value.order != null && String(value.order).trim() !== '') {
      formState.order = String(value.order);
    } else {
      formState.order = undefined;
    }

    // Rich text content
    formState.specials = normalizeSpecials(
      value.specials as SpecialsPayload | string | null | undefined
    );
  },
  { immediate: true }
);

const isSaving = ref(false);

async function onSubmit(event: FormSubmitEvent<SpecialSchema>) {
  if (!specialId.value) return;

  const payload = event.data;
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

  const { error: updateError, data: updatedSpecial } = await supabase
    .from('specials')
    .update({
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
    .eq('id', specialId.value)
    .select('id, specials')
    .maybeSingle();

  if (updateError) {
    toast.add({
      title: 'Failed to update special',
      description: updateError.message,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
  } else {
    toast.add({
      title: 'Special updated',
      description: 'Changes saved successfully.',
      color: 'success',
      icon: 'i-lucide-check',
    });
    await refresh();
  }

  isSaving.value = false;
}

const venueName = computed(
  () => special.value?.venueData?.name ?? 'Unknown venue'
);
const crawlName = computed(() => special.value?.crawlData?.name ?? '');
const themeName = computed(() => special.value?.themeData?.display_name ?? '');
const mapName = computed(() => special.value?.mapData?.name ?? '');

const title = computed(() => venueName.value + ' - ' + themeName.value);

const { data: venues, pending: venuesPending } = await useAsyncData(
  'venues',
  async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('id, name, slug')
      .order('name');

    if (error) {
      console.error('Error loading venues:', error);
      return [];
    }

    return data ?? [];
  }
);

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

// Computed property to get the current venue name for display
const currentVenueName = computed(() => {
  if (!formState.venue || !venues.value) return '';
  const venue = venues.value.find(
    (v) => v.id === formState.venue || String(v.id) === String(formState.venue)
  );
  return venue?.name ?? venueName.value ?? '';
});

// Computed property to get the current crawl name for display
const currentCrawlName = computed(() => {
  if (!formState.crawl || !crawls.value) return '';
  const crawl = crawls.value.find(
    (c) => c.id === formState.crawl || String(c.id) === String(formState.crawl)
  );
  return crawl?.name ?? crawlName.value ?? '';
});

// Computed property to get the current theme name for display
const currentThemeName = computed(() => {
  if (!formState.theme || !themes.value) return '';
  const theme = themes.value.find(
    (t) => t.id === formState.theme || String(t.id) === String(formState.theme)
  );
  return theme?.display_name ?? theme?.name ?? themeName.value ?? '';
});

// Computed property to get the current map name for display
const currentMapName = computed(() => {
  if (!formState.map || !maps.value) return '';
  const map = maps.value.find(
    (m) => m.id === formState.map || String(m.id) === String(formState.map)
  );
  return map?.name ?? mapName.value ?? '';
});

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
      (v) =>
        v.id === formState.venue || String(v.id) === String(formState.venue)
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

// Watch to auto-update slug when theme, venue, or crawl date changes
watch(
  [formState.theme, formState.venue, formState.crawl, themes, venues, crawls],
  () => {
    if (generatedSlug.value) {
      formState.slug = generatedSlug.value;
    }
  },
  { immediate: false }
);

// Watch both special and venues to ensure venue is set correctly when both are loaded
watch(
  [special, venues],
  ([specialValue, venuesValue]) => {
    if (!specialValue || !venuesValue || venuesValue.length === 0) return;

    // Ensure venue is set correctly - use the ID directly, not converted to string
    if (specialValue.venue) {
      // Find the matching venue to ensure we have the right ID format
      const matchingVenue = venuesValue.find(
        (v) =>
          v.id === specialValue.venue ||
          String(v.id) === String(specialValue.venue)
      );
      if (matchingVenue) {
        // Use the exact ID from the venues array, converted to string to match options format
        formState.venue = String(matchingVenue.id);
      } else {
        // Fallback to the value from special, ensuring it's a string
        formState.venue = String(specialValue.venue);
      }
    }
  },
  { immediate: true }
);

// Watch both special and crawls to ensure crawl is set correctly when both are loaded
watch(
  [special, crawls],
  ([specialValue, crawlsValue]) => {
    if (!specialValue || !crawlsValue || crawlsValue.length === 0) return;

    // Ensure crawl is set correctly - use the ID directly, not converted to string
    if (specialValue.crawl) {
      // Find the matching crawl to ensure we have the right ID format
      const matchingCrawl = crawlsValue.find(
        (c) =>
          c.id === specialValue.crawl ||
          String(c.id) === String(specialValue.crawl)
      );
      if (matchingCrawl) {
        // Use the exact ID from the crawls array, converted to string to match options format
        formState.crawl = String(matchingCrawl.id);
      } else {
        // Fallback to the value from special, ensuring it's a string
        formState.crawl = specialValue.crawl
          ? String(specialValue.crawl)
          : undefined;
      }
    }
  },
  { immediate: true }
);

// Watch both special and themes to ensure theme is set correctly when both are loaded
watch(
  [special, themes],
  ([specialValue, themesValue]) => {
    if (!specialValue || !themesValue || themesValue.length === 0) return;

    // Ensure theme is set correctly - use the ID directly, not converted to string
    if (specialValue.theme) {
      // Find the matching theme to ensure we have the right ID format
      const matchingTheme = themesValue.find(
        (t) =>
          t.id === specialValue.theme ||
          String(t.id) === String(specialValue.theme)
      );
      if (matchingTheme) {
        // Use the exact ID from the themes array, converted to string to match options format
        formState.theme = String(matchingTheme.id);
      } else {
        // Fallback to the value from special, ensuring it's a string
        formState.theme = specialValue.theme
          ? String(specialValue.theme)
          : undefined;
      }
    }
  },
  { immediate: true }
);

// Watch both special and maps to ensure map is set correctly when both are loaded
watch(
  [special, maps],
  ([specialValue, mapsValue]) => {
    if (!specialValue || !mapsValue || mapsValue.length === 0) return;

    // Ensure map is set correctly - use the ID directly, not converted to string
    if (specialValue.map) {
      // Find the matching map to ensure we have the right ID format
      const matchingMap = mapsValue.find(
        (m) =>
          m.id === specialValue.map || String(m.id) === String(specialValue.map)
      );
      if (matchingMap) {
        // Use the exact ID from the maps array, converted to string to match options format
        formState.map = String(matchingMap.id);
      } else {
        // Fallback to the value from special, ensuring it's a string
        formState.map = specialValue.map ? String(specialValue.map) : undefined;
      }
    }
  },
  { immediate: true }
);

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
</script>

<template>
  <UDashboardNavbar> </UDashboardNavbar>
  <div class="space-y-4">
    <p
      v-if="status === 'pending'"
      class="text-sm text-muted"
    >
      Loading special...
    </p>
    <UAlert
      v-else-if="error"
      color="error"
      icon="i-lucide-triangle-alert"
      :title="error.message"
      description="Unable to load this special. Please try again later."
    />
    <UAlert
      v-else-if="!special"
      color="warning"
      icon="i-lucide-info"
      title="Special not found"
      description="We couldn't find a special for this slug."
    />
    <div v-else>
      <UForm
        id="special-edit"
        :schema="specialSchema"
        :state="formState"
        @submit="onSubmit"
      >
        <UPageCard
          :title="title"
          description="Update the details for this special."
          variant="naked"
          orientation="horizontal"
          class="mb-4"
        >
          <UButton
            form="special-edit"
            label="Save changes"
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
            description="Select the venue for this special. The current venue is pre-selected."
            required
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <USelectMenu
              v-model="formState.venue"
              :items="venueOptions"
              value-key="value"
              searchable
              :placeholder="currentVenueName || 'Select a venue'"
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
            description="Optional: Associate this special with a crawl event. The current crawl is pre-selected."
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <USelectMenu
              v-model="formState.crawl"
              :items="crawlOptions"
              value-key="value"
              searchable
              clearable
              :placeholder="currentCrawlName || 'Select a crawl (optional)'"
              class="w-full min-w-[350px]"
            />
          </UFormField>

          <USeparator />

          <UFormField
            name="theme"
            label="Theme"
            description="Optional: Associate this special with a theme. The current theme is pre-selected."
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
            name="map"
            label="Map"
            description="Optional: Associate this special with a map. The current map is pre-selected."
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <USelectMenu
              v-model="formState.map"
              :items="mapOptions"
              value-key="value"
              searchable
              clearable
              :placeholder="currentMapName || 'Select a map (optional)'"
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

          <USeparator />

          <UFormField
            name="created_at"
            label="Created At"
            description="When this special was created (read-only)."
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <UInput
              :model-value="
                special?.created_at
                  ? new Date(special.created_at).toLocaleString()
                  : 'N/A'
              "
              readonly
              disabled
            />
          </UFormField>
        </UPageCard>
      </UForm>
    </div>
  </div>
</template>
