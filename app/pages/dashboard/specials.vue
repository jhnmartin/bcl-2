<script lang="ts" setup></script>

<template>
  <UDashboardPanel id="specials">
    <template #header>
      <UDashboardNavbar
        title="Specials"
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
            :to="'/dashboard/specials/new'"
          >
            New special
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <NuxtPage />
    </template>
  </UDashboardPanel>
</template>
