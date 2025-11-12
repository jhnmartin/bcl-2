<script lang="ts" setup>
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

const router = useRouter();
const supabase = useSupabaseClient();
const toast = useToast();

const themeSchema = z.object({
  name: z.string().optional(),
  display_name: z.string().min(1, 'Display name is required'),
  slug: z.string().min(1, 'Slug is required'),
  crawl_date: z.string().optional(),
  h1: z.string().optional(),
  h1_paragraph: z.string().optional(),
  h2: z.string().optional(),
  h2_paragraph: z.string().optional(),
  home_h2: z.string().optional(),
  benefits_heading: z.string().optional(),
  benefits_paragraph: z.string().optional(),
  cities_paragraph: z.string().optional(),
  p_how_it_works: z.string().optional(),
  seo_title: z.string().optional(),
  meta_description: z.string().optional(),
  square_1_image_url: z.string().optional(),
  square_1_image_alt_text: z.string().optional(),
  square_2_image_url: z.string().optional(),
  square_2_image_alt_text: z.string().optional(),
  square_3_image_url: z.string().optional(),
  square_3_image_alt_text: z.string().optional(),
  horizontal_image_url: z.string().optional(),
  horizontal_image_alt_text: z.string().optional(),
  vertical_image_url: z.string().optional(),
  vertical_image_alt_text: z.string().optional(),
  video: z.string().optional(),
});

type ThemeSchema = z.output<typeof themeSchema>;

const formState = reactive<ThemeSchema>({
  name: undefined,
  display_name: '',
  slug: '',
  crawl_date: undefined,
  h1: undefined,
  h1_paragraph: undefined,
  h2: undefined,
  h2_paragraph: undefined,
  home_h2: undefined,
  benefits_heading: undefined,
  benefits_paragraph: undefined,
  cities_paragraph: undefined,
  p_how_it_works: undefined,
  seo_title: undefined,
  meta_description: undefined,
  square_1_image_url: undefined,
  square_1_image_alt_text: undefined,
  square_2_image_url: undefined,
  square_2_image_alt_text: undefined,
  square_3_image_url: undefined,
  square_3_image_alt_text: undefined,
  horizontal_image_url: undefined,
  horizontal_image_alt_text: undefined,
  vertical_image_url: undefined,
  vertical_image_alt_text: undefined,
  video: undefined,
});

const isSaving = ref(false);

