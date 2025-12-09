<script lang="ts" setup>
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { JSONContent } from '@tiptap/vue-3';

const router = useRouter();
const supabase = useSupabaseClient();
const toast = useToast();
const user = useSupabaseUser();

const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  summary: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  published_at: z.string().optional(),
  content: z.custom<JSONContent>().optional(),
});

type BlogSchema = z.output<typeof blogSchema>;

const formState = reactive<BlogSchema>({
  title: '',
  slug: '',
  summary: undefined,
  seo_title: undefined,
  seo_description: undefined,
  published_at: undefined,
  content: undefined,
});

const blogContent = ref<JSONContent | null>(null);
const isSaving = ref(false);

// Auto-generate slug from title
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Track if user has manually edited the slug
const isSlugManuallyEdited = ref(false);

watch(
  () => formState.title,
  (newTitle) => {
    // Only auto-update slug if user hasn't manually edited it
    if (newTitle && !isSlugManuallyEdited.value) {
      formState.slug = slugify(newTitle);
    }
  }
);

// Track manual slug edits
watch(
  () => formState.slug,
  () => {
    // If slug doesn't match the auto-generated version, mark as manually edited
    const autoSlug = slugify(formState.title);
    if (formState.slug !== autoSlug && formState.title) {
      isSlugManuallyEdited.value = true;
    }
  }
);

// Handle content updates from editor
function onContentUpdate(content: JSONContent) {
  blogContent.value = content;
  formState.content = content;
}

async function onSubmit(event: FormSubmitEvent<BlogSchema>) {
  const payload = event.data;

  if (!blogContent.value) {
    toast.add({
      title: 'Content required',
      description: 'Please add some content to your blog post.',
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    return;
  }

  isSaving.value = true;

  // Check if slug already exists and append date if needed
  let finalSlug = payload.slug;
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const { data: existingBlog } = (await supabase
    .from('blogs' as any)
    .select('slug')
    .eq('slug', finalSlug)
    .maybeSingle()) as { data: { slug: string } | null };

  if (existingBlog) {
    // Slug exists, append the date
    finalSlug = `${payload.slug}-${currentDate}`;

    // Double-check the new slug doesn't exist (in case same slug was created today)
    const { data: existingWithDate } = (await supabase
      .from('blogs' as any)
      .select('slug')
      .eq('slug', finalSlug)
      .maybeSingle()) as { data: { slug: string } | null };

    if (existingWithDate) {
      // If still exists, append timestamp
      const isoString = new Date().toISOString();
      const timePart = isoString.split('T')[1];
      if (timePart) {
        const timeWithoutMs = timePart.split('.')[0] || timePart;
        const timestamp = timeWithoutMs.replace(/:/g, '-');
        finalSlug = `${payload.slug}-${currentDate}-${timestamp}`;
      } else {
        // Fallback to timestamp if parsing fails
        finalSlug = `${payload.slug}-${currentDate}-${Date.now()}`;
      }
    }
  }

  const { error: insertError, data: newBlog } = (await supabase
    .from('blogs' as any)
    .insert({
      title: payload.title,
      slug: finalSlug,
      summary: payload.summary ?? null,
      content: blogContent.value,
      seo_title: payload.seo_title ?? null,
      seo_description: payload.seo_description ?? null,
      published_at: payload.published_at
        ? new Date(payload.published_at).toISOString()
        : null,
      author_id: user.value?.id ?? null,
    })
    .select('id, slug')
    .single()) as { error: any; data: { id: string; slug: string } | null };

  if (insertError) {
    toast.add({
      title: 'Failed to create blog post',
      description: insertError.message,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    isSaving.value = false;
  } else {
    toast.add({
      title: 'Blog post created',
      description: 'The new blog post has been created successfully.',
      color: 'success',
      icon: 'i-lucide-check',
    });
    // Redirect to the blog edit page or list
    if (newBlog) {
      await router.push(`/dashboard/blog/${newBlog.id}`);
    } else {
      await router.push('/dashboard/blog');
    }
  }
}

const value = ref({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: {
        level: 1,
      },
      content: [
        {
          type: 'text',
          text: 'Hello World',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'This is a ',
        },
        {
          type: 'text',
          marks: [
            {
              type: 'bold',
            },
          ],
          text: 'rich text',
        },
        {
          type: 'text',
          text: ' editor.',
        },
      ],
    },
  ],
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        title="Create New Blog Post"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <!-- Form Section -->
      <UForm
        id="blog-new"
        :schema="blogSchema"
        :state="formState"
        @submit="onSubmit"
      >
        <UButton
          form="blog-new"
          label="Save Blog Post"
          color="primary"
          type="submit"
          class="w-fit lg:ms-auto"
          :loading="isSaving"
          :disabled="isSaving"
        />

        <UPageCard variant="subtle">
          <UFormField
            name="title"
            label="Title"
            description="The title of your blog post."
            required
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <UInput
              v-model="formState.title"
              autocomplete="off"
              placeholder="Enter blog post title"
              class="min-w-[350px]"
            />
          </UFormField>

          <USeparator />

          <UFormField
            name="slug"
            label="Slug"
            description="URL-friendly identifier for the blog post (auto-generated from title, editable)."
            required
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <UInput
              v-model="formState.slug"
              autocomplete="off"
              placeholder="blog-post-slug"
              class="min-w-[350px]"
              @input="isSlugManuallyEdited = true"
            />
          </UFormField>

          <USeparator />

          <UFormField
            name="summary"
            label="Summary"
            description="Optional: A brief summary or excerpt of the blog post."
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <UTextarea
              v-model="formState.summary"
              :rows="4"
              autoresize
              class="w-full min-w-[350px]"
              placeholder="Enter blog post summary (optional)"
            />
          </UFormField>

          <USeparator />

          <UFormField
            name="seo_title"
            label="SEO Title"
            description="Optional: Custom title for search engines. If not provided, the blog title will be used."
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
            description="Optional: Meta description for search engines (recommended 150-160 characters)."
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
            name="published_at"
            label="Publish Date"
            description="Optional: Set a publish date to schedule or publish immediately. Leave empty to save as draft."
            class="flex max-sm:flex-col justify-between items-start gap-4"
          >
            <UInput
              v-model="formState.published_at"
              type="datetime-local"
              autocomplete="off"
              placeholder="Select publish date (optional)"
              class="min-w-[350px]"
            />
          </UFormField>
        </UPageCard>
      </UForm>

      <!-- Blog Editor Section -->
      <UPageCard
        title="Blog Content"
        description="Write your blog post content using the editor below."
        variant="subtle"
      >
        <DashboardBlogEditor
          :model-value="blogContent"
          standalone
          @update:model-value="onContentUpdate"
        />
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>
