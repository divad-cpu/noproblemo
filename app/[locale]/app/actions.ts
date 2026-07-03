"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import type { ChallengeSectionKey } from "@/lib/supabase/types";

type GuestDraft = {
  problem?: unknown;
  context?: unknown;
  outcome?: unknown;
  options?: unknown;
  nextStep?: unknown;
  importedChallengeId?: unknown;
};

type ImportGuestState = {
  status: "idle" | "success" | "error";
  messageKey?: string;
  challengeId?: string;
};

const maxTitleLength = 160;
const maxShortDescriptionLength = 500;
const maxSectionLength = 8000;

function firstString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getLocale(formData: FormData): Locale {
  const value = firstString(formData.get("locale"));

  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : defaultLocale;
}

function getSafeLocale(value: string): Locale {
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : defaultLocale;
}

function truncate(value: string, length: number) {
  return value.length > length ? value.slice(0, length).trim() : value;
}

function valueToString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function titleFromDraft(draft: GuestDraft, fallback: string) {
  const problem = valueToString(draft.problem);
  const firstLine = problem.split("\n").find(Boolean)?.trim();

  return truncate(firstLine || fallback, maxTitleLength);
}

function sectionsFromDraft(draft: GuestDraft) {
  const sections: Array<{
    section_key: ChallengeSectionKey;
    content: string;
    position: number;
  }> = [
    {
      section_key: "problem_title",
      content: valueToString(draft.problem),
      position: 0,
    },
    {
      section_key: "background_context",
      content: valueToString(draft.context),
      position: 1,
    },
    {
      section_key: "final_recommendation",
      content: valueToString(draft.outcome),
      position: 2,
    },
    {
      section_key: "possible_causes",
      content: valueToString(draft.options),
      position: 3,
    },
    {
      section_key: "summary",
      content: valueToString(draft.nextStep),
      position: 4,
    },
  ];

  return sections
    .filter((section) => section.content.length > 0)
    .map((section) => ({
      ...section,
      content: truncate(section.content, maxSectionLength),
    }));
}

async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

export async function createChallenge(formData: FormData) {
  const locale = getLocale(formData);
  const title = truncate(firstString(formData.get("title")), maxTitleLength);
  const shortDescription = truncate(
    firstString(formData.get("shortDescription")),
    maxShortDescriptionLength,
  );

  if (!title) {
    redirect(`/${locale}/app/challenges/new?error=missing-title`);
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app`);
  }

  const { data, error } = await supabase
    .from("challenges")
    .insert({
      owner_id: user.id,
      title,
      short_description: shortDescription || null,
      status: "draft",
      visibility: "private",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/${locale}/app/challenges/new?error=create-failed`);
  }

  revalidatePath(`/${locale}/app`);
  redirect(`/${locale}/app/challenges/${data.id}?status=created`);
}

export async function importGuestDraft(
  _previousState: ImportGuestState,
  formData: FormData,
): Promise<ImportGuestState> {
  const locale = getLocale(formData);
  const fallbackTitle = firstString(formData.get("fallbackTitle")) || "Imported guest challenge";
  const rawDraft = firstString(formData.get("draft"));

  if (!rawDraft) {
    return { status: "error", messageKey: "missingDraft" };
  }

  let draft: GuestDraft;
  try {
    draft = JSON.parse(rawDraft) as GuestDraft;
  } catch {
    return { status: "error", messageKey: "invalidDraft" };
  }

  if (typeof draft.importedChallengeId === "string" && draft.importedChallengeId) {
    return {
      status: "success",
      messageKey: "alreadyImported",
      challengeId: draft.importedChallengeId,
    };
  }

  const sections = sectionsFromDraft(draft);
  const hasDraftContent = sections.length > 0;

  if (!hasDraftContent) {
    return { status: "error", messageKey: "emptyDraft" };
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { status: "error", messageKey: "authRequired" };
  }

  const title = titleFromDraft(draft, fallbackTitle);
  const shortDescription = truncate(
    valueToString(draft.context) || valueToString(draft.outcome),
    maxShortDescriptionLength,
  );

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .insert({
      owner_id: user.id,
      title,
      short_description: shortDescription || null,
      status: "draft",
      visibility: "private",
    })
    .select("id")
    .single();

  if (challengeError || !challenge) {
    return { status: "error", messageKey: "createFailed" };
  }

  const { error: sectionsError } = await supabase
    .from("challenge_sections")
    .insert(
      sections.map((section) => ({
        challenge_id: challenge.id,
        section_key: section.section_key,
        content: section.content,
        position: section.position,
      })),
    );

  if (sectionsError) {
    return { status: "error", messageKey: "sectionsFailed" };
  }

  revalidatePath(`/${locale}/app`);

  return {
    status: "success",
    messageKey: "success",
    challengeId: challenge.id,
  };
}

export async function updateProfile(formData: FormData) {
  const locale = getLocale(formData);
  const displayName = truncate(firstString(formData.get("displayName")), 120);
  const preferredLocale = getSafeLocale(firstString(formData.get("preferredLocale")));

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/settings`);
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName || null,
    preferred_locale: preferredLocale,
    role: "user",
  });

  if (error) {
    redirect(`/${locale}/app/settings?error=profile-update-failed`);
  }

  revalidatePath(`/${locale}/app`);
  revalidatePath(`/${locale}/app/settings`);
  redirect(`/${locale}/app/settings?status=profile-saved`);
}
