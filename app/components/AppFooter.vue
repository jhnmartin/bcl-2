<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const items = computed<NavigationMenuItem[]>(
  () =>
    [
      {
        label: 'Themes',
        to: '/themes',
      },
      {
        label: 'Cities',
        to: '/cities',
      },
      {
        label: 'FAQ',
        to: '/faq',
      },
      {
        label: 'Blog',
        to: '/blog',
      },
      {
        label: 'Terms',
        to: '/terms',
      },
      {
        label: 'Privacy',
        to: '/privacy',
      },
      {
        label: 'Login',
        to: '/login',
      },
    ] satisfies NavigationMenuItem[]
);

const toast = useToast();

const email = ref('');
const loading = ref(false);

function onSubmit() {
  loading.value = true;

  toast.add({
    title: 'Subscribed!',
    description: "You've been subscribed to our newsletter.",
  });
}
</script>

<template>
  <USeparator class="h-px" />

  <UFooter :ui="{ top: 'border-b border-default' }">
    <template #top>
      <UContainer
        class="flex flex-col md:flex-row justify-between items-start gap-4"
      >
        <UNavigationMenu
          :items="items"
          variant="link"
          class="hidden md:block"
        />
        <UNavigationMenu
          :items="items"
          variant="link"
          orientation="vertical"
          class="md:hidden"
        />
        <form @submit.prevent="onSubmit">
          <UFormField
            name="email"
            label="Subscribe to our newsletter"
            size="lg"
          >
            <UInput
              v-model="email"
              type="email"
              class="w-full"
              placeholder="Enter your email"
            >
              <template #trailing>
                <UButton
                  type="submit"
                  size="xs"
                  color="neutral"
                  label="Subscribe"
                />
              </template>
            </UInput>
          </UFormField>
        </form>
      </UContainer>
    </template>

    <template #left>
      <p class="text-muted text-sm">
        Bar Crawl Live! • © {{ new Date().getFullYear() }}
      </p>
    </template>

    <template #right>
      <UButton
        to="https://go.nuxt.com/discord"
        target="_blank"
        icon="i-simple-icons-facebook"
        aria-label="Nuxt on Discord"
        color="neutral"
        variant="ghost"
      />
      <UButton
        to="https://go.nuxt.com/x"
        target="_blank"
        icon="i-simple-icons-instagram"
        aria-label="Nuxt on X"
        color="neutral"
        variant="ghost"
      />
      <UButton
        to="https://github.com/nuxt-ui-templates/saas"
        target="_blank"
        icon="i-simple-icons-google"
        aria-label="Nuxt UI on GitHub"
        color="neutral"
        variant="ghost"
      />
      <UButton
        to="https://github.com/nuxt-ui-templates/saas"
        target="_blank"
        icon="i-simple-icons-tiktok"
        aria-label="Nuxt UI on GitHub"
        color="neutral"
        variant="ghost"
      />
      <UButton
        to="https://github.com/nuxt-ui-templates/saas"
        target="_blank"
        icon="i-simple-icons-youtube"
        aria-label="Nuxt UI on GitHub"
        color="neutral"
        variant="ghost"
      />
    </template>
  </UFooter>
</template>
