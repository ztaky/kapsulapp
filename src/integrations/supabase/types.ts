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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_credits: {
        Row: {
          created_at: string
          credits_used: number
          id: string
          month_year: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          id?: string
          month_year: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          id?: string
          month_year?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_credits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          context: Json | null
          conversation_id: string
          created_at: string
          id: string
          mode: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          context?: Json | null
          conversation_id?: string
          created_at?: string
          id?: string
          mode?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          context?: Json | null
          conversation_id?: string
          created_at?: string
          id?: string
          mode?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_design_preferences: {
        Row: {
          created_at: string
          id: string
          learned_from_edits: Json | null
          organization_id: string
          preferred_colors: string[] | null
          preferred_cta_style: string | null
          preferred_fonts: Json | null
          preferred_layout_style: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          learned_from_edits?: Json | null
          organization_id: string
          preferred_colors?: string[] | null
          preferred_cta_style?: string | null
          preferred_fonts?: Json | null
          preferred_layout_style?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          learned_from_edits?: Json | null
          organization_id?: string
          preferred_colors?: string[] | null
          preferred_cta_style?: string | null
          preferred_fonts?: Json | null
          preferred_layout_style?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_design_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_drafts: {
        Row: {
          created_at: string
          created_by: string | null
          draft_data: Json
          id: string
          organization_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          draft_data?: Json
          id?: string
          organization_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          draft_data?: Json
          id?: string
          organization_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_drafts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          course_id: string
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          notes: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          installment_price_id: string | null
          installments_count: number | null
          installments_enabled: boolean | null
          is_published: boolean
          marketing_content: Json | null
          organization_id: string | null
          payment_link_url: string | null
          price: number
          title: string
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          installment_price_id?: string | null
          installments_count?: number | null
          installments_enabled?: boolean | null
          is_published?: boolean
          marketing_content?: Json | null
          organization_id?: string | null
          payment_link_url?: string | null
          price?: number
          title: string
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          installment_price_id?: string | null
          installments_count?: number | null
          installments_enabled?: boolean | null
          is_published?: boolean
          marketing_content?: Json | null
          organization_id?: string | null
          payment_link_url?: string | null
          price?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          clicked_at: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          organization_id: string | null
          recipient_email: string
          recipient_user_id: string | null
          sent_at: string | null
          sequence_step_id: string | null
          status: Database["public"]["Enums"]["email_send_status"]
          subject: string
          template_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          organization_id?: string | null
          recipient_email: string
          recipient_user_id?: string | null
          sent_at?: string | null
          sequence_step_id?: string | null
          status?: Database["public"]["Enums"]["email_send_status"]
          subject: string
          template_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          organization_id?: string | null
          recipient_email?: string
          recipient_user_id?: string | null
          sent_at?: string | null
          sequence_step_id?: string | null
          status?: Database["public"]["Enums"]["email_send_status"]
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_sequence_step_id_fkey"
            columns: ["sequence_step_id"]
            isOneToOne: false
            referencedRelation: "email_sequence_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_steps: {
        Row: {
          created_at: string
          delay_hours: number
          id: string
          sequence_id: string
          step_order: number
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delay_hours?: number
          id?: string
          sequence_id: string
          step_order?: number
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delay_hours?: number
          id?: string
          sequence_id?: string
          step_order?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          trigger_course_id: string | null
          trigger_event: Database["public"]["Enums"]["sequence_trigger_event"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          trigger_course_id?: string | null
          trigger_event: Database["public"]["Enums"]["sequence_trigger_event"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          trigger_course_id?: string | null
          trigger_event?: Database["public"]["Enums"]["sequence_trigger_event"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequences_trigger_course_id_fkey"
            columns: ["trigger_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          email_type: Database["public"]["Enums"]["email_type"]
          html_content: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          organization_id: string | null
          subject: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          email_type: Database["public"]["Enums"]["email_type"]
          html_content: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          organization_id?: string | null
          subject: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          email_type?: Database["public"]["Enums"]["email_type"]
          html_content?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          organization_id?: string | null
          subject?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_usage: {
        Row: {
          bonus_emails: number
          created_at: string
          emails_sent: number
          id: string
          month_year: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          bonus_emails?: number
          created_at?: string
          emails_sent?: number
          id?: string
          month_year: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          bonus_emails?: number
          created_at?: string
          emails_sent?: number
          id?: string
          month_year?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_entries: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          helpful_count: number | null
          id: string
          is_published: boolean | null
          question: string
          source_ticket_ids: string[] | null
          updated_at: string
          views_count: number | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          question: string
          source_ticket_ids?: string[] | null
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          question?: string
          source_ticket_ids?: string[] | null
          updated_at?: string
          views_count?: number | null
        }
        Relationships: []
      }
      interactive_tools: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          lesson_id: string | null
          name: string
          organization_id: string
          tool_type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          name: string
          organization_id: string
          tool_type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          name?: string
          organization_id?: string
          tool_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactive_tools_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactive_tools_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          clone_source_url: string | null
          content: Json
          conversions_count: number
          course_id: string
          created_at: string
          design_config: Json
          id: string
          name: string
          organization_id: string
          reference_screenshots: string[] | null
          slug: string
          status: Database["public"]["Enums"]["landing_page_status"]
          stripe_product_id: string | null
          target_audience: string | null
          trainer_info: Json | null
          updated_at: string
          views_count: number
        }
        Insert: {
          clone_source_url?: string | null
          content?: Json
          conversions_count?: number
          course_id: string
          created_at?: string
          design_config?: Json
          id?: string
          name: string
          organization_id: string
          reference_screenshots?: string[] | null
          slug: string
          status?: Database["public"]["Enums"]["landing_page_status"]
          stripe_product_id?: string | null
          target_audience?: string | null
          trainer_info?: Json | null
          updated_at?: string
          views_count?: number
        }
        Update: {
          clone_source_url?: string | null
          content?: Json
          conversions_count?: number
          course_id?: string
          created_at?: string
          design_config?: Json
          id?: string
          name?: string
          organization_id?: string
          reference_screenshots?: string[] | null
          slug?: string
          status?: Database["public"]["Enums"]["landing_page_status"]
          stripe_product_id?: string | null
          target_audience?: string | null
          trainer_info?: Json | null
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          organization_id: string
          title: string
          type: Database["public"]["Enums"]["legal_page_type"]
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          organization_id: string
          title: string
          type: Database["public"]["Enums"]["legal_page_type"]
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          organization_id?: string
          title?: string
          type?: Database["public"]["Enums"]["legal_page_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_pages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_text: string | null
          created_at: string
          id: string
          module_id: string
          objective: string | null
          position: number
          resource_url: string | null
          resources: Json | null
          title: string
          tool_config: Json | null
          tool_id: string | null
          type: Database["public"]["Enums"]["lesson_type"]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content_text?: string | null
          created_at?: string
          id?: string
          module_id: string
          objective?: string | null
          position?: number
          resource_url?: string | null
          resources?: Json | null
          title: string
          tool_config?: Json | null
          tool_id?: string | null
          type?: Database["public"]["Enums"]["lesson_type"]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content_text?: string | null
          created_at?: string
          id?: string
          module_id?: string
          objective?: string | null
          position?: number
          resource_url?: string | null
          resources?: Json | null
          title?: string
          tool_config?: Json | null
          tool_id?: string | null
          type?: Database["public"]["Enums"]["lesson_type"]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          objective: string | null
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          objective?: string | null
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          objective?: string | null
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          organization_id: string
          skipped: boolean | null
          step_key: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          organization_id: string
          skipped?: boolean | null
          step_key: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string
          skipped?: boolean | null
          step_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_color: string | null
          contact_email: string | null
          created_at: string
          custom_domain: string | null
          custom_domain_status: string | null
          custom_domain_verified_at: string | null
          description: string | null
          email_limit_per_month: number | null
          facebook_pixel_id: string | null
          gtm_container_id: string | null
          id: string
          is_founder_plan: boolean | null
          logo_url: string | null
          max_coaches: number | null
          max_students: number | null
          name: string
          onboarding_completed: boolean | null
          payment_methods_enabled: string[] | null
          paypal_email: string | null
          paypal_merchant_id: string | null
          slug: string
          specialty: string | null
          stripe_account_id: string | null
          tutor_quota_per_student: number | null
          updated_at: string
          webhook_events: string[] | null
          webhook_url: string | null
        }
        Insert: {
          brand_color?: string | null
          contact_email?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_domain_status?: string | null
          custom_domain_verified_at?: string | null
          description?: string | null
          email_limit_per_month?: number | null
          facebook_pixel_id?: string | null
          gtm_container_id?: string | null
          id?: string
          is_founder_plan?: boolean | null
          logo_url?: string | null
          max_coaches?: number | null
          max_students?: number | null
          name: string
          onboarding_completed?: boolean | null
          payment_methods_enabled?: string[] | null
          paypal_email?: string | null
          paypal_merchant_id?: string | null
          slug: string
          specialty?: string | null
          stripe_account_id?: string | null
          tutor_quota_per_student?: number | null
          updated_at?: string
          webhook_events?: string[] | null
          webhook_url?: string | null
        }
        Update: {
          brand_color?: string | null
          contact_email?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_domain_status?: string | null
          custom_domain_verified_at?: string | null
          description?: string | null
          email_limit_per_month?: number | null
          facebook_pixel_id?: string | null
          gtm_container_id?: string | null
          id?: string
          is_founder_plan?: boolean | null
          logo_url?: string | null
          max_coaches?: number | null
          max_students?: number | null
          name?: string
          onboarding_completed?: boolean | null
          payment_methods_enabled?: string[] | null
          paypal_email?: string | null
          paypal_merchant_id?: string | null
          slug?: string
          specialty?: string | null
          stripe_account_id?: string | null
          tutor_quota_per_student?: number | null
          updated_at?: string
          webhook_events?: string[] | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          ai_credits_limit: number | null
          badge_text: string | null
          created_at: string
          description: string | null
          email_limit: number | null
          features: Json
          id: string
          is_active: boolean
          is_highlighted: boolean
          max_courses: number | null
          max_students: number | null
          name: string
          position: number
          price_monthly: number
          price_yearly: number | null
          slug: string
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          updated_at: string
        }
        Insert: {
          ai_credits_limit?: number | null
          badge_text?: string | null
          created_at?: string
          description?: string | null
          email_limit?: number | null
          features?: Json
          id?: string
          is_active?: boolean
          is_highlighted?: boolean
          max_courses?: number | null
          max_students?: number | null
          name: string
          position?: number
          price_monthly?: number
          price_yearly?: number | null
          slug: string
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string
        }
        Update: {
          ai_credits_limit?: number | null
          badge_text?: string | null
          created_at?: string
          description?: string | null
          email_limit?: number | null
          features?: Json
          id?: string
          is_active?: boolean
          is_highlighted?: boolean
          max_courses?: number | null
          max_students?: number | null
          name?: string
          position?: number
          price_monthly?: number
          price_yearly?: number | null
          slug?: string
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          course_id: string
          id: string
          purchased_at: string
          status: string
          stripe_payment_id: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          course_id: string
          id?: string
          purchased_at?: string
          status?: string
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          course_id?: string
          id?: string
          purchased_at?: string
          status?: string
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_visible: boolean
          position: number
          release_date: string | null
          status: string
          title: string
          updated_at: string
          votes_count: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean
          position?: number
          release_date?: string | null
          status?: string
          title: string
          updated_at?: string
          votes_count?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean
          position?: number
          release_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          votes_count?: number
        }
        Relationships: []
      }
      sales_leads: {
        Row: {
          conversation: Json
          converted: boolean | null
          created_at: string | null
          email: string | null
          first_question: string | null
          id: string
          session_id: string
          source_page: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          conversation?: Json
          converted?: boolean | null
          created_at?: string | null
          email?: string | null
          first_question?: string | null
          id?: string
          session_id: string
          source_page?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          conversation?: Json
          converted?: boolean | null
          created_at?: string | null
          email?: string | null
          first_question?: string | null
          id?: string
          session_id?: string
          source_page?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sequence_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string | null
          created_at: string
          current_step: number | null
          enrolled_at: string
          id: string
          is_active: boolean | null
          next_email_at: string | null
          sequence_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          current_step?: number | null
          enrolled_at?: string
          id?: string
          is_active?: boolean | null
          next_email_at?: string | null
          sequence_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          current_step?: number | null
          enrolled_at?: string
          id?: string
          is_active?: boolean | null
          next_email_at?: string | null
          sequence_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequence_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_from_admin: boolean
          sender_id: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_from_admin?: boolean
          sender_id: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_from_admin?: boolean
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          ai_conversation: Json | null
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string
          id: string
          organization_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_conversation?: Json | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description: string
          id?: string
          organization_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_conversation?: Json | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          organization_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_usage: {
        Row: {
          created_at: string
          id: string
          message_count: number
          month_year: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_count?: number
          month_year: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_count?: number
          month_year?: string
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      purchases_safe: {
        Row: {
          amount: number | null
          course_id: string | null
          id: string | null
          purchased_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          course_id?: string | null
          id?: string | null
          purchased_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          course_id?: string | null
          id?: string | null
          purchased_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_bonus_credits: {
        Args: {
          _credits_amount: number
          _month_year: string
          _organization_id: string
        }
        Returns: {
          new_bonus: number
          success: boolean
          total_bonus: number
        }[]
      }
      add_bonus_emails: {
        Args: {
          _emails_amount: number
          _month_year: string
          _organization_id: string
        }
        Returns: {
          new_bonus: number
          success: boolean
          total_bonus: number
        }[]
      }
      check_coach_limit: {
        Args: { _organization_id: string }
        Returns: {
          can_add: boolean
          current_count: number
          max_allowed: number
        }[]
      }
      check_student_limit: {
        Args: { _organization_id: string }
        Returns: {
          can_add: boolean
          current_count: number
          max_allowed: number
        }[]
      }
      create_notification: {
        Args: {
          _link?: string
          _message: string
          _metadata?: Json
          _title: string
          _type?: string
          _user_id: string
        }
        Returns: string
      }
      get_ai_credits_usage: {
        Args: { _month_year: string; _organization_id: string }
        Returns: {
          bonus_credits: number
          credits_limit: number
          credits_used: number
        }[]
      }
      get_email_usage: {
        Args: { _month_year: string; _organization_id: string }
        Returns: {
          bonus_emails: number
          emails_limit: number
          emails_sent: number
        }[]
      }
      get_public_organization: {
        Args: { org_slug: string }
        Returns: {
          brand_color: string
          description: string
          id: string
          logo_url: string
          name: string
          slug: string
          specialty: string
        }[]
      }
      get_public_organization_by_id: {
        Args: { org_id: string }
        Returns: {
          brand_color: string
          description: string
          id: string
          logo_url: string
          name: string
          slug: string
          specialty: string
        }[]
      }
      get_tutor_usage: {
        Args: {
          _month_year: string
          _organization_id: string
          _user_id: string
        }
        Returns: number
      }
      get_user_org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      has_course_access: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      has_org_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["org_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ai_credits: {
        Args: {
          _amount?: number
          _month_year: string
          _organization_id: string
        }
        Returns: {
          credits_limit: number
          new_count: number
          success: boolean
        }[]
      }
      increment_email_usage: {
        Args: {
          _amount?: number
          _month_year: string
          _organization_id: string
        }
        Returns: {
          emails_limit: number
          new_count: number
          success: boolean
        }[]
      }
      increment_faq_helpful: { Args: { faq_id: string }; Returns: undefined }
      increment_faq_views: { Args: { faq_id: string }; Returns: undefined }
      increment_landing_page_views: {
        Args: { page_slug: string }
        Returns: undefined
      }
      increment_tutor_usage: {
        Args: {
          _month_year: string
          _organization_id: string
          _user_id: string
        }
        Returns: number
      }
      log_activity: {
        Args: {
          _action: string
          _entity_id?: string
          _entity_type?: string
          _metadata?: Json
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "super_admin" | "user"
      email_send_status: "pending" | "sent" | "failed" | "opened" | "clicked"
      email_type:
        | "welcome_purchase"
        | "invoice"
        | "course_reminder"
        | "new_content"
        | "onboarding_day_1"
        | "onboarding_day_3"
        | "onboarding_day_7"
        | "coach_welcome"
        | "founder_welcome"
        | "support_ticket_created"
        | "support_ticket_reply"
        | "support_ticket_status"
        | "platform_update"
        | "custom"
      landing_page_status: "draft" | "published"
      legal_page_type:
        | "mentions_legales"
        | "politique_confidentialite"
        | "cgv"
        | "cookies"
      lesson_type: "video" | "interactive_tool"
      org_role: "coach" | "student"
      sequence_trigger_event:
        | "purchase_completed"
        | "student_signup"
        | "course_completed"
        | "manual"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status:
        | "open"
        | "in_progress"
        | "waiting_response"
        | "resolved"
        | "closed"
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
    Enums: {
      app_role: ["super_admin", "user"],
      email_send_status: ["pending", "sent", "failed", "opened", "clicked"],
      email_type: [
        "welcome_purchase",
        "invoice",
        "course_reminder",
        "new_content",
        "onboarding_day_1",
        "onboarding_day_3",
        "onboarding_day_7",
        "coach_welcome",
        "founder_welcome",
        "support_ticket_created",
        "support_ticket_reply",
        "support_ticket_status",
        "platform_update",
        "custom",
      ],
      landing_page_status: ["draft", "published"],
      legal_page_type: [
        "mentions_legales",
        "politique_confidentialite",
        "cgv",
        "cookies",
      ],
      lesson_type: ["video", "interactive_tool"],
      org_role: ["coach", "student"],
      sequence_trigger_event: [
        "purchase_completed",
        "student_signup",
        "course_completed",
        "manual",
      ],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: [
        "open",
        "in_progress",
        "waiting_response",
        "resolved",
        "closed",
      ],
    },
  },
} as const
