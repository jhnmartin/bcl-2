<script lang="ts" setup>
const supabase = useSupabaseClient();

const { data: blogs, error } = await useAsyncData('blogs', () =>
  supabase.from('blogs').select('*').order('published_at', { ascending: false })
);
</script>

<template>
  <UDashboardPanel id="blog">
    <template #header>
      <UDashboardNavbar
        title="Blog"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UPageGrid>
        <UPageCard
          v-for="blog in blogs"
          :key="blog?.id"
          :title="blog?.title"
        >
          <img
            src="https://placehold.co/600x400"
            alt="Blog Article 1"
          />
        </UPageCard>
      </UPageGrid>
      <pre>{{ blogs }}</pre>
    </template>
  </UDashboardPanel>
</template>

<style></style>
