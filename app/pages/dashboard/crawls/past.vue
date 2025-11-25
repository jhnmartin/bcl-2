<script lang="ts" setup>
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';

const supabase = useSupabaseClient();
const router = useRouter();

const UButton = resolveComponent('UButton');

const nowIso = new Date().toISOString();

const { data: pastCrawls, status } = await useAsyncData(
  'dashboard-past-crawls',
  async () => {
    const { data, error } = await supabase
      .from('crawls')
      .select(
        `
          id,
          name,
          crawl_image_1,
          event_date_start,
          event_end_date,
          city:cities (
            name
          ),
          theme:themes (
            display_name,
            square_1_image_url
          )
        `
      )
      .lt('event_end_date', nowIso)
      .order('event_end_date', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }
);

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

interface PastCrawlRow {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  startDateFormatted: string;
  endDateFormatted: string;
  city: string;
  theme: string;
  avatar: string | null;
}

function formatDate(value: string | null) {
  if (!value) return 'TBD';
  return dateFormatter.format(new Date(value));
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

const columns: TableColumn<PastCrawlRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => getSortableHeader(column, 'Name'),
  },
  {
    accessorKey: 'startDate',
    header: ({ column }) => getSortableHeader(column, 'Start Date'),
    cell: ({ row }) => row.original.startDateFormatted,
  },
  {
    accessorKey: 'endDate',
    header: ({ column }) => getSortableHeader(column, 'End Date'),
    cell: ({ row }) => row.original.endDateFormatted,
  },
  {
    accessorKey: 'city',
    header: ({ column }) => getSortableHeader(column, 'City'),
  },
  {
    accessorKey: 'theme',
    header: ({ column }) => getSortableHeader(column, 'Theme'),
  },
];

const sorting = ref<Array<{ id: string; desc: boolean }>>([
  { id: 'endDate', desc: true },
]);

const globalFilter = ref('');

const tableData = computed<PastCrawlRow[]>(() =>
  (pastCrawls.value ?? []).map((crawl) => {
    const startRaw = crawl.event_date_start ?? null;
    const endRaw = crawl.event_end_date ?? null;

    return {
      id: crawl.id,
      name: crawl.name ?? 'Untitled crawl',
      startDate: startRaw,
      endDate: endRaw,
      startDateFormatted: formatDate(startRaw),
      endDateFormatted: formatDate(endRaw),
      city: crawl.city?.name ?? '—',
      theme: crawl.theme?.display_name ?? '—',
      avatar: crawl.crawl_image_1 ?? crawl.theme?.square_1_image_url ?? null,
    };
  })
);
</script>

<template>
  <div class="flex flex-col flex-1 w-full">
    <div class="flex px-4 py-3.5 border-b border-accented">
      <UInput
        v-model="globalFilter"
        class="max-w-sm"
        placeholder="Search past crawls..."
      />
    </div>

    <UTable
      v-model:sorting="sorting"
      :data="tableData"
      :loading="status === 'pending'"
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
    </UTable>
  </div>
</template>
