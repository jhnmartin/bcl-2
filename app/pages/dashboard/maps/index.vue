<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';

const { isNotificationsSlideoverOpen } = useDashboard();
const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { copy } = useClipboard();

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

const columns: TableColumn<MapRow>[] = [
  { accessorKey: 'map', header: 'Map' },
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'city', header: 'City' },
  { accessorKey: 'crawl', header: 'Crawl' },
  { accessorKey: 'theme', header: 'Theme' },
  { id: 'actions' },
];

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
  <UTable
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
          <p class="font-medium text-highlighted">
            {{ row.original.map }}
          </p>
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
</template>
