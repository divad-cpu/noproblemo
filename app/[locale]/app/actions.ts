"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import type {
  ChallengeSectionKey,
  ChallengeStatus,
  Database,
  GroupRole,
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
const maxMessageLength = 2000;
const challengeStatuses: ChallengeStatus[] = [
  "draft",
  "active",
  "completed",
  "archived",
];
const groupRoles: GroupRole[] = ["owner", "admin", "member", "viewer"];
const invitationRoles: Array<Exclude<GroupRole, "owner">> = [
  "admin",
  "member",
  "viewer",
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

function getGroupId(formData: FormData) {
  return firstString(formData.get("groupId"));
}

function getMessageId(formData: FormData) {
  return firstString(formData.get("messageId"));
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
  const titleSource =
    valueToString(draft.problem) ||
    valueToString(draft.context) ||
    valueToString(draft.outcome) ||
    valueToString(draft.options) ||
    valueToString(draft.nextStep);
  const firstLine = titleSource.split("\n").find(Boolean)?.trim();

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
    .maybeSingle();

  return { supabase, userId: user.id, challenge };
}

function canonicalFriendPair(userA: string, userB: string) {
  return userA < userB
    ? { user_one_id: userA, user_two_id: userB }
    : { user_one_id: userB, user_two_id: userA };
}

async function logChallengeActivity(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  challengeId: string,
  type: "challenge_updated" | "task_updated" | "solution_updated",
  summary: string,
) {
  await supabase.from("activity_events").insert({
    actor_id: userId,
    challenge_id: challengeId,
    type,
    summary,
  });
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
  const fallbackTitle = firstString(formData.get("fallbackTitle"));
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

  const profileUpdate = {
    display_name: displayName || null,
    preferred_locale: preferredLocale,
  };

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(`/${locale}/app/settings?error=profile-update-failed`);
  }

  if (!updatedProfile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      ...profileUpdate,
      role: "user",
    });

    if (insertError) {
      redirect(`/${locale}/app/settings?error=profile-update-failed`);
    }
  }

  revalidatePath(`/${locale}/app`);
  revalidatePath(`/${locale}/app/settings`);
  revalidatePath(`/${preferredLocale}/app/settings`);
  redirect(`/${preferredLocale}/app/settings?status=profile-saved`);
}

export async function updatePassword(formData: FormData) {
  const locale = getLocale(formData);
  const password = firstString(formData.get("password"));
  const confirmPassword = firstString(formData.get("confirmPassword"));

  if (password.length < 8) {
    redirect(`/${locale}/app/settings?error=password-weak`);
  }

  if (password !== confirmPassword) {
    redirect(`/${locale}/app/settings?error=password-mismatch`);
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/settings`);
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/${locale}/app/settings?error=password-update-failed`);
  }

  redirect(`/${locale}/app/settings?status=password-saved`);
}

export async function deleteCurrentAccount(formData: FormData) {
  const locale = getLocale(formData);
  const confirmed = firstString(formData.get("deleteConfirmation")) === "DELETE";
  const checked = formData.get("deleteConfirmed") === "on";

  if (!confirmed || !checked) {
    redirect(`/${locale}/app/settings?error=account-delete-confirmation`);
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/settings`);
  }

  let adminSupabase: ReturnType<typeof createAdminSupabaseClient>;
  try {
    adminSupabase = createAdminSupabaseClient();
  } catch {
    redirect(`/${locale}/app/settings?error=account-delete-unavailable`);
  }

  const { error } = await adminSupabase.auth.admin.deleteUser(user.id);

  if (error) {
    redirect(`/${locale}/app/settings?error=account-delete-failed`);
  }

  await supabase.auth.signOut();
  redirect(`/${locale}/login?status=account-deleted`);
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

  const { supabase, userId, challenge } = await requireOwnedChallenge(challengeId);

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

  await logChallengeActivity(
    supabase,
    userId,
    challengeId,
    "challenge_updated",
    "Challenge details updated.",
  );

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

  const { supabase, userId, challenge } = await requireOwnedChallenge(challengeId);

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

  await logChallengeActivity(
    supabase,
    userId,
    challengeId,
    "solution_updated",
    "Solution updated.",
  );

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

  const { supabase, userId, challenge } = await requireOwnedChallenge(challengeId);

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

  await logChallengeActivity(
    supabase,
    userId,
    challengeId,
    "task_updated",
    "Task updated.",
  );

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

export async function sendFriendRequest(formData: FormData) {
  const locale = getLocale(formData);
  const receiverId = firstString(formData.get("receiverId"));
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/friends`);
  }

  if (!receiverId || receiverId === user.id) {
    redirect(`/${locale}/app/friends?error=friend-invalid-user`);
  }

  const { error } = await supabase.from("friend_requests").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    status: "pending",
  });

  if (error) {
    redirect(`/${locale}/app/friends?error=friend-request-failed`);
  }

  revalidatePath(`/${locale}/app/friends`);
  redirect(`/${locale}/app/friends?status=friend-request-sent`);
}

