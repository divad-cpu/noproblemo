import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ChallengeSectionKey,
  ChallengeStatus,
  Database,
} from "@/lib/supabase/types";
import {
  deleteSolution,
  deleteTask,
  saveChallengeSections,
  saveSolution,
  saveTask,
  sendChallengeMessage,
  softDeleteMessage,
  updateChallengeDetails,
} from "../../actions";
import { ChallengeMarkdownExport } from "../../_components/challenge-markdown-export";

type ChallengePageProps = {
  params: Promise<{ locale: Locale; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Challenge = Database["public"]["Tables"]["challenges"]["Row"];
type Section = Database["public"]["Tables"]["challenge_sections"]["Row"];
type Solution = Database["public"]["Tables"]["challenge_solutions"]["Row"];
type Task = Database["public"]["Tables"]["challenge_tasks"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];
type ActivityEvent = Database["public"]["Tables"]["activity_events"]["Row"];
type ProfileResult =
  Database["public"]["Functions"]["search_profiles"]["Returns"][number];

const statusKeys = [
  "created",
  "details-saved",
  "sections-saved",
  "solution-saved",
  "solution-deleted",
  "task-saved",
  "task-deleted",
  "message-sent",
  "message-deleted",
] as const;

const errorKeys = [
  "details-missing-title",
  "details-save-failed",
  "sections-save-failed",
  "solution-missing-title",
  "solution-invalid-score",
  "solution-save-failed",
  "solution-delete-failed",
  "task-missing-title",
  "task-save-failed",
  "task-delete-failed",
  "message-send-failed",
  "message-delete-failed",
] as const;

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

const statuses: ChallengeStatus[] = [
  "draft",
  "active",
  "completed",
  "archived",
];

const workflowSteps = [
  {
    key: "define",
    sections: ["problem_title", "short_description"] as ChallengeSectionKey[],
  },
  {
    key: "understand",
    sections: [
      "background_context",
      "who_is_affected",
      "why_it_matters",
      "possible_causes",
    ] as ChallengeSectionKey[],
  },
  { key: "brainstorm", sections: [] as ChallengeSectionKey[] },
  { key: "evaluate", sections: [] as ChallengeSectionKey[] },
  { key: "choose", sections: ["final_recommendation"] as ChallengeSectionKey[] },
  { key: "action", sections: [] as ChallengeSectionKey[] },
  { key: "review", sections: ["summary"] as ChallengeSectionKey[] },
] as const;

function getQueryValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function isKnownKey<T extends readonly string[]>(
  value: string | undefined,
  keys: T,
): value is T[number] {
  return !!value && keys.includes(value);
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function getProfileMap(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  ids: string[],
) {
  const entries = await Promise.all(
    [...new Set(ids)].map(async (profileId) => {
      const { data } = await supabase.rpc("search_profiles", {
        search_term: profileId,
      });

      return [profileId, data?.[0] ?? null] as const;
    }),
  );

  return new Map(entries);
}

function profileName(profile: ProfileResult | null, fallback: string) {
  return profile?.display_name || fallback;
}

function getSectionContent(sections: Section[], sectionKey: ChallengeSectionKey) {
  return sections.find((section) => section.section_key === sectionKey)?.content ?? "";
}

function numberValue(value: number | null) {
  return value === null ? "" : String(value);
}

function ExportData({
  challenge,
  sections,
  solutions,
  tasks,
  sectionLabels,
  statusLabel,
}: {
  challenge: Challenge;
  sections: Section[];
  solutions: Solution[];
  tasks: Task[];
  sectionLabels: Record<ChallengeSectionKey, string>;
  statusLabel: string;
}) {
  return (
    <ChallengeMarkdownExport
      challenge={{
        title: challenge.title,
        shortDescription: challenge.short_description ?? "",
        status: statusLabel,
      }}
      sections={sectionKeys.map((sectionKey) => ({
        key: sectionKey,
        title: sectionLabels[sectionKey],
        content: getSectionContent(sections, sectionKey),
      }))}
      solutions={solutions.map((solution) => ({
        title: solution.title,
        description: solution.description ?? "",
        pros: solution.pros ?? "",
        cons: solution.cons ?? "",
        risk: solution.risk,
        effort: solution.effort,
        impact: solution.impact,
        resourcesNeeded: solution.resources_needed ?? "",
        priority: solution.priority,
      }))}
      tasks={tasks.map((task) => ({
        title: task.title,
        description: task.description ?? "",
        responsiblePerson: task.responsible_person ?? "",
        deadline: task.deadline ?? "",
        completed: task.completed,
        position: task.position,
      }))}
    />
  );
}

function SaveMessage({
  status,
  error,
  t,
}: {
  status?: string;
  error?: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  if (isKnownKey(status, statusKeys)) {
    return (
      <p className="rounded-md border border-[#cbd8c5] bg-[#f6fbf4] p-4 text-sm leading-6 text-[#2f5f2d]">
        {t(`statusMessages.${status}`)}
      </p>
    );
  }

  if (isKnownKey(error, errorKeys)) {
    return (
      <p className="rounded-md border border-[#e3b8ad] bg-[#fff7f4] p-4 text-sm leading-6 text-[#7a2f1d]">
        {t(`errorMessages.${error}`)}
      </p>
    );
  }

  return null;
}

function scoreOptions(t: Awaited<ReturnType<typeof getTranslations>>) {
  return (
    <>
      <option value="">{t("fields.none")}</option>
      {[1, 2, 3, 4, 5].map((score) => (
        <option key={score} value={score}>
          {score}
        </option>
      ))}
    </>
  );
}

export default async function ChallengePage({
  params,
  searchParams,
}: ChallengePageProps) {
  const { locale, id } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Workspace" });
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app`);
  }

  const [
    { data: challenge },
    { data: sections },
    { data: solutions },
    { data: tasks },
    { data: messages },
    { data: activityEvents },
    { data: groupLinks },
  ] = await Promise.all([
      supabase
        .from("challenges")
        .select("*")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("challenge_sections")
        .select("*")
        .eq("challenge_id", id)
        .order("position", { ascending: true }),
      supabase
        .from("challenge_solutions")
        .select("*")
        .eq("challenge_id", id)
        .order("priority", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("challenge_tasks")
        .select("*")
        .eq("challenge_id", id)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("messages")
        .select("*")
        .eq("challenge_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("activity_events")
        .select("*")
        .eq("challenge_id", id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("group_challenges")
        .select("group_id")
        .eq("challenge_id", id),
    ]);

  if (!challenge) {
    notFound();
  }

  const savedSections = sections ?? [];
  const savedSolutions = solutions ?? [];
  const savedTasks = tasks ?? [];
  const savedMessages = (messages ?? []) as Message[];
  const savedActivityEvents = (activityEvents ?? []) as ActivityEvent[];
  const groupIds = (groupLinks ?? []).map((link) => link.group_id);
  const { data: currentUserMemberships } =
    groupIds.length > 0
      ? await supabase
          .from("group_members")
          .select("role")
          .in("group_id", groupIds)
          .eq("user_id", user.id)
      : { data: [] };
  const canSendMessage =
    challenge.owner_id === user.id ||
    (currentUserMemberships ?? []).some((membership) =>
      ["owner", "admin", "member"].includes(membership.role),
    );
  const profiles = await getProfileMap(supabase, [
    ...savedMessages.flatMap((message) =>
      message.sender_id ? [message.sender_id] : [],
    ),
    ...savedActivityEvents.flatMap((event) =>
      event.actor_id ? [event.actor_id] : [],
    ),
  ]);
  const status = getQueryValue(query, "status");
  const error = getQueryValue(query, "error");
  const sectionLabels = Object.fromEntries(
    sectionKeys.map((sectionKey) => [
      sectionKey,
      t(`sections.${sectionKey}.title`),
    ]),
  ) as Record<ChallengeSectionKey, string>;

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-8">
        <Link
          href="/app"
          className="text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
        >
          {t("back")}
        </Link>

        <div className="mt-6 grid gap-4">
          <SaveMessage status={status} error={error} t={t} />
        </div>

        <p className="mt-6 text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
          {t("eyebrow")}
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-4xl font-semibold leading-tight text-[#22211e]">
              {challenge.title}
            </h1>
            <p className="mt-4 max-w-3xl break-words leading-7 text-[#55544f]">
              {challenge.short_description || t("noDescription")}
            </p>
            <p className="mt-3 text-sm text-[#706f68]">
              {t("updated")}: {formatDate(challenge.updated_at, locale)}
            </p>
          </div>
          <span className="inline-flex w-fit rounded-md border border-[#e5e2da] bg-[#fbfaf7] px-3 py-1 text-sm font-semibold text-[#373632]">
            {t("fields.status")}: {t(`statuses.${challenge.status}`)}
          </span>
        </div>
      </section>

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("details.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#55544f]">
          {t("details.body")}
        </p>
        <form action={updateChallengeDetails} className="mt-5 grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="challengeId" value={challenge.id} />
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#373632]">
              {t("fields.title")}
            </span>
            <input
              name="title"
              type="text"
              required
              maxLength={160}
              defaultValue={challenge.title}
              className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#373632]">
              {t("fields.shortDescription")}
            </span>
            <textarea
              name="shortDescription"
              rows={3}
              maxLength={500}
              defaultValue={challenge.short_description ?? ""}
              className="min-h-24 resize-y rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#373632]">
              {t("fields.status")}
            </span>
            <select
              name="status"
              defaultValue={challenge.status}
              className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e]"
            >
              {statuses.map((option) => (
                <option key={option} value={option}>
                  {t(`statuses.${option}`)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]"
          >
            {t("actions.saveDetails")}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("workflow.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#55544f]">
          {t("workflow.body")}
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {workflowSteps.map((step, index) => (
            <article
              key={step.key}
              className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4"
            >
              <span className="text-sm font-semibold text-[#706f68]">
                {index + 1}
              </span>
              <h3 className="mt-2 font-semibold text-[#22211e]">
                {t(`workflow.steps.${step.key}.title`)}
              </h3>
              <p className="mt-1 text-sm leading-6 text-[#55544f]">
                {t(`workflow.steps.${step.key}.body`)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <form
        action={saveChallengeSections}
        className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6"
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="challengeId" value={challenge.id} />
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("sectionsTitle")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#55544f]">
          {t("sectionsBody")}
        </p>
        <div className="mt-6 grid gap-6">
          {workflowSteps
            .filter((step) => step.sections.length > 0)
            .map((step) => (
              <section key={step.key} className="grid gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#22211e]">
                    {t(`workflow.steps.${step.key}.title`)}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#706f68]">
                    {t(`workflow.steps.${step.key}.body`)}
                  </p>
                </div>
                {step.sections.map((sectionKey) => (
                  <label key={sectionKey} className="grid gap-2">
                    <span className="text-sm font-semibold text-[#373632]">
                      {t(`sections.${sectionKey}.title`)}
                    </span>
                    <span className="text-sm leading-6 text-[#706f68]">
                      {t(`sections.${sectionKey}.help`)}
                    </span>
                    <textarea
                      name={sectionKey}
                      rows={sectionKey === "summary" ? 4 : 5}
                      defaultValue={getSectionContent(savedSections, sectionKey)}
                      className="min-h-28 resize-y rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e]"
                    />
                  </label>
                ))}
              </section>
            ))}
        </div>
        <button
          type="submit"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]"
        >
          {t("actions.saveSections")}
        </button>
      </form>

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("solutions.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#55544f]">
          {t("solutions.body")}
        </p>
        <div className="mt-6 grid gap-5">
          {savedSolutions.map((solution) => (
            <article
              key={solution.id}
              className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4"
            >
              <form action={saveSolution} className="grid gap-4">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="challengeId" value={challenge.id} />
                <input type="hidden" name="solutionId" value={solution.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[#373632]">
                      {t("solutions.fields.title")}
                    </span>
                    <input
                      name="title"
                      required
                      defaultValue={solution.title}
                      className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[#373632]">
                      {t("solutions.fields.priority")}
                    </span>
                    <input
                      name="priority"
                      type="number"
                      defaultValue={numberValue(solution.priority)}
                      className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                    />
                  </label>
                </div>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#373632]">
                    {t("solutions.fields.description")}
                  </span>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={solution.description ?? ""}
                    className="min-h-24 resize-y rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[#373632]">
                      {t("solutions.fields.pros")}
                    </span>
                    <textarea
                      name="pros"
                      rows={3}
                      defaultValue={solution.pros ?? ""}
                      className="min-h-24 resize-y rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[#373632]">
                      {t("solutions.fields.cons")}
                    </span>
                    <textarea
                      name="cons"
                      rows={3}
                      defaultValue={solution.cons ?? ""}
                      className="min-h-24 resize-y rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {(["risk", "effort", "impact"] as const).map((field) => (
                    <label key={field} className="grid gap-2">
                      <span className="text-sm font-semibold text-[#373632]">
                        {t(`solutions.fields.${field}`)}
                      </span>
                      <select
                        name={field}
                        defaultValue={numberValue(solution[field])}
                        className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                      >
                        {scoreOptions(t)}
                      </select>
                    </label>
                  ))}
                </div>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#373632]">
                    {t("solutions.fields.resourcesNeeded")}
                  </span>
                  <textarea
                    name="resourcesNeeded"
                    rows={2}
                    defaultValue={solution.resources_needed ?? ""}
                    className="min-h-20 resize-y rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#22211e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a3832]"
                  >
                    {t("actions.saveSolution")}
                  </button>
                </div>
              </form>
              <form action={deleteSolution} className="mt-3">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="challengeId" value={challenge.id} />
                <input type="hidden" name="solutionId" value={solution.id} />
                <button
                  type="submit"
                  className="text-sm font-semibold text-[#7a2f1d] underline-offset-4 hover:underline"
                >
                  {t("actions.deleteSolution")}
                </button>
              </form>
            </article>
          ))}

          <article className="rounded-md border border-[#dad8d0] bg-white p-4">
            <h3 className="text-xl font-semibold text-[#22211e]">
              {t("solutions.newTitle")}
            </h3>
            <form action={saveSolution} className="mt-4 grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="challengeId" value={challenge.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="title"
                  required
                  aria-label={t("solutions.fields.title")}
                  placeholder={t("solutions.fields.title")}
                  className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                />
                <input
                  name="priority"
                  type="number"
                  aria-label={t("solutions.fields.priority")}
                  placeholder={t("solutions.fields.priority")}
                  className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                />
              </div>
              <textarea
                name="description"
                rows={3}
                aria-label={t("solutions.fields.description")}
                placeholder={t("solutions.fields.description")}
                className="min-h-24 resize-y rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <textarea
                  name="pros"
                  rows={3}
                  aria-label={t("solutions.fields.pros")}
                  placeholder={t("solutions.fields.pros")}
                  className="min-h-24 resize-y rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                />
                <textarea
                  name="cons"
                  rows={3}
                  aria-label={t("solutions.fields.cons")}
                  placeholder={t("solutions.fields.cons")}
                  className="min-h-24 resize-y rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {(["risk", "effort", "impact"] as const).map((field) => (
                  <label key={field} className="grid gap-2">
                    <span className="text-sm font-semibold text-[#373632]">
                      {t(`solutions.fields.${field}`)}
                    </span>
                    <select
                      name={field}
                      className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                    >
                      {scoreOptions(t)}
                    </select>
                  </label>
                ))}
              </div>
              <textarea
                name="resourcesNeeded"
                rows={2}
                aria-label={t("solutions.fields.resourcesNeeded")}
                placeholder={t("solutions.fields.resourcesNeeded")}
                className="min-h-20 resize-y rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
              />
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#22211e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a3832]"
              >
                {t("actions.addSolution")}
              </button>
            </form>
          </article>
        </div>
      </section>

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("tasks.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#55544f]">{t("tasks.body")}</p>
        <div className="mt-6 grid gap-5">
          {savedTasks.map((task) => (
            <article
              key={task.id}
              className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4"
            >
              <form action={saveTask} className="grid gap-4">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="challengeId" value={challenge.id} />
                <input type="hidden" name="taskId" value={task.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[#373632]">
                      {t("tasks.fields.title")}
                    </span>
                    <input
                      name="title"
                      required
                      defaultValue={task.title}
                      className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[#373632]">
                      {t("tasks.fields.position")}
                    </span>
                    <input
                      name="position"
                      type="number"
                      defaultValue={task.position}
                      className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                    />
                  </label>
                </div>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={task.description ?? ""}
                  placeholder={t("tasks.fields.description")}
                  className="min-h-24 resize-y rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="responsiblePerson"
                    defaultValue={task.responsible_person ?? ""}
                    placeholder={t("tasks.fields.responsiblePerson")}
                    className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                  />
                  <input
                    name="deadline"
                    type="date"
                    defaultValue={task.deadline ?? ""}
                    className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                  />
                </div>
                <label className="flex items-center gap-3 text-sm font-semibold text-[#373632]">
                  <input
                    name="completed"
                    type="checkbox"
                    defaultChecked={task.completed}
                    className="h-4 w-4"
                  />
                  {t("tasks.fields.completed")}
                </label>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#22211e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a3832]"
                >
                  {t("actions.saveTask")}
                </button>
              </form>
              <form action={deleteTask} className="mt-3">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="challengeId" value={challenge.id} />
                <input type="hidden" name="taskId" value={task.id} />
                <button
                  type="submit"
                  className="text-sm font-semibold text-[#7a2f1d] underline-offset-4 hover:underline"
                >
                  {t("actions.deleteTask")}
                </button>
              </form>
            </article>
          ))}

          <article className="rounded-md border border-[#dad8d0] bg-white p-4">
            <h3 className="text-xl font-semibold text-[#22211e]">
              {t("tasks.newTitle")}
            </h3>
            <form action={saveTask} className="mt-4 grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="challengeId" value={challenge.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="title"
                  required
                  aria-label={t("tasks.fields.title")}
                  placeholder={t("tasks.fields.title")}
                  className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                />
                <input
                  name="position"
                  type="number"
                  aria-label={t("tasks.fields.position")}
                  placeholder={t("tasks.fields.position")}
                  className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                />
              </div>
              <textarea
                name="description"
                rows={3}
                aria-label={t("tasks.fields.description")}
                placeholder={t("tasks.fields.description")}
                className="min-h-24 resize-y rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="responsiblePerson"
                  aria-label={t("tasks.fields.responsiblePerson")}
                  placeholder={t("tasks.fields.responsiblePerson")}
                  className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                />
                <input
                  name="deadline"
                  type="date"
                  aria-label={t("tasks.fields.deadline")}
                  className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-[#161616]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#22211e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a3832]"
              >
                {t("actions.addTask")}
              </button>
            </form>
          </article>
        </div>
      </section>

      <ExportData
        challenge={challenge}
        sections={savedSections}
        solutions={savedSolutions}
        tasks={savedTasks}
        sectionLabels={sectionLabels}
        statusLabel={t(`statuses.${challenge.status}`)}
      />

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("messages.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#55544f]">
          {t("messages.body")}
        </p>
        {canSendMessage ? (
          <form action={sendChallengeMessage} className="mt-5 grid gap-3">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="challengeId" value={challenge.id} />
            <textarea
              name="body"
              required
              maxLength={2000}
              rows={3}
              aria-label={t("messages.placeholder")}
              placeholder={t("messages.placeholder")}
              className="min-h-24 resize-y rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e]"
            />
            <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#22211e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a3832]">
              {t("messages.send")}
            </button>
          </form>
        ) : (
          <p className="mt-4 rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4 text-sm leading-6 text-[#55544f]">
            {t("messages.viewerReadOnly")}
          </p>
        )}
        <div className="mt-5 grid gap-3">
          {savedMessages.length > 0 ? (
            savedMessages.map((message) => (
              <ChallengeMessageRow
                key={message.id}
                message={message}
                locale={locale}
                challengeId={challenge.id}
                author={profileName(
                  message.sender_id
                    ? profiles.get(message.sender_id) ?? null
                    : null,
                  t("messages.unknownSender"),
                )}
                t={t}
                canDelete={message.sender_id === user.id}
              />
            ))
          ) : (
            <p className="text-sm leading-6 text-[#55544f]">
              {t("messages.empty")}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("activity.title")}
        </h2>
        <div className="mt-5 grid gap-3">
          {savedActivityEvents.length > 0 ? (
            savedActivityEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4"
              >
                <p className="font-semibold text-[#22211e]">
                  {t(`activity.types.${event.type}`)}
                </p>
                <p className="mt-1 text-sm text-[#706f68]">
                  {formatDateTime(event.created_at, locale)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-[#55544f]">
              {t("activity.empty")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function ChallengeMessageRow({
  message,
  locale,
  challengeId,
  author,
  t,
  canDelete,
}: {
  message: Message;
  locale: Locale;
  challengeId: string;
  author: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
  canDelete: boolean;
}) {
  return (
    <article className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words font-semibold text-[#22211e]">{author}</p>
          <p className="text-sm text-[#706f68]">
            {formatDateTime(message.created_at, locale)}
          </p>
        </div>
        {canDelete && !message.is_deleted ? (
          <form action={softDeleteMessage}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="challengeId" value={challengeId} />
            <input type="hidden" name="messageId" value={message.id} />
            <button className="text-sm font-semibold text-[#7a2f1d] underline-offset-4 hover:underline">
              {t("messages.delete")}
            </button>
          </form>
        ) : null}
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#373632]">
        {message.is_deleted ? t("messages.deleted") : message.body}
      </p>
    </article>
  );
}
