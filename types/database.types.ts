export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '10.2.0 (e07807d)';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      cities: {
        Row: {
          cities_how_alt_text: string | null;
          cities_how_image: string | null;
          city_h1: string | null;
          city_h2_1: string | null;
          city_h2_1_paragraph: string | null;
          city_h2_2: string | null;
          city_h2_3: string | null;
          city_h2_3_paragraph: string | null;
          city_h2_4: string | null;
          city_h2_5: string | null;
          city_h2_6: string | null;
          city_h2_6_paragraph: string | null;
          created_at: string | null;
          hero_image: string | null;
          hero_image_alt_text: string | null;
          hero_paragraph: string | null;
          id: string;
          name: string | null;
          seo_description: string | null;
          seo_title: string | null;
          slug: string | null;
        };
        Insert: {
          cities_how_alt_text?: string | null;
          cities_how_image?: string | null;
          city_h1?: string | null;
          city_h2_1?: string | null;
          city_h2_1_paragraph?: string | null;
          city_h2_2?: string | null;
          city_h2_3?: string | null;
          city_h2_3_paragraph?: string | null;
          city_h2_4?: string | null;
          city_h2_5?: string | null;
          city_h2_6?: string | null;
          city_h2_6_paragraph?: string | null;
          created_at?: string | null;
          hero_image?: string | null;
          hero_image_alt_text?: string | null;
          hero_paragraph?: string | null;
          id?: string;
          name?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string | null;
        };
        Update: {
          cities_how_alt_text?: string | null;
          cities_how_image?: string | null;
          city_h1?: string | null;
          city_h2_1?: string | null;
          city_h2_1_paragraph?: string | null;
          city_h2_2?: string | null;
          city_h2_3?: string | null;
          city_h2_3_paragraph?: string | null;
          city_h2_4?: string | null;
          city_h2_5?: string | null;
          city_h2_6?: string | null;
          city_h2_6_paragraph?: string | null;
          created_at?: string | null;
          hero_image?: string | null;
          hero_image_alt_text?: string | null;
          hero_paragraph?: string | null;
          id?: string;
          name?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string | null;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          created_at: string;
          email: string | null;
          first_name: string | null;
          id: number;
          last_name: string | null;
          message: string | null;
          phone: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          first_name?: string | null;
          id?: number;
          last_name?: string | null;
          message?: string | null;
          phone?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          first_name?: string | null;
          id?: number;
          last_name?: string | null;
          message?: string | null;
          phone?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      'crawl-collection': {
        Row: {
          city: string | null;
          created_at: string;
          description: string | null;
          id: string;
          image_alt: string | null;
          image_src: string | null;
          name: string | null;
          price: string | null;
          slug: string | null;
          theme: string | null;
        };
        Insert: {
          city?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_alt?: string | null;
          image_src?: string | null;
          name?: string | null;
          price?: string | null;
          slug?: string | null;
          theme?: string | null;
        };
        Update: {
          city?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_alt?: string | null;
          image_src?: string | null;
          name?: string | null;
          price?: string | null;
          slug?: string | null;
          theme?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'crawl-collection_city_fkey';
            columns: ['city'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'crawl-collection_theme_fkey';
            columns: ['theme'];
            isOneToOne: false;
            referencedRelation: 'themes';
            referencedColumns: ['id'];
          }
        ];
      };
      crawls: {
        Row: {
          alt_name: string | null;
          checkin_venue_1: string | null;
          city: string | null;
          collection: string | null;
          crawl_image_1: string | null;
          crawl_image_1_alt: string | null;
          crawl_image_2: string | null;
          crawl_image_2_alt: string | null;
          crawl_image_3: string | null;
          crawl_image_3_alt: string | null;
          crawl_image_4: string | null;
          crawl_image_4_alt: string | null;
          crawl_image_vertical_alt: string | null;
          crawl_image_vertical_url: string | null;
          created_at: string | null;
          event_date_end: string | null;
          event_date_end_2: string | null;
          event_date_end_3: string | null;
          event_date_start: string | null;
          event_date_start_2: string | null;
          event_date_start_3: string | null;
          eventbrite_id: string | null;
          id: string;
          keywords_h2: string | null;
          keywords_paragraph: string | null;
          name: string | null;
          neighborhood: string | null;
          price: string | null;
          seo_description: string | null;
          seo_title: string | null;
          short_description: string | null;
          slug: string | null;
          theme: string | null;
          updated_at: string | null;
        };
        Insert: {
          alt_name?: string | null;
          checkin_venue_1?: string | null;
          city?: string | null;
          collection?: string | null;
          crawl_image_1?: string | null;
          crawl_image_1_alt?: string | null;
          crawl_image_2?: string | null;
          crawl_image_2_alt?: string | null;
          crawl_image_3?: string | null;
          crawl_image_3_alt?: string | null;
          crawl_image_4?: string | null;
          crawl_image_4_alt?: string | null;
          crawl_image_vertical_alt?: string | null;
          crawl_image_vertical_url?: string | null;
          created_at?: string | null;
          event_date_end?: string | null;
          event_date_end_2?: string | null;
          event_date_end_3?: string | null;
          event_date_start?: string | null;
          event_date_start_2?: string | null;
          event_date_start_3?: string | null;
          eventbrite_id?: string | null;
          id?: string;
          keywords_h2?: string | null;
          keywords_paragraph?: string | null;
          name?: string | null;
          neighborhood?: string | null;
          price?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          slug?: string | null;
          theme?: string | null;
          updated_at?: string | null;
        };
        Update: {
          alt_name?: string | null;
          checkin_venue_1?: string | null;
          city?: string | null;
          collection?: string | null;
          crawl_image_1?: string | null;
          crawl_image_1_alt?: string | null;
          crawl_image_2?: string | null;
          crawl_image_2_alt?: string | null;
          crawl_image_3?: string | null;
          crawl_image_3_alt?: string | null;
          crawl_image_4?: string | null;
          crawl_image_4_alt?: string | null;
          crawl_image_vertical_alt?: string | null;
          crawl_image_vertical_url?: string | null;
          created_at?: string | null;
          event_date_end?: string | null;
          event_date_end_2?: string | null;
          event_date_end_3?: string | null;
          event_date_start?: string | null;
          event_date_start_2?: string | null;
          event_date_start_3?: string | null;
          eventbrite_id?: string | null;
          id?: string;
          keywords_h2?: string | null;
          keywords_paragraph?: string | null;
          name?: string | null;
          neighborhood?: string | null;
          price?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          slug?: string | null;
          theme?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'crawls_checkin_venue_1_fkey';
            columns: ['checkin_venue_1'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'crawls_city_fkey';
            columns: ['city'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'crawls_collection_fkey';
            columns: ['collection'];
            isOneToOne: false;
            referencedRelation: 'crawl-collection';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'crawls_theme_fkey';
            columns: ['theme'];
            isOneToOne: false;
            referencedRelation: 'themes';
            referencedColumns: ['id'];
          }
        ];
      };
      faqs: {
        Row: {
          answer: string;
          city: string | null;
          crawl: string | null;
          created_at: string | null;
          id: string;
          question: string;
          theme: string | null;
        };
        Insert: {
          answer: string;
          city?: string | null;
          crawl?: string | null;
          created_at?: string | null;
          id?: string;
          question: string;
          theme?: string | null;
        };
        Update: {
          answer?: string;
          city?: string | null;
          crawl?: string | null;
          created_at?: string | null;
          id?: string;
          question?: string;
          theme?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'faqs_city_fkey';
            columns: ['city'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'faqs_crawl_fkey';
            columns: ['crawl'];
            isOneToOne: false;
            referencedRelation: 'crawls';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'faqs_theme_fkey';
            columns: ['theme'];
            isOneToOne: false;
            referencedRelation: 'themes';
            referencedColumns: ['id'];
          }
        ];
      };
      features: {
        Row: {
          created_at: string | null;
          feature_description: string | null;
          feature_title: string | null;
          id: string;
          theme: string | null;
        };
        Insert: {
          created_at?: string | null;
          feature_description?: string | null;
          feature_title?: string | null;
          id?: string;
          theme?: string | null;
        };
        Update: {
          created_at?: string | null;
          feature_description?: string | null;
          feature_title?: string | null;
          id?: string;
          theme?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'features_theme_fkey';
            columns: ['theme'];
            isOneToOne: false;
            referencedRelation: 'themes';
            referencedColumns: ['id'];
          }
        ];
      };
      maps: {
        Row: {
          additional_info: string | null;
          cancelled_redirect: string | null;
          checkin_timeslot_1: string | null;
          checkin_timeslot_2: string | null;
          checkin_timeslot_3: string | null;
          checkin_venue_1: string | null;
          checkin_venue_2: string | null;
          checkin_venue_3: string | null;
          city: string | null;
          crawl: string | null;
          created_at: string;
          date: string | null;
          early_checkin_date: string | null;
          early_checkin_date_2: string | null;
          early_checkin_message: string | null;
          early_checkin_timeslot: string | null;
          early_checkin_timeslot_2: string | null;
          early_checkin_venue: string | null;
          early_checkin_venue_2: string | null;
          eventbrite_id: string | null;
          id: string;
          slug: string | null;
          theme: string | null;
          time_slot: string | null;
        };
        Insert: {
          additional_info?: string | null;
          cancelled_redirect?: string | null;
          checkin_timeslot_1?: string | null;
          checkin_timeslot_2?: string | null;
          checkin_timeslot_3?: string | null;
          checkin_venue_1?: string | null;
          checkin_venue_2?: string | null;
          checkin_venue_3?: string | null;
          city?: string | null;
          crawl?: string | null;
          created_at?: string;
          date?: string | null;
          early_checkin_date?: string | null;
          early_checkin_date_2?: string | null;
          early_checkin_message?: string | null;
          early_checkin_timeslot?: string | null;
          early_checkin_timeslot_2?: string | null;
          early_checkin_venue?: string | null;
          early_checkin_venue_2?: string | null;
          eventbrite_id?: string | null;
          id?: string;
          slug?: string | null;
          theme?: string | null;
          time_slot?: string | null;
        };
        Update: {
          additional_info?: string | null;
          cancelled_redirect?: string | null;
          checkin_timeslot_1?: string | null;
          checkin_timeslot_2?: string | null;
          checkin_timeslot_3?: string | null;
          checkin_venue_1?: string | null;
          checkin_venue_2?: string | null;
          checkin_venue_3?: string | null;
          city?: string | null;
          crawl?: string | null;
          created_at?: string;
          date?: string | null;
          early_checkin_date?: string | null;
          early_checkin_date_2?: string | null;
          early_checkin_message?: string | null;
          early_checkin_timeslot?: string | null;
          early_checkin_timeslot_2?: string | null;
          early_checkin_venue?: string | null;
          early_checkin_venue_2?: string | null;
          eventbrite_id?: string | null;
          id?: string;
          slug?: string | null;
          theme?: string | null;
          time_slot?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'maps_checkin_venue_1_fkey';
            columns: ['checkin_venue_1'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maps_checkin_venue_2_fkey';
            columns: ['checkin_venue_2'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maps_checkin_venue_3_fkey';
            columns: ['checkin_venue_3'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maps_city_fkey';
            columns: ['city'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maps_crawl_fkey';
            columns: ['crawl'];
            isOneToOne: false;
            referencedRelation: 'crawls';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maps_early_checkin_venue_2_fkey';
            columns: ['early_checkin_venue_2'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maps_early_checkin_venue_fkey';
            columns: ['early_checkin_venue'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maps_theme_fkey';
            columns: ['theme'];
            isOneToOne: false;
            referencedRelation: 'themes';
            referencedColumns: ['id'];
          }
        ];
      };
      orders: {
        Row: {
          created_at: string | null;
          email: string | null;
          event_id: string | null;
          first_name: string | null;
          gross: string | null;
          id: string;
          last_name: string | null;
          order_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          event_id?: string | null;
          first_name?: string | null;
          gross?: string | null;
          id?: string;
          last_name?: string | null;
          order_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          event_id?: string | null;
          first_name?: string | null;
          gross?: string | null;
          id?: string;
          last_name?: string | null;
          order_id?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          first_name: string | null;
          id: string;
          last_name: string | null;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
      smartlinks: {
        Row: {
          created_at: string | null;
          h1: string | null;
          h1_paragraph: string | null;
          id: string;
          name: string;
          promocode: string | null;
          slug: string;
          theme: string | null;
        };
        Insert: {
          created_at?: string | null;
          h1?: string | null;
          h1_paragraph?: string | null;
          id?: string;
          name: string;
          promocode?: string | null;
          slug: string;
          theme?: string | null;
        };
        Update: {
          created_at?: string | null;
          h1?: string | null;
          h1_paragraph?: string | null;
          id?: string;
          name?: string;
          promocode?: string | null;
          slug?: string;
          theme?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'smartlinks_theme_fkey';
            columns: ['theme'];
            isOneToOne: false;
            referencedRelation: 'themes';
            referencedColumns: ['id'];
          }
        ];
      };
      specials: {
        Row: {
          additional_info: string | null;
          crawl: string | null;
          created_at: string | null;
          id: string;
          map: string | null;
          order: number | null;
          slug: string | null;
          specials: Json | null;
          theme: string | null;
          timeslot: string | null;
          venue: string;
        };
        Insert: {
          additional_info?: string | null;
          crawl?: string | null;
          created_at?: string | null;
          id?: string;
          map?: string | null;
          order?: number | null;
          slug?: string | null;
          specials?: Json | null;
          theme?: string | null;
          timeslot?: string | null;
          venue: string;
        };
        Update: {
          additional_info?: string | null;
          crawl?: string | null;
          created_at?: string | null;
          id?: string;
          map?: string | null;
          order?: number | null;
          slug?: string | null;
          specials?: Json | null;
          theme?: string | null;
          timeslot?: string | null;
          venue?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'specials_crawl_fkey';
            columns: ['crawl'];
            isOneToOne: false;
            referencedRelation: 'crawls';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'specials_map_fkey';
            columns: ['map'];
            isOneToOne: false;
            referencedRelation: 'maps';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'specials_theme_fkey';
            columns: ['theme'];
            isOneToOne: false;
            referencedRelation: 'themes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'specials_venue_fkey';
            columns: ['venue'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          }
        ];
      };
      themes: {
        Row: {
          benefits_heading: string | null;
          benefits_paragraph: string | null;
          cities_paragraph: string | null;
          crawl_date: string | null;
          created_at: string | null;
          display_name: string | null;
          h1: string | null;
          h1_paragraph: string | null;
          h2: string | null;
          h2_paragraph: string | null;
          home_h2: string | null;
          horizontal_image_alt_text: string | null;
          horizontal_image_url: string | null;
          id: string;
          meta_description: string | null;
          name: string | null;
          p_how_it_works: string | null;
          seo_title: string | null;
          slug: string | null;
          square_1_image_alt_text: string | null;
          square_1_image_url: string | null;
          square_2_image_alt_text: string | null;
          square_2_image_url: string | null;
          square_3_image_alt_text: string | null;
          square_3_image_url: string | null;
          vertical_image_alt_text: string | null;
          vertical_image_url: string | null;
        };
        Insert: {
          benefits_heading?: string | null;
          benefits_paragraph?: string | null;
          cities_paragraph?: string | null;
          crawl_date?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          h1?: string | null;
          h1_paragraph?: string | null;
          h2?: string | null;
          h2_paragraph?: string | null;
          home_h2?: string | null;
          horizontal_image_alt_text?: string | null;
          horizontal_image_url?: string | null;
          id?: string;
          meta_description?: string | null;
          name?: string | null;
          p_how_it_works?: string | null;
          seo_title?: string | null;
          slug?: string | null;
          square_1_image_alt_text?: string | null;
          square_1_image_url?: string | null;
          square_2_image_alt_text?: string | null;
          square_2_image_url?: string | null;
          square_3_image_alt_text?: string | null;
          square_3_image_url?: string | null;
          vertical_image_alt_text?: string | null;
          vertical_image_url?: string | null;
        };
        Update: {
          benefits_heading?: string | null;
          benefits_paragraph?: string | null;
          cities_paragraph?: string | null;
          crawl_date?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          h1?: string | null;
          h1_paragraph?: string | null;
          h2?: string | null;
          h2_paragraph?: string | null;
          home_h2?: string | null;
          horizontal_image_alt_text?: string | null;
          horizontal_image_url?: string | null;
          id?: string;
          meta_description?: string | null;
          name?: string | null;
          p_how_it_works?: string | null;
          seo_title?: string | null;
          slug?: string | null;
          square_1_image_alt_text?: string | null;
          square_1_image_url?: string | null;
          square_2_image_alt_text?: string | null;
          square_2_image_url?: string | null;
          square_3_image_alt_text?: string | null;
          square_3_image_url?: string | null;
          vertical_image_alt_text?: string | null;
          vertical_image_url?: string | null;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          address_line_1: string | null;
          black_logo: string | null;
          black_logo_alt: string | null;
          city: string | null;
          created_at: string | null;
          id: string;
          is_featured: boolean | null;
          maps_embed: string | null;
          name: string | null;
          seo_description: string | null;
          seo_title: string | null;
          slug: string | null;
          state: string | null;
          white_logo: string | null;
          white_logo_alt: string | null;
          zip_code: string | null;
        };
        Insert: {
          address_line_1?: string | null;
          black_logo?: string | null;
          black_logo_alt?: string | null;
          city?: string | null;
          created_at?: string | null;
          id?: string;
          is_featured?: boolean | null;
          maps_embed?: string | null;
          name?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string | null;
          state?: string | null;
          white_logo?: string | null;
          white_logo_alt?: string | null;
          zip_code?: string | null;
        };
        Update: {
          address_line_1?: string | null;
          black_logo?: string | null;
          black_logo_alt?: string | null;
          city?: string | null;
          created_at?: string | null;
          id?: string;
          is_featured?: boolean | null;
          maps_embed?: string | null;
          name?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string | null;
          state?: string | null;
          white_logo?: string | null;
          white_logo_alt?: string | null;
          zip_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'venues_city_fkey';
            columns: ['city'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      handle_new_crawl_maps: { Args: never; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          type: Database['storage']['Enums']['buckettype'];
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          type?: Database['storage']['Enums']['buckettype'];
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          type?: Database['storage']['Enums']['buckettype'];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      buckets_analytics: {
        Row: {
          created_at: string;
          format: string;
          id: string;
          type: Database['storage']['Enums']['buckettype'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          format?: string;
          id: string;
          type?: Database['storage']['Enums']['buckettype'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          format?: string;
          id?: string;
          type?: Database['storage']['Enums']['buckettype'];
          updated_at?: string;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          level: number | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          user_metadata: Json | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          level?: number | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          level?: number | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'objects_bucketId_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          }
        ];
      };
      prefixes: {
        Row: {
          bucket_id: string;
          created_at: string | null;
          level: number;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          bucket_id: string;
          created_at?: string | null;
          level?: number;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          bucket_id?: string;
          created_at?: string | null;
          level?: number;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'prefixes_bucketId_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          }
        ];
      };
      s3_multipart_uploads: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          in_progress_size: number;
          key: string;
          owner_id: string | null;
          upload_signature: string;
          user_metadata: Json | null;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id: string;
          in_progress_size?: number;
          key: string;
          owner_id?: string | null;
          upload_signature: string;
          user_metadata?: Json | null;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          in_progress_size?: number;
          key?: string;
          owner_id?: string | null;
          upload_signature?: string;
          user_metadata?: Json | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          }
        ];
      };
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string;
          created_at: string;
          etag: string;
          id: string;
          key: string;
          owner_id: string | null;
          part_number: number;
          size: number;
          upload_id: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          etag: string;
          id?: string;
          key: string;
          owner_id?: string | null;
          part_number: number;
          size?: number;
          upload_id: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          etag?: string;
          id?: string;
          key?: string;
          owner_id?: string | null;
          part_number?: number;
          size?: number;
          upload_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_parts_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 's3_multipart_uploads_parts_upload_id_fkey';
            columns: ['upload_id'];
            isOneToOne: false;
            referencedRelation: 's3_multipart_uploads';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string };
        Returns: undefined;
      };
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string };
        Returns: undefined;
      };
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] };
        Returns: undefined;
      };
      delete_prefix: {
        Args: { _bucket_id: string; _name: string };
        Returns: boolean;
      };
      extension: { Args: { name: string }; Returns: string };
      filename: { Args: { name: string }; Returns: string };
      foldername: { Args: { name: string }; Returns: string[] };
      get_level: { Args: { name: string }; Returns: number };
      get_prefix: { Args: { name: string }; Returns: string };
      get_prefixes: { Args: { name: string }; Returns: string[] };
      get_size_by_bucket: {
        Args: never;
        Returns: {
          bucket_id: string;
          size: number;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
          prefix_param: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_token?: string;
          prefix_param: string;
          start_after?: string;
        };
        Returns: {
          id: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] };
        Returns: undefined;
      };
      operation: { Args: never; Returns: string };
      search: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_legacy_v1: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_v1_optimised: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_v2: {
        Args: {
          bucket_name: string;
          levels?: number;
          limits?: number;
          prefix: string;
          sort_column?: string;
          sort_column_after?: string;
          sort_order?: string;
          start_after?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
    };
    Enums: {
      buckettype: 'STANDARD' | 'ANALYTICS';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
      DefaultSchema['Views'])
  ? (DefaultSchema['Tables'] &
      DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
  ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
  ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ['STANDARD', 'ANALYTICS'],
    },
  },
} as const;
