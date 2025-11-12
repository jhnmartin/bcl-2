<script lang="ts" setup>
const { isNotificationsSlideoverOpen } = useDashboard();
</script>

<template>
  <UDashboardPanel id="venues">
    <template #header>
      <UDashboardNavbar
        title="Venues"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip
            text="Notifications"
            :shortcuts="['N']"
          >
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip
                color="error"
                inset
              >
                <UIcon
                  name="i-lucide-bell"
                  class="size-5 shrink-0"
                />
              </UChip>
            </UButton>
          </UTooltip>

          <UButton
            color="primary"
            icon="i-lucide-plus"
            size="md"
            class="rounded-full"
            :to="'/dashboard/venues/new'"
          >
            New venue
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <NuxtPage />
    </template>
  </UDashboardPanel>
</template>
