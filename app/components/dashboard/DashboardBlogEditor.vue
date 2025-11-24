<script setup lang="ts">
import type { JSONContent } from '@tiptap/vue-3';

interface Props {
  modelValue?: string | JSONContent | null;
  placeholder?: string;
  title?: string;
  standalone?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Start writing your blog post...',
  title: 'Blog Editor',
  standalone: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: JSONContent): void;
}>();

const { isNotificationsSlideoverOpen } = useDashboard();
const supabase = useSupabaseClient();
const toast = useToast();

const defaultDoc: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
};

function normalizeContent(
  value: string | JSONContent | null | undefined
): JSONContent {
  if (!value) return defaultDoc;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as JSONContent;
      return parsed.type === 'doc' ? parsed : defaultDoc;
    } catch {
      return defaultDoc;
    }
  }
  if (
    typeof value === 'object' &&
    'type' in value &&
    (value as JSONContent).type === 'doc'
  ) {
    return value as JSONContent;
  }
  return defaultDoc;
}

const content = ref<JSONContent>(normalizeContent(props.modelValue));
const isUploading = ref(false);

// Image extension
const ImageExtension = TiptapImage.configure({
  inline: true,
  allowBase64: false,
});

// Custom image upload handler
async function handleImageUpload(file: File): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file');
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Please upload an image smaller than 5MB');
  }

  isUploading.value = true;

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `blog-images/${fileName}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('blog-images').getPublicUrl(filePath);

    toast.add({
      title: 'Image uploaded',
      description: 'Image has been successfully added to your post',
      color: 'success',
      icon: 'i-lucide-check',
    });

    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    toast.add({
      title: 'Upload failed',
      description: error.message || 'Failed to upload image. Please try again.',
      color: 'error',
      icon: 'i-lucide-triangle-alert',
    });
    throw error;
  } finally {
    isUploading.value = false;
  }
}

// Trigger file input for image upload
const triggerImageUpload = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const url = await handleImageUpload(file);
      // Insert image into editor
      editor.value?.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      // Error already handled in handleImageUpload
    }
  };
  input.click();
};

const editor = useEditor({
  content: content.value,
  extensions: [
    TiptapStarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
    }),
    ImageExtension,
    TiptapLink.configure({
      openOnClick: false,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'tiptap-blog-editor focus:outline-none',
      'data-placeholder': props.placeholder,
    },
  },
  onUpdate({ editor }) {
    const json = editor.getJSON();
    content.value = json;
    emit('update:modelValue', json);
  },
});

watch(
  () => props.modelValue,
  (value) => {
    const normalized = normalizeContent(value);
    if (JSON.stringify(normalized) !== JSON.stringify(content.value)) {
      content.value = normalized;
      editor.value?.commands.setContent(normalized, false);
    }
  }
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});

// Toolbar helper functions
function toggleHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  editor.value?.chain().focus().toggleHeading({ level }).run();
}

function isHeadingActive(level: 1 | 2 | 3 | 4 | 5 | 6) {
  return !!editor.value?.isActive('heading', { level });
}

function isActive(name: string, attrs?: Record<string, unknown>) {
  return !!editor.value?.isActive(name, attrs);
}

function setLink() {
  const previousUrl = editor.value?.getAttributes('link').href;
  const url = window.prompt('URL', previousUrl);

  // cancelled
  if (url === null) {
    return;
  }

  // empty
  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  // update link
  editor.value
    ?.chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url })
    .run();
}
</script>

<template>
  <UDashboardPanel
    v-if="!standalone"
    id="blog-editor"
  >
    <template #header>
      <UDashboardNavbar
        :title="title"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip
            text="Notifications"
            :shortcuts="['N']"
          >
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip
                color="error"
                inset
              >
                <UIcon
                  name="i-lucide-bell"
                  class="size-5 shrink-0"
                />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex justify-center">
        <div class="w-full max-w-4xl space-y-3">
          <!-- Toolbar -->
          <div
            v-if="editor"
            class="flex flex-wrap items-center gap-2"
          >
            <!-- Text Formatting -->
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              :class="{ 'bg-primary/10 text-primary': isActive('paragraph') }"
              @click="editor?.chain().focus().setParagraph().run()"
              icon="i-lucide-pilcrow"
            >
              <UTooltip text="Paragraph" />
            </UButton>

            <UButton
              v-for="level in [1, 2, 3, 4, 5, 6]"
              :key="level"
              size="xs"
              color="neutral"
              variant="ghost"
              :class="{ 'bg-primary/10 text-primary': isHeadingActive(level as any) }"
              @click="toggleHeading(level as any)"
              :icon="`i-lucide-heading-${level}`"
            >
              <UTooltip :text="`Heading ${level}`" />
            </UButton>

            <UDivider
              orientation="vertical"
              class="h-6"
            />

            <!-- Text Styles -->
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              :class="{ 'bg-primary/10 text-primary': isActive('bold') }"
              @click="editor?.chain().focus().toggleBold().run()"
              icon="i-lucide-bold"
            >
              <UTooltip text="Bold" />
            </UButton>

            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              :class="{ 'bg-primary/10 text-primary': isActive('italic') }"
              @click="editor?.chain().focus().toggleItalic().run()"
              icon="i-lucide-italic"
            >
              <UTooltip text="Italic" />
            </UButton>

            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              :class="{ 'bg-primary/10 text-primary': isActive('strike') }"
              @click="editor?.chain().focus().toggleStrike().run()"
              icon="i-lucide-strikethrough"
            >
              <UTooltip text="Strikethrough" />
            </UButton>

            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              :class="{ 'bg-primary/10 text-primary': isActive('code') }"
              @click="editor?.chain().focus().toggleCode().run()"
              icon="i-lucide-code"
            >
              <UTooltip text="Inline code" />
            </UButton>

            <UDivider
              orientation="vertical"
              class="h-6"
            />

            <!-- Lists -->
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              :class="{ 'bg-primary/10 text-primary': isActive('bulletList') }"
              @click="editor?.chain().focus().toggleBulletList().run()"
              icon="i-lucide-list"
            >
              <UTooltip text="Bullet list" />
            </UButton>

            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              :class="{ 'bg-primary/10 text-primary': isActive('orderedList') }"
              @click="editor?.chain().focus().toggleOrderedList().run()"
              icon="i-lucide-list-ordered"
            >
              <UTooltip text="Numbered list" />
            </UButton>

            <UDivider
              orientation="vertical"
              class="h-6"
            />

            <!-- Block Elements -->
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              :class="{ 'bg-primary/10 text-primary': isActive('blockquote') }"
              @click="editor?.chain().focus().toggleBlockquote().run()"
              icon="i-lucide-quote"
            >
              <UTooltip text="Quote" />
            </UButton>

            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              :class="{ 'bg-primary/10 text-primary': isActive('codeBlock') }"
              @click="editor?.chain().focus().toggleCodeBlock().run()"
              icon="i-lucide-code-2"
            >
              <UTooltip text="Code block" />
            </UButton>

            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              @click="editor?.chain().focus().setHorizontalRule().run()"
              icon="i-lucide-minus"
            >
              <UTooltip text="Horizontal rule" />
            </UButton>

            <UDivider
              orientation="vertical"
              class="h-6"
            />

            <!-- Media & Links -->
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              :class="{ 'bg-primary/10 text-primary': isActive('link') }"
              @click="setLink"
              icon="i-lucide-link"
              :loading="isUploading"
            >
              <UTooltip text="Link" />
            </UButton>

            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              @click="triggerImageUpload"
              icon="i-lucide-image"
              :loading="isUploading"
              :disabled="isUploading"
            >
              <UTooltip text="Upload image" />
            </UButton>

            <UDivider
              orientation="vertical"
              class="h-6"
            />

            <!-- History -->
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              @click="editor?.chain().focus().undo().run()"
              :disabled="!editor?.can().undo()"
              icon="i-lucide-undo"
            >
              <UTooltip text="Undo" />
            </UButton>

            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              @click="editor?.chain().focus().redo().run()"
              :disabled="!editor?.can().redo()"
              icon="i-lucide-redo"
            >
              <UTooltip text="Redo" />
            </UButton>
          </div>

          <!-- Upload progress indicator -->
          <UAlert
            v-if="isUploading"
            color="primary"
            variant="soft"
            icon="i-lucide-upload"
            title="Uploading image..."
          />

          <!-- Editor Content -->
          <TiptapEditorContent
            v-if="editor"
            :editor="editor"
            class="min-h-[500px]"
          />
          <p
            v-else
            class="text-center text-sm text-gray-500 dark:text-gray-400 py-8"
          >
            Initializing editor…
          </p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
  <div
    v-else
    class="w-full space-y-3"
  >
    <!-- Toolbar -->
    <div
      v-if="editor"
      class="flex flex-wrap items-center gap-2"
    >
      <!-- Text Formatting -->
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :class="{ 'bg-primary/10 text-primary': isActive('paragraph') }"
        @click="editor?.chain().focus().setParagraph().run()"
        icon="i-lucide-pilcrow"
      >
        <UTooltip text="Paragraph" />
      </UButton>

      <UButton
        v-for="level in [1, 2, 3, 4, 5, 6]"
        :key="level"
        size="xs"
        color="neutral"
        variant="ghost"
        :class="{ 'bg-primary/10 text-primary': isHeadingActive(level as any) }"
        @click="toggleHeading(level as any)"
        :icon="`i-lucide-heading-${level}`"
      >
        <UTooltip :text="`Heading ${level}`" />
      </UButton>

      <UDivider
        orientation="vertical"
        class="h-6"
      />

      <!-- Text Styles -->
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :class="{ 'bg-primary/10 text-primary': isActive('bold') }"
        @click="editor?.chain().focus().toggleBold().run()"
        icon="i-lucide-bold"
      >
        <UTooltip text="Bold" />
      </UButton>

      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :class="{ 'bg-primary/10 text-primary': isActive('italic') }"
        @click="editor?.chain().focus().toggleItalic().run()"
        icon="i-lucide-italic"
      >
        <UTooltip text="Italic" />
      </UButton>

      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :class="{ 'bg-primary/10 text-primary': isActive('strike') }"
        @click="editor?.chain().focus().toggleStrike().run()"
        icon="i-lucide-strikethrough"
      >
        <UTooltip text="Strikethrough" />
      </UButton>

      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :class="{ 'bg-primary/10 text-primary': isActive('code') }"
        @click="editor?.chain().focus().toggleCode().run()"
        icon="i-lucide-code"
      >
        <UTooltip text="Inline code" />
      </UButton>

      <UDivider
        orientation="vertical"
        class="h-6"
      />

      <!-- Lists -->
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :class="{ 'bg-primary/10 text-primary': isActive('bulletList') }"
        @click="editor?.chain().focus().toggleBulletList().run()"
        icon="i-lucide-list"
      >
        <UTooltip text="Bullet list" />
      </UButton>

      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :class="{ 'bg-primary/10 text-primary': isActive('orderedList') }"
        @click="editor?.chain().focus().toggleOrderedList().run()"
        icon="i-lucide-list-ordered"
      >
        <UTooltip text="Numbered list" />
      </UButton>

      <UDivider
        orientation="vertical"
        class="h-6"
      />

      <!-- Block Elements -->
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :class="{ 'bg-primary/10 text-primary': isActive('blockquote') }"
        @click="editor?.chain().focus().toggleBlockquote().run()"
        icon="i-lucide-quote"
      >
        <UTooltip text="Quote" />
      </UButton>

      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :class="{ 'bg-primary/10 text-primary': isActive('codeBlock') }"
        @click="editor?.chain().focus().toggleCodeBlock().run()"
        icon="i-lucide-code-2"
      >
        <UTooltip text="Code block" />
      </UButton>

      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        @click="editor?.chain().focus().setHorizontalRule().run()"
        icon="i-lucide-minus"
      >
        <UTooltip text="Horizontal rule" />
      </UButton>

      <UDivider
        orientation="vertical"
        class="h-6"
      />

      <!-- Media & Links -->
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :class="{ 'bg-primary/10 text-primary': isActive('link') }"
        @click="setLink"
        icon="i-lucide-link"
        :loading="isUploading"
      >
        <UTooltip text="Link" />
      </UButton>

      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        @click="triggerImageUpload"
        icon="i-lucide-image"
        :loading="isUploading"
        :disabled="isUploading"
      >
        <UTooltip text="Upload image" />
      </UButton>

      <UDivider
        orientation="vertical"
        class="h-6"
      />

      <!-- History -->
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        @click="editor?.chain().focus().undo().run()"
        :disabled="!editor?.can().undo()"
        icon="i-lucide-undo"
      >
        <UTooltip text="Undo" />
      </UButton>

      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        @click="editor?.chain().focus().redo().run()"
        :disabled="!editor?.can().redo()"
        icon="i-lucide-redo"
      >
        <UTooltip text="Redo" />
      </UButton>
    </div>

    <!-- Upload progress indicator -->
    <UAlert
      v-if="isUploading"
      color="primary"
      variant="soft"
      icon="i-lucide-upload"
      title="Uploading image..."
    />

    <!-- Editor Content -->
    <TiptapEditorContent
      v-if="editor"
      :editor="editor"
      class="min-h-[500px]"
    />
    <p
      v-else
      class="text-center text-sm text-gray-500 dark:text-gray-400 py-8"
    >
      Initializing editor…
    </p>
  </div>
</template>
