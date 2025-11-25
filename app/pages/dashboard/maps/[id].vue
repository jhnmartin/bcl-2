<script lang="ts" setup>
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import { useSortable } from '@vueuse/integrations/useSortable';
import { useDateFormat } from '@vueuse/core';

const route = useRoute();
const supabase = useSupabaseClient();
const toast = useToast();

const mapId = computed(() => route.params.id as string);

function formatMapDate(dateString: string | null | undefined) {
  if (!dateString) return 'No date set';
  const [datePart] = dateString.split('T');
  const localDate = new Date(`${datePart}T00:00:00`);
  const formatted = useDateFormat(localDate, 'MMMM D, YYYY');
  return formatted.value;
}

// Fetch the map with all relationships
const {
  data: map,
  status,
  error,
  refresh,
} = await useAsyncData(
  () => `dashboard-map-${mapId.value}`,
  async () => {
    if (!mapId.value) {
      return null;
    }

    const { data, error } = await supabase
      .from('maps')
      .select(
        `
        *,
        cityData:cities (
          id,
          name,
          slug
        ),
        crawlData:crawls (
          id,
          name,
          slug
        ),
        themeData:themes (
          id,
          display_name,
          slug
        ),
        checkinVenue1Data:venues!maps_checkin_venue_1_fkey (
          id,
          name,
          slug
        ),
        checkinVenue2Data:venues!maps_checkin_venue_2_fkey (
          id,
          name,
          slug
        ),
        checkinVenue3Data:venues!maps_checkin_venue_3_fkey (
          id,
          name,
          slug
        ),
        earlyCheckinVenueData:venues!maps_early_checkin_venue_fkey (
          id,
          name,
          slug
        ),
        earlyCheckinVenue2Data:venues!maps_early_checkin_venue_2_fkey (
          id,
          name,
          slug
        )
      `
      )
      .eq('id', mapId.value)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
  {
    watch: [mapId],
  }
);

// Set up real-time subscription to listen for changes
onMounted(() => {
  if (!mapId.value) return;

  const mapChannel = supabase
    .channel(`map-${mapId.value}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'maps',
        filter: `id=eq.${mapId.value}`,
      },
      () => {
        // Refresh the data when changes are detected
        refresh();
      }
    )
    .subscribe();

  // Subscribe to specials changes for this map
  const specialsChannel = supabase
    .channel(`map-specials-${mapId.value}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'specials',
        filter: `map=eq.${mapId.value}`,
      },
      async () => {
        // Don't refresh if we're manually updating (to avoid race conditions)
        if (!isUpdatingVenues.value) {
          // Small delay to ensure database consistency
          await new Promise((resolve) => setTimeout(resolve, 50));
          await refreshSpecials();
        }
      }
    )
    .subscribe();

  // Cleanup subscriptions on unmount
  onUnmounted(() => {
    supabase.removeChannel(mapChannel);
    supabase.removeChannel(specialsChannel);
  });
});

const basicDetailsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  date: z.string().optional(),
  time_slot: z.string().optional(),
  eventbrite_id: z.string().optional(),
  theme: z.string().optional(),
  city: z.string().optional(),
  crawl: z.string().optional(),
});

type BasicDetailsSchema = z.output<typeof basicDetailsSchema>;

const basicDetailsFormState = reactive<BasicDetailsSchema>({
  name: '',
  slug: '',
  date: undefined,
  time_slot: undefined,
  eventbrite_id: undefined,
  theme: undefined,
  city: undefined,
  crawl: undefined,
});

const isSaving = ref(false);
const isSavingCheckin = ref(false);
const isAddVenueModalOpen = ref(false);
const isSavingVenue = ref(false);

// Fetch themes for dropdown
const { data: themes } = await useAsyncData('themes', async () => {
  const { data } = await supabase
    .from('themes')
    .select('id, slug, display_name, name')
    .order('display_name');
  return data ?? [];
});

const themeOptions = computed(
  () =>
    themes.value?.map((theme) => ({
      label: theme.display_name ?? theme.name ?? 'Untitled Theme',
      value: String(theme.id),
    })) ?? []
);

// Fetch cities for dropdown
const { data: cities } = await useAsyncData('cities', async () => {
  const { data } = await supabase
    .from('cities')
    .select('id, name')
    .order('name');
  return data ?? [];
});

const cityOptions = computed(
  () =>
    cities.value?.map((city) => ({
      label: city.name ?? 'Unnamed City',
      value: String(city.id),
    })) ?? []
);

// Fetch crawls for dropdown
const { data: crawls } = await useAsyncData('crawls', async () => {
  const { data } = await supabase
    .from('crawls')
    .select('id, name')
    .order('name');
  return data ?? [];
});

const crawlOptions = computed(
  () =>
    crawls.value?.map((crawl) => ({
      label: crawl.name ?? 'Untitled Crawl',
      value: String(crawl.id),
    })) ?? []
);

// Fetch all venues for check-in dropdowns
const { data: venues, refresh: refreshVenues } = await useAsyncData(
  'venues',
  async () => {
    const { data } = await supabase
      .from('venues')
      .select('id, name, city, slug')
      .order('name');
    return data ?? [];
  }
);

// Filter venues by the map's city
const venueOptions = computed(() => {
  if (!venues.value || !basicDetailsFormState.city) return [];
  return venues.value
    .filter(
      (venue) => String(venue.city) === String(basicDetailsFormState.city)
    )
    .map((venue) => ({
      label: venue.name ?? 'Unnamed Venue',
      value: String(venue.id),
    }));
});

// Get filtered venues for the grid display
const filteredVenues = computed(() => {
  if (!venues.value || !basicDetailsFormState.city) return [];
  return venues.value.filter(
    (venue) => String(venue.city) === String(basicDetailsFormState.city)
  );
});