export async function respondFriendRequest(formData: FormData) {
  const locale = getLocale(formData);
  const requestId = firstString(formData.get("requestId"));
  const response = firstString(formData.get("response"));
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/friends`);
  }

  if (!requestId || !["accepted", "declined", "canceled"].includes(response)) {
    redirect(`/${locale}/app/friends?error=friend-response-failed`);
  }

  const { data: request } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .maybeSingle();

  if (!request) {
    redirect(`/${locale}/app/friends?error=friend-response-failed`);
  }

  const canRespond =
    (response === "canceled" && request.sender_id === user.id) ||
    (["accepted", "declined"].includes(response) && request.receiver_id === user.id);

  if (!canRespond) {
    redirect(`/${locale}/app/friends?error=friend-response-failed`);
  }

  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({
      status: response as "accepted" | "declined" | "canceled",
      responded_at: new Date().toISOString(),
    })
    .eq("id", request.id);

  if (updateError) {
    redirect(`/${locale}/app/friends?error=friend-response-failed`);
  }

  if (response === "accepted") {
    const { error: friendshipError } = await supabase.from("friendships").insert(
      canonicalFriendPair(request.sender_id, request.receiver_id),
    );

    if (friendshipError) {
      redirect(`/${locale}/app/friends?error=friend-response-failed`);
    }
  }

  revalidatePath(`/${locale}/app/friends`);
  redirect(`/${locale}/app/friends?status=friend-${response}`);
}

export async function removeFriend(formData: FormData) {
  const locale = getLocale(formData);
  const friendshipId = firstString(formData.get("friendshipId"));
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/friends`);
  }

  if (!friendshipId) {
    redirect(`/${locale}/app/friends?error=friend-remove-failed`);
  }

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) {
    redirect(`/${locale}/app/friends?error=friend-remove-failed`);
  }

  revalidatePath(`/${locale}/app/friends`);
  redirect(`/${locale}/app/friends?status=friend-removed`);
}

export async function createGroup(formData: FormData) {
  const locale = getLocale(formData);
  const name = truncate(firstString(formData.get("name")), maxTitleLength);
  const description = nullableText(firstString(formData.get("description")), 1000);
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/groups`);
  }

  if (!name) {
    redirect(`/${locale}/app/groups/new?error=group-name-required`);
  }

  const groupId = crypto.randomUUID();
  const { error: insertError } = await supabase
    .from("groups")
    .insert({ id: groupId, owner_id: user.id, name, description });

  if (insertError) {
    redirect(
      `/${locale}/app/groups/new?error=group-create-failed&failure=insert`,
    );
  }

  const { data: createdGroup, error: verificationError } = await supabase
    .from("groups")
    .select("id")
    .eq("id", groupId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (verificationError || !createdGroup) {
    redirect(
      `/${locale}/app/groups/new?error=group-create-failed&failure=verification`,
    );
  }

  revalidatePath(`/${locale}/app/groups`);
  redirect(`/${locale}/app/groups/${createdGroup.id}?status=group-created`);
}

export async function updateGroup(formData: FormData) {
  const locale = getLocale(formData);
  const groupId = getGroupId(formData);
  const name = truncate(firstString(formData.get("name")), maxTitleLength);
  const description = nullableText(firstString(formData.get("description")), 1000);
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/groups`);
  }

  if (!groupId || !name) {
    redirect(`/${locale}/app/groups/${groupId}?error=group-save-failed`);
  }

  const { error } = await supabase
    .from("groups")
    .update({ name, description })
    .eq("id", groupId);

  if (error) {
    redirect(`/${locale}/app/groups/${groupId}?error=group-save-failed`);
  }

  revalidatePath(`/${locale}/app/groups`);
  revalidatePath(`/${locale}/app/groups/${groupId}`);
  redirect(`/${locale}/app/groups/${groupId}?status=group-saved`);
}

