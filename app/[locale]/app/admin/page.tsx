import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ActivityType, Database } from "@/lib/supabase/types";

type AdminPageProps = {
  params: Promise<{ locale: Locale }>;
};

type OverviewCount =
  Database["public"]["Functions"]["admin_overview_counts"]["Returns"][number];
type AdminProfile =
  Database["public"]["Functions"]["admin_list_profiles"]["Returns"][number];
type AdminActivity =
  Database["public"]["Functions"]["admin_recent_activity"]["Returns"][number];
type AdminAuditLog =
  Database["public"]["Functions"]["admin_recent_audit_log"]["Returns"][number];

const activityTypes: ActivityType[] = [
  "challenge_created",
  "challenge_updated",
  "challenge_linked_to_group",
  "group_created",
  "group_updated",
  "group_member_joined",
  "group_member_removed",
  "group_message_created",
  "challenge_message_created",
  "task_updated",
  "solution_updated",
];

function formatDateTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function metricValue(counts: OverviewCount[], metric: string) {
  return counts.find((count) => count.metric === metric)?.value ?? 0;
}

function activityLabelKey(type: ActivityType) {
  return activityTypes.includes(type) ? `activity.types.${type}` : "activity.types.unknown";
}

async function requireAdmin(locale: Locale) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/admin`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    notFound();
  }

  return supabase;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Admin" });
  const supabase = await requireAdmin(locale);

  const [countsResult, profilesResult, activityResult, auditResult] =
    await Promise.all([
      supabase.rpc("admin_overview_counts", {}),
      supabase.rpc("admin_list_profiles", { profile_limit: 12 }),
      supabase.rpc("admin_recent_activity", { activity_limit: 8 }),
      supabase.rpc("admin_recent_audit_log", { audit_limit: 8 }),
    ]);

  const counts = (countsResult.data ?? []) as OverviewCount[];
  const profiles = (profilesResult.data ?? []) as AdminProfile[];
  const activity = (activityResult.data ?? []) as AdminActivity[];
  const auditLog = (auditResult.data ?? []) as AdminAuditLog[];
  const hasDataError = Boolean(
    countsResult.error ||
      profilesResult.error ||
      activityResult.error ||
      auditResult.error,
  );
  const metrics = [
    { key: "profiles", value: metricValue(counts, "profiles") },
    { key: "challenges", value: metricValue(counts, "challenges") },
    { key: "groups", value: metricValue(counts, "groups") },
    { key: "messages", value: metricValue(counts, "messages") },
    { key: "notifications", value: metricValue(counts, "notifications") },
  ];

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
          {t("eyebrow")}
        </p>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-[#22211e]">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-[#55544f]">
              {t("body")}
            </p>
          </div>
          <Link
            href="/app/admin/settings"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-5 py-3 font-semibold text-[#22211e] hover:border-[#8b897f]"
          >
            {t("actions.settings")}
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-[#d8cbb1] bg-[#fffaf0] p-5 text-[#5f4823]">
        <h2 className="text-xl font-semibold">{t("verification.title")}</h2>
        <p className="mt-2 text-sm leading-6">{t("verification.body")}</p>
        {hasDataError ? (
          <p className="mt-3 text-sm font-semibold">{t("verification.error")}</p>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="rounded-lg border border-[#dad8d0] bg-white p-5"
          >
            <p className="text-sm font-medium text-[#706f68]">
              {t(`metrics.${metric.key}`)}
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#22211e]">
              {metric.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("profiles.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#706f68]">
          {t("profiles.body")}
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-[#e5e2da] text-[#706f68]">
                <th className="py-3 pe-4 font-semibold">{t("profiles.id")}</th>
                <th className="py-3 pe-4 font-semibold">
                  {t("profiles.displayName")}
                </th>
                <th className="py-3 pe-4 font-semibold">
                  {t("profiles.locale")}
                </th>
                <th className="py-3 pe-4 font-semibold">{t("profiles.role")}</th>
                <th className="py-3 pe-4 font-semibold">
                  {t("profiles.created")}
                </th>
              </tr>
            </thead>
            <tbody>
              {profiles.length > 0 ? (
                profiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-[#f0eee8]">
                    <td className="py-3 pe-4 font-mono text-xs text-[#55544f]">
                      {profile.id}
                    </td>
                    <td className="py-3 pe-4 text-[#22211e]">
                      {profile.display_name || t("profiles.noDisplayName")}
                    </td>
                    <td className="py-3 pe-4 text-[#55544f]">
                      {profile.preferred_locale}
                    </td>
                    <td className="py-3 pe-4 text-[#55544f]">{profile.role}</td>
                    <td className="py-3 pe-4 text-[#55544f]">
                      {formatDateTime(profile.created_at, locale)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-[#55544f]" colSpan={5}>
                    {t("profiles.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-semibold text-[#22211e]">
            {t("activity.title")}
          </h2>
          <div className="mt-5 grid gap-3">
            {activity.length > 0 ? (
              activity.map((event) => (
                <div
                  key={event.id}
                  className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4"
                >
                  <p className="font-semibold text-[#22211e]">
                    {t(activityLabelKey(event.type))}
                  </p>
                  <p className="mt-1 text-sm text-[#706f68]">
                    {event.actor_display_name || event.actor_id || t("activity.noActor")}
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
        </div>

        <div className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-semibold text-[#22211e]">
            {t("audit.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#706f68]">
            {t("audit.body")}
          </p>
          <div className="mt-5 grid gap-3">
            {auditLog.length > 0 ? (
              auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4"
                >
                  <p className="font-semibold text-[#22211e]">{entry.action}</p>
                  <p className="mt-1 text-sm text-[#706f68]">
                    {entry.target_table || t("audit.noTarget")}
                  </p>
                  <p className="mt-1 text-sm text-[#706f68]">
                    {formatDateTime(entry.created_at, locale)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-[#55544f]">
                {t("audit.empty")}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
