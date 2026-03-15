export type PropertyStage = 'preventa' | 'construccion' | 'entrega_inmediata';
export type PropertyType = 'departamento' | 'penthouse' | 'terreno' | 'macrolote' | 'casa';
export type PropertyBadge = 'preventa' | 'nuevo' | 'entrega_inmediata';
export type LeadSource = 'whatsapp' | 'form' | 'phone' | 'schedule' | 'csv_import';
export type LeadStatus = 'nuevo' | 'contactado' | 'en_seguimiento' | 'visita_agendada' | 'negociacion' | 'cerrado' | 'perdido';
export type UserRole = 'admin' | 'asesor' | 'developer';

export interface Database {
  public: {
    Tables: {
      developers: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          website: string | null;
          phone: string | null;
          email: string | null;
          description_es: string | null;
          description_en: string | null;
          city: string | null;
          state: string;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['developers']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['developers']['Insert']>;
      };
      properties: {
        Row: {
          id: string;
          slug: string;
          name: string;
          developer_id: string | null;
          city: string;
          zone: string;
          state: string;
          address: string | null;
          lat: number | null;
          lng: number | null;
          price_mxn: number;
          currency: string;
          bedrooms: number;
          bathrooms: number;
          area_m2: number;
          property_type: PropertyType;
          stage: PropertyStage;
          badge: PropertyBadge | null;
          usage: string[];
          featured: boolean;
          published: boolean;
          roi_projected: number;
          roi_rental_monthly: number;
          roi_appreciation: number;
          financing_down_payment_min: number;
          financing_months: number[];
          financing_interest_rate: number;
          description_es: string | null;
          description_en: string | null;
          images: string[];
          virtual_tour_url: string | null;
          video_url: string | null;
          amenities: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['properties']['Row'], 'id' | 'created_at' | 'updated_at' | 'fts'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['properties']['Insert']>;
      };
      leads: {
        Row: {
          id: string;
          property_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          message: string | null;
          source: LeadSource;
          status: LeadStatus;
          assigned_to: string | null;
          locale: string;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['leads']['Insert']>;
      };
      lead_notes: {
        Row: {
          id: string;
          lead_id: string;
          author_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['lead_notes']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['lead_notes']['Insert']>;
      };
      property_views: {
        Row: {
          id: string;
          property_id: string;
          event_type: string;
          locale: string;
          user_agent: string | null;
          referrer: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['property_views']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['property_views']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          phone: string | null;
          developer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
    };
    Views: {
      properties_with_developer: {
        Row: Database['public']['Tables']['properties']['Row'] & {
          developer_name: string | null;
          developer_logo: string | null;
          developer_verified: boolean | null;
        };
      };
      lead_stats: {
        Row: {
          property_id: string;
          total_leads: number;
          new_leads: number;
          closed_leads: number;
          first_lead_at: string | null;
          last_lead_at: string | null;
        };
      };
    };
  };
}
