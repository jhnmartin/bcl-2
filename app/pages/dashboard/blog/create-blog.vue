<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Create Blog Post">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/dashboard/blog"
          />
        </template>
        <template #right>
          <UButton label="Save Draft" color="neutral" variant="outline" />
          <UButton label="Publish" color="primary" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- BlogEditor is a .client.vue component, so it only renders on client -->
      <DashboardBlogEditor />
    </template>
  </UDashboardPanel>
</template>
