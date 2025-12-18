<script setup lang="ts">
const { isNotificationsSlideoverOpen } = useDashboard();
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="Notifications"
  >
    <template #body>
      <div class="p-4 text-center text-muted">No notifications</div>
    </template>
  </USlideover>
</template>
