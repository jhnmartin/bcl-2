<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';

const { isNotificationsSlideoverOpen } = useDashboard();
const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { copy } = useClipboard();

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

const columns: TableColumn<CityRow>[] = [
  { accessorKey: 'name', header: 'City' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'created', header: 'Created' },
  { id: 'actions' },
];

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
  <UDashboardPanel id="cities">
    <template #header>
      <UDashboardNavbar
        title="Cities"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip
            text="Notifications"
            :shortcuts="['N']"
          >
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip
                color="error"
                inset
              >
                <UIcon
                  name="i-lucide-bell"
                  class="size-5 shrink-0"
                />
              </UChip>
            </UButton>
          </UTooltip>

          <UButton
            color="primary"
            icon="i-lucide-plus"
            size="md"
            class="rounded-full"
            :to="'/dashboard/cities/new'"
          >
            New city
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
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
  </UDashboardPanel>
</template>

<style></style>
