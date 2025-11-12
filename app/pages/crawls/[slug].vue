<script lang="ts" setup>
const route = useRoute();
const supabase = useSupabaseClient();

const { data: crawl } = await supabase
  .from('crawls')
  .select('* , theme( video ), city:cities( name, id )')
  .eq('slug', route.params.slug as string)
  .single();

const { data: additionalCrawls } = await supabase
  .from('crawls')
  .select('*')
  .eq('city', crawl?.city?.id ?? '')
  .neq('id', crawl?.id ?? '')
  .order('event_date_start', { ascending: true })
  .limit(3);

const links = ref([
  {
    label: 'Get Tickets',
    to: '#tickets',
    icon: 'i-lucide-ticket',
  },
]);

const additionalCrawlsTitle = `Other Crawls in ${crawl?.city?.name ?? ''}`;
</script>

<template>
  <div>
    <UPage>
      <UPageHero
        :title="crawl?.name ?? ''"
        :description="crawl?.short_description ?? ''"
        :headline="crawl?.neighborhood ?? ''"
        :links="links"
        class="relative min-h-screen"
        orientation="horizontal"
      >
        <div class="absolute bottom-0 left-0 right-0 w-full h-full -z-10">
          <video
            v-if="crawl?.theme?.video"
            :src="crawl.theme.video"
            autoplay
            muted
            loop
            playsinline
            class="absolute inset-0 w-full h-full object-cover z-0"
          ></video>
          <div class="absolute inset-0 bg-black/50 z-10"></div>
        </div>
      </UPageHero>
      <UPageSection
        title="Tickets"
        id="tickets"
      >
        tickets
      </UPageSection>
      <UPageSection title="Event Details"> details </UPageSection>
      <UPageSection
        title="FAQ"
        description="What Bar Crawl Attendees want to know about the Chicago Ugly Sweater Bar Crawl."
      >
        faq
      </UPageSection>
      <UPageSection title="Bar Crawl Pro Tips"> pro tips </UPageSection>
      <UPageSection
        :title="additionalCrawlsTitle"
        :ui="{ title: 'capitalize' }"
      >
        <UPageGrid>
          <ULink
            v-for="crawl in additionalCrawls"
            :key="crawl.id"
            :to="`/crawls/${crawl.slug}`"
          >
            <UPageCard :title="crawl.name ?? ''">
              <template #header>
                <img
                  :src="crawl.crawl_image_vertical_url ?? ''"
                  :alt="crawl.crawl_image_vertical_alt ?? ''"
                />
              </template>
            </UPageCard>
          </ULink>
        </UPageGrid>
      </UPageSection>
    </UPage>
  </div>
</template>

<style></style>
