<script lang="ts" setup>
import * as z from 'zod';

definePageMeta({
  layout: 'auth',
  colorMode: 'dark',
});

useSeoMeta({
  title: 'Forgot password',
  description:
    "Forgot your password? No problem. Enter your email and we'll send you a link to reset your password.",
});

const schema = z.object({
  email: z.string().email('Invalid email'),
});

type Schema = z.output<typeof schema>;

const fields = [
  {
    name: 'email',
    type: 'email' as const,
    label: 'Email',
    placeholder: 'Enter your email',
  },
];
</script>

<template>
  <div>
    <UAuthForm
      :fields="fields"
      :schema="schema"
      title="Forgot password"
      icon="i-lucide-lock"
      @submit="onSubmit"
    />
  </div>
</template>

<style></style>
