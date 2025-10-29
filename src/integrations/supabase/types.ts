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
      alunos: {
        Row: {
          criado_em: string | null
          foto_url: string | null
          id: string
          matricula: string
          qr_code_token: string
          turma_id: string | null
          usuario_id: string | null
        }
        Insert: {
          criado_em?: string | null
          foto_url?: string | null
          id?: string
          matricula: string
          qr_code_token?: string
          turma_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          criado_em?: string | null
          foto_url?: string | null
          id?: string
          matricula?: string
          qr_code_token?: string
          turma_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      justificativas: {
        Row: {
          aluno_id: string
          aprovado: boolean | null
          aprovado_por: string | null
          criado_em: string | null
          data: string
          id: string
          motivo: string
          tipo: Database["public"]["Enums"]["justification_type"]
        }
        Insert: {
          aluno_id: string
          aprovado?: boolean | null
          aprovado_por?: string | null
          criado_em?: string | null
          data: string
          id?: string
          motivo: string
          tipo: Database["public"]["Enums"]["justification_type"]
        }
        Update: {
          aluno_id?: string
          aprovado?: boolean | null
          aprovado_por?: string | null
          criado_em?: string | null
          data?: string
          id?: string
          motivo?: string
          tipo?: Database["public"]["Enums"]["justification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "justificativas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "justificativas_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          aluno_id: string
          criado_em: string | null
          data: string
          hora: string
          id: string
          metodo: Database["public"]["Enums"]["presence_method"]
          observacao: string | null
          registrado_por: string | null
          status: Database["public"]["Enums"]["presence_status"]
        }
        Insert: {
          aluno_id: string
          criado_em?: string | null
          data?: string
          hora?: string
          id?: string
          metodo: Database["public"]["Enums"]["presence_method"]
          observacao?: string | null
          registrado_por?: string | null
          status?: Database["public"]["Enums"]["presence_status"]
        }
        Update: {
          aluno_id?: string
          criado_em?: string | null
          data?: string
          hora?: string
          id?: string
          metodo?: Database["public"]["Enums"]["presence_method"]
          observacao?: string | null
          registrado_por?: string | null
          status?: Database["public"]["Enums"]["presence_status"]
        }
        Relationships: [
          {
            foreignKeyName: "presencas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          criado_em: string | null
          disciplina: string | null
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          criado_em?: string | null
          disciplina?: string | null
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          criado_em?: string | null
          disciplina?: string | null
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      turmas: {
        Row: {
          ano: string
          criado_em: string | null
          id: string
          nome: string
          professor_id: string | null
        }
        Insert: {
          ano: string
          criado_em?: string | null
          id?: string
          nome: string
          professor_id?: string | null
        }
        Update: {
          ano?: string
          criado_em?: string | null
          id?: string
          nome?: string
          professor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turmas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_diretor: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      justification_type: "saida_antecipada" | "falta"
      presence_method: "qr" | "face" | "manual"
      presence_status: "presente" | "ausente"
      user_type: "diretor" | "professor" | "aluno"
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
      justification_type: ["saida_antecipada", "falta"],
      presence_method: ["qr", "face", "manual"],
      presence_status: ["presente", "ausente"],
      user_type: ["diretor", "professor", "aluno"],
    },
  },
} as const
