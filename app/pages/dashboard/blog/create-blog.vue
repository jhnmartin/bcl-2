<script setup lang="ts">
import type { EditorCustomHandlers } from "@nuxt/ui";
import type { Editor } from "@tiptap/core";
import { Emoji } from "@tiptap/extension-emoji";
import TextAlign from "@tiptap/extension-text-align";
import ImageUpload from "~/components/editor/ImageUpload";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const runtimeConfig = useRuntimeConfig();

const room = computed(() => route.query.room as string | undefined);

const user = useState("user", () => ({
  name: getRandomName(),
  color: getRandomColor(),
}));

const appConfig = useAppConfig();

const editorRef = useTemplateRef("editorRef");

const {
  extension: completionExtension,
  handlers: aiHandlers,
  isLoading: aiLoading,
} = useEditorCompletion(editorRef);

const {
  enabled: collaborationEnabled,
  ready: collaborationReady,
  extensions: collaborationExtensions,
  connectedUsers,
} = useEditorCollaboration({
  room: room.value,
  host: runtimeConfig.public.partykitHost,
  user: {
    name: user.value.name,
    color: COLORS[user.value.color]!,
  },
});

// Set primary color for the app
if (collaborationEnabled) {
  appConfig.ui.colors.primary = user.value.color;
}

// Custom handlers for editor (merged with AI handlers)
const customHandlers = {
  imageUpload: {
    canExecute: (editor: Editor) =>
      editor.can().insertContent({ type: "imageUpload" }),
    execute: (editor: Editor) =>
      editor.chain().focus().insertContent({ type: "imageUpload" }),
    isActive: (editor: Editor) => editor.isActive("imageUpload"),
    isDisabled: undefined,
  },
  ...aiHandlers,
} satisfies EditorCustomHandlers;

const { items: emojiItems } = useEditorEmojis();
const { items: mentionItems } = useEditorMentions(connectedUsers);
const { items: suggestionItems } = useEditorSuggestions(customHandlers);
const { getItems: getDragHandleItems, onNodeChange } =
  useEditorDragHandle(customHandlers);
const { toolbarItems, bubbleToolbarItems, getImageToolbarItems } =
  useEditorToolbar(customHandlers, { aiLoading });

// Default content - only used when Y.js document is empty
const content = ref(`# New Blog Post
  
Start writing your blog post here...

---

## Rich Text Formatting

This editor supports **bold**, *italic*, <u>underline</u>, ~~strikethrough~~, and \`inline code\`.

## Slash Commands

Type \`/\` anywhere to open the command menu and quickly insert:

- Headings, paragraphs, and blockquotes
- Bullet lists and numbered lists
- Code blocks and horizontal rules
- Images and more

## Mentions & Emojis

Add emojis with \`:\` syntax :rocket:

> *Pro tip: Use the bubble toolbar that appears when you select text for quick formatting.*
`);

// Set initial content for collaborative documents (only if empty)
function onCreate({ editor }: { editor: Editor }) {
  if (!collaborationEnabled) return;

  const storageKey = `editor-initialized-${room.value}`;

  // Skip if already initialized this session (handles HMR)
  if (sessionStorage.getItem(storageKey)) return;

  // Wait for Y.js to sync existing content from server before checking if empty
  setTimeout(() => {
    const text = editor.state.doc.textContent.trim();
    if (!text) {
      editor.commands.setContent(content.value, { contentType: "markdown" });
    }
    sessionStorage.setItem(storageKey, "true");
  }, 500);
}

function onUpdate(value: string) {
  if (!collaborationEnabled) {
    content.value = value;
  }
}

const extensions = computed(() => [
  Emoji,
  ImageUpload,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  completionExtension,
  ...collaborationExtensions.value,
]);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Create Blog Post">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/dashboard/blog"
          />
        </template>
        <template #right>
          <UButton label="Save Draft" color="neutral" variant="outline" />
          <UButton label="Publish" color="primary" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UEditor
        v-if="collaborationReady"
        ref="editorRef"
        v-slot="{ editor, handlers }"
        :model-value="collaborationEnabled ? undefined : content"
        content-type="markdown"
        :extensions="extensions"
        :starter-kit="collaborationEnabled ? { undoRedo: false } : undefined"
        :handlers="customHandlers"
        autofocus
        placeholder="Write, type '/' for commands..."
        class="min-h-[calc(100vh-8rem)]"
        :ui="{
          base: 'p-4 sm:p-8',
          content: 'max-w-4xl mx-auto',
        }"
        @update:model-value="onUpdate"
        @create="onCreate"
      >
        <!-- Editor Toolbar -->
        <div
          class="sticky top-0 z-10 bg-default border-b border-default px-4 py-2 flex items-center gap-4"
        >
          <EditorCollaborationUsers
            v-if="collaborationEnabled"
            :users="connectedUsers"
          />

          <UEditorToolbar :editor="editor" :items="toolbarItems" />
        </div>

        <UEditorToolbar
          :editor="editor"
          :items="bubbleToolbarItems"
          layout="bubble"
          :should-show="({ editor, view, state }: any) => {
              if (editor.isActive('imageUpload') || editor.isActive('image')) {
                return false
              }
              const { selection } = state
              return view.hasFocus() && !selection.empty
            }"
        >
          <template #link>
            <EditorLinkPopover :editor="editor" />
          </template>
        </UEditorToolbar>

        <UEditorToolbar
          :editor="editor"
          :items="getImageToolbarItems(editor)"
          layout="bubble"
          :should-show="({ editor, view }: any) => {
              return editor.isActive('image') && view.hasFocus()
            }"
        />

        <UEditorDragHandle
          v-slot="{ ui, onClick }"
          :editor="editor"
          @node-change="onNodeChange"
        >
          <UButton
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            size="sm"
            :class="ui.handle()"
            @click="(e: MouseEvent) => {
                e.stopPropagation()
                const node = onClick()
  
                handlers.suggestion?.execute(editor, { pos: node?.pos }).run()
              }"
          />

          <UDropdownMenu
            v-slot="{ open }"
            :modal="false"
            :items="getDragHandleItems(editor)"
            :content="{ side: 'left' }"
            :ui="{ content: 'w-48', label: 'text-xs' }"
            @update:open="editor.chain().setMeta('lockDragHandle', $event).run()"
          >
            <UButton
              color="neutral"
              variant="ghost"
              active-variant="soft"
              size="sm"
              icon="i-lucide-grip-vertical"
              :active="open"
              :class="ui.handle()"
            />
          </UDropdownMenu>
        </UEditorDragHandle>

        <UEditorEmojiMenu :editor="editor" :items="emojiItems" />
        <UEditorMentionMenu :editor="editor" :items="mentionItems" />
        <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />
      </UEditor>
    </template>
  </UDashboardPanel>
</template>