// Fetch specials for this map to get venues with specials
const { data: mapSpecials, refresh: refreshSpecials } = await useAsyncData(
  () => `map-specials-${mapId.value}`,
  async () => {
    if (!mapId.value) return [];

    const { data, error } = await supabase
      .from('specials')
      .select(
        `
        id,
        venue,
        timeslot,
        "order",
        venueData:venues (
          id,
          name,
          slug
        )
      `
      )
      .eq('map', mapId.value)
      .order('order', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data ?? [];
  },
  {
    watch: [mapId],
    getCachedData: () => undefined, // Always fetch fresh data
  }
);

// Venues added to the map (from specials) - using shallowRef for sortable
const mapVenues = shallowRef<
  Array<{
    specialId: string;
    venueId: string;
    name: string;
    timeslot: string;
    order: number | null;
  }>
>([]);

// Flag to prevent watch from overwriting manual updates during operations
const isUpdatingVenues = ref(false);

// Update mapVenues when mapSpecials changes
watch(
  () => mapSpecials.value,
  (specials) => {
    // Skip watch updates if we're manually updating venues
    if (isUpdatingVenues.value) {
      return;
    }

    if (!specials) {
      mapVenues.value = [];
      return;
    }

    const newMapVenues = specials
      .filter((special) => special.venue && special.venueData)
      .map((special) => {
        const venue = special.venueData as { id: string; name: string };
        return {
          specialId: special.id,
          venueId: venue.id,
          name: venue.name || 'Unnamed Venue',
          timeslot: special.timeslot || '',
          order: special.order ?? null,
        };
      })
      .sort((a, b) => {
        // Sort by order, nulls last
        if (a.order === null && b.order === null) return 0;
        if (a.order === null) return 1;
        if (b.order === null) return -1;
        return a.order - b.order;
      });

    // Only update if the data actually changed to avoid unnecessary re-renders
    const currentIds = new Set(mapVenues.value.map((v) => v.specialId));
    const newIds = new Set(newMapVenues.map((v) => v.specialId));
    const idsChanged =
      currentIds.size !== newIds.size ||
      [...currentIds].some((id) => !newIds.has(id)) ||
      [...newIds].some((id) => !currentIds.has(id));

    if (
      idsChanged ||
      JSON.stringify(mapVenues.value) !== JSON.stringify(newMapVenues)
    ) {
      mapVenues.value = newMapVenues;
    }
  },
  { immediate: true, deep: true }
);

// Available venues (all venues in the city, excluding participating venues)
const availableVenues = computed(() => {
  if (!filteredVenues.value || !mapVenues.value)
    return filteredVenues.value || [];

  // Get IDs of participating venues
  const participatingVenueIds = new Set(mapVenues.value.map((v) => v.venueId));

  // Filter out participating venues
  return filteredVenues.value.filter(
    (venue) => !participatingVenueIds.has(String(venue.id))
  );
});

// Update timeslot for a special (debounced)
const updateTimeslotDebounced = useDebounceFn(
  async (specialId: string, timeslot: string) => {
    const { error } = await supabase
      .from('specials' as any)
      .update({ timeslot: timeslot || null })
      .eq('id', specialId);

    if (error) {
      toast.add({
        title: 'Failed to update time slot',
        description: error.message,
        color: 'error',
        icon: 'i-lucide-triangle-alert',
      });
    } else {
      await refreshSpecials();
    }
  },
  500
);

function updateTimeslot(specialId: string, timeslot: string) {
  updateTimeslotDebounced(specialId, timeslot);
}

async function persistVenueOrder(
  orderedVenues: Array<{
    specialId: string;
    venueId: string;
    name: string;
    timeslot: string;
    order: number | null;
  }>
) {
  if (!orderedVenues || orderedVenues.length === 0) {
    mapVenues.value = [];
    return null;
  }

  const applyOrderUpdates = async (offset: number) => {
    for (const [index, venue] of orderedVenues.entries()) {
      const newOrderValue = index + 1 + offset;
      const { error } = await supabase
        .from('specials' as any)
        .update({ order: newOrderValue })
        .eq('id', venue.specialId);

      if (error) {
        return error;
      }
    }
    return null;
  };

  const tempError = await applyOrderUpdates(orderedVenues.length);
  if (tempError) {
    return tempError;
  }

  const finalError = await applyOrderUpdates(0);
  if (finalError) {
    return finalError;
  }

  orderedVenues.forEach((venue, index) => {
    venue.order = index + 1;
  });

  mapVenues.value = [...orderedVenues];
  return null;
}

// Template ref for sortable container (the div that holds the items)
const sortableContainerRef = useTemplateRef<HTMLElement>('sortableContainer');
let sortableInstance: ReturnType<typeof useSortable> | null = null;

// Make dropzone items sortable
watch(
  [() => sortableContainerRef.value, () => mapVenues.value.length],
  ([el, length]) => {
    // Clean up previous instance
    if (sortableInstance && typeof sortableInstance.stop === 'function') {
      sortableInstance.stop();
      sortableInstance = null;
    }

    if (!el || length === 0) return;

    sortableInstance = useSortable(el, mapVenues, {
      animation: 150,
      handle: '.grip-handle', // Only allow reordering via the grip handle
      onStart: () => {
        // When starting to sort via grip handle, prevent HTML5 drag
        el.querySelectorAll('.venue-item').forEach((item) => {
          const htmlItem = item as HTMLElement;
          htmlItem.setAttribute('data-sorting', 'true');
          htmlItem.draggable = false;
        });
      },
      onEnd: () => {
        // Re-enable HTML5 drag after sorting
        el.querySelectorAll('.venue-item').forEach((item) => {
          const htmlItem = item as HTMLElement;
          htmlItem.removeAttribute('data-sorting');
          htmlItem.draggable = true;
        });
      },
      onUpdate: async (e: any) => {
        const { oldIndex, newIndex } = e;
        if (oldIndex === undefined || newIndex === undefined) return;

        // Set flag to prevent watch from overwriting our reordered array
        isUpdatingVenues.value = true;

        const reorderedVenues = [...mapVenues.value];
        const [movedVenue] = reorderedVenues.splice(oldIndex, 1);
        if (!movedVenue) {
          isUpdatingVenues.value = false;
          return;
        }
        reorderedVenues.splice(newIndex, 0, movedVenue);
        mapVenues.value = reorderedVenues;

        const orderError = await persistVenueOrder(reorderedVenues);
        if (orderError) {
          toast.add({
            title: 'Failed to update order',
            description:
              orderError.message ||
              'Unable to update venue order. Please try again.',
            color: 'error',
            icon: 'i-lucide-triangle-alert',
          });
          isUpdatingVenues.value = false;
          await refreshSpecials();
          return;
        }

        isUpdatingVenues.value = false;
        await refreshSpecials();
      },
    });
  },
  { immediate: true }
);

// Cleanup on unmount
onUnmounted(() => {
  if (sortableInstance && typeof sortableInstance.stop === 'function') {
    sortableInstance.stop();
  }
});

// Drag and drop handlers
const draggedVenue = ref<{
  id: string;
  name: string;
  specialId?: string;
} | null>(null);
const isOverLeftDropzone = ref(false);
const isOverRightDropzone = ref(false);

function onDragStart(
  venue: { id: string; name: string; specialId?: string },
  event?: DragEvent
) {
  // Don't start HTML5 drag if we're sorting via grip handle
  if (event?.target && (event.target as HTMLElement).closest('.grip-handle')) {
    event.preventDefault();
    return;
  }
  draggedVenue.value = venue;
}

function onDragEnd() {
  draggedVenue.value = null;
  isOverLeftDropzone.value = false;
  isOverRightDropzone.value = false;
}

function onDragOverLeft(event: DragEvent) {
  event.preventDefault();
  isOverLeftDropzone.value = true;
  isOverRightDropzone.value = false;
}

function onDragOverRight(event: DragEvent) {
  event.preventDefault();
  isOverRightDropzone.value = true;
  isOverLeftDropzone.value = false;
}

function onDragLeaveLeft() {
  isOverLeftDropzone.value = false;
}

function onDragLeaveRight() {
  isOverRightDropzone.value = false;
}

async function onDropLeft(event: DragEvent) {
  event.preventDefault();
  isOverLeftDropzone.value = false;

  if (draggedVenue.value && mapId.value) {
    const venueId = draggedVenue.value.id;

    // Check if venue already has a special for this map
    const existingSpecial = mapSpecials.value?.find((s) => s.venue === venueId);

    if (existingSpecial) {
      // Special already exists, just refresh
      await refreshSpecials();
      draggedVenue.value = null;
      return;
    }

    // Get venue slug
    const venue = venues.value?.find((v) => v.id === venueId);
    const venueSlug = venue?.slug || 'venue';

    // Get crawl slug and date from map - ensure we're using crawlData, not cityData
    const crawlSlug = map.value?.crawlData?.slug;
    if (!crawlSlug) {
      toast.add({
        title: 'Error',
        description:
          'Crawl slug not found. Please ensure the map has an associated crawl.',
        color: 'error',
        icon: 'i-lucide-triangle-alert',
      });
      draggedVenue.value = null;
      return;
    }

    const crawlId = map.value?.crawlData?.id || map.value?.crawl || null;
    const themeId = map.value?.themeData?.id || map.value?.theme || null;
    const mapDate = map.value?.date;

    // Format date as MM-DD (e.g., "12-20")
    let dateSlug = '';
    if (mapDate) {
      const date = new Date(mapDate);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateSlug = `${month}-${day}`;
    }

    // Generate slug: {crawl-slug}-{venue-slug}-{date}
    const specialSlug = `${crawlSlug}-${venueSlug}${
      dateSlug ? `-${dateSlug}` : ''
    }`;

    // Calculate the next order (current max order + 1, or 1 if no items)
    const maxOrder = mapVenues.value.reduce(
      (max, v) => (v.order !== null && v.order > max ? v.order : max),
      0
    );
    const nextOrder = maxOrder + 1;

    // Default specials content
    const defaultSpecialsContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              text: 'Coming Soon!',
              type: 'text',
            },
          ],
        },
      ],
    };

    // Create a new special for this venue and map
    const { error } = await supabase.from('specials' as any).insert({
      venue: venueId,
      map: mapId.value,
      crawl: crawlId,
      theme: themeId,
      slug: specialSlug,
      specials: defaultSpecialsContent,
      order: nextOrder,
    });

    if (error) {
      toast.add({
        title: 'Failed to add venue',
        description: error.message,
        color: 'error',
        icon: 'i-lucide-triangle-alert',
      });
    } else {
      // Small delay to ensure database has processed the insert
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Force refresh and wait for it
      await refreshSpecials();

      toast.add({
        title: 'Venue added',
        description: 'The venue has been added to the map.',
        color: 'success',
        icon: 'i-lucide-check',
      });
    }
    draggedVenue.value = null;
  }
}

