<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';

const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { copy } = useClipboard();

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
  timeslot: string;
  order: string;
  eventDate: string;
  slug: string;
}

const columns: TableColumn<SpecialsRow>[] = [
  { accessorKey: 'venue', header: 'Venue' },
  { accessorKey: 'crawl', header: 'Crawl' },
  { accessorKey: 'eventDate', header: 'Event Date' },
  { accessorKey: 'theme', header: 'Theme' },
  { accessorKey: 'timeslot', header: 'Timeslot' },
  { accessorKey: 'order', header: 'Order' },
  { id: 'actions' },
];

const tableData = computed<SpecialsRow[]>(() =>
  (specials.value ?? []).map((special) => ({
    id: special.id,
    venue: special.venueData?.name ?? 'Untitled venue',
    crawl: special.crawl?.name ?? '—',
    theme: special.theme?.display_name ?? '—',
    timeslot: special.timeslot ?? '—',
    order:
      typeof special.order === 'number'
        ? String(special.order)
        : special.order ?? '—',
    eventDate: special.crawl?.event_date_start
      ? dateFormatter.format(new Date(special.crawl.event_date_start))
      : '—',
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
        placeholder="Filter..."
      />
    </div>
    <UTable
      :data="tableData"
      :columns="columns"
      :global-filter="globalFilter"
      class="flex-1"
    >
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
