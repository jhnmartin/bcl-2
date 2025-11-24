<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';

const { isNotificationsSlideoverOpen } = useDashboard();
const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { copy } = useClipboard();

const UButton = resolveComponent('UButton');

const { data: maps } = await useAsyncData('dashboard-maps', async () => {
  const { data, error } = await supabase
    .from('maps')
    .select(
      `
        id,
        slug,
        date,
        time_slot,
        created_at,
        city:cities (
          name
        ),
        crawl:crawls (
          name,
          crawl_image_1
        ),
        theme:themes (
          display_name,
          square_1_image_url
        )
      `
    )
    .order('date', { ascending: true, nullsFirst: false });

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

interface MapRow {
  id: string;
  map: string;
  date: string;
  city: string;
  crawl: string;
  theme: string;
  timeSlot: string;
  avatar: string | null;
}

// Helper function to create sortable headers
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

const columns: TableColumn<MapRow>[] = [
  {
    accessorKey: 'map',
    header: ({ column }) => getSortableHeader(column, 'Map'),
  },
  {
    accessorKey: 'date',
    header: ({ column }) => getSortableHeader(column, 'Date'),
  },
  {
    accessorKey: 'city',
    header: ({ column }) => getSortableHeader(column, 'City'),
  },
  {
    accessorKey: 'crawl',
    header: ({ column }) => getSortableHeader(column, 'Crawl'),
  },
  {
    accessorKey: 'theme',
    header: ({ column }) => getSortableHeader(column, 'Theme'),
  },
  { id: 'actions', enableSorting: false },
];

const sorting = ref<Array<{ id: string; desc: boolean }>>([]);
const globalFilter = ref('');

const tableData = computed<MapRow[]>(() =>
  (maps.value ?? []).map((map) => ({
    id: map.id,
    map: map.slug ?? 'Untitled map',
    date: map.date ? dateFormatter.format(new Date(map.date)) : '—',
    city: map.city?.name ?? '—',
    crawl: map.crawl?.name ?? '—',
    theme: map.theme?.display_name ?? '—',
    timeSlot: map.time_slot ?? '—',
    avatar: map.crawl?.crawl_image_1 ?? map.theme?.square_1_image_url ?? null,
  }))
);

function getDropdownActions(map: MapRow): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Copy map ID',
        icon: 'i-lucide-copy',
        onSelect: () => {
          copy(map.id);
          toast.add({
            title: 'Map ID copied to clipboard',
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
        onSelect: () => router.push(`/dashboard/maps/${map.id}`),
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
        placeholder="Filter maps..."
        icon="i-lucide-search"
      />
    </div>

    <UTable
      v-model:sorting="sorting"
      v-model:global-filter="globalFilter"
      :data="tableData"
      :columns="columns"
      class="flex-1"
    >
      <template #map-cell="{ row }">
        <div class="flex items-center gap-3">
          <UAvatar
            :src="row.original.avatar ?? undefined"
            size="md"
            :alt="row.original.map"
          />
          <div>
            <NuxtLink
              :to="`/dashboard/maps/${row.original.id}`"
              class="font-medium text-highlighted hover:text-primary transition-colors cursor-pointer"
            >
              {{ row.original.map }}
            </NuxtLink>
            <p class="text-sm text-muted">
              {{ row.original.timeSlot }}
            </p>
          </div>
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
