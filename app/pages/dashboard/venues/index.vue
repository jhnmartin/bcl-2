<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';

const { isNotificationsSlideoverOpen } = useDashboard();
const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { copy } = useClipboard();

const { data: venues } = await useAsyncData('dashboard-venues', async () => {
  const { data, error } = await supabase
    .from('venues')
    .select(
      `
        id,
        name,
        slug,
        city:cities (
          name
        ),
        created_at,
        white_logo,
        black_logo
      `
    )
    .order('name', { ascending: true });

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

interface VenueRow {
  id: string;
  name: string;
  slug: string;
  city: string;
  created: string;
  avatar: string | null;
}

const columns: TableColumn<VenueRow>[] = [
  { accessorKey: 'name', header: 'Venue' },
  { accessorKey: 'city', header: 'City' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'created', header: 'Created' },
  { id: 'actions' },
];

const tableData = computed<VenueRow[]>(() =>
  (venues.value ?? []).map((venue) => ({
    id: venue.id,
    name: venue.name ?? 'Untitled venue',
    slug: venue.slug ?? '—',
    city: venue.city?.name ?? '—',
    created: venue.created_at
      ? dateFormatter.format(new Date(venue.created_at))
      : '—',
    avatar: venue.white_logo ?? venue.black_logo ?? null,
  }))
);

function getDropdownActions(venue: VenueRow): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Copy venue ID',
        icon: 'i-lucide-copy',
        onSelect: () => {
          copy(venue.id);
          toast.add({
            title: 'Venue ID copied to clipboard',
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
        onSelect: () => router.push(`/dashboard/venues/${venue.id}`),
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
