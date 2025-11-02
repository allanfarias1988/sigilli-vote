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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details_json: Json | null
          entity_id: string
          entity_type: string
          id: string
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details_json?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details_json?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ballots: {
        Row: {
          commission_id: string
          created_at: string
          id: string
          role_id: string
          signature_hash: string
          voter_id: string | null
        }
        Insert: {
          commission_id: string
          created_at?: string
          id?: string
          role_id: string
          signature_hash: string
          voter_id?: string | null
        }
        Update: {
          commission_id?: string
          created_at?: string
          id?: string
          role_id?: string
          signature_hash?: string
          voter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ballots_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballots_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "commission_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_roles: {
        Row: {
          ativo: boolean | null
          commission_id: string
          created_at: string
          id: string
          max_selecoes: number | null
          nome_cargo: string
          ordem: number
        }
        Insert: {
          ativo?: boolean | null
          commission_id: string
          created_at?: string
          id?: string
          max_selecoes?: number | null
          nome_cargo: string
          ordem: number
        }
        Update: {
          ativo?: boolean | null
          commission_id?: string
          created_at?: string
          id?: string
          max_selecoes?: number | null
          nome_cargo?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_roles_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          ano: number
          anonimato_modo: Database["public"]["Enums"]["anonimato_modo"] | null
          created_at: string
          created_by: string | null
          descricao: string | null
          finalization_key: string | null
          finalized_at: string | null
          id: string
          link_code: string
          nome: string
          status: Database["public"]["Enums"]["commission_status"] | null
          survey_id: string | null
          tenant_id: string
        }
        Insert: {
          ano: number
          anonimato_modo?: Database["public"]["Enums"]["anonimato_modo"] | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          finalization_key?: string | null
          finalized_at?: string | null
          id?: string
          link_code: string
          nome: string
          status?: Database["public"]["Enums"]["commission_status"] | null
          survey_id?: string | null
          tenant_id: string
        }
        Update: {
          ano?: number
          anonimato_modo?: Database["public"]["Enums"]["anonimato_modo"] | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          finalization_key?: string | null
          finalized_at?: string | null
          id?: string
          link_code?: string
          nome?: string
          status?: Database["public"]["Enums"]["commission_status"] | null
          survey_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          ano_batismo: number | null
          apelido: string | null
          apto: boolean | null
          cargos_atuais: string[] | null
          created_at: string
          data_nasc: string | null
          email: string | null
          endereco: string | null
          estado_civil: string | null
          id: string
          imagem_url: string | null
          interesses: string[] | null
          nome_completo: string
          telefone: string | null
          tempo_no_cargo: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ano_batismo?: number | null
          apelido?: string | null
          apto?: boolean | null
          cargos_atuais?: string[] | null
          created_at?: string
          data_nasc?: string | null
          email?: string | null
          endereco?: string | null
          estado_civil?: string | null
          id?: string
          imagem_url?: string | null
          interesses?: string[] | null
          nome_completo: string
          telefone?: string | null
          tempo_no_cargo?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ano_batismo?: number | null
          apelido?: string | null
          apto?: boolean | null
          cargos_atuais?: string[] | null
          created_at?: string
          data_nasc?: string | null
          email?: string | null
          endereco?: string | null
          estado_civil?: string | null
          id?: string
          imagem_url?: string | null
          interesses?: string[] | null
          nome_completo?: string
          telefone?: string | null
          tempo_no_cargo?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome: string
          telefone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      short_links: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          target: string
          target_id: string
          tenant_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          target: string
          target_id: string
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          target?: string
          target_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "short_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_items: {
        Row: {
          cargo_nome: string
          created_at: string
          id: string
          max_sugestoes: number | null
          ordem: number
          survey_id: string
        }
        Insert: {
          cargo_nome: string
          created_at?: string
          id?: string
          max_sugestoes?: number | null
          ordem: number
          survey_id: string
        }
        Update: {
          cargo_nome?: string
          created_at?: string
          id?: string
          max_sugestoes?: number | null
          ordem?: number
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_items_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_votes: {
        Row: {
          cargo_nome: string
          created_at: string
          id: string
          member_id: string
          survey_id: string
          vote_count: number | null
        }
        Insert: {
          cargo_nome: string
          created_at?: string
          id?: string
          member_id: string
          survey_id: string
          vote_count?: number | null
        }
        Update: {
          cargo_nome?: string
          created_at?: string
          id?: string
          member_id?: string
          survey_id?: string
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_votes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_votes_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          ano: number
          created_at: string
          descricao: string | null
          id: string
          link_code: string
          status: Database["public"]["Enums"]["survey_status"] | null
          tenant_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          descricao?: string | null
          id?: string
          link_code: string
          status?: Database["public"]["Enums"]["survey_status"] | null
          tenant_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          descricao?: string | null
          id?: string
          link_code?: string
          status?: Database["public"]["Enums"]["survey_status"] | null
          tenant_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          ano_corrente: number | null
          created_at: string
          id: string
          logo_url: string | null
          nome: string
          slug: string
          timezone: string | null
        }
        Insert: {
          ano_corrente?: number | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nome: string
          slug: string
          timezone?: string | null
        }
        Update: {
          ano_corrente?: number | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nome?: string
          slug?: string
          timezone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          ballot_id: string
          created_at: string
          id: string
          member_id: string
        }
        Insert: {
          ballot_id: string
          created_at?: string
          id?: string
          member_id: string
        }
        Update: {
          ballot_id?: string
          created_at?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_ballot_id_fkey"
            columns: ["ballot_id"]
            isOneToOne: false
            referencedRelation: "ballots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tenant: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      anonimato_modo: "anonimo" | "obrigatorio" | "opcional"
      app_role: "tenant_admin" | "commission_admin" | "voter" | "viewer"
      commission_status: "draft" | "aberta" | "finalizada"
      survey_status: "aberta" | "fechada"
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
      anonimato_modo: ["anonimo", "obrigatorio", "opcional"],
      app_role: ["tenant_admin", "commission_admin", "voter", "viewer"],
      commission_status: ["draft", "aberta", "finalizada"],
      survey_status: ["aberta", "fechada"],
    },
  },
} as const
