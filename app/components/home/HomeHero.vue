<script lang="ts" setup>
const links = [
  {
    label: 'Find a Crawl',
    to: '/crawls',
    trailingIcon: 'i-lucide-arrow-right',
  },
  {
    label: 'Find your city',
    to: '/cities',
    trailingIcon: 'i-lucide-arrow-right',
    variant: 'outline',
  },
];
</script>

<template>
  <UPageHero
    title="The Go To Party For Party Goers."
    description="Bar Crawl LIVE! Proudly Hosts the country's best bar crawls and pub crawls. Join the party as we bar-hop through your city's top-rated bars and nightclubs. "
    headline="Bar Crawl Live!"
    :links="links"
  />
</template>

<style></style>
