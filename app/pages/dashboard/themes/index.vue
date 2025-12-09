<script lang="ts" setup>
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';

const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { copy } = useClipboard();

const { data: themes } = await useAsyncData('dashboard-themes', async () => {
  const { data, error } = await supabase
    .from('themes')
    .select(
      `
        id,
        display_name,
        slug,
        crawl_date,
        created_at,
        square_1_image_url
      `
    )
    .order('crawl_date', { ascending: true, nullsFirst: false });

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

interface ThemeRow {
  id: string;
  name: string;
  slug: string;
  crawlDate: string;
  created: string;
  avatar: string | null;
}

const columns: TableColumn<ThemeRow>[] = [
  { accessorKey: 'name', header: 'Theme' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'crawlDate', header: 'Next Crawl' },
  { accessorKey: 'created', header: 'Created' },
  { id: 'actions' },
];

const tableData = computed<ThemeRow[]>(() =>
  (themes.value ?? []).map((theme) => ({
    id: theme.id,
    name: theme.display_name ?? 'Untitled theme',
    slug: theme.slug ?? '—',
    crawlDate: theme.crawl_date
      ? dateFormatter.format(new Date(theme.crawl_date))
      : '—',
    created: theme.created_at
      ? dateFormatter.format(new Date(theme.created_at))
      : '—',
    avatar: theme.square_1_image_url ?? null,
  }))
);

function getDropdownActions(theme: ThemeRow): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Copy theme ID',
        icon: 'i-lucide-copy',
        onSelect: () => {
          copy(theme.id);
          toast.add({
            title: 'Theme ID copied to clipboard',
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
        onSelect: () => router.push(`/dashboard/themes/${theme.id}`),
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
        <NuxtLink
          :to="`/dashboard/themes/${row.original.id}`"
          class="font-medium text-highlighted hover:text-primary transition-colors cursor-pointer"
        >
          {{ row.original.name }}
        </NuxtLink>
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
