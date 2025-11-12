<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const links = [
  [
    {
      label: 'All Crawls',
      icon: 'i-lucide-beer',
      to: '/dashboard/crawls',
      exact: true,
    },
    {
      label: 'Upcoming Crawls',
      icon: 'i-lucide-calendar',
      to: '/dashboard/crawls/upcoming',
    },
    {
      label: 'Past Crawls',
      icon: 'i-lucide-calendar-check',
      to: '/dashboard/crawls/past',
    },
  ],
] satisfies NavigationMenuItem[][];
</script>

<template>
  <UDashboardPanel
    id="settings"
    :ui="{ body: 'lg:py-12' }"
  >
    <template #header>
      <UDashboardNavbar
        title="Crawls"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            size="md"
            class="rounded-full"
            :to="'/dashboard/crawls/new'"
          >
            New crawl
          </UButton>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu
          :items="links"
          highlight
          class="-mx-1 flex-1"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <NuxtPage />
    </template>
  </UDashboardPanel>
</template>
