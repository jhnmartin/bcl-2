<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const route = useRoute();
const toast = useToast();

const open = ref(false);

const links = [
  [
    {
      label: 'Dashboard',
      icon: 'i-lucide-gauge',
      to: '/dashboard',
      exact: true,
    },
    {
      label: 'Crawls',
      to: '/dashboard/crawls',
      icon: 'i-lucide-beer',
      defaultOpen: true,
      type: 'trigger',
      children: [
        {
          label: 'All Crawls',
          to: '/dashboard/crawls',
          exact: true,
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: 'Upcoming Crawls',
          to: '/dashboard/crawls/upcoming',
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: 'Past Crawls',
          to: '/dashboard/crawls/past',
          onSelect: () => {
            open.value = false;
          },
        },
      ],
    },
    {
      label: 'Themes',
      icon: 'i-lucide-party-popper',
      to: '/dashboard/themes',
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: 'Cities',
      icon: 'i-lucide-map-pin',
      to: '/dashboard/cities',
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: 'Maps',
      icon: 'i-lucide-map',
      to: '/dashboard/maps',
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: 'Venues',
      icon: 'i-lucide-building',
      to: '/dashboard/venues',
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: 'Smartlinks',
      icon: 'i-lucide-zap',
      to: '/dashboard/smartlinks',
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: 'Specials',
      icon: 'i-lucide-sparkles',
      to: '/dashboard/specials',
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: 'Blog',
      to: '/dashboard/blog',
      icon: 'i-lucide-book',
      defaultOpen: true,
      type: 'trigger',
      children: [
        {
          label: 'All Blogs',
          to: '/dashboard/blog',
          exact: true,
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: 'New Blog',
          to: '/dashboard/blog/new',
          onSelect: () => {
            open.value = false;
          },
        },
      ],
    },
  ],
  [
    {
      label: 'Feedback',
      icon: 'i-lucide-message-circle',
      to: 'https://github.com/nuxt-ui-templates/dashboard',
      target: '_blank',
    },
    {
      label: 'Help & Support',
      icon: 'i-lucide-info',
      to: 'https://github.com/nuxt-ui-templates/dashboard',
      target: '_blank',
    },
  ],
] satisfies NavigationMenuItem[][];

const groups = computed(() => [
  {
    id: 'links',
    label: 'Go to',
    items: links.flat(),
  },
  {
    id: 'code',
    label: 'Code',
    items: [
      {
        id: 'source',
        label: 'View page source',
        icon: 'i-simple-icons-github',
        to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${
          route.path === '/' ? '/index' : route.path
        }.vue`,
        target: '_blank',
      },
    ],
  },
]);

onMounted(async () => {
  const cookie = useCookie('cookie-consent');
  if (cookie.value === 'accepted') {
    return;
  }

  toast.add({
    title:
      'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [
      {
        label: 'Accept',
        color: 'neutral',
        variant: 'outline',
        onClick: () => {
          cookie.value = 'accepted';
        },
      },
      {
        label: 'Opt out',
        color: 'neutral',
        variant: 'ghost',
      },
    ],
  });
});
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />
    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
