<script lang="ts" setup>
import { h, resolveComponent } from 'vue';
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';

const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { copy } = useClipboard();

const UButton = resolveComponent('UButton');

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
  date: string | null;
  city: string;
  theme: string;
  avatar: string | null;
  dateFormatted: string;
}

function getSortableHeader(column: any, label: string) {
  const isSorted = column.getIsSorted();

  return h(UButton, {
    color: 'neutral',
    variant: 'ghost',
    label,
    icon: isSorted
      ? isSorted === 'asc'
        ? 'i-lucide-arrow-up-narrow-wide'
        : 'i-lucide-arrow-down-wide-narrow'
      : 'i-lucide-arrow-up-down',
    class: '-mx-2.5',
    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
  });
}

const columns: TableColumn<CrawlRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => getSortableHeader(column, 'Name'),
  },
  {
    accessorKey: 'date',
    header: ({ column }) => getSortableHeader(column, 'Date'),
    cell: ({ row }) => row.original.dateFormatted,
  },
  {
    accessorKey: 'city',
    header: ({ column }) => getSortableHeader(column, 'City'),
  },
  {
    accessorKey: 'theme',
    header: ({ column }) => getSortableHeader(column, 'Theme'),
  },
  { id: 'actions', enableSorting: false },
];

const sorting = ref<Array<{ id: string; desc: boolean }>>([
  { id: 'date', desc: false },
]);

const tableData = computed<CrawlRow[]>(() =>
  (crawls.value ?? []).map((crawl) => {
    const rawDate = crawl.event_date_start ?? null;
    const formattedDate = rawDate
      ? dateFormatter.format(new Date(rawDate))
      : 'TBD';

    return {
      id: crawl.id,
      name: crawl.name ?? 'Untitled crawl',
      date: rawDate,
      dateFormatted: formattedDate,
      city: crawl.city?.name ?? '—',
      theme: crawl.theme?.display_name ?? '—',
      avatar: crawl.crawl_image_1 ?? crawl.theme?.square_1_image_url ?? null,
    };
  })
);

const globalFilter = ref('');

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
  <div class="flex flex-col flex-1 w-full">
    <div class="flex px-4 py-3.5 border-b border-accented">
      <UInput
        v-model="globalFilter"
        class="max-w-sm"
        placeholder="Search..."
      />
    </div>
    <UTable
      v-model:sorting="sorting"
      :data="tableData"
      :columns="columns"
      :global-filter="globalFilter"
      class="flex-1"
      sticky
    >
      <template #name-cell="{ row }">
        <div class="flex items-center gap-3">
          <UAvatar
            :src="row.original.avatar ?? undefined"
            size="md"
            :alt="row.original.name"
          />
          <NuxtLink
            :to="`/dashboard/crawls/${row.original.id}`"
            class="font-medium text-highlighted hover:text-primary transition-colors"
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
  </div>
</template>