async function onDropRight(event: DragEvent) {
  event.preventDefault();
  isOverRightDropzone.value = false;

  if (draggedVenue.value && draggedVenue.value.specialId) {
    const specialIdToDelete = draggedVenue.value.specialId;
    draggedVenue.value = null;

    // Set flag to prevent watch from overwriting our manual update
    isUpdatingVenues.value = true;

    // Immediately remove from local state for instant UI feedback
    const previousVenues = [...mapVenues.value];
    mapVenues.value = mapVenues.value.filter(
      (v) => v.specialId !== specialIdToDelete
    );

    // Delete the special when dropped on the right (not participating)
    // First verify it exists
    const { data: existingSpecial } = await supabase
      .from('specials' as any)
      .select('id, venue, map')
      .eq('id', specialIdToDelete)
      .maybeSingle();

    if (!existingSpecial) {
      // Special doesn't exist, just update UI
      isUpdatingVenues.value = false;
      await refreshSpecials();
      draggedVenue.value = null;
      return;
    }

    // Delete the special
    const { error } = await supabase
      .from('specials' as any)
      .delete()
      .eq('id', specialIdToDelete);

    if (error) {
      // Restore previous state on error
      mapVenues.value = previousVenues;
      isUpdatingVenues.value = false;
      toast.add({
        title: 'Failed to remove venue',
        description: error.message,
        color: 'error',
        icon: 'i-lucide-triangle-alert',
      });
    } else {
      // Verify the delete actually happened
      await new Promise((resolve) => setTimeout(resolve, 100));

      const { data: verifyData } = await supabase
        .from('specials' as any)
        .select('id')
        .eq('id', specialIdToDelete)
        .maybeSingle();

      if (verifyData) {
        // Special still exists, this might be an RLS issue or timing issue
        mapVenues.value = previousVenues;
        isUpdatingVenues.value = false;
        toast.add({
          title: 'Failed to remove venue',
          description:
            'The venue could not be removed. Please check your permissions or try again.',
          color: 'error',
          icon: 'i-lucide-triangle-alert',
        });
        return;
      }

      const orderError = await persistVenueOrder([...mapVenues.value]);
      if (orderError) {
        toast.add({
          title: 'Failed to normalize order',
          description:
            orderError.message || 'Unable to update venue order after removal.',
          color: 'error',
          icon: 'i-lucide-triangle-alert',
        });
        isUpdatingVenues.value = false;
        await refreshSpecials();
        return;
      }

      await refreshSpecials();
      await nextTick();
      isUpdatingVenues.value = false;

      toast.add({
        title: 'Venue removed',
        description: 'The venue has been removed from the map.',
        color: 'success',
        icon: 'i-lucide-check',
      });
    }
  } else if (draggedVenue.value && !draggedVenue.value.specialId) {
    // Venue from right column dropped on right column (no-op)
    draggedVenue.value = null;
  }
}

