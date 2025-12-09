<script lang="ts" setup>
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

const router = useRouter();
const supabase = useSupabaseClient();
const toast = useToast();

const citySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  city_h1: z.string().optional(),
  hero_paragraph: z.string().optional(),
  hero_image: z.string().optional(),
  hero_image_alt_text: z.string().optional(),
  city_h2_1: z.string().optional(),
  city_h2_1_paragraph: z.string().optional(),
  city_h2_2: z.string().optional(),
  city_h2_3: z.string().optional(),
  city_h2_3_paragraph: z.string().optional(),
  city_h2_4: z.string().optional(),
  city_h2_5: z.string().optional(),
  city_h2_6: z.string().optional(),
  city_h2_6_paragraph: z.string().optional(),
  cities_how_image: z.string().optional(),
  cities_how_alt_text: z.string().optional(),
});

type CitySchema = z.output<typeof citySchema>;

const formState = reactive<CitySchema>({
  name: '',
  slug: '',
  seo_title: undefined,
  seo_description: undefined,
  city_h1: undefined,
  hero_paragraph: undefined,
  hero_image: undefined,
  hero_image_alt_text: undefined,
  city_h2_1: undefined,
  city_h2_1_paragraph: undefined,
  city_h2_2: undefined,
  city_h2_3: undefined,
  city_h2_3_paragraph: undefined,
  city_h2_4: undefined,
  city_h2_5: undefined,
  city_h2_6: undefined,
  city_h2_6_paragraph: undefined,
  cities_how_image: undefined,
  cities_how_alt_text: undefined,
});

const isSaving = ref(false);

async function onSubmit(event: FormSubmitEvent<CitySchema>) {
  const payload = event.data;

  isSaving.value = true;

  const { data, error } = await supabase
    .from('cities')
    .insert({
      name: payload.name,
      slug: payload.slug,
      seo_title: payload.seo_title ?? null,
      seo_description: payload.seo_description ?? null,
      city_h1: payload.city_h1 ?? null,
      hero_paragraph: payload.hero_paragraph ?? null,
      hero_image: payload.hero_image ?? null,
      hero_image_alt_text: payload.hero_image_alt_text ?? null,
      city_h2_1: payload.city_h2_1 ?? null,
      city_h2_1_paragraph: payload.city_h2_1_paragraph ?? null,
      city_h2_2: payload.city_h2_2 ?? null,
      city_h2_3: payload.city_h2_3 ?? null,
      city_h2_3_paragraph: payload.city_h2_3_paragraph ?? null,
      city_h2_4: payload.city_h2_4 ?? null,
      city_h2_5: payload.city_h2_5 ?? null,
      city_h2_6: payload.city_h2_6 ?? null,
      city_h2_6_paragraph: payload.city_h2_6_paragraph ?? null,
      cities_how_image: payload.cities_how_image ?? null,
      cities_how_alt_text: payload.cities_how_alt_text ?? null,
    })
    .select()
    .single();

  isSaving.value = false;

  if (error) {
    toast.add({
      title: 'Error creating city',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
    return;
  }

  toast.add({
    title: 'City created successfully',
    color: 'success',
    icon: 'i-lucide-circle-check',
  });

  router.push(`/dashboard/cities/${data.id}`);
}
</script>

<template>
  <div class="flex flex-col flex-1 w-full">
    <UForm
      :schema="citySchema"
      :state="formState"
      @submit="onSubmit"
    >
      <UPageCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">New City</h1>
            <div class="flex gap-2">
              <UButton
                variant="outline"
                @click="router.back()"
              >
                Cancel
              </UButton>
              <UButton
                type="submit"
                :loading="isSaving"
                color="primary"
              >
                Create City
              </UButton>
            </div>
          </div>
        </template>

        <UFormField
          name="name"
          label="Name"
          description="The name of the city"
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.name"
            placeholder="e.g., New York"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="slug"
          label="Slug"
          description="URL-friendly identifier for the city"
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.slug"
            placeholder="e.g., new-york"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="seo_title"
          label="SEO Title"
          description="Meta title for search engines"
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.seo_title"
            placeholder="SEO title"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="seo_description"
          label="SEO Description"
          description="Meta description for search engines"
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.seo_description"
            :rows="3"
            autoresize
            placeholder="SEO description"
          />
        </UFormField>
      </UPageCard>
    </UForm>
  </div>
</template>

