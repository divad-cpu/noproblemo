export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Locale =
  | "en"
  | "zh-CN"
  | "hi"
  | "es"
  | "ar"
  | "fr"
  | "bn"
  | "pt-BR"
  | "id"
  | "ur"
  | "nb";

export type ProfileRole = "user" | "admin";
export type ChallengeStatus = "draft" | "active" | "completed" | "archived";
export type ChallengeVisibility = "private" | "group";
export type ChallengeSectionKey =
  | "problem_title"
  | "short_description"
  | "background_context"
  | "who_is_affected"
  | "why_it_matters"
  | "possible_causes"
  | "final_recommendation"
  | "summary";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          preferred_locale: Locale;
          role: ProfileRole;
          support_contact_seen: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          preferred_locale?: Locale;
          role?: ProfileRole;
          support_contact_seen?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          preferred_locale?: Locale;
          role?: ProfileRole;
          support_contact_seen?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          short_description: string | null;
          status: ChallengeStatus;
          visibility: ChallengeVisibility;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          short_description?: string | null;
          status?: ChallengeStatus;
          visibility?: ChallengeVisibility;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          short_description?: string | null;
          status?: ChallengeStatus;
          visibility?: ChallengeVisibility;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenges_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      challenge_sections: {
        Row: {
          id: string;
          challenge_id: string;
          section_key: ChallengeSectionKey;
          content: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          section_key: ChallengeSectionKey;
          content?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          section_key?: ChallengeSectionKey;
          content?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_sections_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
        ];
      };
      challenge_solutions: {
        Row: {
          id: string;
          challenge_id: string;
          title: string;
          description: string | null;
          pros: string | null;
          cons: string | null;
          risk: number | null;
          effort: number | null;
          impact: number | null;
          resources_needed: string | null;
          priority: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          title: string;
          description?: string | null;
          pros?: string | null;
          cons?: string | null;
          risk?: number | null;
          effort?: number | null;
          impact?: number | null;
          resources_needed?: string | null;
          priority?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          title?: string;
          description?: string | null;
          pros?: string | null;
          cons?: string | null;
          risk?: number | null;
          effort?: number | null;
          impact?: number | null;
          resources_needed?: string | null;
          priority?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_solutions_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
        ];
      };
      challenge_tasks: {
        Row: {
          id: string;
          challenge_id: string;
          title: string;
          description: string | null;
          responsible_person: string | null;
          deadline: string | null;
          completed: boolean;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          title: string;
          description?: string | null;
          responsible_person?: string | null;
          deadline?: string | null;
          completed?: boolean;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          title?: string;
          description?: string | null;
          responsible_person?: string | null;
          deadline?: string | null;
          completed?: boolean;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_tasks_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
