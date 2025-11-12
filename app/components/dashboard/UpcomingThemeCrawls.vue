<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';

const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { copy } = useClipboard();

// Find the next theme coming up (based on crawl_date)
const { data: nextTheme } = await useAsyncData('next-theme', async () => {
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  const { data, error } = await supabase
    .from('themes')
    .select('id, display_name, slug, crawl_date, square_1_image_url')
    .gte('crawl_date', today) // Only get themes with crawl_date >= today
    .order('crawl_date', { ascending: true, nullsFirst: false })
    .limit(1)
    .single();

  if (error) {
    // If no future theme found, return null
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message);
  }

  return data;
});

// Get crawls for the next theme
const { data: themeCrawls } = await useAsyncData(
  'theme-crawls',
  async () => {
    if (!nextTheme.value?.id) {
      return [];
    }

    const { data, error } = await supabase
      .from('crawls')
      .select(
        `
        id,
        name,
        crawl_image_1,
        event_date_start,
        city:cities (
          name,
          slug
        ),
        theme:themes (
          display_name,
          slug,
          square_1_image_url
        )
      `
      )
      .eq('theme', nextTheme.value.id)
      .gte('event_date_start', new Date().toISOString()) // Only upcoming crawls
      .order('event_date_start', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },
  {
    watch: [nextTheme],
  }
);

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

interface CrawlRow {
  id: string;
  name: string;
  date: string;
  city: string;
  theme: string;
  avatar: string | null;
}

const columns: TableColumn<CrawlRow>[] = [
  { accessorKey: 'name', header: 'Crawl' },
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'city', header: 'City' },
  { accessorKey: 'theme', header: 'Theme' },
  { id: 'actions' },
];

const tableData = computed<CrawlRow[]>(() =>
  (themeCrawls.value ?? []).map((crawl) => ({
    id: crawl.id,
    name: crawl.name ?? 'Untitled crawl',
    date: crawl.event_date_start
      ? dateTimeFormatter.format(new Date(crawl.event_date_start))
      : 'TBD',
    city: crawl.city?.name ?? '—',
    theme: crawl.theme?.display_name ?? '—',
    avatar: crawl.crawl_image_1 ?? crawl.theme?.square_1_image_url ?? null,
  }))
);

function getDropdownActions(crawl: CrawlRow): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Copy crawl ID',
        icon: 'i-lucide-copy',
        onSelect: () => {
          copy(crawl.id);
          toast.add({
            title: 'Crawl ID copied to clipboard',
            color: 'success',
            icon: 'i-lucide-circle-check',
          });
        },
      },
    ],
    [
      {
        label: 'Edit',
        icon: 'i-lucide-edit',
        onSelect: () => router.push(`/dashboard/crawls/${crawl.id}`),
      },
      {
        label: 'Delete',
        icon: 'i-lucide-trash',
        color: 'error',
        disabled: true,
      },
    ],
  ];
}
</script>

<template>
  <UPageCard
    v-if="nextTheme"
    :title="`Upcoming Crawls - ${nextTheme.display_name ?? 'Next Theme'}`"
    :description="
      nextTheme.crawl_date
        ? `Theme crawl date: ${dateFormatter.format(new Date(nextTheme.crawl_date))}`
        : 'Upcoming crawls for the next theme'
    "
    variant="subtle"
    class="mb-4"
  >
    <div v-if="tableData.length === 0">
      <p class="text-muted">No upcoming crawls found for this theme.</p>
    </div>
    <UTable
      v-else
      :data="tableData"
      :columns="columns"
      class="flex-1"
    >
      <template #name-cell="{ row }">
        <div class="flex items-center gap-3">
          <UAvatar
            :src="row.original.avatar ?? undefined"
            size="md"
            :alt="row.original.name"
          />
          <span class="font-medium text-highlighted">
            {{ row.original.name }}
          </span>
        </div>
      </template>
      <template #actions-cell="{ row }">
        <UDropdownMenu :items="getDropdownActions(row.original)">
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
            aria-label="Actions"
          />
        </UDropdownMenu>
      </template>
    </UTable>
  </UPageCard>
  <UPageCard
    v-else
    title="Upcoming Theme Crawls"
    description="No upcoming themes found."
    variant="subtle"
    class="mb-4"
  >
    <p class="text-muted">There are no themes with upcoming crawl dates.</p>
  </UPageCard>
</template>