// Check-in schema
const checkinSchema = z.object({
  checkin_venue_1: z.string().optional(),
  checkin_timeslot_1: z.string().optional(),
  checkin_venue_2: z.string().optional(),
  checkin_timeslot_2: z.string().optional(),
  checkin_venue_3: z.string().optional(),
  checkin_timeslot_3: z.string().optional(),
  early_checkin_venue: z.string().optional(),
  early_checkin_date: z.string().optional(),
  early_checkin_timeslot: z.string().optional(),
  early_checkin_venue_2: z.string().optional(),
  early_checkin_date_2: z.string().optional(),
  early_checkin_timeslot_2: z.string().optional(),
});

type CheckinSchema = z.output<typeof checkinSchema>;

const checkinFormState = reactive<CheckinSchema>({
  checkin_venue_1: undefined,
  checkin_timeslot_1: undefined,
  checkin_venue_2: undefined,
  checkin_timeslot_2: undefined,
  checkin_venue_3: undefined,
  checkin_timeslot_3: undefined,
  early_checkin_venue: undefined,
  early_checkin_date: undefined,
  early_checkin_timeslot: undefined,
  early_checkin_venue_2: undefined,
  early_checkin_date_2: undefined,
  early_checkin_timeslot_2: undefined,
});

// Helper function to get venue name for display
function getVenueName(venueId: string | undefined): string {
  if (!venueId || !venues.value) return '';
  const venue = venues.value.find((v) => String(v.id) === String(venueId));
  return venue?.name ?? '';
}

// Helper function to capitalize venue name
function capitalizeVenueName(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const venueSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  city: z.string().optional(),
  address_line_1: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  maps_embed: z.string().optional(),
  white_logo: z.string().optional(),
  white_logo_alt: z.string().optional(),
  black_logo: z.string().optional(),
  black_logo_alt: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  is_featured: z.boolean().optional(),
});

type VenueSchema = z.output<typeof venueSchema>;

const defaultVenueFormState: VenueSchema = {
  name: '',
  slug: '',
  city: undefined,
  address_line_1: undefined,
  state: undefined,
  zip_code: undefined,
  maps_embed: undefined,
  white_logo: undefined,
  white_logo_alt: undefined,
  black_logo: undefined,
  black_logo_alt: undefined,
  seo_title: undefined,
  seo_description: undefined,
  is_featured: false,
};

const venueFormState = reactive<VenueSchema>({ ...defaultVenueFormState });

function resetVenueFormState() {
  Object.assign(venueFormState, { ...defaultVenueFormState });
}

