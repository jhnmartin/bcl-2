<script lang="ts" setup>
const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();

const cityId = computed(() => route.params.id as string);

// Fetch the city
const {
  data: city,
  status,
  error,
  refresh,
} = await useAsyncData(
  () => `dashboard-city-${cityId.value}`,
  async () => {
    if (!cityId.value) {
      return null;
    }

    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId.value)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
  {
    watch: [cityId],
  }
);

// Fetch all crawls related to this city
const { data: relatedCrawls } = await useAsyncData(
  () => `city-crawls-${cityId.value}`,
  async () => {
    if (!cityId.value) {
      return [];
    }

    const { data, error } = await supabase
      .from('crawls')
      .select(
        `
        id,
        name,
        slug,
        event_date_start,
        event_date_end,
        themeData:themes (
          id,
          display_name,
          name
        )
      `
      )
      .eq('city', cityId.value);

    if (error) {
      console.error('Error fetching crawls:', error);
      return [];
    }

    return data ?? [];
  },
  {
    watch: [cityId],
  }
);

// Fetch all venues related to this city
const { data: relatedVenues } = await useAsyncData(
  () => `city-venues-${cityId.value}`,
  async () => {
    if (!cityId.value) {
      return [];
    }

    const { data, error } = await supabase
      .from('venues')
      .select(
        `
        id,
        name,
        slug,
        address_line_1,
        state,
        zip_code
      `
      )
      .eq('city', cityId.value);

    if (error) {
      console.error('Error fetching venues:', error);
      return [];
    }

    return data ?? [];
  },
  {
    watch: [cityId],
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
  <UDashboardPanel id="city-detail">
    <template #header>
      <UDashboardNavbar
        :title="city?.name ?? 'City'"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="status === 'pending'" class="flex items-center justify-center flex-1 py-12">
        <div class="text-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin mx-auto mb-2" />
          <p class="text-sm text-muted">Loading city...</p>
        </div>
      </div>

      <div v-else-if="error" class="flex items-center justify-center flex-1 py-12">
        <div class="text-center">
          <UIcon name="i-lucide-alert-circle" class="w-8 h-8 text-error mx-auto mb-2" />
          <p class="text-sm text-error">Error loading city</p>
          <UButton
            @click="() => refresh()"
            variant="outline"
            class="mt-4"
          >
            Retry
          </UButton>
        </div>
      </div>

      <div v-else-if="city" class="flex flex-col flex-1 w-full">
        <!-- Header -->
        <div class="px-4 py-6 border-b border-accented">
          <h1 class="text-2xl font-semibold text-highlighted mb-2">
            {{ city.name ?? 'Untitled City' }}
          </h1>
          <div class="flex flex-wrap gap-4 text-sm text-muted">
            <span v-if="city.slug">
              <UIcon name="i-lucide-link" class="w-4 h-4 inline mr-1" />
              {{ city.slug }}
            </span>
          </div>
        </div>

        <!-- Content Sections -->
        <div class="flex-1 overflow-y-auto">
        <!-- Related Crawls Section -->
        <div class="px-4 py-6 border-b border-accented">
          <h2 class="text-lg font-semibold text-highlighted mb-4">
            Related Crawls
          </h2>

          <div v-if="!relatedCrawls || relatedCrawls.length === 0" class="text-center py-8">
            <p class="text-sm text-muted">No crawls found for this city.</p>
          </div>

          <div v-else class="space-y-3">
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
                    <span v-if="crawl.themeData?.display_name || crawl.themeData?.name">
                      <UIcon name="i-lucide-tag" class="w-4 h-4 inline mr-1" />
                      {{ crawl.themeData?.display_name ?? crawl.themeData?.name }}
                    </span>
                    <span v-if="crawl.event_date_start">
                      <UIcon name="i-lucide-calendar" class="w-4 h-4 inline mr-1" />
                      {{ formatDate(crawl.event_date_start) }}
                    </span>
                  </div>
                </div>
                <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-muted ml-4" />
              </div>
            </div>
          </div>
        </div>

        <!-- Related Venues Section -->
        <div class="px-4 py-6">
          <h2 class="text-lg font-semibold text-highlighted mb-4">
            Related Venues
          </h2>

          <div v-if="!relatedVenues || relatedVenues.length === 0" class="text-center py-8">
            <p class="text-sm text-muted">No venues found for this city.</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="venue in relatedVenues"
              :key="venue.id"
              class="border border-accented rounded-lg p-4 hover:bg-accented/50 transition-colors cursor-pointer"
              @click="router.push(`/dashboard/venues/${venue.id}`)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-medium text-highlighted mb-1">
                    {{ venue.name ?? 'Untitled Venue' }}
                  </h3>
                  <div class="flex flex-wrap gap-4 text-sm text-muted">
                    <span v-if="venue.address_line_1">
                      <UIcon name="i-lucide-map-pin" class="w-4 h-4 inline mr-1" />
                      {{ [venue.address_line_1, venue.state, venue.zip_code].filter(Boolean).join(', ') }}
                    </span>
                  </div>
                </div>
                <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-muted ml-4" />
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

