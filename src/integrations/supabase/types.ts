export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      animal_drafts: {
        Row: {
          created_at: string
          data: Json
          expires_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      animal_media: {
        Row: {
          animal_id: string | null
          created_at: string | null
          id: string
          order_index: number | null
          type: string
          url: string
        }
        Insert: {
          animal_id?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          type: string
          url: string
        }
        Update: {
          animal_id?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_media_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_media_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_media_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_media_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "search_animals"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_partnerships: {
        Row: {
          animal_id: string | null
          created_at: string | null
          id: string
          partner_haras_name: string | null
          partner_id: string | null
          partner_public_code: string | null
          percentage: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          animal_id?: string | null
          created_at?: string | null
          id?: string
          partner_haras_name?: string | null
          partner_id?: string | null
          partner_public_code?: string | null
          percentage?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          animal_id?: string | null
          created_at?: string | null
          id?: string
          partner_haras_name?: string | null
          partner_id?: string | null
          partner_public_code?: string | null
          percentage?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_partnerships_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_partnerships_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_partnerships_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_partnerships_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "search_animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_partnerships_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_partnerships_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      animals: {
        Row: {
          ad_status: string | null
          allow_messages: boolean | null
          auto_renew: boolean | null
          birth_date: string
          boost_expires_at: string | null
          boosted_at: string | null
          boosted_by: string | null
          breed: string
          can_edit: boolean | null
          chip: string | null
          coat: string | null
          created_at: string | null
          current_city: string | null
          current_state: string | null
          expires_at: string | null
          father_name: string | null
          featured: boolean | null
          gender: string
          haras_id: string | null
          haras_name: string | null
          height: number | null
          id: string
          images: Json
          is_boosted: boolean | null
          mother_name: string | null
          name: string
          owner_id: string | null
          published_at: string | null
          registration_number: string | null
          titles: string[] | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          ad_status?: string | null
          allow_messages?: boolean | null
          auto_renew?: boolean | null
          birth_date: string
          boost_expires_at?: string | null
          boosted_at?: string | null
          boosted_by?: string | null
          breed: string
          can_edit?: boolean | null
          chip?: string | null
          coat?: string | null
          created_at?: string | null
          current_city?: string | null
          current_state?: string | null
          expires_at?: string | null
          father_name?: string | null
          featured?: boolean | null
          gender: string
          haras_id?: string | null
          haras_name?: string | null
          height?: number | null
          id?: string
          images?: Json
          is_boosted?: boolean | null
          mother_name?: string | null
          name: string
          owner_id?: string | null
          published_at?: string | null
          registration_number?: string | null
          titles?: string[] | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          ad_status?: string | null
          allow_messages?: boolean | null
          auto_renew?: boolean | null
          birth_date?: string
          boost_expires_at?: string | null
          boosted_at?: string | null
          boosted_by?: string | null
          breed?: string
          can_edit?: boolean | null
          chip?: string | null
          coat?: string | null
          created_at?: string | null
          current_city?: string | null
          current_state?: string | null
          expires_at?: string | null
          father_name?: string | null
          featured?: boolean | null
          gender?: string
          haras_id?: string | null
          haras_name?: string | null
          height?: number | null
          id?: string
          images?: Json
          is_boosted?: boolean | null
          mother_name?: string | null
          name?: string
          owner_id?: string | null
          published_at?: string | null
          registration_number?: string | null
          titles?: string[] | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_boosted_by_fkey"
            columns: ["boosted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_boosted_by_fkey"
            columns: ["boosted_by"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "animals_haras_id_fkey"
            columns: ["haras_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_haras_id_fkey"
            columns: ["haras_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "animals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          cover_image_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      boost_history: {
        Row: {
          boost_type: string
          content_id: string
          content_type: string
          cost: number | null
          created_at: string | null
          duration_hours: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          boost_type: string
          content_id: string
          content_type: string
          cost?: number | null
          created_at?: string | null
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          boost_type?: string
          content_id?: string
          content_type?: string
          cost?: number | null
          created_at?: string | null
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boost_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boost_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      clicks: {
        Row: {
          click_target: string | null
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          page_url: string | null
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          click_target?: string | null
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          page_url?: string | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          click_target?: string | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          animal_id: string | null
          animal_owner_id: string | null
          created_at: string | null
          id: string
          interested_user_id: string | null
          is_active: boolean | null
          is_temporary: boolean | null
          updated_at: string | null
        }
        Insert: {
          animal_id?: string | null
          animal_owner_id?: string | null
          created_at?: string | null
          id?: string
          interested_user_id?: string | null
          is_active?: boolean | null
          is_temporary?: boolean | null
          updated_at?: string | null
        }
        Update: {
          animal_id?: string | null
          animal_owner_id?: string | null
          created_at?: string | null
          id?: string
          interested_user_id?: string | null
          is_active?: boolean | null
          is_temporary?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "search_animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_animal_owner_id_fkey"
            columns: ["animal_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_animal_owner_id_fkey"
            columns: ["animal_owner_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_interested_user_id_fkey"
            columns: ["interested_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_interested_user_id_fkey"
            columns: ["interested_user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      events: {
        Row: {
          ad_status: string | null
          boost_expires_at: string | null
          boosted_at: string | null
          boosted_by: string | null
          can_edit: boolean | null
          city: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          event_type: string | null
          expires_at: string | null
          id: string
          is_boosted: boolean | null
          location: string | null
          max_participants: number | null
          organizer_id: string | null
          published_at: string | null
          registration_deadline: string | null
          start_date: string
          state: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ad_status?: string | null
          boost_expires_at?: string | null
          boosted_at?: string | null
          boosted_by?: string | null
          can_edit?: boolean | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          expires_at?: string | null
          id?: string
          is_boosted?: boolean | null
          location?: string | null
          max_participants?: number | null
          organizer_id?: string | null
          published_at?: string | null
          registration_deadline?: string | null
          start_date: string
          state?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ad_status?: string | null
          boost_expires_at?: string | null
          boosted_at?: string | null
          boosted_by?: string | null
          can_edit?: boolean | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          expires_at?: string | null
          id?: string
          is_boosted?: boolean | null
          location?: string | null
          max_participants?: number | null
          organizer_id?: string | null
          published_at?: string | null
          registration_deadline?: string | null
          start_date?: string
          state?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_boosted_by_fkey"
            columns: ["boosted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_boosted_by_fkey"
            columns: ["boosted_by"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      favorites: {
        Row: {
          animal_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          animal_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          animal_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "search_animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      impressions: {
        Row: {
          carousel_name: string | null
          carousel_position: number | null
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          page_url: string | null
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
          viewport_position: Json | null
        }
        Insert: {
          carousel_name?: string | null
          carousel_position?: number | null
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          page_url?: string | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
          viewport_position?: Json | null
        }
        Update: {
          carousel_name?: string | null
          carousel_position?: number | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
          viewport_position?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "impressions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impressions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string | null
          type: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string | null
          type?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      page_visits: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          page_key: string
          page_path: string
          page_title: string | null
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          page_key: string
          page_path: string
          page_title?: string | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          page_key?: string
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_visits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_visits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string | null
          available_boosts: number | null
          avatar_url: string | null
          boosts_reset_at: string | null
          cpf: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          is_annual_plan: boolean | null
          is_suspended: boolean | null
          last_boost_grant_at: string | null
          name: string
          phone: string | null
          plan: string | null
          plan_boost_credits: number
          plan_expires_at: string | null
          plan_purchased_at: string | null
          property_id: string | null
          property_name: string | null
          property_type: string | null
          public_code: string | null
          purchased_boost_credits: number
          role: string | null
          updated_at: string | null
        }
        Insert: {
          account_type?: string | null
          available_boosts?: number | null
          avatar_url?: string | null
          boosts_reset_at?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          is_annual_plan?: boolean | null
          is_suspended?: boolean | null
          last_boost_grant_at?: string | null
          name: string
          phone?: string | null
          plan?: string | null
          plan_boost_credits?: number
          plan_expires_at?: string | null
          plan_purchased_at?: string | null
          property_id?: string | null
          property_name?: string | null
          property_type?: string | null
          public_code?: string | null
          purchased_boost_credits?: number
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string | null
          available_boosts?: number | null
          avatar_url?: string | null
          boosts_reset_at?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          is_annual_plan?: boolean | null
          is_suspended?: boolean | null
          last_boost_grant_at?: string | null
          name?: string
          phone?: string | null
          plan?: string | null
          plan_boost_credits?: number
          plan_expires_at?: string | null
          plan_purchased_at?: string | null
          property_id?: string | null
          property_name?: string | null
          property_type?: string | null
          public_code?: string | null
          purchased_boost_credits?: number
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limit_tracker: {
        Row: {
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          id: string
          operation_type: string
          updated_at: string | null
          user_identifier: string
          window_start: string | null
        }
        Insert: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          operation_type: string
          updated_at?: string | null
          user_identifier: string
          window_start?: string | null
        }
        Update: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          operation_type?: string
          updated_at?: string | null
          user_identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_action: string | null
          admin_id: string | null
          admin_notes: string | null
          animal_id: string | null
          category: string | null
          content_id: string | null
          content_type: string
          conversation_id: string | null
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          message_id: string | null
          priority: string | null
          reason: string
          report_location: string | null
          reported_user_id: string | null
          reported_user_name: string | null
          reporter_email: string | null
          reporter_id: string | null
          reporter_name: string | null
          reviewed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_action?: string | null
          admin_id?: string | null
          admin_notes?: string | null
          animal_id?: string | null
          category?: string | null
          content_id?: string | null
          content_type: string
          conversation_id?: string | null
          created_at?: string
          description: string
          evidence_urls?: string[] | null
          id?: string
          message_id?: string | null
          priority?: string | null
          reason: string
          report_location?: string | null
          reported_user_id?: string | null
          reported_user_name?: string | null
          reporter_email?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_action?: string | null
          admin_id?: string | null
          admin_notes?: string | null
          animal_id?: string | null
          category?: string | null
          content_id?: string | null
          content_type?: string
          conversation_id?: string | null
          created_at?: string
          description?: string
          evidence_urls?: string[] | null
          id?: string
          message_id?: string | null
          priority?: string | null
          reason?: string
          report_location?: string | null
          reported_user_id?: string | null
          reported_user_name?: string | null
          reporter_email?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "search_animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      suspensions: {
        Row: {
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          reason: string
          suspended_at: string | null
          suspended_by: string | null
          suspended_until: string | null
          user_id: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          reason: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_until?: string | null
          user_id?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_until?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suspensions_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspensions_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "suspensions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspensions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          id: number
          operation: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: number
          operation: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: number
          operation?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          boost_quantity: number | null
          created_at: string | null
          currency: string | null
          id: string
          is_annual: boolean | null
          metadata: Json | null
          plan_type: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          boost_quantity?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_annual?: boolean | null
          metadata?: Json | null
          plan_type?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          boost_quantity?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_annual?: boolean | null
          metadata?: Json | null
          plan_type?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      admin_audit_logs_with_admin: {
        Row: {
          action: string | null
          admin_email: string | null
          admin_id: string | null
          admin_name: string | null
          created_at: string | null
          details: Json | null
          id: string | null
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      animals_ranking: {
        Row: {
          birth_date: string | null
          breed: string | null
          clicks: number | null
          current_city: string | null
          current_state: string | null
          gender: string | null
          haras_name: string | null
          id: string | null
          images: Json | null
          is_boosted: boolean | null
          name: string | null
          published_at: string | null
          ranking_score: number | null
          views: number | null
        }
        Relationships: []
      }
      animals_with_stats: {
        Row: {
          ad_status: string | null
          allow_messages: boolean | null
          auto_renew: boolean | null
          birth_date: string | null
          boost_expires_at: string | null
          boosted_at: string | null
          boosted_by: string | null
          breed: string | null
          can_edit: boolean | null
          chip: string | null
          clicks: number | null
          coat: string | null
          created_at: string | null
          ctr: number | null
          current_city: string | null
          current_state: string | null
          expires_at: string | null
          father_name: string | null
          featured: boolean | null
          gender: string | null
          haras_id: string | null
          haras_name: string | null
          height: number | null
          id: string | null
          images: Json | null
          impressions: number | null
          is_boosted: boolean | null
          mother_name: string | null
          name: string | null
          owner_id: string | null
          owner_name: string | null
          owner_public_code: string | null
          property_name: string | null
          published_at: string | null
          registration_number: string | null
          titles: string[] | null
          updated_at: string | null
          weight: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_boosted_by_fkey"
            columns: ["boosted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_boosted_by_fkey"
            columns: ["boosted_by"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "animals_haras_id_fkey"
            columns: ["haras_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_haras_id_fkey"
            columns: ["haras_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "animals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      articles_with_stats: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string | null
          clicks: number | null
          content: string | null
          cover_image_url: string | null
          created_at: string | null
          ctr: number | null
          excerpt: string | null
          id: string | null
          impressions: number | null
          is_published: boolean | null
          published_at: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      events_with_stats: {
        Row: {
          ad_status: string | null
          boost_expires_at: string | null
          boosted_at: string | null
          boosted_by: string | null
          can_edit: boolean | null
          city: string | null
          clicks: number | null
          cover_image_url: string | null
          created_at: string | null
          ctr: number | null
          description: string | null
          end_date: string | null
          event_type: string | null
          expires_at: string | null
          id: string | null
          impressions: number | null
          is_boosted: boolean | null
          location: string | null
          max_participants: number | null
          organizer_id: string | null
          organizer_name: string | null
          property_name: string | null
          published_at: string | null
          registration_deadline: string | null
          start_date: string | null
          state: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_boosted_by_fkey"
            columns: ["boosted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_boosted_by_fkey"
            columns: ["boosted_by"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      search_animals: {
        Row: {
          birth_date: string | null
          breed: string | null
          click_count: number | null
          click_rate: number | null
          coat: string | null
          current_city: string | null
          current_state: string | null
          gender: string | null
          id: string | null
          images: Json | null
          impression_count: number | null
          is_boosted: boolean | null
          name: string | null
          owner_name: string | null
          property_name: string | null
          published_at: string | null
        }
        Relationships: []
      }
      user_dashboard_stats: {
        Row: {
          active_animals: number | null
          available_boosts: number | null
          boosted_animals: number | null
          name: string | null
          overall_ctr: number | null
          plan: string | null
          property_name: string | null
          total_animals: number | null
          total_clicks: number | null
          total_impressions: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_expiration_date: {
        Args: { publish_date: string }
        Returns: string
      }
      check_rate_limit: {
        Args: {
          identifier: string
          max_attempts: number
          operation: string
          window_minutes: number
        }
        Returns: Json
      }
      cleanup_rate_limit_tracker: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      expire_ads: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      expire_boosts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_public_code: {
        Args: { account_type_param: string; user_id_param: string }
        Returns: string
      }
      get_pending_reports_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_reports_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      grant_monthly_boosts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_in_grace_period: {
        Args: { expire_date: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action: string
          p_details?: Json
          p_new_data?: Json
          p_old_data?: Json
          p_resource_id: string
          p_resource_type: string
        }
        Returns: string
      }
      process_animal_expirations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      renew_animal_individually: {
        Args: { animal_id_param: string; user_id_param: string }
        Returns: boolean
      }
      search_animals: {
        Args: {
          breed_filter?: string
          city_filter?: string
          gender_filter?: string
          limit_count?: number
          offset_count?: number
          order_by?: string
          property_type_filter?: string
          search_term?: string
          state_filter?: string
        }
        Returns: {
          birth_date: string
          breed: string
          coat: string
          current_city: string
          current_state: string
          gender: string
          id: string
          images: Json
          is_boosted: boolean
          name: string
          owner_name: string
          property_name: string
        }[]
      }
      zero_plan_boosts_on_free: {
        Args: { user_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
