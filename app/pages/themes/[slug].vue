<script lang="ts" setup>
const supabase = useSupabaseClient();

const { slug } = useRoute().params;

const { data: theme } = await useAsyncData('theme', async () => {
  const { data } = await supabase
    .from('themes')
    .select('*')
    .eq('slug', slug as string)
    .single();
  return data ?? [];
});
</script>

<template>
  <div>
    <pre>{{ theme }}</pre>
  </div>
</template>

<style></style>
