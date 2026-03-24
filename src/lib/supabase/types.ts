export type SitePlan = 'free' | 'pro' | 'enterprise';
export type SiteRole = 'owner' | 'admin' | 'viewer';
export type EventType = 'pageview' | 'custom_event';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sites: {
        Row: {
          id: string;
          domain: string;
          created_by: string;
          plan: SitePlan;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          domain: string;
          created_by: string;
          plan?: SitePlan;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          domain?: string;
          created_by?: string;
          plan?: SitePlan;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sites_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      site_members: {
        Row: {
          user_id: string;
          site_id: string;
          role: SiteRole;
          created_at: string;
        };
        Insert: {
          user_id: string;
          site_id: string;
          role?: SiteRole;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          site_id?: string;
          role?: SiteRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'site_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'site_members_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
        ];
      };
      sessions: {
        Row: {
          id: string;
          site_id: string;
          visitor_id: string;
          referrer: string | null;
          is_bounce: boolean;
          page_count: number;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          site_id: string;
          visitor_id: string;
          referrer?: string | null;
          is_bounce?: boolean;
          page_count?: number;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          site_id?: string;
          visitor_id?: string;
          referrer?: string | null;
          is_bounce?: boolean;
          page_count?: number;
          started_at?: string;
          ended_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          site_id: string;
          session_id: string | null;
          type: EventType;
          path: string;
          referrer: string | null;
          duration_ms: number | null;
          timestamp: string;
          properties: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          site_id: string;
          session_id?: string | null;
          type?: EventType;
          path: string;
          referrer?: string | null;
          duration_ms?: number | null;
          timestamp?: string;
          properties?: Record<string, unknown>;
        };
        Update: {
          id?: string;
          site_id?: string;
          session_id?: string | null;
          type?: EventType;
          path?: string;
          referrer?: string | null;
          duration_ms?: number | null;
          timestamp?: string;
          properties?: Record<string, unknown>;
        };
        Relationships: [
          {
            foreignKeyName: 'events_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'events_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      daily_stats: {
        Row: {
          site_id: string;
          date: string;
          total_views: number;
          unique_visitors: number;
          unique_pages: number;
          total_sessions: number;
          avg_duration_ms: number | null;
          bounce_rate: number | null;
          top_page: string | null;
          top_referrer: string | null;
        };
        Insert: {
          site_id: string;
          date: string;
          total_views?: number;
          unique_visitors?: number;
          unique_pages?: number;
          total_sessions?: number;
          avg_duration_ms?: number | null;
          bounce_rate?: number | null;
          top_page?: string | null;
          top_referrer?: string | null;
        };
        Update: {
          site_id?: string;
          date?: string;
          total_views?: number;
          unique_visitors?: number;
          unique_pages?: number;
          total_sessions?: number;
          avg_duration_ms?: number | null;
          bounce_rate?: number | null;
          top_page?: string | null;
          top_referrer?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'daily_stats_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Enums: {
      site_plan: SitePlan;
      site_role: SiteRole;
      event_type: EventType;
    };
    Functions: {
      get_top_pages: {
        Args: { p_site_id: string; p_days: number; p_limit: number };
        Returns: { path: string; views: number; avg_duration: number }[];
      };
      get_top_referrers: {
        Args: { p_site_id: string; p_days: number; p_limit: number };
        Returns: { referrer: string; views: number }[];
      };
      get_browser_breakdown: {
        Args: { p_site_id: string; p_days: number };
        Returns: { browser: string; views: number }[];
      };
      get_country_breakdown: {
        Args: { p_site_id: string; p_days: number };
        Returns: { country: string; views: number }[];
      };
      get_os_breakdown: {
        Args: { p_site_id: string; p_days: number };
        Returns: { os: string; views: number }[];
      };
      get_bounce_rate: {
        Args: { p_site_id: string; p_days: number };
        Returns: { bounced: number; total: number; bounce_rate: number }[];
      };
      get_hourly_breakdown: {
        Args: { p_site_id: string };
        Returns: { hour: string; views: number }[];
      };
      compute_all_daily_stats: {
        Args: { p_date: string };
        Returns: undefined;
      };
    };
  };
}

// Row types
export type User = Database['public']['Tables']['users']['Row'];
export type Site = Database['public']['Tables']['sites']['Row'];
export type SiteMember = Database['public']['Tables']['site_members']['Row'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type DailyStat = Database['public']['Tables']['daily_stats']['Row'];

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type SiteInsert = Database['public']['Tables']['sites']['Insert'];
export type SiteMemberInsert = Database['public']['Tables']['site_members']['Insert'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];

// Update types
export type SiteUpdate = Database['public']['Tables']['sites']['Update'];
