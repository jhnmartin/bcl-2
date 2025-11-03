<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const route = useRoute();

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Themes',
    to: '/themes',
    active: route.path.startsWith('/themes'),
  },
  {
    label: 'Cities',
    to: '/cities',
    active: route.path.startsWith('/cities'),
  },
  {
    label: 'FAQ',
    to: '/faq',
    active: route.path.startsWith('/faq'),
  },
  {
    label: 'Blog',
    to: '/blog',
    active: route.path.startsWith('/blog'),
  },
  {
    label: 'Contact',
    to: '/contact',
    active: route.path.startsWith('/contact'),
  },
]);
</script>

<template>
  <UHeader mode="drawer">
    <template #title>
      <p>Bar Crawl Live!</p>
    </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <UButton
        to="/crawls"
        aria-label="Crawls"
        label="Crawls"
        icon="i-lucide-arrow-right"
      />
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />

      <USeparator class="my-6" />

      <UButton
        label="Sign in"
        color="neutral"
        variant="subtle"
        to="/login"
        block
        class="mb-3"
      />
    </template>
  </UHeader>
</template>
