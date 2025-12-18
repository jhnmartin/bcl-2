// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxtjs/supabase", "@nuxt/ui", "@vueuse/nuxt"],
  css: ["~/assets/css/main.css"],

  ui: {
    experimental: {
      componentDetection: true,
    },
  },

  devtools: { enabled: true },

  compatibilityDate: "2025-07-15",

  runtimeConfig: {
    eventbrite: {
      webhookSecret: process.env.EVENTBRITE_WEBHOOK_SECRET,
      apiToken: process.env.EVENTBRITE_API_TOKEN,
    },
    public: {
      partykitHost: "",
    },
  },

  supabase: {
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      include: ["/dashboard(/*)?"],
      saveRedirectToCookie: false,
    },
  },

  vite: {
    optimizeDeps: {
      include: [
        "prosemirror-state",
        "prosemirror-view",
        "yjs",
        "y-partykit/provider",
      ],
    },
  },
});