async function onSubmit(event: FormSubmitEvent<ThemeSchema>) {
  const payload = event.data;

  isSaving.value = true;

  const { error: insertError } = await supabase
    .from('themes')
    .insert({
      name: payload.name ?? null,
      display_name: payload.display_name,
      slug: payload.slug,
      crawl_date: payload.crawl_date ?? null,
      h1: payload.h1 ?? null,
      h1_paragraph: payload.h1_paragraph ?? null,
      h2: payload.h2 ?? null,
      h2_paragraph: payload.h2_paragraph ?? null,
      home_h2: payload.home_h2 ?? null,
      benefits_heading: payload.benefits_heading ?? null,
      benefits_paragraph: payload.benefits_paragraph ?? null,
      cities_paragraph: payload.cities_paragraph ?? null,
      p_how_it_works: payload.p_how_it_works ?? null,
      seo_title: payload.seo_title ?? null,
      meta_description: payload.meta_description ?? null,
      square_1_image_url: payload.square_1_image_url ?? null,
      square_1_image_alt_text: payload.square_1_image_alt_text ?? null,
      square_2_image_url: payload.square_2_image_url ?? null,
      square_2_image_alt_text: payload.square_2_image_alt_text ?? null,
      square_3_image_url: payload.square_3_image_url ?? null,
      square_3_image_alt_text: payload.square_3_image_alt_text ?? null,
      horizontal_image_url: payload.horizontal_image_url ?? null,
      horizontal_image_alt_text: payload.horizontal_image_alt_text ?? null,
      vertical_image_url: payload.vertical_image_url ?? null,
      vertical_image_alt_text: payload.vertical_image_alt_text ?? null,
      video: payload.video ?? null,
    });

  if (insertError) {
    toast.add({
      title: 'Failed to create theme',
      description: insertError.message,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    isSaving.value = false;
  } else {
    toast.add({
      title: 'Theme created',
      description: 'The new theme has been created successfully.',
      color: 'success',
      icon: 'i-lucide-check',
    });
    // Redirect back to the themes list
    await router.push('/dashboard/themes');
  }
}
</script>

<template>
  <UDashboardNavbar />
  <div class="space-y-4">
    <UForm
      id="theme-new"
      :schema="themeSchema"
      :state="formState"
      @submit="onSubmit"
    >
      <UPageCard
        title="Create New Theme"
        description="Fill in the details for the new theme."
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <UButton
          form="theme-new"
          label="Create Theme"
          color="neutral"
          type="submit"
          class="w-fit lg:ms-auto"
          :loading="isSaving"
          :disabled="isSaving"
        />
      </UPageCard>

      <UPageCard variant="subtle">
        <UFormField
          name="display_name"
          label="Display Name"
          description="The display name of the theme."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.display_name"
            autocomplete="off"
            placeholder="Enter display name"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="name"
          label="Name"
          description="Optional: Internal name for the theme."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.name"
            autocomplete="off"
            placeholder="Enter name (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="slug"
          label="Slug"
          description="Unique identifier for the theme."
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
          name="crawl_date"
          label="Crawl Date"
          description="Optional: Date for the next crawl event."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.crawl_date"
            type="date"
            autocomplete="off"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <h3 class="text-lg font-semibold mt-6 mb-4">Headings & Content</h3>

        <UFormField
          name="h1"
          label="H1 Heading"
          description="Optional: Main heading for the theme page."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.h1"
            autocomplete="off"
            placeholder="Enter H1 heading (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="h1_paragraph"
          label="H1 Paragraph"
          description="Optional: Paragraph text below the H1 heading."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.h1_paragraph"
            :rows="3"
            autoresize
            class="w-full min-w-[350px]"
            placeholder="Enter H1 paragraph (optional)"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="h2"
          label="H2 Heading"
          description="Optional: Secondary heading for the theme page."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.h2"
            autocomplete="off"
            placeholder="Enter H2 heading (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="h2_paragraph"
          label="H2 Paragraph"
          description="Optional: Paragraph text below the H2 heading."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.h2_paragraph"
            :rows="3"
            autoresize
            class="w-full min-w-[350px]"
            placeholder="Enter H2 paragraph (optional)"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="home_h2"
          label="Home H2"
          description="Optional: H2 text for the home page."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.home_h2"
            autocomplete="off"
            placeholder="Enter home H2 (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="benefits_heading"
          label="Benefits Heading"
          description="Optional: Heading for the benefits section."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.benefits_heading"
            autocomplete="off"
            placeholder="Enter benefits heading (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="benefits_paragraph"
          label="Benefits Paragraph"
          description="Optional: Paragraph text for the benefits section."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.benefits_paragraph"
            :rows="3"
            autoresize
            class="w-full min-w-[350px]"
            placeholder="Enter benefits paragraph (optional)"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="cities_paragraph"
          label="Cities Paragraph"
          description="Optional: Paragraph text about cities."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.cities_paragraph"
            :rows="3"
            autoresize
            class="w-full min-w-[350px]"
            placeholder="Enter cities paragraph (optional)"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="p_how_it_works"
          label="How It Works Paragraph"
          description="Optional: Paragraph explaining how it works."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.p_how_it_works"
            :rows="3"
            autoresize
            class="w-full min-w-[350px]"
            placeholder="Enter how it works paragraph (optional)"
          />
        </UFormField>

        <USeparator />

        <h3 class="text-lg font-semibold mt-6 mb-4">Images</h3>

        <UFormField
          name="square_1_image_url"
          label="Square 1 Image URL"
          description="Optional: URL for the first square image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.square_1_image_url"
            autocomplete="off"
            placeholder="Enter square 1 image URL (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="square_1_image_alt_text"
          label="Square 1 Image Alt Text"
          description="Optional: Alt text for the first square image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.square_1_image_alt_text"
            autocomplete="off"
            placeholder="Enter square 1 alt text (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="square_2_image_url"
          label="Square 2 Image URL"
          description="Optional: URL for the second square image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.square_2_image_url"
            autocomplete="off"
            placeholder="Enter square 2 image URL (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="square_2_image_alt_text"
          label="Square 2 Image Alt Text"
          description="Optional: Alt text for the second square image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.square_2_image_alt_text"
            autocomplete="off"
            placeholder="Enter square 2 alt text (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="square_3_image_url"
          label="Square 3 Image URL"
          description="Optional: URL for the third square image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.square_3_image_url"
            autocomplete="off"
            placeholder="Enter square 3 image URL (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="square_3_image_alt_text"
          label="Square 3 Image Alt Text"
          description="Optional: Alt text for the third square image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.square_3_image_alt_text"
            autocomplete="off"
            placeholder="Enter square 3 alt text (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="horizontal_image_url"
          label="Horizontal Image URL"
          description="Optional: URL for the horizontal image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.horizontal_image_url"
            autocomplete="off"
            placeholder="Enter horizontal image URL (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="horizontal_image_alt_text"
          label="Horizontal Image Alt Text"
          description="Optional: Alt text for the horizontal image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.horizontal_image_alt_text"
            autocomplete="off"
            placeholder="Enter horizontal alt text (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="vertical_image_url"
          label="Vertical Image URL"
          description="Optional: URL for the vertical image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.vertical_image_url"
            autocomplete="off"
            placeholder="Enter vertical image URL (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="vertical_image_alt_text"
          label="Vertical Image Alt Text"
          description="Optional: Alt text for the vertical image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.vertical_image_alt_text"
            autocomplete="off"
            placeholder="Enter vertical alt text (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <h3 class="text-lg font-semibold mt-6 mb-4">SEO & Media</h3>

        <UFormField
          name="seo_title"
          label="SEO Title"
          description="Optional: SEO title for the theme page."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.seo_title"
            autocomplete="off"
            placeholder="Enter SEO title (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="meta_description"
          label="Meta Description"
          description="Optional: Meta description for SEO."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.meta_description"
            :rows="3"
            autoresize
            class="w-full min-w-[350px]"
            placeholder="Enter meta description (optional)"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="video"
          label="Video"
          description="Optional: Video URL or embed code."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.video"
            autocomplete="off"
            placeholder="Enter video URL (optional)"
            class="min-w-[350px]"
          />
        </UFormField>
      </UPageCard>
    </UForm>
  </div>
</template>
