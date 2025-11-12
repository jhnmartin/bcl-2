<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useClipboard } from '@vueuse/core';

const { isNotificationsSlideoverOpen } = useDashboard();
const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { copy } = useClipboard();

const { data: themes } = await useAsyncData('dashboard-themes', async () => {
  const { data, error } = await supabase
    .from('themes')
    .select(
      `
        id,
        display_name,
        slug,
        crawl_date,
        created_at,
        square_1_image_url
      `
    )
    .order('crawl_date', { ascending: true, nullsFirst: false });

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

interface ThemeRow {
  id: string;
  name: string;
  slug: string;
  crawlDate: string;
  created: string;
  avatar: string | null;
}

const columns: TableColumn<ThemeRow>[] = [
  { accessorKey: 'name', header: 'Theme' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'crawlDate', header: 'Next Crawl' },
  { accessorKey: 'created', header: 'Created' },
  { id: 'actions' },
];

const tableData = computed<ThemeRow[]>(() =>
  (themes.value ?? []).map((theme) => ({
    id: theme.id,
    name: theme.display_name ?? 'Untitled theme',
    slug: theme.slug ?? '—',
    crawlDate: theme.crawl_date
      ? dateFormatter.format(new Date(theme.crawl_date))
      : '—',
    created: theme.created_at
      ? dateFormatter.format(new Date(theme.created_at))
      : '—',
    avatar: theme.square_1_image_url ?? null,
  }))
);

function getDropdownActions(theme: ThemeRow): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Copy theme ID',
        icon: 'i-lucide-copy',
        onSelect: () => {
          copy(theme.id);
          toast.add({
            title: 'Theme ID copied to clipboard',
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
        onSelect: () => router.push(`/dashboard/themes/${theme.id}`),
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
  <UDashboardPanel id="themes">
    <template #header>
      <UDashboardNavbar
        title="Themes"
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
            :to="'/dashboard/themes/new'"
          >
            New theme
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <NuxtPage />
    </template>
  </UDashboardPanel>
</template>
