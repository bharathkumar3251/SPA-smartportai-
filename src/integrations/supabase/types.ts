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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_verifications: {
        Row: {
          checks: Json
          confidence: number
          created_at: string
          id: string
          issues: Json
          model: string | null
          recommendations: Json
          risk_score: number
          scope: string
          submission_id: string
          verdict: Database["public"]["Enums"]["ai_verdict"]
        }
        Insert: {
          checks?: Json
          confidence?: number
          created_at?: string
          id?: string
          issues?: Json
          model?: string | null
          recommendations?: Json
          risk_score?: number
          scope?: string
          submission_id: string
          verdict?: Database["public"]["Enums"]["ai_verdict"]
        }
        Update: {
          checks?: Json
          confidence?: number
          created_at?: string
          id?: string
          issues?: Json
          model?: string | null
          recommendations?: Json
          risk_score?: number
          scope?: string
          submission_id?: string
          verdict?: Database["public"]["Enums"]["ai_verdict"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_verifications_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "shipment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      berths: {
        Row: {
          code: string
          created_at: string
          id: string
          length_m: number
          max_draft_m: number
          status: string
          terminal_name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          length_m?: number
          max_draft_m?: number
          status?: string
          terminal_name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          length_m?: number
          max_draft_m?: number
          status?: string
          terminal_name?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_email: string | null
          actor_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          success: boolean
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          success?: boolean
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          success?: boolean
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      containers: {
        Row: {
          container_no: string
          crane_id: string | null
          created_at: string
          delivered_at: string | null
          destination: string | null
          driver_name: string | null
          hazardous: boolean
          id: string
          iso_type: string | null
          pickup_at: string | null
          stage: Database["public"]["Enums"]["container_stage"]
          storage_slot: string | null
          submission_id: string
          truck_plate: string | null
          unloading_team: string | null
          updated_at: string
          weight_kg: number | null
          yard_slot: string | null
        }
        Insert: {
          container_no: string
          crane_id?: string | null
          created_at?: string
          delivered_at?: string | null
          destination?: string | null
          driver_name?: string | null
          hazardous?: boolean
          id?: string
          iso_type?: string | null
          pickup_at?: string | null
          stage?: Database["public"]["Enums"]["container_stage"]
          storage_slot?: string | null
          submission_id: string
          truck_plate?: string | null
          unloading_team?: string | null
          updated_at?: string
          weight_kg?: number | null
          yard_slot?: string | null
        }
        Update: {
          container_no?: string
          crane_id?: string | null
          created_at?: string
          delivered_at?: string | null
          destination?: string | null
          driver_name?: string | null
          hazardous?: boolean
          id?: string
          iso_type?: string | null
          pickup_at?: string | null
          stage?: Database["public"]["Enums"]["container_stage"]
          storage_slot?: string | null
          submission_id?: string
          truck_plate?: string | null
          unloading_team?: string | null
          updated_at?: string
          weight_kg?: number | null
          yard_slot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "containers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "shipment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          created_at: string
          device_label: string | null
          failure_reason: string | null
          id: string
          ip_address: string | null
          location: string | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_label?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_label?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          archived_at: string | null
          body: string | null
          category: string
          created_at: string
          id: string
          link: string | null
          metadata: Json
          priority: Database["public"]["Enums"]["notification_priority"]
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          last_seen_at: string | null
          organization: string | null
          requested_role: Database["public"]["Enums"]["app_role"] | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          last_seen_at?: string | null
          organization?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"] | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_seen_at?: string | null
          organization?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"] | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: []
      }
      shipment_submissions: {
        Row: {
          ai_confidence: number | null
          ai_risk_score: number | null
          ai_verdict: Database["public"]["Enums"]["ai_verdict"] | null
          arrival_window_end: string | null
          arrival_window_start: string | null
          authority_notes: string | null
          berth_code: string | null
          cargo_type: string | null
          container_count: number
          created_at: string
          created_by: string
          customs_notes: string | null
          dangerous_goods: boolean
          eta: string | null
          etd: string | null
          id: string
          imo_number: string | null
          inspection_notes: string | null
          origin_port: string | null
          reference: string
          shipping_company: string
          stage: Database["public"]["Enums"]["submission_stage"]
          updated_at: string
          vessel_name: string
          voyage_number: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_risk_score?: number | null
          ai_verdict?: Database["public"]["Enums"]["ai_verdict"] | null
          arrival_window_end?: string | null
          arrival_window_start?: string | null
          authority_notes?: string | null
          berth_code?: string | null
          cargo_type?: string | null
          container_count?: number
          created_at?: string
          created_by: string
          customs_notes?: string | null
          dangerous_goods?: boolean
          eta?: string | null
          etd?: string | null
          id?: string
          imo_number?: string | null
          inspection_notes?: string | null
          origin_port?: string | null
          reference: string
          shipping_company: string
          stage?: Database["public"]["Enums"]["submission_stage"]
          updated_at?: string
          vessel_name: string
          voyage_number?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_risk_score?: number | null
          ai_verdict?: Database["public"]["Enums"]["ai_verdict"] | null
          arrival_window_end?: string | null
          arrival_window_start?: string | null
          authority_notes?: string | null
          berth_code?: string | null
          cargo_type?: string | null
          container_count?: number
          created_at?: string
          created_by?: string
          customs_notes?: string | null
          dangerous_goods?: boolean
          eta?: string | null
          etd?: string | null
          id?: string
          imo_number?: string | null
          inspection_notes?: string | null
          origin_port?: string | null
          reference?: string
          shipping_company?: string
          stage?: Database["public"]["Enums"]["submission_stage"]
          updated_at?: string
          vessel_name?: string
          voyage_number?: string | null
        }
        Relationships: []
      }
      submission_documents: {
        Row: {
          ai_findings: Json
          created_at: string
          doc_type: Database["public"]["Enums"]["document_type"]
          expires_on: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          id: string
          issued_on: string | null
          mime_type: string | null
          status: Database["public"]["Enums"]["document_status"]
          submission_id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          ai_findings?: Json
          created_at?: string
          doc_type: Database["public"]["Enums"]["document_type"]
          expires_on?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          issued_on?: string | null
          mime_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          submission_id: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          ai_findings?: Json
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          expires_on?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          issued_on?: string | null
          mime_type?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          submission_id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_documents_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "shipment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string
          id: string
          metadata: Json
          notes: string | null
          stage: Database["public"]["Enums"]["submission_stage"]
          submission_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          stage: Database["public"]["Enums"]["submission_stage"]
          submission_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          stage?: Database["public"]["Enums"]["submission_stage"]
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_events_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "shipment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allowed_container_next: {
        Args: { _from: Database["public"]["Enums"]["container_stage"] }
        Returns: Database["public"]["Enums"]["container_stage"][]
      }
      allowed_submission_next: {
        Args: { _from: Database["public"]["Enums"]["submission_stage"] }
        Returns: Database["public"]["Enums"]["submission_stage"][]
      }
      approve_role_request: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      can_advance_workflow: { Args: { _user_id: string }; Returns: boolean }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_ops_visibility: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      revoke_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      roles_for_container_stage: {
        Args: { _to: Database["public"]["Enums"]["container_stage"] }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      roles_for_submission_stage: {
        Args: { _to: Database["public"]["Enums"]["submission_stage"] }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      set_account_status: {
        Args: {
          _status: Database["public"]["Enums"]["account_status"]
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "pending" | "active" | "disabled"
      ai_verdict: "verified" | "needs_manual_review" | "rejected"
      app_role:
        | "super_admin"
        | "port_authority"
        | "terminal_operator"
        | "shipping_company"
        | "customs_officer"
        | "warehouse_manager"
        | "truck_operator"
        | "logistics_manager"
        | "ai_administrator"
        | "data_analyst"
      audit_action:
        | "login"
        | "logout"
        | "failed_login"
        | "password_change"
        | "role_change"
        | "user_created"
        | "user_updated"
        | "user_disabled"
        | "user_activated"
        | "data_created"
        | "data_updated"
        | "data_deleted"
        | "ai_model_execution"
        | "report_generated"
        | "api_access"
        | "permission_denied"
      container_stage:
        | "at_vessel"
        | "unloading"
        | "yard"
        | "warehouse_received"
        | "stored"
        | "dispatch_ready"
        | "assigned_truck"
        | "in_transit"
        | "delivered"
      document_status: "uploaded" | "verified" | "flagged" | "rejected"
      document_type:
        | "vessel_arrival_notice"
        | "cargo_manifest"
        | "bill_of_lading"
        | "crew_list"
        | "dangerous_goods_declaration"
        | "container_list"
        | "insurance_certificate"
        | "port_clearance"
        | "eta_information"
      notification_priority: "low" | "normal" | "high" | "critical"
      submission_stage:
        | "uploaded"
        | "ai_verification"
        | "ai_needs_review"
        | "ai_rejected"
        | "authority_review"
        | "modification_requested"
        | "authority_rejected"
        | "authority_approved"
        | "customs_review"
        | "customs_hold"
        | "customs_rejected"
        | "customs_cleared"
        | "final_approval"
        | "final_approved"
        | "berth_assigned"
        | "terminal_scheduled"
        | "unloading"
        | "warehouse_received"
        | "dispatch_ready"
        | "in_transit"
        | "delivered"
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
      account_status: ["pending", "active", "disabled"],
      ai_verdict: ["verified", "needs_manual_review", "rejected"],
      app_role: [
        "super_admin",
        "port_authority",
        "terminal_operator",
        "shipping_company",
        "customs_officer",
        "warehouse_manager",
        "truck_operator",
        "logistics_manager",
        "ai_administrator",
        "data_analyst",
      ],
      audit_action: [
        "login",
        "logout",
        "failed_login",
        "password_change",
        "role_change",
        "user_created",
        "user_updated",
        "user_disabled",
        "user_activated",
        "data_created",
        "data_updated",
        "data_deleted",
        "ai_model_execution",
        "report_generated",
        "api_access",
        "permission_denied",
      ],
      container_stage: [
        "at_vessel",
        "unloading",
        "yard",
        "warehouse_received",
        "stored",
        "dispatch_ready",
        "assigned_truck",
        "in_transit",
        "delivered",
      ],
      document_status: ["uploaded", "verified", "flagged", "rejected"],
      document_type: [
        "vessel_arrival_notice",
        "cargo_manifest",
        "bill_of_lading",
        "crew_list",
        "dangerous_goods_declaration",
        "container_list",
        "insurance_certificate",
        "port_clearance",
        "eta_information",
      ],
      notification_priority: ["low", "normal", "high", "critical"],
      submission_stage: [
        "uploaded",
        "ai_verification",
        "ai_needs_review",
        "ai_rejected",
        "authority_review",
        "modification_requested",
        "authority_rejected",
        "authority_approved",
        "customs_review",
        "customs_hold",
        "customs_rejected",
        "customs_cleared",
        "final_approval",
        "final_approved",
        "berth_assigned",
        "terminal_scheduled",
        "unloading",
        "warehouse_received",
        "dispatch_ready",
        "in_transit",
        "delivered",
      ],
    },
  },
} as const
