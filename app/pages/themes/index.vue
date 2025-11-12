<script lang="ts" setup>
import type { AccordionItem } from '@nuxt/ui';

const supabase = useSupabaseClient();

const { data: themes } = await useAsyncData('themes', async () => {
  const { data } = await supabase
    .from('themes')
    .select('*')
    .order('crawl_date', { ascending: true });

  return data ?? [];
});

const heroImage = computed(() => {
  return themes.value?.[0]?.square_1_image_url;
});

const heroImageAltText = computed(() => {
  return themes.value?.[0]?.square_1_image_alt_text;
});

const heroLinks = ref([
  {
    label: 'Upcoming Events',
    to: '#upcoming-events',
  },
]);

const faqs = ref<AccordionItem[]>([
  {
    label: 'What is a bar crawl?',
    icon: 'i-lucide-beer',
    content:
      'A bar crawl is a social event that involves visiting multiple bars, pubs, or nightclubs in a designated area. It typically takes place in an evening or night, where participants move from one venue to another as a group. Bar crawls provide an opportunity to experience the local bar scene, try different drinks, socialize with fellow participants, and enjoy the unique atmosphere of each establishment. They often include perks such as discounted drinks, exclusive access to venues, and organized activities to enhance the overall experience.',
  },
  {
    label: 'Are there any events happening near me this weekend?',
    icon: 'i-lucide-map-pin',
    content:
      "Seeking thrilling events near you this weekend? Look no further than Bar Crawl LIVE! Stay updated on the latest happenings in your area by regularly checking our upcoming bar crawls. Don't miss out on the lively atmosphere and unforgettable experiences of the upcoming events near you.",
  },
  {
    label: 'How do I find a bar crawl near me?',
    icon: 'i-lucide-search',
    content:
      'Want to discover thrilling bar crawls near your location? Bar Crawl LIVE is here to help! Our website provides an easy way to find upcoming bar crawl events in your area. Simply enter your location or browse our listings to explore the best bar crawls happening near you. Join us for an unforgettable night of hopping from one lively venue to another, enjoying fantastic drinks, meeting new people, and experiencing the vibrant nightlife scene right in your own neighborhood.',
  },
  {
    label: 'What should I wear to a bar crawl?',
    icon: 'i-lucide-shirt',
    content:
      "Dressing up for our themed bar crawls adds an extra level of excitement and immersion to the experience. Embrace the theme spirit by wearing creative and themed attire that matches the event. Whether it's costumes, accessories, or themed outfits, let your imagination run wild. Get ready to show off your unique style and have a blast with fellow bar crawlers.",
  },
  {
    label: 'What are the benefits of joining a themed bar crawl?',
    icon: 'i-lucide-check-circle',
    content:
      'Participating in one of our many themes for a bar crawl offers an unforgettable experience. Immerse yourself in the holiday or themed atmosphere as you visit hand-selected venues that perfectly complement the theme. Enjoy themed drink specials, lively entertainment, and a vibrant social atmosphere throughout the crawl.',
  },
]);

const items = computed(() => {
  return themes.value?.map((theme) => {
    return {
      label: theme.display_name,
      image: theme.square_2_image_url,
      alt: theme.square_2_image_alt_text,
      date: theme.crawl_date,
      slug: theme.slug,
    };
  });
});
</script>

<template>
  <div>
    <UPageHero
      title="Bar Crawl & Block Party Themes"
      description="Crawl with us for the best bar crawls in the USA! Bringing you the ultimate bar crawl themes from St. Patrick's Day events to Halloween parties, and Christmas bar events for a unforgettable bar hopping tour! "
      :links="heroLinks"
      orientation="horizontal"
    >
      <img
        class="w-fullobject-cover rounded-lg"
        :src="heroImage"
        :alt="heroImageAltText"
      />
    </UPageHero>
    <UPageSection
      title="Our Themes"
      description="We bring you the best bar crawl themes from St. Patrick's Day events to Halloween parties, and Christmas bar events for a unforgettable bar hopping tour! "
    >
      <UPageGrid>
        <ULink
          v-for="(item, index) in items"
          :key="index"
          :to="`/themes/${item.slug}`"
        >
          <UPageCard
            :title="item.label"
            :description="item.date"
            spotlight
          >
            <template #header>
              <img
                class="w-full object-cover rounded-lg aspect-4/5"
                :src="item.image"
                :alt="item.alt"
              />
            </template>
          </UPageCard>
        </ULink>
      </UPageGrid>
    </UPageSection>
    <UPageSection
      title="Frequently Asked Questions"
      description="just a few questions and answers to help you get started"
    >
      <UAccordion :items="faqs" />
    </UPageSection>
    <UPageSection>
      <UPageCTA
        title="Get first dibs on ticket giveaways, discounts, and new events"
        description="Sign up for news and all our best deals for upcoming bar and pub crawls, block parties and special events."
        variant="solid"
      />
    </UPageSection>
  </div>
</template>
