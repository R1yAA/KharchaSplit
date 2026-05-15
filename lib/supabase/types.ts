// Supabase typed schema. Keep in sync with supabase/migrations/0001_init.sql.

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export interface GroupRow {
  id: string;
  workspace: string;
  name: string;
  icon: string;
  members: string[];
  created_at: string;
  updated_at: string;
}

export type SplitType = "equal" | "unequal";

export interface ExpenseRow {
  id: string;
  workspace: string;
  group_id: string | null;
  title: string;
  amount: number;
  category: string;
  paid_by: string | null;
  paid_by_members: string[] | null;
  paid_by_amounts: number[] | null;
  split_type: SplitType;
  split_members: string[] | null;
  split_amounts: number[] | null;
  date: string;
  note: string | null;
  is_personal: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettlementRow {
  id: string;
  workspace: string;
  group_id: string;
  from_member: string;
  to_member: string;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
}

export interface SettingsRow {
  workspace: string;
  user_name: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      groups: { Row: GroupRow; Insert: Partial<GroupRow> & { workspace: string; name: string; members: string[] }; Update: Partial<GroupRow> };
      expenses: { Row: ExpenseRow; Insert: Partial<ExpenseRow> & { workspace: string; title: string; amount: number }; Update: Partial<ExpenseRow> };
      settlements: { Row: SettlementRow; Insert: Partial<SettlementRow> & { workspace: string; group_id: string; from_member: string; to_member: string; amount: number }; Update: Partial<SettlementRow> };
      settings: { Row: SettingsRow; Insert: Partial<SettingsRow> & { workspace: string }; Update: Partial<SettingsRow> };
    };
  };
}