export async function inviteUserToGroup(formData: FormData) {
  const locale = getLocale(formData);
  const groupId = getGroupId(formData);
  const inviteeId = firstString(formData.get("inviteeId"));
  const role = firstString(formData.get("role")) as Exclude<GroupRole, "owner">;
  const safeRole = invitationRoles.includes(role) ? role : "member";
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/groups`);
  }

  if (!groupId || !inviteeId || inviteeId === user.id) {
    redirect(`/${locale}/app/groups/${groupId}?error=group-invite-failed`);
  }

  const { error } = await supabase.from("group_invitations").insert({
    group_id: groupId,
    inviter_id: user.id,
    invitee_id: inviteeId,
    role: safeRole,
    status: "pending",
  });

  if (error) {
    redirect(`/${locale}/app/groups/${groupId}?error=group-invite-failed`);
  }

  revalidatePath(`/${locale}/app/groups/${groupId}`);
  redirect(`/${locale}/app/groups/${groupId}?status=group-invite-sent`);
}

export async function respondGroupInvitation(formData: FormData) {
  const locale = getLocale(formData);
  const invitationId = firstString(formData.get("invitationId"));
  const response = firstString(formData.get("response"));
  const returnTo = firstString(formData.get("returnTo")) || "groups";
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/groups`);
  }

  if (!invitationId || !["accepted", "declined", "canceled"].includes(response)) {
    redirect(`/${locale}/app/groups?error=group-invitation-response-failed`);
  }

  const { data: invitation } = await supabase
    .from("group_invitations")
    .select("*")
    .eq("id", invitationId)
    .eq("status", "pending")
    .maybeSingle();

  if (!invitation) {
    redirect(`/${locale}/app/groups?error=group-invitation-response-failed`);
  }

  const canRespond =
    (response === "canceled" && invitation.inviter_id === user.id) ||
    (["accepted", "declined"].includes(response) && invitation.invitee_id === user.id);

  if (!canRespond) {
    redirect(`/${locale}/app/groups?error=group-invitation-response-failed`);
  }

  const { error: updateError } = await supabase
    .from("group_invitations")
    .update({
      status: response as "accepted" | "declined" | "canceled",
      responded_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  if (updateError) {
    redirect(`/${locale}/app/groups?error=group-invitation-response-failed`);
  }

  if (response === "accepted") {
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: invitation.group_id,
      user_id: user.id,
      role: invitation.role,
    });

    if (memberError) {
      redirect(`/${locale}/app/groups?error=group-invitation-response-failed`);
    }
  }

  const destination =
    returnTo === "detail"
      ? `/${locale}/app/groups/${invitation.group_id}`
      : `/${locale}/app/groups`;

  revalidatePath(destination);
  redirect(`${destination}?status=group-invitation-${response}`);
}

export async function removeGroupMember(formData: FormData) {
  const locale = getLocale(formData);
  const groupId = getGroupId(formData);
  const memberId = firstString(formData.get("memberId"));
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/groups`);
  }

  if (!groupId || !memberId) {
    redirect(`/${locale}/app/groups/${groupId}?error=group-member-remove-failed`);
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("id", memberId)
    .eq("group_id", groupId);

  if (error) {
    redirect(`/${locale}/app/groups/${groupId}?error=group-member-remove-failed`);
  }

  revalidatePath(`/${locale}/app/groups/${groupId}`);
  redirect(`/${locale}/app/groups/${groupId}?status=group-member-removed`);
}

export async function updateGroupMemberRole(formData: FormData) {
  const locale = getLocale(formData);
  const groupId = getGroupId(formData);
  const memberId = firstString(formData.get("memberId"));
  const role = firstString(formData.get("role")) as GroupRole;
  const safeRole = groupRoles.includes(role) ? role : "member";
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/groups`);
  }

  if (!groupId || !memberId) {
    redirect(`/${locale}/app/groups/${groupId}?error=group-role-update-failed`);
  }

  const { error } = await supabase
    .from("group_members")
    .update({ role: safeRole })
    .eq("id", memberId)
    .eq("group_id", groupId);

  if (error) {
    redirect(`/${locale}/app/groups/${groupId}?error=group-role-update-failed`);
  }

  revalidatePath(`/${locale}/app/groups/${groupId}`);
  redirect(`/${locale}/app/groups/${groupId}?status=group-role-updated`);
}

