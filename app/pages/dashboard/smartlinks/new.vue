<script lang="ts" setup>
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { Database } from '@/types/database.types';

const router = useRouter();
const supabase = useSupabaseClient();
const toast = useToast();

const smartlinkSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  promocode: z.string().optional(),
  theme: z.string().optional(),
  h1: z.string().min(1, 'H1 heading is required'),
  h1_paragraph: z.string().min(1, 'H1 paragraph is required'),
});

type SmartlinkSchema = z.output<typeof smartlinkSchema>;

const formState = reactive<SmartlinkSchema>({
  name: '',
  slug: '',
  promocode: undefined,
  theme: undefined,
  h1: '',
  h1_paragraph: '',
});

const isSaving = ref(false);

// Fetch themes for dropdown
const { data: themes } = await useAsyncData('themes', async () => {
  const { data, error } = await supabase
    .from('themes')
    .select('id, slug, display_name, name')
    .order('display_name');
  return data ?? [];
});

const themeOptions = computed(
  () =>
    themes.value?.map((theme) => ({
      label: theme.display_name ?? theme.name ?? 'Untitled Theme',
      value: String(theme.id), // Ensure value is always a string for consistent matching
    })) ?? []
);

async function onSubmit(event: FormSubmitEvent<SmartlinkSchema>) {
  const payload = event.data;

  isSaving.value = true;

  const { error: insertError, data: newSmartlink } = await supabase
    .from('smartlinks')
    .insert({
      name: payload.name,
      slug: payload.slug,
      promocode: payload.promocode ?? null,
      theme: payload.theme ?? null,
      h1: payload.h1 ?? null,
      h1_paragraph: payload.h1_paragraph ?? null,
    })
    .select('id')
    .single();

  if (insertError) {
    toast.add({
      title: 'Failed to create smartlink',
      description: insertError.message,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    isSaving.value = false;
  } else {
    toast.add({
      title: 'Smartlink created',
      description: 'The new smartlink has been created successfully.',
      color: 'success',
      icon: 'i-lucide-check',
    });
    // Redirect back to the smartlinks list
    await router.push('/dashboard/smartlinks');
  }
}
</script>

<template>
  <UDashboardNavbar> </UDashboardNavbar>
  <div class="space-y-4">
    <UForm
      id="smartlink-new"
      :schema="smartlinkSchema"
      :state="formState"
      @submit="onSubmit"
    >
      <UPageCard
        title="Create New Smartlink"
        description="Fill in the details for the new smartlink."
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <UButton
          form="smartlink-new"
          label="Create Smartlink"
          color="neutral"
          type="submit"
          class="w-fit lg:ms-auto"
          :loading="isSaving"
          :disabled="isSaving"
        />
      </UPageCard>

      <UPageCard variant="subtle">
        <UFormField
          name="name"
          label="Name"
          description="The name of the smartlink."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.name"
            autocomplete="off"
            placeholder="Enter smartlink name"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="slug"
          label="Slug"
          description="Unique identifier for the smartlink."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.slug"
            autocomplete="off"
            placeholder="Enter slug"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="promocode"
          label="Promo Code"
          description="Optional: Promo code associated with this smartlink."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.promocode"
            autocomplete="off"
            placeholder="Enter promo code (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="theme"
          label="Theme"
          description="Optional: Associate this smartlink with a theme."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <USelectMenu
            v-model="formState.theme"
            :items="themeOptions"
            value-key="value"
            searchable
            clearable
            placeholder="Select a theme (optional)"
            class="w-full min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="h1"
          label="H1 Heading"
          description="Main heading for the smartlink page."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.h1"
            autocomplete="off"
            placeholder="Enter H1 heading"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="h1_paragraph"
          label="H1 Paragraph"
          description="Paragraph text below the H1 heading."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.h1_paragraph"
            :rows="3"
            autoresize
            class="w-full min-w-[350px]"
            placeholder="Enter paragraph text"
          />
        </UFormField>
      </UPageCard>
    </UForm>
  </div>
</template>
