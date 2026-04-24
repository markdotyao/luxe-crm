// Regenerate with `npm run gen:types` (requires a running local Supabase).
// This file mirrors the output of `supabase gen types typescript --local`.
// Tracked in git so the typecheck works without needing Docker.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      brands: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          brand_id: string | null;
          store_id: string | null;
          first_name: string | null;
          last_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          brand_id?: string | null;
          store_id?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          brand_id?: string | null;
          store_id?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          dob: string | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          phone: string | null;
          email: string | null;
          city: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          dob?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          phone?: string | null;
          email?: string | null;
          city?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          dob?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          phone?: string | null;
          email?: string | null;
          city?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      contact_brands: {
        Row: {
          contact_id: string;
          brand_id: string;
          store_id: string | null;
          created_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          contact_id: string;
          brand_id: string;
          store_id?: string | null;
          created_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          contact_id?: string;
          brand_id?: string;
          store_id?: string | null;
          created_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_brands_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_brands_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_brands_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_brands_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      find_contact_by_phone_or_email: {
        Args: {
          p_phone: string | null;
          p_email: string | null;
        };
        Returns: {
          contact_id: string;
          matched_on: string | null;
          existing_brand_ids: string[];
        }[];
      };
      create_or_link_contact: {
        Args: {
          p_first_name: string;
          p_last_name: string;
          p_phone: string | null;
          p_email: string | null;
          p_dob: string | null;
          p_gender: Database["public"]["Enums"]["gender"] | null;
          p_city: string | null;
          p_brand_id: string;
          p_store_id: string | null;
          p_notes: string | null;
        };
        Returns: {
          contact_id: string;
          was_created: boolean;
          was_linked: boolean;
        }[];
      };
      normalize_email: {
        Args: { e: string };
        Returns: string;
      };
      admin_list_users: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          email: string;
          role: Database["public"]["Enums"]["user_role"];
          brand_id: string | null;
          store_id: string | null;
          first_name: string | null;
          last_name: string | null;
          created_at: string;
        }[];
      };
      admin_assign_profile: {
        Args: {
          p_user_id: string;
          p_role: Database["public"]["Enums"]["user_role"];
          p_brand_id: string | null;
          p_store_id: string | null;
          p_first_name: string | null;
          p_last_name: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: "admin" | "brand_manager" | "sales_staff";
      gender: "male" | "female" | "other" | "prefer_not_to_say";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Update"];

export type Enums<
  EnumName extends keyof PublicSchema["Enums"],
> = PublicSchema["Enums"][EnumName];