export async function linkChallengeToGroup(formData: FormData) {
  const locale = getLocale(formData);
  const groupId = getGroupId(formData);
  const challengeId = getChallengeId(formData);
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/groups`);
  }

  if (!groupId || !challengeId) {
    redirect(`/${locale}/app/groups/${groupId}?error=group-challenge-link-failed`);
  }

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, owner_id")
    .eq("id", challengeId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!challenge) {
    redirect(`/${locale}/app/groups/${groupId}?error=group-challenge-link-failed`);
  }

  const { error } = await supabase.from("group_challenges").insert({
    group_id: groupId,
    challenge_id: challengeId,
    created_by: user.id,
  });

  if (error) {
    redirect(`/${locale}/app/groups/${groupId}?error=group-challenge-link-failed`);
  }

  await supabase
    .from("challenges")
    .update({ visibility: "group" })
    .eq("id", challengeId)
    .eq("owner_id", user.id);

  revalidatePath(`/${locale}/app/groups/${groupId}`);
  redirect(`/${locale}/app/groups/${groupId}?status=group-challenge-linked`);
}

export async function unlinkChallengeFromGroup(formData: FormData) {
  const locale = getLocale(formData);
  const groupId = getGroupId(formData);
  const groupChallengeId = firstString(formData.get("groupChallengeId"));
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/groups`);
  }

  if (!groupId || !groupChallengeId) {
    redirect(`/${locale}/app/groups/${groupId}?error=group-challenge-unlink-failed`);
  }

  const { error } = await supabase
    .from("group_challenges")
    .delete()
    .eq("id", groupChallengeId)
    .eq("group_id", groupId);

  if (error) {
    redirect(`/${locale}/app/groups/${groupId}?error=group-challenge-unlink-failed`);
  }

  revalidatePath(`/${locale}/app/groups/${groupId}`);
  redirect(`/${locale}/app/groups/${groupId}?status=group-challenge-unlinked`);
}

export async function sendGroupMessage(formData: FormData) {
  const locale = getLocale(formData);
  const groupId = getGroupId(formData);
  const body = truncate(firstString(formData.get("body")), maxMessageLength);
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/groups`);
  }

  if (!groupId || !body) {
    redirect(`/${locale}/app/groups/${groupId}?error=message-send-failed`);
  }

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    group_id: groupId,
    body,
  });

  if (error) {
    redirect(`/${locale}/app/groups/${groupId}?error=message-send-failed`);
  }

  revalidatePath(`/${locale}/app/groups/${groupId}`);
  redirect(`/${locale}/app/groups/${groupId}?status=message-sent`);
}

export async function sendChallengeMessage(formData: FormData) {
  const locale = getLocale(formData);
  const challengeId = getChallengeId(formData);
  const body = truncate(firstString(formData.get("body")), maxMessageLength);
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app`);
  }

  if (!challengeId || !body) {
    redirect(workspaceErrorUrl(locale, challengeId, "message-send-failed"));
  }

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    challenge_id: challengeId,
    body,
  });

  if (error) {
    redirect(workspaceErrorUrl(locale, challengeId, "message-send-failed"));
  }

  revalidatePath(`/${locale}/app/challenges/${challengeId}`);
  redirect(workspaceStatusUrl(locale, challengeId, "message-sent"));
}

export async function softDeleteMessage(formData: FormData) {
  const locale = getLocale(formData);
  const messageId = getMessageId(formData);
  const groupId = getGroupId(formData);
  const challengeId = getChallengeId(formData);
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app`);
  }

  const destination = groupId
    ? `/${locale}/app/groups/${groupId}`
    : `/${locale}/app/challenges/${challengeId}`;

  if (!messageId || (!groupId && !challengeId)) {
    redirect(`${destination}?error=message-delete-failed`);
  }

  const { error } = await supabase
    .from("messages")
    .update({ is_deleted: true })
    .eq("id", messageId);

  if (error) {
    redirect(`${destination}?error=message-delete-failed`);
  }

  revalidatePath(destination);
  redirect(`${destination}?status=message-deleted`);
}

export async function markNotificationRead(formData: FormData) {
  const locale = getLocale(formData);
  const notificationId = firstString(formData.get("notificationId"));
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/notifications`);
  }

  if (!notificationId) {
    redirect(`/${locale}/app/notifications?error=notification-read-failed`);
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/${locale}/app/notifications?error=notification-read-failed`);
  }

  revalidatePath(`/${locale}/app/notifications`);
  redirect(`/${locale}/app/notifications?status=notification-read`);
}

export async function markAllNotificationsRead(formData: FormData) {
  const locale = getLocale(formData);
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/notifications`);
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    redirect(`/${locale}/app/notifications?error=notification-read-failed`);
  }

  revalidatePath(`/${locale}/app/notifications`);
  redirect(`/${locale}/app/notifications?status=all-notifications-read`);
}
