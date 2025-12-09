<script lang="ts" setup>
const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();

const themeId = computed(() => route.params.id as string);

// Fetch the theme
const {
  data: theme,
  status,
  error,
  refresh,
} = await useAsyncData(
  () => `dashboard-theme-${themeId.value}`,
  async () => {
    if (!themeId.value) {
      return null;
    }

    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('id', themeId.value)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
  {
    watch: [themeId],
  }
);

// Fetch all crawls related to this theme
const { data: relatedCrawls } = await useAsyncData(
  () => `theme-crawls-${themeId.value}`,
  async () => {
    if (!themeId.value) {
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
        cityData:cities (
          id,
          name
        )
      `
      )
      .eq('theme', themeId.value);

    if (error) {
      console.error('Error fetching crawls:', error);
      return [];
    }

    return data ?? [];
  },
  {
    watch: [themeId],
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
  <div class="flex flex-col flex-1 w-full">
    <div v-if="status === 'pending'" class="flex items-center justify-center flex-1">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin mx-auto mb-2" />
        <p class="text-sm text-muted">Loading theme...</p>
      </div>
    </div>

    <div v-else-if="error" class="flex items-center justify-center flex-1">
      <div class="text-center">
        <UIcon name="i-lucide-alert-circle" class="w-8 h-8 text-error mx-auto mb-2" />
        <p class="text-sm text-error">Error loading theme</p>
        <UButton
          @click="() => refresh()"
          variant="outline"
          class="mt-4"
        >
          Retry
        </UButton>
      </div>
    </div>

    <div v-else-if="theme" class="flex flex-col flex-1 w-full">
      <!-- Header -->
      <div class="px-4 py-6 border-b border-accented">
        <h1 class="text-2xl font-semibold text-highlighted mb-2">
          {{ theme.display_name ?? theme.name ?? 'Untitled Theme' }}
        </h1>
        <div class="flex flex-wrap gap-4 text-sm text-muted">
          <span v-if="theme.slug">
            <UIcon name="i-lucide-link" class="w-4 h-4 inline mr-1" />
            {{ theme.slug }}
          </span>
          <span v-if="theme.crawl_date">
            <UIcon name="i-lucide-calendar" class="w-4 h-4 inline mr-1" />
            Next Crawl: {{ formatDate(theme.crawl_date) }}
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
            <p class="text-sm text-muted">No crawls found for this theme.</p>
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
                    <span v-if="crawl.cityData?.name">
                      <UIcon name="i-lucide-map-pin" class="w-4 h-4 inline mr-1" />
                      {{ crawl.cityData.name }}
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
      </div>
    </div>
  </div>
</template>
