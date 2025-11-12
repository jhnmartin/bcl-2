<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';

const { isNotificationsSlideoverOpen } = useDashboard();
const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { copy } = useClipboard();

const { data: smartlinks } = await useAsyncData(
  'dashboard-smartlinks',
  async () => {
    const { data, error } = await supabase
      .from('smartlinks')
      .select(
        `
          id,
          name,
          slug,
          promocode,
          created_at,
          theme:themes (
            display_name,
            square_1_image_url
          )
        `
      )
      .order('created_at', { ascending: false, nullsFirst: false });

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

interface SmartlinkRow {
  id: string;
  name: string;
  slug: string;
  promo: string;
  theme: string;
  created: string;
  avatar: string | null;
}

const columns: TableColumn<SmartlinkRow>[] = [
  { accessorKey: 'name', header: 'Smartlink' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'promo', header: 'Promo Code' },
  { accessorKey: 'theme', header: 'Theme' },
  { accessorKey: 'created', header: 'Created' },
  { id: 'actions' },
];

const tableData = computed<SmartlinkRow[]>(() =>
  (smartlinks.value ?? []).map((smartlink) => ({
    id: smartlink.id,
    name: smartlink.name ?? 'Untitled smartlink',
    slug: smartlink.slug ?? '—',
    promo: smartlink.promocode ?? '—',
    theme: smartlink.theme?.display_name ?? '—',
    created: smartlink.created_at
      ? dateFormatter.format(new Date(smartlink.created_at))
      : '—',
    avatar: smartlink.theme?.square_1_image_url ?? null,
  }))
);

function getDropdownActions(smartlink: SmartlinkRow): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Copy smartlink ID',
        icon: 'i-lucide-copy',
        onSelect: () => {
          copy(smartlink.id);
          toast.add({
            title: 'Smartlink ID copied to clipboard',
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
        onSelect: () => router.push(`/dashboard/smartlinks/${smartlink.id}`),
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
