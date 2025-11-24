<script lang="ts" setup>
const email = ref('');

function onSubmit() {
  console.log('Submitted', email.value);
}
</script>

<template>
  <UPageCTA
    title="Get first dibs on ticket giveaways, discounts, and new events"
    description="Sign up for news and all our best deals for upcoming bar and pub crawls, block parties and special events."
    class="my-24"
  >
    <UForm
      @submit.prevent="onSubmit"
      class="flex gap-2 mx-auto"
    >
      <UFormField name="email">
        <UInput
          v-model="email"
          type="email"
          size="xl"
          placeholder="Enter your email"
        />
      </UFormField>
      <UButton
        type="submit"
        label="Subscribe"
        size="xl"
      />
    </UForm>
  </UPageCTA>
</template>

<style></style>
