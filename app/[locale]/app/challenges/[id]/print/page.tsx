import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ChallengeSectionKey, Database } from "@/lib/supabase/types";
import { ChallengePrintControls } from "../../../_components/challenge-print-controls";
import { ChallengePrintReport } from "../../../_components/challenge-print-report";

type ChallengePrintPageProps = {
  params: Promise<{ locale: Locale; id: string }>;
};

type Challenge = Database["public"]["Tables"]["challenges"]["Row"];
type Section = Database["public"]["Tables"]["challenge_sections"]["Row"];
type Solution = Database["public"]["Tables"]["challenge_solutions"]["Row"];
type Task = Database["public"]["Tables"]["challenge_tasks"]["Row"];

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

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getSectionContent(sections: Section[], sectionKey: ChallengeSectionKey) {
  return sections.find((section) => section.section_key === sectionKey)?.content ?? "";
}

function buildReportLabels(t: Awaited<ReturnType<typeof getTranslations>>) {
  return {
    reportTitle: t("export.reportTitle"),
    status: t("export.status"),
    createdAt: t("export.createdAt"),
    updatedAt: t("export.updatedAt"),
    emptyReport: t("export.emptyReport"),
    solutions: t("export.solutions"),
    pros: t("export.pros"),
    cons: t("export.cons"),
    risk: t("export.risk"),
    effort: t("export.effort"),
    impact: t("export.impact"),
    resourcesNeeded: t("export.resourcesNeeded"),
    priority: t("export.priority"),
    tasks: t("export.tasks"),
    task: t("export.task"),
    responsiblePerson: t("export.responsiblePerson"),
    deadline: t("export.deadline"),
    completed: t("export.completed"),
    yes: t("export.yes"),
    no: t("export.no"),
  };
}

export default async function ChallengePrintPage({
  params,
}: ChallengePrintPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Workspace" });
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/${locale}/login?error=auth-required&next=/${locale}/app/challenges/${id}/print`,
    );
  }

  const [
    { data: challenge },
    { data: sections },
    { data: solutions },
    { data: tasks },
  ] = await Promise.all([
    supabase.from("challenges").select("*").eq("id", id).maybeSingle(),
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
  ]);

  if (!challenge) {
    notFound();
  }

  const savedSections = (sections ?? []) as Section[];
  const savedSolutions = (solutions ?? []) as Solution[];
  const savedTasks = (tasks ?? []) as Task[];
  const sectionLabels = Object.fromEntries(
    sectionKeys.map((sectionKey) => [
      sectionKey,
      t(`sections.${sectionKey}.title`),
    ]),
  ) as Record<ChallengeSectionKey, string>;

  return (
    <section className="print-report-page rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-8">
      <ChallengePrintControls
        backHref={`/app/challenges/${id}`}
        backLabel={t("export.backToChallenge")}
        printLabel={t("export.printButton")}
      />

      <ChallengePrintReport
        labels={buildReportLabels(t)}
        challenge={{
          title: (challenge as Challenge).title,
          shortDescription: (challenge as Challenge).short_description ?? "",
          status: t(`statuses.${(challenge as Challenge).status}`),
          createdAt: formatDate((challenge as Challenge).created_at, locale),
          updatedAt: formatDate((challenge as Challenge).updated_at, locale),
        }}
        sections={sectionKeys.map((sectionKey) => ({
          key: sectionKey,
          title: sectionLabels[sectionKey],
          content: getSectionContent(savedSections, sectionKey),
        }))}
        solutions={savedSolutions.map((solution) => ({
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
        tasks={savedTasks.map((task) => ({
          title: task.title,
          description: task.description ?? "",
          responsiblePerson: task.responsible_person ?? "",
          deadline: task.deadline ?? "",
          completed: task.completed,
        }))}
      />
    </section>
  );
}
