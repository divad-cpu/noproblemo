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
export type FriendRequestStatus = "pending" | "accepted" | "declined" | "canceled";
export type GroupRole = "owner" | "admin" | "member" | "viewer";
export type GroupInvitationStatus = "pending" | "accepted" | "declined" | "canceled";
export type NotificationType =
  | "friend_request"
  | "friend_request_accepted"
  | "group_invitation"
  | "group_invitation_accepted"
  | "group_invitation_declined"
  | "group_message"
  | "challenge_message"
  | "challenge_updated"
  | "group_updated";
export type ActivityType =
  | "challenge_created"
  | "challenge_updated"
  | "challenge_linked_to_group"
  | "group_created"
  | "group_updated"
  | "group_member_joined"
  | "group_member_removed"
  | "group_message_created"
  | "challenge_message_created"
  | "task_updated"
  | "solution_updated";
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
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: FriendRequestStatus;
          created_at: string;
          updated_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: FriendRequestStatus;
          created_at?: string;
          updated_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: FriendRequestStatus;
          created_at?: string;
          updated_at?: string;
          responded_at?: string | null;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          user_one_id: string;
          user_two_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_one_id: string;
          user_two_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_one_id?: string;
          user_two_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: GroupRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role: GroupRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: GroupRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      group_invitations: {
        Row: {
          id: string;
          group_id: string;
          inviter_id: string;
          invitee_id: string;
          role: Exclude<GroupRole, "owner">;
          status: GroupInvitationStatus;
          created_at: string;
          updated_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          inviter_id: string;
          invitee_id: string;
          role?: Exclude<GroupRole, "owner">;
          status?: GroupInvitationStatus;
          created_at?: string;
          updated_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          inviter_id?: string;
          invitee_id?: string;
          role?: Exclude<GroupRole, "owner">;
          status?: GroupInvitationStatus;
          created_at?: string;
          updated_at?: string;
          responded_at?: string | null;
        };
        Relationships: [];
      };
      group_challenges: {
        Row: {
          id: string;
          group_id: string;
          challenge_id: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          challenge_id: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          challenge_id?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string | null;
          group_id: string | null;
          challenge_id: string | null;
          body: string;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id?: string | null;
          group_id?: string | null;
          challenge_id?: string | null;
          body: string;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string | null;
          group_id?: string | null;
          challenge_id?: string | null;
          body?: string;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          related_group_id: string | null;
          related_challenge_id: string | null;
          related_message_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body?: string | null;
          related_group_id?: string | null;
          related_challenge_id?: string | null;
          related_message_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          body?: string | null;
          related_group_id?: string | null;
          related_challenge_id?: string | null;
          related_message_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_events: {
        Row: {
          id: string;
          actor_id: string | null;
          group_id: string | null;
          challenge_id: string | null;
          type: ActivityType;
          summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          group_id?: string | null;
          challenge_id?: string | null;
          type: ActivityType;
          summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          group_id?: string | null;
          challenge_id?: string | null;
          type?: ActivityType;
          summary?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_profiles: {
        Args: {
          search_term: string;
        };
        Returns: Array<{
          id: string;
          display_name: string | null;
          avatar_url: string | null;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
