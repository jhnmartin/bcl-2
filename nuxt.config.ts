// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/supabase',
    '@nuxt/ui',
    'nuxt-tiptap-editor',
    '@vueuse/nuxt',
  ],
  css: ['~/assets/css/main.css'],

  devtools: { enabled: true },
  compatibilityDate: '2025-07-15',

  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: ['/dashboard(/*)?'],
      saveRedirectToCookie: false,
    },
  },

  tiptap: {
    prefix: 'Tiptap',
  },
});
