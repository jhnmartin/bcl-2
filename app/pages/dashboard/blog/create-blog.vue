<script setup lang="ts">
import type { EditorCustomHandlers } from "@nuxt/ui";
import type { Editor } from "@tiptap/core";
import { Emoji } from "@tiptap/extension-emoji";
import TextAlign from "@tiptap/extension-text-align";
import ImageUpload from "~/components/editor/ImageUpload";

definePageMeta({
  layout: "dashboard",
});

const editorRef = useTemplateRef("editorRef");

const {
  extension: completionExtension,
  handlers: aiHandlers,
  isLoading: aiLoading,
} = useEditorCompletion(editorRef);

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
const { items: suggestionItems } = useEditorSuggestions(customHandlers);
const { getItems: getDragHandleItems, onNodeChange } =
  useEditorDragHandle(customHandlers);
const { toolbarItems, bubbleToolbarItems, getImageToolbarItems } =
  useEditorToolbar(customHandlers, { aiLoading });

// Default content
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

## Emojis

Add emojis with \`:\` syntax :rocket:

> *Pro tip: Use the bubble toolbar that appears when you select text for quick formatting.*
`);

function onUpdate(value: string) {
  content.value = value;
}

const extensions = [
  Emoji,
  ImageUpload,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  completionExtension,
];
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
        ref="editorRef"
        v-slot="{ editor, handlers }"
        v-model="content"
        content-type="markdown"
        :extensions="extensions"
        :handlers="customHandlers"
        autofocus
        placeholder="Write, type '/' for commands..."
        class="min-h-[calc(100vh-8rem)]"
        :ui="{
          base: 'p-4 sm:p-8',
          content: 'max-w-4xl mx-auto',
        }"
        @update:model-value="onUpdate"
      >
        <!-- Editor Toolbar -->
        <div
          class="sticky top-0 z-10 bg-default border-b border-default px-4 py-2 flex items-center gap-4"
        >
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
            @update:open="
              editor.chain().setMeta('lockDragHandle', $event).run()
            "
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
        <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />
      </UEditor>
    </template>
  </UDashboardPanel>
</template>
