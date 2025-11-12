<script lang="ts" setup>
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

const router = useRouter();
const supabase = useSupabaseClient();
const toast = useToast();

const venueSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  city: z.string().optional(),
  address_line_1: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  maps_embed: z.string().optional(),
  white_logo: z.string().optional(),
  white_logo_alt: z.string().optional(),
  black_logo: z.string().optional(),
  black_logo_alt: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  is_featured: z.boolean().optional(),
});

type VenueSchema = z.output<typeof venueSchema>;

const formState = reactive<VenueSchema>({
  name: '',
  slug: '',
  city: undefined,
  address_line_1: undefined,
  state: undefined,
  zip_code: undefined,
  maps_embed: undefined,
  white_logo: undefined,
  white_logo_alt: undefined,
  black_logo: undefined,
  black_logo_alt: undefined,
  seo_title: undefined,
  seo_description: undefined,
  is_featured: false,
});

const isSaving = ref(false);

// Fetch cities for dropdown
const { data: cities } = await useAsyncData('cities', async () => {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name')
    .order('name');
  return data ?? [];
});

const cityOptions = computed(
  () =>
    cities.value?.map((city) => ({
      label: city.name ?? 'Untitled City',
      value: String(city.id),
    })) ?? []
);

async function onSubmit(event: FormSubmitEvent<VenueSchema>) {
  const payload = event.data;

  isSaving.value = true;

  const { error: insertError } = await supabase
    .from('venues')
    .insert({
      name: payload.name,
      slug: payload.slug,
      city: payload.city ?? null,
      address_line_1: payload.address_line_1 ?? null,
      state: payload.state ?? null,
      zip_code: payload.zip_code ?? null,
      maps_embed: payload.maps_embed ?? null,
      white_logo: payload.white_logo ?? null,
      white_logo_alt: payload.white_logo_alt ?? null,
      black_logo: payload.black_logo ?? null,
      black_logo_alt: payload.black_logo_alt ?? null,
      seo_title: payload.seo_title ?? null,
      seo_description: payload.seo_description ?? null,
      is_featured: payload.is_featured ?? false,
    });

  if (insertError) {
    toast.add({
      title: 'Failed to create venue',
      description: insertError.message,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    isSaving.value = false;
  } else {
    toast.add({
      title: 'Venue created',
      description: 'The new venue has been created successfully.',
      color: 'success',
      icon: 'i-lucide-check',
    });
    // Redirect back to the venues list
    await router.push('/dashboard/venues');
  }
}
</script>

<template>
  <UDashboardNavbar />
  <div class="space-y-4">
    <UForm
      id="venue-new"
      :schema="venueSchema"
      :state="formState"
      @submit="onSubmit"
    >
      <UPageCard
        title="Create New Venue"
        description="Fill in the details for the new venue."
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <UButton
          form="venue-new"
          label="Create Venue"
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
          description="The name of the venue."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.name"
            autocomplete="off"
            placeholder="Enter venue name"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="slug"
          label="Slug"
          description="Unique identifier for the venue."
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
          name="city"
          label="City"
          description="Optional: Associate this venue with a city."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <USelectMenu
            v-model="formState.city"
            :items="cityOptions"
            value-key="value"
            searchable
            clearable
            placeholder="Select a city (optional)"
            class="w-full min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="address_line_1"
          label="Address Line 1"
          description="Optional: Street address for the venue."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.address_line_1"
            autocomplete="off"
            placeholder="Enter address (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="state"
          label="State"
          description="Optional: State for the venue."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.state"
            autocomplete="off"
            placeholder="Enter state (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="zip_code"
          label="Zip Code"
          description="Optional: Zip code for the venue."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.zip_code"
            autocomplete="off"
            placeholder="Enter zip code (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="maps_embed"
          label="Maps Embed"
          description="Optional: Google Maps embed code or URL."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.maps_embed"
            :rows="3"
            autoresize
            class="w-full min-w-[350px]"
            placeholder="Enter maps embed code (optional)"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="white_logo"
          label="White Logo URL"
          description="Optional: URL for the white logo image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.white_logo"
            autocomplete="off"
            placeholder="Enter white logo URL (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="white_logo_alt"
          label="White Logo Alt Text"
          description="Optional: Alt text for the white logo."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.white_logo_alt"
            autocomplete="off"
            placeholder="Enter white logo alt text (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="black_logo"
          label="Black Logo URL"
          description="Optional: URL for the black logo image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.black_logo"
            autocomplete="off"
            placeholder="Enter black logo URL (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="black_logo_alt"
          label="Black Logo Alt Text"
          description="Optional: Alt text for the black logo."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="formState.black_logo_alt"
            autocomplete="off"
            placeholder="Enter black logo alt text (optional)"
            class="min-w-[350px]"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="seo_title"
          label="SEO Title"
          description="Optional: SEO title for the venue page."
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
          name="seo_description"
          label="SEO Description"
          description="Optional: SEO description for the venue page."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="formState.seo_description"
            :rows="3"
            autoresize
            class="w-full min-w-[350px]"
            placeholder="Enter SEO description (optional)"
          />
        </UFormField>

        <USeparator />

        <UFormField
          name="is_featured"
          label="Is Featured"
          description="Optional: Mark this venue as featured."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UCheckbox
            v-model="formState.is_featured"
            label="Featured venue"
          />
        </UFormField>
      </UPageCard>
    </UForm>
  </div>
</template>
