export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole =
  | 'customer'
  | 'technician'
  | 'admin'
  | 'super_admin'
  | 'logistics_partner'
  | 'hr_manager'
  | 'executive';

export interface Database {
  public: {
    Tables: {
      global_settings: {
        Row: {
          id: number;
          diagnostic_fee: number;
          standard_labor_rate: number;
          emergency_multiplier: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          diagnostic_fee?: number;
          standard_labor_rate?: number;
          emergency_multiplier?: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
          diagnostic_fee?: number;
          standard_labor_rate?: number;
          emergency_multiplier?: number;
          updated_at?: string;
        };
      };
      spare_parts_catalog: {
        Row: {
          id: number;
          sku: string;
          part_name: string;
          category: string;
          supplier_cost: number;
          markup_percentage: number;
          final_price: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          sku: string;
          part_name: string;
          category: string;
          supplier_cost: number;
          markup_percentage?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          sku?: string;
          part_name?: string;
          category?: string;
          supplier_cost?: number;
          markup_percentage?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      repair_requests: {
        Row: {
          id: number | string;
          booking_number: string;
          customer_name: string;
          appliance_name: string;
          issue_description: string;
          city_zone: string;
          ai_estimate: number;
          status: string;
          assigned_tech_code: string | null;
          branch_id?: string | null;
          created_at: string;
        };
        Insert: {
          id?: number | string;
          booking_number: string;
          customer_name: string;
          appliance_name: string;
          issue_description: string;
          city_zone: string;
          ai_estimate?: number;
          status?: string;
          assigned_tech_code?: string | null;
          branch_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number | string;
          booking_number?: string;
          customer_name?: string;
          appliance_name?: string;
          issue_description?: string;
          city_zone?: string;
          ai_estimate?: number;
          status?: string;
          assigned_tech_code?: string | null;
          branch_id?: string | null;
          created_at?: string;
        };
      };
      technician_profiles: {
        Row: {
          id: number | string;
          employee_code: string;
          full_name: string;
          specialty: string;
          zone: string;
          phone_number: string | null;
          customer_comment: string | null;
          customer_comment_author: string | null;
          customer_comment_rating: number | null;
          certifications: string | null;
          avatar_url: string | null;
          average_rating: number;
          completed_jobs: number;
          availability_status: string;
          branch_id?: string | null;
          created_at: string;
        };
        Insert: {
          id?: number | string;
          employee_code: string;
          full_name: string;
          specialty: string;
          zone: string;
          phone_number?: string | null;
          customer_comment?: string | null;
          customer_comment_author?: string | null;
          customer_comment_rating?: number | null;
          certifications?: string | null;
          avatar_url?: string | null;
          average_rating?: number;
          completed_jobs?: number;
          availability_status?: string;
          branch_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number | string;
          employee_code?: string;
          full_name?: string;
          specialty?: string;
          zone?: string;
          phone_number?: string | null;
          customer_comment?: string | null;
          customer_comment_author?: string | null;
          customer_comment_rating?: number | null;
          certifications?: string | null;
          avatar_url?: string | null;
          average_rating?: number;
          completed_jobs?: number;
          availability_status?: string;
          branch_id?: string | null;
          created_at?: string;
        };
      };
      ai_assessments: {
        Row: {
          id: number | string;
          repair_request_id?: string | null;
          appliance_model: string;
          reported_symptoms: string;
          predicted_fault: string;
          recommended_part_sku: string | null;
          confidence_score: number;
          estimated_cost: number;
          prompt_version?: string | null;
          pipeline_version?: string | null;
          source_hash?: string | null;
          probable_causes?: Json;
          safety_flags?: Json;
          customer_questions?: Json;
          needs_human_review?: boolean;
          review_status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          latency_ms?: number | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          created_at: string;
        };
        Insert: {
          id?: number | string;
          repair_request_id?: string | null;
          appliance_model: string;
          reported_symptoms: string;
          predicted_fault: string;
          recommended_part_sku?: string | null;
          confidence_score?: number;
          estimated_cost?: number;
          prompt_version?: string | null;
          pipeline_version?: string | null;
          source_hash?: string | null;
          probable_causes?: Json;
          safety_flags?: Json;
          customer_questions?: Json;
          needs_human_review?: boolean;
          review_status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          latency_ms?: number | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          created_at?: string;
        };
        Update: {
          id?: number | string;
          repair_request_id?: string | null;
          appliance_model?: string;
          reported_symptoms?: string;
          predicted_fault?: string;
          recommended_part_sku?: string | null;
          confidence_score?: number;
          estimated_cost?: number;
          prompt_version?: string | null;
          pipeline_version?: string | null;
          source_hash?: string | null;
          probable_causes?: Json;
          safety_flags?: Json;
          customer_questions?: Json;
          needs_human_review?: boolean;
          review_status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          latency_ms?: number | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          phone: string | null;
          account_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email: string;
          phone?: string | null;
          account_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string;
          phone?: string | null;
          account_status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          branch_id: string | null;
          assigned_at: string;
          assigned_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: AppRole;
          branch_id?: string | null;
          assigned_at?: string;
          assigned_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: AppRole;
          branch_id?: string | null;
          assigned_at?: string;
          assigned_by?: string | null;
        };
      };
      branches: {
        Row: {
          id: string;
          code: string;
          name: string;
          region: string;
          address: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          region: string;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          region?: string;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          event_type: string;
          details: Json;
          created_at: string;
          prev_hash: string | null;
          row_hash: string | null;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          event_type: string;
          details?: Json;
          created_at?: string;
          prev_hash?: string | null;
          row_hash?: string | null;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          event_type?: string;
          details?: Json;
          created_at?: string;
          prev_hash?: string | null;
          row_hash?: string | null;
        };
      };
      api_keys: {
        Row: {
          id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          scopes: string[];
          created_by: string | null;
          created_at: string;
          last_used_at: string | null;
          revoked_at: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          scopes?: string[];
          created_by?: string | null;
          created_at?: string;
          last_used_at?: string | null;
          revoked_at?: string | null;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          key_prefix?: string;
          key_hash?: string;
          scopes?: string[];
          created_by?: string | null;
          created_at?: string;
          last_used_at?: string | null;
          revoked_at?: string | null;
          expires_at?: string | null;
        };
      };
    };
    Views: {
      spare_parts_public: {
        Row: {
          id: number;
          sku: string;
          part_name: string;
          category: string;
          markup_percentage: number;
          final_price: number;
          is_active: boolean;
        };
      };
      service_prices_matrix: {
        Row: {
          id: number;
          part_sku: string;
          part_name: string;
          category: string;
          supplier_cost: number;
          markup_percentage: number;
          final_price: number;
          is_active: boolean;
          created_at: string;
        };
      };
    };
  };
}
