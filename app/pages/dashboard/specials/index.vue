<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';

const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { copy } = useClipboard();

const UButton = resolveComponent('UButton');

const { data: specials } = await useAsyncData(
  'dashboard-specials',
  async () => {
    const { data, error } = await supabase.from('specials').select(
      `
        id,
        order,
        timeslot,
        slug,
        crawl:crawls (
          name,
          crawl_image_1,
          event_date_start
        ),
        venueData:venues (
          name,
          white_logo,
          black_logo
        ),
        theme:themes (
          id,
          display_name,
          square_1_image_url
        )
      `
    );

    if (error) {
      throw new Error(error.message);
    }

    // Sort by venue name client-side
    return (data ?? []).sort((a, b) => {
      const nameA = a.venueData?.name ?? '';
      const nameB = b.venueData?.name ?? '';
      return nameA.localeCompare(nameB);
    });
  }
);

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

interface SpecialsRow {
  id: string;
  venue: string;
  crawl: string;
  theme: string;
  themeId: string | null;
  timeslot: string;
  order: number | null;
  eventDate: string | null;
  slug: string;
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

const columns: TableColumn<SpecialsRow>[] = [
  {
    accessorKey: 'venue',
    header: ({ column }) => getSortableHeader(column, 'Venue'),
  },
  {
    accessorKey: 'crawl',
    header: ({ column }) => getSortableHeader(column, 'Crawl'),
  },
  {
    accessorKey: 'eventDate',
    header: ({ column }) => getSortableHeader(column, 'Event Date'),
    cell: ({ row }) => {
      const value = row.getValue('eventDate') as string | null;
      return value ? dateFormatter.format(new Date(value)) : '—';
    },
  },
  {
    accessorKey: 'theme',
    header: ({ column }) => getSortableHeader(column, 'Theme'),
  },
  {
    accessorKey: 'timeslot',
    header: ({ column }) => getSortableHeader(column, 'Timeslot'),
  },
  {
    accessorKey: 'order',
    header: ({ column }) => getSortableHeader(column, 'Order'),
    cell: ({ row }) => {
      const value = row.getValue('order') as number | null;
      return value ?? '—';
    },
  },
  { id: 'actions', enableSorting: false },
];

const sorting = ref<Array<{ id: string; desc: boolean }>>([
  { id: 'eventDate', desc: true },
]);

const tableData = computed<SpecialsRow[]>(() =>
  (specials.value ?? []).map((special) => ({
    id: special.id,
    venue: special.venueData?.name ?? 'Untitled venue',
    crawl: special.crawl?.name ?? '—',
    theme: special.theme?.display_name ?? '—',
    themeId: special.theme?.id ?? null,
    timeslot: special.timeslot ?? '—',
    order: typeof special.order === 'number' ? special.order : null,
    eventDate: special.crawl?.event_date_start ?? null,
    slug: special.slug ?? '',
  }))
);

function getDropdownActions(special: SpecialsRow): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Copy Link',
        icon: 'i-lucide-link',
        onSelect: () => {
          copy(`https://crawlr.com/special/${special.slug}`);
          toast.add({
            title: 'Link copied to clipboard',
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
        onSelect: () => router.push(`/dashboard/specials/${special.id}`),
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

const globalFilter = ref('');
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
      <template #venue-cell="{ row }">
        <NuxtLink
          :to="`/dashboard/specials/${row.original.id}`"
          class="font-medium text-highlighted hover:text-primary transition-colors cursor-pointer"
        >
          {{ row.original.venue }}
        </NuxtLink>
      </template>
      <template #theme-cell="{ row }">
        <NuxtLink
          v-if="row.original.themeId"
          :to="`/dashboard/themes/${row.original.themeId}`"
          class="font-medium text-highlighted hover:text-primary transition-colors cursor-pointer"
        >
          {{ row.original.theme }}
        </NuxtLink>
        <span v-else>{{ row.original.theme }}</span>
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
