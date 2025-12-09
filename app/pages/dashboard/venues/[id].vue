<script lang="ts" setup>
const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();

const venueId = computed(() => route.params.id as string);

// Fetch the venue
const {
  data: venue,
  status,
  error,
  refresh,
} = await useAsyncData(
  () => `dashboard-venue-${venueId.value}`,
  async () => {
    if (!venueId.value) {
      return null;
    }

    const { data, error } = await supabase
      .from('venues')
      .select(
        `
        *,
        cityData:cities (
          id,
          name
        )
      `
      )
      .eq('id', venueId.value)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
  {
    watch: [venueId],
  }
);

// Fetch all crawls related to this venue
const { data: relatedCrawls } = await useAsyncData(
  () => `venue-crawls-${venueId.value}`,
  async () => {
    if (!venueId.value) {
      return [];
    }

    // Get crawls where this venue is the checkin venue
    const { data: directCrawls, error: directError } = await supabase
      .from('crawls')
      .select(
        `
        id,
        name,
        slug,
        event_date_start,
        event_date_end,
        cityData:cities (
          id,
          name
        ),
        themeData:themes (
          id,
          display_name,
          name
        )
      `
      )
      .eq('checkin_venue_1', venueId.value);

    if (directError) {
      console.error('Error fetching direct crawls:', directError);
    }

    // Get crawls through specials
    const { data: specialsData, error: specialsError } = await supabase
      .from('specials')
      .select(
        `
        crawl:crawls (
          id,
          name,
          slug,
          event_date_start,
          event_date_end,
          cityData:cities (
            id,
            name
          ),
          themeData:themes (
            id,
            display_name,
            name
          )
        )
      `
      )
      .eq('venue', venueId.value);

    if (specialsError) {
      console.error('Error fetching crawls through specials:', specialsError);
    }

    // Get crawls through maps
    const { data: mapsData, error: mapsError } = await supabase
      .from('maps')
      .select(
        `
        crawl:crawls (
          id,
          name,
          slug,
          event_date_start,
          event_date_end,
          cityData:cities (
            id,
            name
          ),
          themeData:themes (
            id,
            display_name,
            name
          )
        )
      `
      )
      .or(
        `checkin_venue_1.eq.${venueId.value},checkin_venue_2.eq.${venueId.value},checkin_venue_3.eq.${venueId.value},early_checkin_venue.eq.${venueId.value},early_checkin_venue_2.eq.${venueId.value}`
      );

    if (mapsError) {
      console.error('Error fetching crawls through maps:', mapsError);
    }

    // Combine and deduplicate crawls by ID
    const crawlMap = new Map();

    // Add direct crawls
    directCrawls?.forEach((crawl) => {
      if (crawl?.id) {
        crawlMap.set(crawl.id, crawl);
      }
    });

    // Add crawls from specials
    specialsData?.forEach((special) => {
      const crawl = special.crawl;
      if (crawl && typeof crawl === 'object' && 'id' in crawl) {
        crawlMap.set(crawl.id, crawl);
      }
    });

    // Add crawls from maps
    mapsData?.forEach((map) => {
      const crawl = map.crawl;
      if (crawl && typeof crawl === 'object' && 'id' in crawl) {
        crawlMap.set(crawl.id, crawl);
      }
    });

    return Array.from(crawlMap.values());
  },
  {
    watch: [venueId],
  }
);

// Format address
const formattedAddress = computed(() => {
  if (!venue.value) return null;

  const parts = [
    venue.value.address_line_1,
    venue.value.state,
    venue.value.zip_code,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : null;
});

// Fetch all specials related to this venue
const { data: relatedSpecials } = await useAsyncData(
  () => `venue-specials-${venueId.value}`,
  async () => {
    if (!venueId.value) {
      return [];
    }

    const { data, error } = await supabase
      .from('specials')
      .select(
        `
        id,
        slug,
        timeslot,
        crawlData:crawls (
          id,
          name,
          slug
        ),
        themeData:themes (
          id,
          display_name,
          name
        )
      `
      )
      .eq('venue', venueId.value)
      .order('timeslot', { ascending: true, nullsFirst: true });

    if (error) {
      console.error('Error fetching specials:', error);
      return [];
    }

    return data ?? [];
  },
  {
    watch: [venueId],
  }
);

// Format date
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(dateString: string | null) {
  if (!dateString) return '—';
  return dateFormatter.format(new Date(dateString));
}
</script>

<template>
  <UDashboardPanel id="venue-detail">
    <template #header>
      <UDashboardNavbar
        :title="venue?.name ?? 'Venue'"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="status === 'pending'"
        class="flex items-center justify-center flex-1 py-12"
      >
        <div class="text-center">
          <UIcon
            name="i-lucide-loader-2"
            class="w-8 h-8 animate-spin mx-auto mb-2"
          />
          <p class="text-sm text-muted">Loading venue...</p>
        </div>
      </div>

      <div
        v-else-if="error"
        class="flex items-center justify-center flex-1 py-12"
      >
        <div class="text-center">
          <UIcon
            name="i-lucide-alert-circle"
            class="w-8 h-8 text-error mx-auto mb-2"
          />
          <p class="text-sm text-error">Error loading venue</p>
          <UButton
            @click="() => refresh()"
            variant="outline"
            class="mt-4"
          >
            Retry
          </UButton>
        </div>
      </div>

      <div
        v-else-if="venue"
        class="flex flex-col flex-1 w-full"
      >
        <!-- Header -->
        <div class="px-4 py-6 border-b border-accented">
          <h1 class="text-2xl font-semibold text-highlighted mb-2">
            {{ venue.name ?? 'Untitled Venue' }}
          </h1>
          <p
            v-if="formattedAddress"
            class="text-sm text-muted"
          >
            {{ formattedAddress }}
          </p>
        </div>

      <!-- Content Sections -->
      <div class="flex-1 overflow-y-auto">
        <!-- Related Crawls Section -->
        <div class="px-4 py-6 border-b border-accented">
          <h2 class="text-lg font-semibold text-highlighted mb-4">
            Related Crawls
          </h2>

          <div
            v-if="!relatedCrawls || relatedCrawls.length === 0"
            class="text-center py-8"
          >
            <p class="text-sm text-muted">No crawls found for this venue.</p>
          </div>

          <div
            v-else
            class="space-y-3"
          >
            <div
              v-for="crawl in relatedCrawls"
              :key="crawl.id"
              class="border border-accented rounded-lg p-4 hover:bg-accented/50 transition-colors cursor-pointer"
              @click="router.push(`/dashboard/crawls/${crawl.id}`)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-medium text-highlighted mb-1">
                    {{ crawl.name ?? 'Untitled Crawl' }}
                  </h3>
                  <div class="flex flex-wrap gap-4 text-sm text-muted">
                    <span v-if="crawl.cityData?.name">
                      <UIcon
                        name="i-lucide-map-pin"
                        class="w-4 h-4 inline mr-1"
                      />
                      {{ crawl.cityData.name }}
                    </span>
                    <span
                      v-if="
                        crawl.themeData?.display_name || crawl.themeData?.name
                      "
                    >
                      <UIcon
                        name="i-lucide-tag"
                        class="w-4 h-4 inline mr-1"
                      />
                      {{
                        crawl.themeData?.display_name ?? crawl.themeData?.name
                      }}
                    </span>
                    <span v-if="crawl.event_date_start">
                      <UIcon
                        name="i-lucide-calendar"
                        class="w-4 h-4 inline mr-1"
                      />
                      {{ formatDate(crawl.event_date_start) }}
                    </span>
                  </div>
                </div>
                <UIcon
                  name="i-lucide-chevron-right"
                  class="w-5 h-5 text-muted ml-4"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Related Specials Section -->
        <div class="px-4 py-6">
          <h2 class="text-lg font-semibold text-highlighted mb-4">
            Related Specials
          </h2>

          <div
            v-if="!relatedSpecials || relatedSpecials.length === 0"
            class="text-center py-8"
          >
            <p class="text-sm text-muted">No specials found for this venue.</p>
          </div>

          <div
            v-else
            class="space-y-3"
          >
            <div
              v-for="special in relatedSpecials"
              :key="special.id"
              class="border border-accented rounded-lg p-4 hover:bg-accented/50 transition-colors cursor-pointer"
              @click="router.push(`/dashboard/specials/${special.id}`)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-medium text-highlighted mb-1">
                    {{ special.crawlData?.name ?? 'Untitled Special' }}
                  </h3>
                  <div class="flex flex-wrap gap-4 text-sm text-muted">
                    <span v-if="special.themeData?.display_name || special.themeData?.name">
                      <UIcon
                        name="i-lucide-tag"
                        class="w-4 h-4 inline mr-1"
                      />
                      {{ special.themeData?.display_name ?? special.themeData?.name }}
                    </span>
                    <span v-if="special.timeslot">
                      <UIcon
                        name="i-lucide-clock"
                        class="w-4 h-4 inline mr-1"
                      />
                      {{ special.timeslot }}
                    </span>
                    <span v-if="special.slug">
                      <UIcon
                        name="i-lucide-link"
                        class="w-4 h-4 inline mr-1"
                      />
                      {{ special.slug }}
                    </span>
                  </div>
                </div>
                <UIcon
                  name="i-lucide-chevron-right"
                  class="w-5 h-5 text-muted ml-4"
                />
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
