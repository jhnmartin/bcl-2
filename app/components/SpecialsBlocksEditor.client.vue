<script setup lang="ts">
import type { JSONContent } from '@tiptap/vue-3';
import type { Database } from '@/types/database.types';

type SpecialsPayload =
  Database['public']['Tables']['specials']['Row']['specials'];

const props = withDefaults(
  defineProps<{
    modelValue: SpecialsPayload;
  }>(),
  {
    modelValue: null,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: SpecialsPayload): void;
}>();

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
  value: SpecialsPayload | null | undefined
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

const editor = useEditor({
  content: content.value,
  extensions: [
    TiptapStarterKit.configure({
      heading: {
        levels: [2, 3, 4],
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
  ],
  editorProps: {
    attributes: {
      class:
        'tiptap-editor-content max-w-none min-h-[220px] focus:outline-none text-base leading-6',
    },
  },
  onUpdate({ editor }) {
    const json = editor.getJSON();
    content.value = json;
    emit('update:modelValue', json as SpecialsPayload);
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

function toggleHeading(level: 2 | 3 | 4) {
  editor.value?.chain().focus().toggleHeading({ level }).run();
}

function isHeadingActive(level: 2 | 3 | 4) {
  return !!editor.value?.isActive('heading', { level });
}

function isActive(name: string, attrs?: Record<string, unknown>) {
  return !!editor.value?.isActive(name, attrs);
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="editor"
      class="flex flex-wrap items-center gap-2 rounded-lg p-2"
    >
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :ui="{ rounded: 'rounded-md' }"
        :class="{ 'bg-primary/10 text-primary': isActive('paragraph') }"
        @click="editor?.chain().focus().setParagraph().run()"
        icon="i-lucide-pilcrow"
      />
      <UButton
        v-for="level in [2, 3, 4]"
        :key="level"
        size="xs"
        color="neutral"
        variant="ghost"
        :ui="{ rounded: 'rounded-md' }"
        :class="{ 'bg-primary/10 text-primary': isHeadingActive(level) }"
        @click="toggleHeading(level)"
        :icon="`i-lucide-heading-${level}`"
      />
      <UDivider
        orientation="vertical"
        class="h-6"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :ui="{ rounded: 'rounded-md' }"
        :class="{ 'bg-primary/10 text-primary': isActive('bold') }"
        @click="editor?.chain().focus().toggleBold().run()"
        icon="i-lucide-bold"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :ui="{ rounded: 'rounded-md' }"
        :class="{ 'bg-primary/10 text-primary': isActive('italic') }"
        @click="editor?.chain().focus().toggleItalic().run()"
        icon="i-lucide-italic"
      />
      <UDivider
        orientation="vertical"
        class="h-6"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :ui="{ rounded: 'rounded-md' }"
        :class="{ 'bg-primary/10 text-primary': isActive('bulletList') }"
        @click="editor?.chain().focus().toggleBulletList().run()"
        icon="i-lucide-list"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :ui="{ rounded: 'rounded-md' }"
        :class="{ 'bg-primary/10 text-primary': isActive('orderedList') }"
        @click="editor?.chain().focus().toggleOrderedList().run()"
        icon="i-lucide-list-ordered"
      />
      <UDivider
        orientation="vertical"
        class="h-6"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :ui="{ rounded: 'rounded-md' }"
        @click="editor?.chain().focus().undo().run()"
        :disabled="!editor?.can().undo()"
        icon="i-lucide-undo"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :ui="{ rounded: 'rounded-md' }"
        @click="editor?.chain().focus().redo().run()"
        :disabled="!editor?.can().redo()"
        icon="i-lucide-redo"
      />
    </div>

    <div class="overflow-hidden rounded-lg">
      <TiptapEditorContent
        v-if="editor"
        :editor="editor"
        class="min-h-[220px] rounded-md bg-white px-4 py-3 dark:bg-neutral-900"
      />
      <p
        v-else
        class="px-2 py-4 text-xs text-muted"
      >
        Initializing editor…
      </p>
    </div>
  </div>
</template>

<style scoped>
:deep(.tiptap-editor-content h2) {
  font-size: 1.5rem !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
  margin-top: 1.5em !important;
  margin-bottom: 0.75em !important;
}

:deep(.tiptap-editor-content h3) {
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
  margin-top: 1.25em !important;
  margin-bottom: 0.5em !important;
}

:deep(.tiptap-editor-content h4) {
  font-size: 1.125rem !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
  margin-top: 1em !important;
  margin-bottom: 0.5em !important;
}

:deep(.tiptap-editor-content ul),
:deep(.tiptap-editor-content ol) {
  padding-left: 1.5rem !important;
  margin: 0.75em 0 !important;
}

:deep(.tiptap-editor-content ul) {
  list-style-type: disc !important;
}

:deep(.tiptap-editor-content ol) {
  list-style-type: decimal !important;
}

:deep(.tiptap-editor-content li) {
  margin: 0.25em 0 !important;
  padding-left: 0.25rem !important;
  display: list-item !important;
}

:deep(.tiptap-editor-content li p) {
  margin: 0 !important;
}

:deep(.tiptap-editor-content li::marker) {
  color: inherit !important;
}
</style>
