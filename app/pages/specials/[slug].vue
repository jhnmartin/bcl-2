<script lang="ts" setup>
import type { JSONContent } from '@tiptap/vue-3';
import type { Database } from '@/types/database.types';

const route = useRoute();
const supabase = useSupabaseClient();

const specialId = computed(() => route.params.slug as string);

type SpecialsPayload =
  Database['public']['Tables']['specials']['Row']['specials'];

const { data: special } = await useAsyncData('special', async () => {
  const { data, error } = await supabase
    .from('specials')
    .select(
      '*, crawl(name, crawl_image_vertical_url, crawl_image_vertical_alt), venue(name)'
    )
    .eq('slug', specialId.value)
    .single();
  return data ?? null;
});

const defaultDoc: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
};

function normalizeSpecials(
  value: SpecialsPayload | string | null | undefined
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

const content = computed(() => normalizeSpecials(special.value?.specials));

const editor = useEditor({
  content: content.value,
  editable: false,
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
      class: 'tiptap-content max-w-none focus:outline-none text-base leading-6',
    },
  },
});

watch(content, (newContent) => {
  editor.value?.commands.setContent(newContent, false);
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <UPage>
    <UPageHero
      v-if="special"
      :title="special.venue?.name ?? ''"
      :description="special.crawl?.name ?? ''"
      orientation="horizontal"
    >
      <img
        v-if="special.crawl?.crawl_image_vertical_url"
        :src="special.crawl.crawl_image_vertical_url"
        :alt="special.crawl.crawl_image_vertical_alt ?? ''"
      />
    </UPageHero>
    <div
      v-if="special"
      class="max-w-4xl mx-auto"
    >
      <div class="prose prose-lg max-w-none">
        <TiptapEditorContent
          v-if="editor"
          :editor="editor"
          class="tiptap-display"
        />
        <p
          v-else
          class="text-muted"
        >
          Loading content...
        </p>
      </div>
    </div>
    <div
      v-else
      class="text-center py-8"
    >
      <p class="text-muted">Special not found</p>
    </div>
  </UPage>
</template>
