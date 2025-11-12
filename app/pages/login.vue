<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

definePageMeta({
  layout: 'auth',
  colorMode: 'dark',
});

useSeoMeta({
  title: 'Login',
  description: 'Login to your account to continue',
});

const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();

const fields = [
  {
    name: 'email',
    type: 'text' as const,
    label: 'Email',
    placeholder: 'Enter your email',
    required: true,
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password' as const,
    placeholder: 'Enter your password',
  },
  {
    name: 'remember',
    label: 'Remember me',
    type: 'checkbox' as const,
  },
];

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
});

type Schema = z.output<typeof schema>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.data.email,
    password: payload.data.password,
  });

  if (error) {
    toast.add({
      title: 'Login failed',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    return;
  }

  if (data.user) {
    toast.add({
      title: 'Welcome back!',
      description: 'You have been successfully logged in.',
      color: 'success',
      icon: 'i-lucide-check',
    });
    await router.push('/dashboard');
  }
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    title="Welcome back"
    icon="i-lucide-lock"
    @submit="onSubmit"
  >
    <template #description>
      Don't have an account?
      <ULink
        to="/signup"
        class="text-primary font-medium"
        >Sign up</ULink
      >.
    </template>

    <template #password-hint>
      <ULink
        to="/forgot-password"
        class="text-primary font-medium"
        tabindex="-1"
        >Forgot password?</ULink
      >
    </template>

    <template #footer>
      By signing in, you agree to our
      <ULink
        to="/"
        class="text-primary font-medium"
        >Terms of Service</ULink
      >.
    </template>
  </UAuthForm>
</template>