// Populate form when map data loads
watch(
  () => map.value,
  (mapData) => {
    if (mapData) {
      basicDetailsFormState.name = mapData.name || '';
      basicDetailsFormState.slug = mapData.slug || '';
      basicDetailsFormState.time_slot = mapData.time_slot || undefined;
      basicDetailsFormState.eventbrite_id = mapData.eventbrite_id || undefined;

      // Handle theme relationship
      if (mapData.theme) {
        if (
          typeof mapData.theme === 'object' &&
          mapData.theme !== null &&
          !Array.isArray(mapData.theme)
        ) {
          const themeObj = mapData.theme as Record<string, unknown>;
          basicDetailsFormState.theme = themeObj.id
            ? String(themeObj.id)
            : undefined;
        } else if (
          typeof mapData.theme === 'string' &&
          mapData.theme.trim() !== ''
        ) {
          basicDetailsFormState.theme = mapData.theme;
        } else {
          basicDetailsFormState.theme = undefined;
        }
      } else {
        basicDetailsFormState.theme = undefined;
      }

      // Handle city relationship
      if (mapData.city) {
        if (
          typeof mapData.city === 'object' &&
          mapData.city !== null &&
          !Array.isArray(mapData.city)
        ) {
          const cityObj = mapData.city as Record<string, unknown>;
          basicDetailsFormState.city = cityObj.id
            ? String(cityObj.id)
            : undefined;
        } else if (
          typeof mapData.city === 'string' &&
          mapData.city.trim() !== ''
        ) {
          basicDetailsFormState.city = mapData.city;
        } else {
          basicDetailsFormState.city = undefined;
        }
      } else {
        basicDetailsFormState.city = undefined;
      }

      // Handle crawl relationship
      if (mapData.crawl) {
        if (
          typeof mapData.crawl === 'object' &&
          mapData.crawl !== null &&
          !Array.isArray(mapData.crawl)
        ) {
          const crawlObj = mapData.crawl as Record<string, unknown>;
          basicDetailsFormState.crawl = crawlObj.id
            ? String(crawlObj.id)
            : undefined;
        } else if (
          typeof mapData.crawl === 'string' &&
          mapData.crawl.trim() !== ''
        ) {
          basicDetailsFormState.crawl = mapData.crawl;
        } else {
          basicDetailsFormState.crawl = undefined;
        }
      } else {
        basicDetailsFormState.crawl = undefined;
      }

      // Format date for datetime-local input
      basicDetailsFormState.date = mapData.date
        ? mapData.date.split('T')[0]
        : undefined;

      // Populate check-in fields
      checkinFormState.checkin_venue_1 = mapData.checkin_venue_1
        ? String(mapData.checkin_venue_1)
        : undefined;
      checkinFormState.checkin_timeslot_1 =
        mapData.checkin_timeslot_1 || undefined;
      checkinFormState.checkin_venue_2 = mapData.checkin_venue_2
        ? String(mapData.checkin_venue_2)
        : undefined;
      checkinFormState.checkin_timeslot_2 =
        mapData.checkin_timeslot_2 || undefined;
      checkinFormState.checkin_venue_3 = mapData.checkin_venue_3
        ? String(mapData.checkin_venue_3)
        : undefined;
      checkinFormState.checkin_timeslot_3 =
        mapData.checkin_timeslot_3 || undefined;

      // Early check-in fields
      checkinFormState.early_checkin_venue = mapData.early_checkin_venue
        ? String(mapData.early_checkin_venue)
        : undefined;
      checkinFormState.early_checkin_timeslot =
        mapData.early_checkin_timeslot || undefined;
      checkinFormState.early_checkin_venue_2 = mapData.early_checkin_venue_2
        ? String(mapData.early_checkin_venue_2)
        : undefined;
      checkinFormState.early_checkin_timeslot_2 =
        mapData.early_checkin_timeslot_2 || undefined;

      // Format early check-in dates
      if (mapData.early_checkin_date) {
        const date = new Date(mapData.early_checkin_date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        checkinFormState.early_checkin_date = `${year}-${month}-${day}`;
      } else {
        checkinFormState.early_checkin_date = undefined;
      }

      if (mapData.early_checkin_date_2) {
        const date = new Date(mapData.early_checkin_date_2);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        checkinFormState.early_checkin_date_2 = `${year}-${month}-${day}`;
      } else {
        checkinFormState.early_checkin_date_2 = undefined;
      }
    }
  },
  { immediate: true }
);

async function onBasicDetailsSubmit(
  event: FormSubmitEvent<BasicDetailsSchema>
) {
  const payload = event.data;
  isSaving.value = true;

  const { error: updateError } = (await supabase
    .from('maps' as any)
    .update({
      name: payload.name,
      slug: payload.slug,
      date: payload.date ? payload.date : null,
      time_slot: payload.time_slot ?? null,
      eventbrite_id: payload.eventbrite_id ?? null,
      theme: payload.theme ?? null,
      city: payload.city ?? null,
      crawl: payload.crawl ?? null,
    })
    .eq('id', mapId.value)) as { error: any };

  if (updateError) {
    toast.add({
      title: 'Failed to update map',
      description: updateError.message,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    isSaving.value = false;
  } else {
    toast.add({
      title: 'Map updated',
      description: 'The map has been updated successfully.',
      color: 'success',
      icon: 'i-lucide-check',
    });
    // Refresh the data
    await refresh();
    isSaving.value = false;
  }
}

async function onCheckinSubmit(event: FormSubmitEvent<CheckinSchema>) {
  const payload = event.data;
  isSavingCheckin.value = true;

  const { error: updateError } = (await supabase
    .from('maps' as any)
    .update({
      checkin_venue_1: payload.checkin_venue_1 ?? null,
      checkin_timeslot_1: payload.checkin_timeslot_1 ?? null,
      checkin_venue_2: payload.checkin_venue_2 ?? null,
      checkin_timeslot_2: payload.checkin_timeslot_2 ?? null,
      checkin_venue_3: payload.checkin_venue_3 ?? null,
      checkin_timeslot_3: payload.checkin_timeslot_3 ?? null,
      early_checkin_venue: payload.early_checkin_venue ?? null,
      early_checkin_date: payload.early_checkin_date
        ? new Date(payload.early_checkin_date).toISOString()
        : null,
      early_checkin_timeslot: payload.early_checkin_timeslot ?? null,
      early_checkin_venue_2: payload.early_checkin_venue_2 ?? null,
      early_checkin_date_2: payload.early_checkin_date_2
        ? new Date(payload.early_checkin_date_2).toISOString()
        : null,
      early_checkin_timeslot_2: payload.early_checkin_timeslot_2 ?? null,
    })
    .eq('id', mapId.value)) as { error: any };

  if (updateError) {
    toast.add({
      title: 'Failed to update check-in details',
      description: updateError.message,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    isSavingCheckin.value = false;
  } else {
    toast.add({
      title: 'Check-in details updated',
      description: 'The check-in details have been updated successfully.',
      color: 'success',
      icon: 'i-lucide-check',
    });
    // Refresh the data
    await refresh();
    isSavingCheckin.value = false;
  }
}

async function onCreateVenue(event: FormSubmitEvent<VenueSchema>) {
  const payload = event.data;
  isSavingVenue.value = true;

  const { error: insertError } = await supabase
    .from('venues')
    .insert({
      name: payload.name,
      slug: payload.slug,
      city: payload.city ?? null,
      address_line_1: payload.address_line_1 ?? null,
      state: payload.state ?? null,
      zip_code: payload.zip_code ?? null,
      maps_embed: payload.maps_embed ?? null,
      white_logo: payload.white_logo ?? null,
      white_logo_alt: payload.white_logo_alt ?? null,
      black_logo: payload.black_logo ?? null,
      black_logo_alt: payload.black_logo_alt ?? null,
      seo_title: payload.seo_title ?? null,
      seo_description: payload.seo_description ?? null,
      is_featured: payload.is_featured ?? false,
    })
    .select('id')
    .single();

  if (insertError) {
    toast.add({
      title: 'Failed to create venue',
      description: insertError.message,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    isSavingVenue.value = false;
    return;
  }

  await refreshVenues();
  await refreshSpecials();
  toast.add({
    title: 'Venue created',
    description: 'The venue has been created successfully.',
    color: 'success',
    icon: 'i-lucide-check',
  });
  resetVenueFormState();
  isSavingVenue.value = false;
  isAddVenueModalOpen.value = false;
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div
      v-if="status === 'pending'"
      class="flex items-center justify-center py-12"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-6 animate-spin text-gray-400"
      />
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error || !map"
      color="error"
      icon="i-lucide-triangle-alert"
      title="Error loading map"
      :description="error?.message || 'Map not found'"
    />

    <!-- Map Data Display -->
    <template v-else>
      <UPageCard
        :title="map.name || 'Untitled Map'"
        :description="formatMapDate(map.date)"
        variant="naked"
      />
      <!-- Basic Details Section -->
      <UPageCard
        title="Basic Details"
        description="Update the basic information for this map."
        variant="subtle"
      >
        <UForm
          id="basic-details-form"
          :schema="basicDetailsSchema"
          :state="basicDetailsFormState"
          @submit="onBasicDetailsSubmit"
        >
          <UFormField
            name="name"
            label="Name"
            description="The name of the map."
            required
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <UInput
              v-model="basicDetailsFormState.name"
              autocomplete="off"
              placeholder="Enter map name"
              class="min-w-[350px]"
            />
          </UFormField>

          <USeparator />

          <UFormField
            name="slug"
            label="Slug"
            description="URL-friendly identifier for the map."
            required
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <UInput
              v-model="basicDetailsFormState.slug"
              autocomplete="off"
              placeholder="map-slug"
              class="min-w-[350px]"
            />
          </UFormField>

          <USeparator />

          <UFormField
            name="crawl"
            label="Crawl"
            description="Select the crawl for this map."
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <USelectMenu
              v-model="basicDetailsFormState.crawl"
              :items="crawlOptions"
              value-key="value"
              placeholder="Select a crawl"
              searchable
              class="min-w-[350px]"
            />
          </UFormField>

          <USeparator />

          <UFormField
            name="theme"
            label="Theme"
            description="Select the theme for this map."
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <USelectMenu
              v-model="basicDetailsFormState.theme"
              :items="themeOptions"
              value-key="value"
              placeholder="Select a theme"
              searchable
              class="min-w-[350px]"
            />
          </UFormField>

          <USeparator />

          <UFormField
            name="city"
            label="City"
            description="Select the city for this map."
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <USelectMenu
              v-model="basicDetailsFormState.city"
              :items="cityOptions"
              value-key="value"
              placeholder="Select a city"
              searchable
              class="min-w-[350px]"
            />
          </UFormField>

          <USeparator />

          <UFormField
            name="date"
            label="Date"
            description="The date and time for this map."
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <UInput
              v-model="basicDetailsFormState.date"
              type="date"
              autocomplete="off"
              placeholder="Select date and time"
              class="min-w-[350px]"
            />
          </UFormField>

          <USeparator />

          <UFormField
            name="time_slot"
            label="Time Slot"
            description="The time slot for this map."
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <UInput
              v-model="basicDetailsFormState.time_slot"
              autocomplete="off"
              placeholder="Enter time slot"
              class="min-w-[350px]"
            />
          </UFormField>

          <USeparator />

          <UFormField
            name="eventbrite_id"
            label="Eventbrite ID"
            description="The Eventbrite event ID for this map."
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <UInput
              v-model="basicDetailsFormState.eventbrite_id"
              autocomplete="off"
              placeholder="Enter Eventbrite ID"
              class="min-w-[350px]"
            />
          </UFormField>

          <div class="flex justify-end mt-6">
            <UButton
              form="basic-details-form"
              label="Save Changes"
              color="primary"
              type="submit"
              :loading="isSaving"
              :disabled="isSaving"
            />
          </div>
        </UForm>
      </UPageCard>

      <!-- Check-in Section -->
      <UPageCard
        title="Check-in Details"
        description="Configure check-in venues and time slots for this map."
        variant="subtle"
      >
        <UForm
          id="checkin-form"
          :schema="checkinSchema"
          :state="checkinFormState"
          @submit="onCheckinSubmit"
        >
          <div class="space-y-6">
            <!-- Check-in 1 -->
            <div>
              <h3 class="text-sm font-semibold text-highlighted mb-4">
                Check-in 1
              </h3>
              <UFormField
                name="checkin_venue_1"
                label="Venue"
                description="Select the venue for check-in 1."
                class="flex max-sm:flex-col justify-between items-start gap-4"
              >
                <USelectMenu
                  v-model="checkinFormState.checkin_venue_1"
                  :items="venueOptions"
                  value-key="value"
                  placeholder="Select a venue"
                  searchable
                  class="min-w-[350px]"
                />
              </UFormField>

              <USeparator />

              <UFormField
                name="checkin_timeslot_1"
                label="Time Slot"
                description="Enter the time slot for check-in 1."
                class="flex max-sm:flex-col justify-between items-start gap-4"
              >
                <UInput
                  v-model="checkinFormState.checkin_timeslot_1"
                  autocomplete="off"
                  placeholder="Enter time slot"
                  class="min-w-[350px]"
                />
              </UFormField>
            </div>

            <USeparator />

            <!-- Check-in 2 -->
            <div>
              <h3 class="text-sm font-semibold text-highlighted mb-4">
                Check-in 2 (Optional)
              </h3>
              <UFormField
                name="checkin_venue_2"
                label="Venue"
                description="Select the venue for check-in 2 (optional)."
                class="flex max-sm:flex-col justify-between items-start gap-4"
              >
                <USelectMenu
                  v-model="checkinFormState.checkin_venue_2"
                  :items="venueOptions"
                  value-key="value"
                  placeholder="Select a venue"
                  searchable
                  class="min-w-[350px]"
                />
              </UFormField>

              <USeparator />

              <UFormField
                name="checkin_timeslot_2"
                label="Time Slot"
                description="Enter the time slot for check-in 2 (optional)."
                class="flex max-sm:flex-col justify-between items-start gap-4"
              >
                <UInput
                  v-model="checkinFormState.checkin_timeslot_2"
                  autocomplete="off"
                  placeholder="Enter time slot"
                  class="min-w-[350px]"
                />
              </UFormField>
            </div>

            <USeparator />

            <!-- Check-in 3 -->
            <div>
              <h3 class="text-sm font-semibold text-highlighted mb-4">
                Check-in 3 (Optional)
              </h3>
              <UFormField
                name="checkin_venue_3"
                label="Venue"
                description="Select the venue for check-in 3 (optional)."
                class="flex max-sm:flex-col justify-between items-start gap-4"
              >
                <USelectMenu
                  v-model="checkinFormState.checkin_venue_3"
                  :items="venueOptions"
                  value-key="value"
                  placeholder="Select a venue"
                  searchable
                  class="min-w-[350px]"
                />
              </UFormField>

              <USeparator />

              <UFormField
                name="checkin_timeslot_3"
                label="Time Slot"
                description="Enter the time slot for check-in 3 (optional)."
                class="flex max-sm:flex-col justify-between items-start gap-4"
              >
                <UInput
                  v-model="checkinFormState.checkin_timeslot_3"
                  autocomplete="off"
                  placeholder="Enter time slot"
                  class="min-w-[350px]"
                />
              </UFormField>
            </div>

            <USeparator />

            <!-- Early Check-in -->
            <div>
              <h3 class="text-sm font-semibold text-highlighted mb-4">
                Early Check-in (Optional)
              </h3>
              <UFormField
                name="early_checkin_venue"
                label="Venue"
                description="Select the venue for early check-in (optional)."
                class="flex max-sm:flex-col justify-between items-start gap-4"
              >
                <USelectMenu
                  v-model="checkinFormState.early_checkin_venue"
                  :items="venueOptions"
                  value-key="value"
                  placeholder="Select a venue"
                  searchable
                  class="min-w-[350px]"
                />
              </UFormField>

              <USeparator />

              <UFormField
                name="early_checkin_date"
                label="Date"
                description="Select the date for early check-in (optional)."
                class="flex max-sm:flex-col justify-between items-start gap-4"
              >
                <UInput
                  v-model="checkinFormState.early_checkin_date"
                  type="date"
                  autocomplete="off"
                  placeholder="Select date"
                  class="min-w-[350px]"
                />
              </UFormField>

              <USeparator />

              <UFormField
                name="early_checkin_timeslot"
                label="Time Slot"
                description="Enter the time slot for early check-in (optional)."
                class="flex max-sm:flex-col justify-between items-start gap-4"
              >
                <UInput
                  v-model="checkinFormState.early_checkin_timeslot"
                  autocomplete="off"
                  placeholder="Enter time slot"
                  class="min-w-[350px]"
                />
              </UFormField>
            </div>

            <USeparator />

            <!-- Early Check-in 2 -->
            <div>
              <h3 class="text-sm font-semibold text-highlighted mb-4">
                Early Check-in 2 (Optional)
              </h3>
              <UFormField
                name="early_checkin_venue_2"
                label="Venue"
                description="Select the venue for early check-in 2 (optional)."
                class="flex max-sm:flex-col justify-between items-start gap-4"
              >
                <USelectMenu
                  v-model="checkinFormState.early_checkin_venue_2"
                  :items="venueOptions"
                  value-key="value"
                  placeholder="Select a venue"
                  searchable
                  class="min-w-[350px]"
                />
              </UFormField>

              <USeparator />

              <UFormField
                name="early_checkin_date_2"
                label="Date"
                description="Select the date for early check-in 2 (optional)."
                class="flex max-sm:flex-col justify-between items-start gap-4"
              >
                <UInput
                  v-model="checkinFormState.early_checkin_date_2"
                  type="date"
                  autocomplete="off"
                  placeholder="Select date"
                  class="min-w-[350px]"
                />
              </UFormField>

              <USeparator />

              <UFormField
                name="early_checkin_timeslot_2"
                label="Time Slot"
                description="Enter the time slot for early check-in 2 (optional)."
                class="flex max-sm:flex-col justify-between items-start gap-4"
              >
                <UInput
                  v-model="checkinFormState.early_checkin_timeslot_2"
                  autocomplete="off"
                  placeholder="Enter time slot"
                  class="min-w-[350px]"
                />
              </UFormField>
            </div>
          </div>

          <div class="flex justify-end mt-6">
            <UButton
              form="checkin-form"
              label="Save Check-in Details"
              color="primary"
              type="submit"
              :loading="isSavingCheckin"
              :disabled="isSavingCheckin"
            />
          </div>
        </UForm>
      </UPageCard>

      <!-- Venues Section -->
      <UPageCard
        title="Map Venues"
        :description="
          filteredVenues.length > 0
            ? `Drag venues to the left to add them to the map, or to the right to remove them. Reorder venues in the left column.`
            : 'Select a city to see venues'
        "
        variant="subtle"
      >
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column: Dropzone -->
          <div>
            <h3 class="text-sm font-semibold text-highlighted mb-4">
              Participating Venues
            </h3>
            <div
              ref="dropzone"
              @dragover="onDragOverLeft"
              @dragleave="onDragLeaveLeft"
              @drop="onDropLeft"
              :class="[
                'min-h-[200px] p-4 rounded-lg border-2 border-dashed transition-colors',
                isOverLeftDropzone
                  ? 'border-primary bg-primary/10'
                  : 'border-accented bg-elevated/50',
              ]"
            >
              <div
                v-if="mapVenues.length === 0"
                class="text-center py-8 text-muted"
              >
                <p>Drop venues here</p>
              </div>
              <div
                v-else
                ref="sortableContainer"
                class="space-y-3"
              >
                <div
                  v-for="venue in mapVenues"
                  :key="venue.specialId"
                  draggable="true"
                  @dragstart="
                    onDragStart(
                      {
                        id: venue.venueId,
                        name: venue.name,
                        specialId: venue.specialId,
                      },
                      $event
                    )
                  "
                  @dragend="onDragEnd"
                  class="venue-item flex items-center gap-3 p-2 rounded-lg hover:bg-elevated transition-colors cursor-move bg-default border border-accented"
                >
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <UIcon
                      name="i-lucide-grip-vertical"
                      class="grip-handle text-muted cursor-move"
                      @mousedown.stop
                    />
                    <NuxtLink
                      :to="`/dashboard/specials/${venue.specialId}`"
                      class="font-medium text-highlighted hover:text-primary transition-colors flex-1 min-w-0"
                      @click.stop
                    >
                      {{ capitalizeVenueName(venue.name) }}
                    </NuxtLink>
                  </div>
                  <UInput
                    :model-value="venue.timeslot"
                    placeholder="Time slot"
                    class="w-32"
                    @update:model-value="
                      updateTimeslot(venue.specialId, $event)
                    "
                    @click.stop
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Dropzone for Non-Participating Venues -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-highlighted">
                Non-Participating Venues
              </h3>

              <UModal
                title="Add New Venue"
                close-icon="i-lucide-x"
                :model-value="isAddVenueModalOpen"
                @update:model-value="
                  (value: boolean) => {
                    isAddVenueModalOpen = value;
                    if (!value) resetVenueFormState();
                  }
                "
                @close="resetVenueFormState"
                :ui="{ body: 'p-6 sm:p-8', header: 'px-6 pt-6' }"
              >
                <UButton
                  icon="i-lucide-plus"
                  label="Add Venue"
                  color="primary"
                  size="xs"
                  @click="isAddVenueModalOpen = true"
                />

                <template #body>
                  <UForm
                    id="create-venue-form"
                    :schema="venueSchema"
                    :state="venueFormState"
                    @submit="onCreateVenue"
                  >
                    <div class="space-y-4">
                      <UFormField
                        name="name"
                        label="Name"
                        description="The name of the venue."
                        required
                        class="flex max-sm:flex-col justify-between items-start gap-4"
                      >
                        <UInput
                          v-model="venueFormState.name"
                          autocomplete="off"
                          placeholder="Enter venue name"
                          class="min-w-[280px]"
                        />
                      </UFormField>

                      <USeparator />

                      <UFormField
                        name="slug"
                        label="Slug"
                        description="URL-friendly identifier."
                        required
                        class="flex max-sm:flex-col justify-between items-start gap-4"
                      >
                        <UInput
                          v-model="venueFormState.slug"
                          autocomplete="off"
                          placeholder="venue-slug"
                          class="min-w-[280px]"
                        />
                      </UFormField>

                      <USeparator />

                      <UFormField
                        name="city"
                        label="City"
                        description="Associate the venue with a city."
                        class="flex max-sm:flex-col justify-between items-start gap-4"
                      >
                        <USelectMenu
                          v-model="venueFormState.city"
                          :items="cityOptions"
                          value-key="value"
                          placeholder="Select a city"
                          searchable
                          clearable
                          class="min-w-[280px]"
                        />
                      </UFormField>

                      <USeparator />

                      <UFormField
                        name="address_line_1"
                        label="Address"
                        description="Street address (optional)."
                        class="flex max-sm:flex-col justify-between items-start gap-4"
                      >
                        <UInput
                          v-model="venueFormState.address_line_1"
                          autocomplete="off"
                          placeholder="123 Main St."
                          class="min-w-[280px]"
                        />
                      </UFormField>

                      <USeparator />

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <UFormField
                          name="state"
                          label="State"
                        >
                          <UInput
                            v-model="venueFormState.state"
                            autocomplete="off"
                            placeholder="State"
                          />
                        </UFormField>
                        <UFormField
                          name="zip_code"
                          label="Zip Code"
                        >
                          <UInput
                            v-model="venueFormState.zip_code"
                            autocomplete="off"
                            placeholder="Zip code"
                          />
                        </UFormField>
                      </div>

                      <USeparator />

                      <UFormField
                        name="maps_embed"
                        label="Maps Embed"
                        description="Google Maps embed URL or snippet (optional)."
                        class="flex max-sm:flex-col justify-between items-start gap-4"
                      >
                        <UTextarea
                          v-model="venueFormState.maps_embed"
                          :rows="3"
                          autoresize
                          placeholder="https://maps.google.com/..."
                          class="min-w-[280px]"
                        />
                      </UFormField>

                      <div class="flex justify-end gap-3 pt-2">
                        <UButton
                          label="Cancel"
                          color="neutral"
                          variant="ghost"
                          @click="
                            () => {
                              isAddVenueModalOpen = false;
                              resetVenueFormState();
                            }
                          "
                        />
                        <UButton
                          form="create-venue-form"
                          label="Create Venue"
                          type="submit"
                          color="primary"
                          :loading="isSavingVenue"
                          :disabled="isSavingVenue"
                        />
                      </div>
                    </div>
                  </UForm>
                </template>
              </UModal>
            </div>
            <div
              @dragover="onDragOverRight"
              @dragleave="onDragLeaveRight"
              @drop="onDropRight"
              :class="[
                'min-h-[200px] p-4 rounded-lg border-2 border-dashed transition-colors',
                isOverRightDropzone
                  ? 'border-error bg-error/10'
                  : 'border-accented bg-elevated/50',
              ]"
            >
              <div
                v-if="availableVenues.length === 0"
                class="text-center py-8 text-muted"
              >
                <p v-if="!basicDetailsFormState.city">
                  Please select a city to view venues.
                </p>
                <p v-else-if="filteredVenues.length === 0">
                  No venues found for this city.
                </p>
              </div>
              <div
                v-else
                class="space-y-1 max-h-[600px] overflow-y-auto"
              >
                <div
                  v-for="venue in availableVenues"
                  :key="venue.id"
                  draggable="true"
                  @dragstart="
                    onDragStart({
                      id: venue.id,
                      name: venue.name || 'Unnamed Venue',
                    })
                  "
                  @dragend="onDragEnd"
                  class="p-2 rounded cursor-move hover:bg-elevated transition-colors"
                >
                  <p class="text-highlighted">
                    {{ capitalizeVenueName(venue.name || 'Unnamed Venue') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UPageCard>
    </template>
  </div>
</template>
