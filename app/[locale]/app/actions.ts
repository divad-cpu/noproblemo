"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import type {
  ChallengeSectionKey,
  ChallengeStatus,
  Database,
} from "@/lib/supabase/types";

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
const maxLongTextLength = 8000;
const maxPersonLength = 160;
const challengeStatuses: ChallengeStatus[] = [
  "draft",
  "active",
  "completed",
  "archived",
];
const sectionKeys: ChallengeSectionKey[] = [
  "problem_title",
  "short_description",
  "background_context",
  "who_is_affected",
  "why_it_matters",
  "possible_causes",
  "final_recommendation",
  "summary",
];

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

function nullableText(value: string, length = maxLongTextLength) {
  const text = truncate(value, length);

  return text || null;
}

function parseNullableInteger(value: FormDataEntryValue | null) {
  const text = firstString(value);
  if (!text) return null;
  const parsed = Number.parseInt(text, 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseScore(value: FormDataEntryValue | null) {
  const parsed = parseNullableInteger(value);

  if (parsed === null) return null;
  if (parsed < 1 || parsed > 5) return null;

  return parsed;
}

function getChallengeId(formData: FormData) {
  return firstString(formData.get("challengeId"));
}

function getWorkspaceUrl(locale: Locale, challengeId: string, params: URLSearchParams) {
  const query = params.toString();

  return `/${locale}/app/challenges/${challengeId}${query ? `?${query}` : ""}`;
}

function workspaceStatusUrl(locale: Locale, challengeId: string, status: string) {
  return getWorkspaceUrl(
    locale,
    challengeId,
    new URLSearchParams({ status }),
  );
}

function workspaceErrorUrl(locale: Locale, challengeId: string, error: string) {
  return getWorkspaceUrl(
    locale,
    challengeId,
    new URLSearchParams({ error }),
  );
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

async function requireOwnedChallenge(
  challengeId: string,
): Promise<{
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  userId: string;
  challenge:
    Database["public"]["Tables"]["challenges"]["Row"]
    | null;
}> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { supabase, userId: "", challenge: null };
  }

  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .eq("owner_id", user.id)
    .maybeSingle();

  return { supabase, userId: user.id, challenge };
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

export async function updateChallengeDetails(formData: FormData) {
  const locale = getLocale(formData);
  const challengeId = getChallengeId(formData);
  const title = truncate(firstString(formData.get("title")), maxTitleLength);
  const shortDescription = truncate(
    firstString(formData.get("shortDescription")),
    maxShortDescriptionLength,
  );
  const rawStatus = firstString(formData.get("status")) as ChallengeStatus;
  const status = challengeStatuses.includes(rawStatus) ? rawStatus : "draft";

  if (!challengeId) {
    redirect(`/${locale}/app`);
  }

  if (!title) {
    redirect(workspaceErrorUrl(locale, challengeId, "details-missing-title"));
  }

  const { supabase, challenge } = await requireOwnedChallenge(challengeId);

  if (!challenge) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app`);
  }

  const { error } = await supabase
    .from("challenges")
    .update({
      title,
      short_description: shortDescription || null,
      status,
    })
    .eq("id", challengeId)
    .eq("owner_id", challenge.owner_id);

  if (error) {
    redirect(workspaceErrorUrl(locale, challengeId, "details-save-failed"));
  }

  revalidatePath(`/${locale}/app`);
  revalidatePath(`/${locale}/app/challenges/${challengeId}`);
  redirect(workspaceStatusUrl(locale, challengeId, "details-saved"));
}

export async function saveChallengeSections(formData: FormData) {
  const locale = getLocale(formData);
  const challengeId = getChallengeId(formData);

  if (!challengeId) {
    redirect(`/${locale}/app`);
  }

  const { supabase, challenge } = await requireOwnedChallenge(challengeId);

  if (!challenge) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app`);
  }

  const { data: existingSections, error: readError } = await supabase
    .from("challenge_sections")
    .select("id, section_key")
    .eq("challenge_id", challengeId);

  if (readError) {
    redirect(workspaceErrorUrl(locale, challengeId, "sections-save-failed"));
  }

  const existingByKey = new Map(
    (existingSections ?? []).map((section) => [section.section_key, section.id]),
  );

  for (const [position, sectionKey] of sectionKeys.entries()) {
    const content = nullableText(
      firstString(formData.get(sectionKey)),
      maxSectionLength,
    );
    const existingId = existingByKey.get(sectionKey);

    if (existingId) {
      const { error } = await supabase
        .from("challenge_sections")
        .update({ content, position })
        .eq("id", existingId)
        .eq("challenge_id", challengeId);

      if (error) {
        redirect(workspaceErrorUrl(locale, challengeId, "sections-save-failed"));
      }
    } else {
      const { error } = await supabase.from("challenge_sections").insert({
        challenge_id: challengeId,
        section_key: sectionKey,
        content,
        position,
      });

      if (error) {
        redirect(workspaceErrorUrl(locale, challengeId, "sections-save-failed"));
      }
    }
  }

  revalidatePath(`/${locale}/app/challenges/${challengeId}`);
  redirect(workspaceStatusUrl(locale, challengeId, "sections-saved"));
}

