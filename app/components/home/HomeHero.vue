<script lang="ts" setup>
const supabase = useSupabaseClient();

const { data: crawls } = await supabase
  .from('crawls')
  .select('event_date_start, themes(vertical_image_url)')
  .order('event_date_start', { ascending: true })
  .limit(1);

const links = [
  {
    label: 'Find a Crawl',
    to: '/crawls',
  },
];
</script>

<template>
  <UPageHero
    title="Bar Crawl Live! The Go To Party For Party Goers."
    description="Bar Crawl LIVE! Proudly Hosts the country's best bar crawls and pub crawls. Join the party as we bar-hop through your city's top-rated bars and nightclubs. "
    :links="links"
    orientation="horizontal"
  >
    <img
      v-if="crawls && crawls[0]?.themes?.vertical_image_url"
      :src="crawls[0].themes.vertical_image_url"
      alt="Bar Crawl Live! The Go To Party For Party Goers."
    />
  </UPageHero>
</template>

<style></style>
