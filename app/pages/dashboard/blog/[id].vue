<script lang="ts" setup>
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { JSONContent } from '@tiptap/vue-3';

const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();
const toast = useToast();
const user = useSupabaseUser();

const blogId = computed(() => route.params.id as string);

const {
  data: blog,
  status: loadingStatus,
  error,
  refresh,
} = await useAsyncData(
  () => `dashboard-blog-${blogId.value}`,
  async () => {
    if (!blogId.value) {
      return null;
    }

    const { data, error } = (await supabase
      .from('blogs' as any)
      .select('*')
      .eq('id', blogId.value)
      .maybeSingle()) as { data: any; error: any };

    if (error) throw error;
    return data;
  },
  {
    watch: [blogId],
  }
);

// Set up real-time subscription to listen for changes
onMounted(() => {
  if (!blogId.value) return;

  const channel = supabase
    .channel(`blog-${blogId.value}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'blogs',
        filter: `id=eq.${blogId.value}`,
      },
      () => {
        // Refresh the data when changes are detected
        refresh();
      }
    )
    .subscribe();

  // Cleanup subscription on unmount
  onUnmounted(() => {
    supabase.removeChannel(channel);
  });
});

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

// Computed status based on published_at
const status = computed(() => {
  if (!formState.published_at) return 'draft';
  const publishedDate = new Date(formState.published_at);
  const now = new Date();
  return publishedDate <= now ? 'published' : 'scheduled';
});

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

// Populate form when blog data loads
watch(
  () => blog.value,
  (blogData) => {
    if (blogData) {
      formState.title = blogData.title || '';
      formState.slug = blogData.slug || '';
      formState.summary = blogData.summary || undefined;
      formState.seo_title = blogData.seo_title || undefined;
      formState.seo_description = blogData.seo_description || undefined;

      // Format published_at for datetime-local input
      if (blogData.published_at) {
        const date = new Date(blogData.published_at);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        formState.published_at = `${year}-${month}-${day}T${hours}:${minutes}`;
      } else {
        formState.published_at = undefined;
      }

      // Load content
      if (blogData.content) {
        try {
          const content =
            typeof blogData.content === 'string'
              ? JSON.parse(blogData.content)
              : blogData.content;
          blogContent.value = content as JSONContent;
          formState.content = content as JSONContent;
        } catch (e) {
          console.error('Error parsing blog content:', e);
          blogContent.value = null;
        }
      }
    }
  },
  { immediate: true }
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

  // Check if slug has changed and if new slug already exists (excluding current blog)
  let finalSlug = payload.slug;
  if (payload.slug !== blog.value?.slug) {
    const currentDate = new Date().toISOString().split('T')[0];

    const { data: existingBlog } = (await supabase
      .from('blogs' as any)
      .select('slug')
      .eq('slug', finalSlug)
      .neq('id', blogId.value)
      .maybeSingle()) as { data: { slug: string } | null };

    if (existingBlog) {
      // Slug exists, append the date
      finalSlug = `${payload.slug}-${currentDate}`;

      // Double-check the new slug doesn't exist
      const { data: existingWithDate } = (await supabase
        .from('blogs' as any)
        .select('slug')
        .eq('slug', finalSlug)
        .neq('id', blogId.value)
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
          finalSlug = `${payload.slug}-${currentDate}-${Date.now()}`;
        }
      }
    }
  }

  const { error: updateError } = (await supabase
    .from('blogs' as any)
    .update({
      title: payload.title,
      slug: finalSlug,
      summary: payload.summary ?? null,
      content: blogContent.value,
      seo_title: payload.seo_title ?? null,
      seo_description: payload.seo_description ?? null,
      published_at: payload.published_at
        ? new Date(payload.published_at).toISOString()
        : null,
    })
    .eq('id', blogId.value)) as { error: any };

  if (updateError) {
    toast.add({
      title: 'Failed to update blog post',
      description: updateError.message,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    isSaving.value = false;
  } else {
    toast.add({
      title: 'Blog post updated',
      description: 'The blog post has been updated successfully.',
      color: 'success',
      icon: 'i-lucide-check',
    });
    // Refresh the data
    await refresh();
  }
}
</script>

<template>
  <UDashboardPanel id="blog-edit">
    <template #header>
      <UDashboardNavbar
        title="Edit Blog Post"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <!-- Loading State -->
      <div
        v-if="loadingStatus === 'pending'"
        class="flex items-center justify-center py-12"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="size-6 animate-spin text-gray-400"
        />
      </div>
      <!-- Error State -->
      <UAlert
        v-else-if="error || !blog"
        color="error"
        icon="i-lucide-triangle-alert"
        title="Error loading blog post"
        :description="error?.message || 'Blog post not found'"
      />
      <!-- Form Section -->
      <template v-else>
        <UForm
          id="blog-edit"
          :schema="blogSchema"
          :state="formState"
          @submit="onSubmit"
        >
          <UPageCard
            title="Edit Blog Post"
            :description="`Status: ${status}`"
            variant="naked"
            orientation="horizontal"
            class="mb-4"
          >
            <UButton
              form="blog-edit"
              label="Save Changes"
              color="primary"
              type="submit"
              class="w-fit lg:ms-auto"
              :loading="isSaving"
              :disabled="isSaving"
            />
          </UPageCard>

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
          description="Edit your blog post content using the editor below."
          variant="subtle"
        >
          <DashboardBlogEditor
            v-if="blogContent !== null"
            :model-value="blogContent"
            standalone
            @update:model-value="onContentUpdate"
          />
          <div
            v-else
            class="flex items-center justify-center py-12"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="size-6 animate-spin text-gray-400"
            />
          </div>
        </UPageCard>
      </template>
    </template>
  </UDashboardPanel>
</template>