export async function saveSolution(formData: FormData) {
  const locale = getLocale(formData);
  const challengeId = getChallengeId(formData);
  const solutionId = firstString(formData.get("solutionId"));
  const title = truncate(firstString(formData.get("title")), maxTitleLength);

  if (!challengeId) {
    redirect(`/${locale}/app`);
  }

  if (!title) {
    redirect(workspaceErrorUrl(locale, challengeId, "solution-missing-title"));
  }

  const { supabase, challenge } = await requireOwnedChallenge(challengeId);

  if (!challenge) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app`);
  }

  const payload = {
    title,
    description: nullableText(firstString(formData.get("description"))),
    pros: nullableText(firstString(formData.get("pros"))),
    cons: nullableText(firstString(formData.get("cons"))),
    risk: parseScore(formData.get("risk")),
    effort: parseScore(formData.get("effort")),
    impact: parseScore(formData.get("impact")),
    resources_needed: nullableText(firstString(formData.get("resourcesNeeded"))),
    priority: parseNullableInteger(formData.get("priority")),
  };

  const invalidScore = ["risk", "effort", "impact"].some((key) => {
    const raw = firstString(formData.get(key));
    return raw && payload[key as "risk" | "effort" | "impact"] === null;
  });

  if (invalidScore) {
    redirect(workspaceErrorUrl(locale, challengeId, "solution-invalid-score"));
  }

  const result = solutionId
    ? await supabase
        .from("challenge_solutions")
        .update(payload)
        .eq("id", solutionId)
        .eq("challenge_id", challengeId)
    : await supabase.from("challenge_solutions").insert({
        ...payload,
        challenge_id: challengeId,
      });

  if (result.error) {
    redirect(workspaceErrorUrl(locale, challengeId, "solution-save-failed"));
  }

  revalidatePath(`/${locale}/app/challenges/${challengeId}`);
  redirect(workspaceStatusUrl(locale, challengeId, "solution-saved"));
}

export async function deleteSolution(formData: FormData) {
  const locale = getLocale(formData);
  const challengeId = getChallengeId(formData);
  const solutionId = firstString(formData.get("solutionId"));

  if (!challengeId || !solutionId) {
    redirect(`/${locale}/app`);
  }

  const { supabase, challenge } = await requireOwnedChallenge(challengeId);

  if (!challenge) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app`);
  }

  const { error } = await supabase
    .from("challenge_solutions")
    .delete()
    .eq("id", solutionId)
    .eq("challenge_id", challengeId);

  if (error) {
    redirect(workspaceErrorUrl(locale, challengeId, "solution-delete-failed"));
  }

  revalidatePath(`/${locale}/app/challenges/${challengeId}`);
  redirect(workspaceStatusUrl(locale, challengeId, "solution-deleted"));
}

export async function saveTask(formData: FormData) {
  const locale = getLocale(formData);
  const challengeId = getChallengeId(formData);
  const taskId = firstString(formData.get("taskId"));
  const title = truncate(firstString(formData.get("title")), maxTitleLength);

  if (!challengeId) {
    redirect(`/${locale}/app`);
  }

  if (!title) {
    redirect(workspaceErrorUrl(locale, challengeId, "task-missing-title"));
  }

  const { supabase, challenge } = await requireOwnedChallenge(challengeId);

  if (!challenge) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app`);
  }

  const payload = {
    title,
    description: nullableText(firstString(formData.get("description"))),
    responsible_person: nullableText(
      firstString(formData.get("responsiblePerson")),
      maxPersonLength,
    ),
    deadline: nullableText(firstString(formData.get("deadline")), 10),
    completed: firstString(formData.get("completed")) === "on",
    position: parseNullableInteger(formData.get("position")) ?? 0,
  };

  const result = taskId
    ? await supabase
        .from("challenge_tasks")
        .update(payload)
        .eq("id", taskId)
        .eq("challenge_id", challengeId)
    : await supabase.from("challenge_tasks").insert({
        ...payload,
        challenge_id: challengeId,
      });

  if (result.error) {
    redirect(workspaceErrorUrl(locale, challengeId, "task-save-failed"));
  }

  revalidatePath(`/${locale}/app/challenges/${challengeId}`);
  redirect(workspaceStatusUrl(locale, challengeId, "task-saved"));
}

export async function deleteTask(formData: FormData) {
  const locale = getLocale(formData);
  const challengeId = getChallengeId(formData);
  const taskId = firstString(formData.get("taskId"));

  if (!challengeId || !taskId) {
    redirect(`/${locale}/app`);
  }

  const { supabase, challenge } = await requireOwnedChallenge(challengeId);

  if (!challenge) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app`);
  }

  const { error } = await supabase
    .from("challenge_tasks")
    .delete()
    .eq("id", taskId)
    .eq("challenge_id", challengeId);

  if (error) {
    redirect(workspaceErrorUrl(locale, challengeId, "task-delete-failed"));
  }

  revalidatePath(`/${locale}/app/challenges/${challengeId}`);
  redirect(workspaceStatusUrl(locale, challengeId, "task-deleted"));
}
