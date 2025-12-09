<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';

const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { copy } = useClipboard();

const UButton = resolveComponent('UButton');

const { data: cities } = await useAsyncData('dashboard-cities', async () => {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name, slug, hero_image, created_at')
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

interface CityRow {
  id: string;
  name: string;
  slug: string;
  created: string;
  avatar: string | null;
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

const columns: TableColumn<CityRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => getSortableHeader(column, 'City'),
  },
  {
    accessorKey: 'slug',
    header: ({ column }) => getSortableHeader(column, 'Slug'),
  },
  {
    accessorKey: 'created',
    header: ({ column }) => getSortableHeader(column, 'Created'),
    cell: ({ row }) => {
      const value = row.getValue('created') as string | null;
      return value ? dateFormatter.format(new Date(value)) : '—';
    },
  },
  { id: 'actions', enableSorting: false },
];

const sorting = ref<Array<{ id: string; desc: boolean }>>([
  { id: 'name', desc: false },
]);

const tableData = computed<CityRow[]>(() =>
  (cities.value ?? []).map((city) => ({
    id: city.id,
    name: city.name ?? 'Untitled city',
    slug: city.slug ?? '—',
    created: city.created_at
      ? dateFormatter.format(new Date(city.created_at))
      : '—',
    avatar: city.hero_image,
  }))
);

const globalFilter = ref('');

function getDropdownActions(city: CityRow): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Copy city ID',
        icon: 'i-lucide-copy',
        onSelect: () => {
          copy(city.id);
          toast.add({
            title: 'City ID copied to clipboard',
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
        onSelect: () => router.push(`/dashboard/cities/${city.id}`),
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
            :to="`/dashboard/cities/${row.original.id}`"
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
  </div>
</template>
