<script lang="ts" setup>
const supabase = useSupabaseClient();

const { data: crawls } = await supabase
  .from('crawls')
  .select('*, city:cities(id, name), theme:themes(id, display_name)')
  .order('event_date_start', { ascending: true });

const { data: cities } = await supabase
  .from('cities')
  .select('*')
  .order('name', { ascending: true });

const { data: themes } = await supabase
  .from('themes')
  .select('*')
  .order('crawl_date', { ascending: true });

const selectedThemes = ref<string[]>([]);
const selectedCities = ref<string[]>([]);

const filteredCrawls = computed(() => {
  if (selectedThemes.value.length === 0 && selectedCities.value.length === 0) {
    return crawls ?? [];
  }

  return (crawls ?? []).filter((crawl) => {
    const matchesTheme =
      selectedThemes.value.length === 0 ||
      (crawl.theme?.id && selectedThemes.value.includes(crawl.theme.id));
    const matchesCity =
      selectedCities.value.length === 0 ||
      (crawl.city?.id && selectedCities.value.includes(crawl.city.id));

    return matchesTheme && matchesCity;
  });
});

function clearFilters() {
  selectedThemes.value = [];
  selectedCities.value = [];
}

function toggleTheme(themeId: string) {
  const index = selectedThemes.value.indexOf(themeId);
  if (index > -1) {
    selectedThemes.value.splice(index, 1);
  } else {
    selectedThemes.value.push(themeId);
  }
}

function toggleCity(cityId: string) {
  const index = selectedCities.value.indexOf(cityId);
  if (index > -1) {
    selectedCities.value.splice(index, 1);
  } else {
    selectedCities.value.push(cityId);
  }
}
</script>

<template>
  <UPageHero
    title="Find Bar and Pub Crawls Near You"
    description="Looking for the perfect night out? Bar Crawl LIVE brings you the best bar crawl events happening across the country. From a lively downtown bar crawl to a themed River North bar crawl Halloween party our events are designed for unforgettable nights of beer crawling, bar hopping, great drink specials, and nonstop fun. It's never been easier to find bar crawls near me, bar hop near me ideas, and citywide celebrations all in one place. "
  >
    <UPage>
      <div class="flex justify-end py-4">
        <USlideover
          title="Find a Crawl by City or Theme"
          side="left"
          :close="{
            color: 'neutral',
            variant: 'subtle',
          }"
        >
          <UButton
            icon="i-lucide-sliders-horizontal"
            color="neutral"
            variant="subtle"
          />

          <template #body>
            <div class="flex flex-col h-full">
              <div class="flex-1 overflow-y-auto p-6 space-y-6">
                <!-- Themes Section -->
                <div>
                  <h3 class="text-lg font-semibold mb-4">Themes</h3>
                  <div class="space-y-3">
                    <UCheckbox
                      v-for="theme in themes"
                      :key="theme.id"
                      :model-value="selectedThemes.includes(theme.id)"
                      :label="
                        theme.display_name ?? theme.name ?? 'Untitled Theme'
                      "
                      @update:model-value="toggleTheme(theme.id)"
                    />
                  </div>
                </div>

                <!-- Cities Section -->
                <div>
                  <h3 class="text-lg font-semibold mb-4">Cities</h3>
                  <div class="space-y-3">
                    <UCheckbox
                      v-for="city in cities"
                      :key="city.id"
                      :model-value="selectedCities.includes(city.id)"
                      :label="city.name ?? 'Untitled City'"
                      @update:model-value="toggleCity(city.id)"
                    />
                  </div>
                </div>
              </div>

              <!-- Footer with Clear Button -->
              <div class="border-t p-4">
                <UButton
                  block
                  color="neutral"
                  variant="outline"
                  @click="clearFilters"
                >
                  Clear Selections
                </UButton>
              </div>
            </div>
          </template>
        </USlideover>
      </div>

      <UPageGrid>
        <ULink
          v-for="crawl in filteredCrawls"
          :key="crawl.id"
          :to="`/crawls/${crawl.slug}`"
        >
          <UPageCard
            :title="crawl.name ?? ''"
            :description="crawl.event_date_start ?? ''"
          >
            <template #header>
              <img
                :src="crawl.crawl_image_vertical_url ?? ''"
                :alt="crawl.crawl_image_vertical_alt ?? ''"
              />
            </template>
          </UPageCard>
        </ULink>
      </UPageGrid>
    </UPage>
  </UPageHero>
</template>
