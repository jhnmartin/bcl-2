<script lang="ts" setup>
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';

const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { copy } = useClipboard();

const { data: crawls } = await useAsyncData('dashboard-crawls', async () => {
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
    .order('event_date_start', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
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
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'city', header: 'City' },
  { accessorKey: 'theme', header: 'Theme' },
  { id: 'actions' },
];

const tableData = computed<CrawlRow[]>(() =>
  (crawls.value ?? []).map((crawl) => ({
    id: crawl.id,
    name: crawl.name ?? 'Untitled crawl',
    date: crawl.event_date_start
      ? dateFormatter.format(new Date(crawl.event_date_start))
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
  <UTable
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
</template>

<style></style>
