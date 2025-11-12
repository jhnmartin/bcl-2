<script lang="ts" setup>
definePageMeta({
  colorMode: 'dark',
});

const supabase = useSupabaseClient();

const { data: themes } = await supabase
  .from('themes')
  .select('*')
  .order('crawl_date', { ascending: true });

const fomattedDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

const upcomingLinks = computed(() => {
  if (!themes || themes.length === 0) return [];
  return [
    {
      label: 'Find Your City',
      to: `/themes/${themes[0].slug}`,
    },
  ];
});

const upcomingFeatures = ref([
  {
    title: 'Up to 50% OFF Specials',
    description:
      'Delight in wristband-only discounts on holiday-themed drinks, shots, beers, and food.',
    icon: 'i-lucide-beer',
  },
  {
    title: 'Contests, Parties and More',
    description:
      'Crawl with us and hundreds of other festive party-goers, groove to the music of local DJs, and show off your tackiest holiday sweater.',
    icon: 'i-lucide-party-popper',
  },
  {
    title: 'Waived Cover Charges',
    description:
      'Receive FREE exclusive entry to the coolest bars and nightclubs with your Ugly Sweater bar crawl wristband.',
    icon: 'i-lucide-ticket',
  },
]);
</script>

<template>
  <UContainer :ui="{ container: 'max-w-none' }">
    <HomeHero />
    <div class="flex flex-col gap-4">
      <UMarquee :ui="{ root: 'gap-4', content: 'gap-4' }">
        <ULink
          v-for="theme in themes"
          :key="theme.id"
          :to="`/themes/${theme.slug}`"
          class="max-w-96"
        >
          <UPageCard>
            <img
              class="w-96 object-cover"
              :src="theme.vertical_image_url ?? ''"
              :alt="theme.vertical_image_alt_text ?? ''"
            />
          </UPageCard>
        </ULink>
      </UMarquee>
      <UMarquee
        reverse
        :ui="{ root: 'gap-4', content: 'gap-4' }"
      >
        <ULink
          v-for="theme in themes"
          :key="theme.id"
          :to="`/themes/${theme.slug}`"
          class="max-w-96"
        >
          <UPageCard>
            <img
              class="w-full object-cover"
              :src="theme.vertical_image_url ?? ''"
              :alt="theme.vertical_image_alt_text ?? ''"
            />
          </UPageCard>
        </ULink>
      </UMarquee>
    </div>
    <UPageSection
      v-if="themes && themes.length > 0"
      :title="themes[0]?.display_name ?? ''"
      :description="themes[0]?.home_h2 ?? ''"
      orientation="horizontal"
      :links="upcomingLinks"
      :features="upcomingFeatures"
    >
      <UPageGrid class="grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <img
          :src="themes[0]?.square_1_image_url ?? ''"
          :alt="themes[0]?.square_1_image_alt_text ?? ''"
          class="w-full object-cover rounded-lg col-span-2"
        />
        <img
          :src="themes[0]?.square_2_image_url ?? ''"
          :alt="themes[0]?.square_2_image_alt_text ?? ''"
        />
        <img
          :src="themes[0]?.square_3_image_url ?? ''"
          :alt="themes[0]?.square_3_image_alt_text ?? ''"
        />
      </UPageGrid>
    </UPageSection>
    <UPageSection
      title="Upcoming Bar Crawl Events"
      description="Looking for bar crawls near me or planning a night of bar hopping near me? 🎉 From seasonal themes to city-wide parties, our bar crawls bring friends together for unforgettable nights. Secure your bar crawl tickets today and join the best bar hop near me. Don’t miss out—bar crawls this weekend are filling fast! Explore all upcoming bar crawl events at Bar Crawl LIVE. "
    >
      <UPageGrid class="grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4">
        <ULink
          :to="`/themes/${themes[1]?.slug ?? ''}`"
          class="object-cover rounded-lg lg:row-span-2 overflow-hidden"
        >
          <p
            class="absolute bottom-0 left-0 right-0 p-4 text-white text-2xl font-bold z-10"
          >
            {{ themes[1]?.display_name ?? '' }}
          </p>
          <img
            :src="themes[1]?.horizontal_image_url ?? ''"
            :alt="themes[1]?.horizontal_image_alt_text ?? ''"
            class="h-full object-cover"
          />
        </ULink>
        <ULink
          :to="`/themes/${themes[2]?.slug ?? ''}`"
          class="relative object-cover rounded-lg overflow-hidden"
        >
          <p
            class="absolute bottom-0 left-0 right-0 p-4 text-white text-2xl font-bold z-10"
          >
            {{ themes[2]?.display_name ?? '' }}
          </p>
          <img
            :src="themes[2]?.horizontal_image_url ?? ''"
            :alt="themes[2]?.horizontal_image_alt_text ?? ''"
            class="inset-0 h-full w-full object-cover"
          />
        </ULink>
        <ULink
          :to="`/themes/${themes[3]?.slug ?? ''}`"
          class="relative object-cover rounded-lg overflow-hidden"
        >
          <p
            class="absolute bottom-0 left-0 right-0 p-4 text-white text-2xl font-bold z-10"
          >
            {{ themes[3]?.display_name }}
          </p>
          <img
            :src="themes[3]?.horizontal_image_url ?? ''"
            :alt="themes[3]?.horizontal_image_alt_text ?? ''"
            class="inset-0 w-full h-full object-cover"
          />
        </ULink>
      </UPageGrid>
    </UPageSection>
    <NewsletterCta />
  </UContainer>
</template>
