import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ChallengeStatus, Database } from "@/lib/supabase/types";
import { GuestImportCard } from "./_components/guest-import-card";

type DashboardPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Challenge = Database["public"]["Tables"]["challenges"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ActivityEvent = Database["public"]["Tables"]["activity_events"]["Row"];

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getDisplayName(profile: Profile | null, email?: string) {
  return profile?.display_name || email || "";
}

function getQueryValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

const statusKeys = ["account-created", "email-confirmed"] as const;

function isKnownKey<T extends readonly string[]>(
  value: string | undefined,
  keys: T,
): value is T[number] {
  return !!value && keys.includes(value);
}

function ChallengeCard({
  challenge,
  locale,
  labels,
}: {
  challenge: Challenge;
  locale: Locale;
  labels: {
    status: string;
    updated: string;
    continue: string;
    noDescription: string;
    statuses: Record<ChallengeStatus, string>;
  };
}) {
  return (
    <article className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-xl font-semibold text-[#22211e]">
            {challenge.title}
          </h3>
          <p className="mt-2 break-words text-sm leading-6 text-[#55544f]">
            {challenge.short_description || labels.noDescription}
          </p>
        </div>
        <span className="inline-flex w-fit rounded-md border border-[#e5e2da] bg-[#fbfaf7] px-3 py-1 text-sm font-semibold text-[#373632]">
          {labels.status}: {labels.statuses[challenge.status]}
        </span>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#706f68]">
          {labels.updated}: {formatDate(challenge.updated_at, locale)}
        </p>
        <Link
          href={`/app/challenges/${challenge.id}`}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#22211e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a3832]"
        >
          {labels.continue}
        </Link>
      </div>
    </article>
  );
}

export default async function DashboardPage({
  params,
  searchParams,
}: DashboardPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  const status = getQueryValue(query, "status");
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app`);
  }

  const [
    { data: profile },
    { data: challenges, error: challengesError },
    { count: incomingFriendRequests },
    { count: groupInvitations },
    { count: unreadNotifications },
    { data: activityEvents },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("challenges")
      .select("*")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("friend_requests")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("group_invitations")
      .select("id", { count: "exact", head: true })
      .eq("invitee_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
    supabase
      .from("activity_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const savedChallenges = challenges ?? [];
  const activeChallenges = savedChallenges.filter((challenge) =>
    ["draft", "active"].includes(challenge.status),
  );
  const latestChallenges = savedChallenges.slice(0, 5);
  const recentActivity = (activityEvents ?? []) as ActivityEvent[];
  const pendingTotal =
    (incomingFriendRequests ?? 0) + (groupInvitations ?? 0) + (unreadNotifications ?? 0);
  const displayName = getDisplayName(profile, user.email);
  const cardLabels = {
    status: t("challenge.status"),
    updated: t("challenge.updated"),
    continue: t("challenge.continue"),
    noDescription: t("challenge.noDescription"),
    statuses: {
      draft: t("challenge.statuses.draft"),
      active: t("challenge.statuses.active"),
      completed: t("challenge.statuses.completed"),
      archived: t("challenge.statuses.archived"),
    },
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 max-w-3xl break-words text-3xl font-semibold leading-tight text-[#22211e] sm:text-4xl">
          {displayName
            ? t("titleWithName", { name: displayName })
            : t("title")}
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-[#55544f]">
          {t("body")}
        </p>
        <div className="mt-6 grid gap-3 border-t border-[#e5e2da] pt-5 sm:grid-cols-3">
          <div>
            <p className="text-sm text-[#706f68]">{t("summary.total")}</p>
            <p className="mt-1 text-2xl font-semibold text-[#22211e]">
              {savedChallenges.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#706f68]">{t("summary.active")}</p>
            <p className="mt-1 text-2xl font-semibold text-[#22211e]">
              {activeChallenges.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#706f68]">{t("summary.pending")}</p>
            <p className="mt-1 text-2xl font-semibold text-[#22211e]">
              {pendingTotal}
            </p>
          </div>
        </div>
      </section>

      {isKnownKey(status, statusKeys) ? (
        <p className="rounded-md border border-[#cbd8c5] bg-[#f6fbf4] p-4 text-sm leading-6 text-[#2f5f2d]">
          {t(`status.${status}`)}
        </p>
      ) : null}

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-[#22211e]">
          {t("quick.title")}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <Link
            href="/app/challenges/new"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]"
          >
            {t("actions.newChallenge")}
          </Link>
          <Link
            href="/app/settings"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-5 py-3 font-semibold text-[#22211e] hover:border-[#8b897f]"
          >
            {t("actions.settings")}
          </Link>
        </div>
      </section>

      <GuestImportCard locale={locale} />

      {challengesError ? (
        <section className="rounded-lg border border-[#e3b8ad] bg-[#fff7f4] p-5 text-[#7a2f1d]">
          <h2 className="text-xl font-semibold">{t("errors.listTitle")}</h2>
          <p className="mt-2 text-sm leading-6">{t("errors.listBody")}</p>
        </section>
      ) : null}

      <section id="active-challenges" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#22211e]">
                {t("active.title")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#706f68]">
                {t("active.body")}
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            {activeChallenges.length > 0 ? (
              activeChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  locale={locale}
                  labels={cardLabels}
                />
              ))
            ) : (
              <div className="rounded-lg border border-[#dad8d0] bg-white p-6">
                <h3 className="text-xl font-semibold text-[#22211e]">
                  {t("empty.title")}
                </h3>
                <p className="mt-2 leading-7 text-[#55544f]">{t("empty.body")}</p>
                <Link
                  href="/app/challenges/new"
                  className="mt-5 inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]"
                >
                  {t("empty.action")}
                </Link>
              </div>
            )}
          </div>
        </div>

        <aside className="grid gap-5">
          <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-[#22211e]">
              {t("pending.title")}
            </h2>
            <div className="mt-4 grid gap-2">
              <Link
                href="/app/friends"
                className="flex items-center justify-between rounded-md border border-[#e5e2da] bg-[#fbfaf7] px-4 py-3 hover:border-[#8b897f]"
              >
                <span className="text-sm text-[#55544f]">
                  {t("social.friendRequests")}
                </span>
                <span className="font-semibold text-[#22211e]">
                  {incomingFriendRequests ?? 0}
                </span>
              </Link>
              <Link
                href="/app/groups"
                className="flex items-center justify-between rounded-md border border-[#e5e2da] bg-[#fbfaf7] px-4 py-3 hover:border-[#8b897f]"
              >
                <span className="text-sm text-[#55544f]">
                  {t("social.groupInvitations")}
                </span>
                <span className="font-semibold text-[#22211e]">
                  {groupInvitations ?? 0}
                </span>
              </Link>
              <Link
                href="/app/notifications"
                className="flex items-center justify-between rounded-md border border-[#e5e2da] bg-[#fbfaf7] px-4 py-3 hover:border-[#8b897f]"
              >
                <span className="text-sm text-[#55544f]">
                  {t("social.notifications")}
                </span>
                <span className="font-semibold text-[#22211e]">
                  {unreadNotifications ?? 0}
                </span>
              </Link>
            </div>
          </section>

          <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-[#22211e]">
              {t("recent.title")}
            </h2>
            <div className="mt-4 grid gap-2">
              {latestChallenges.length > 0 ? (
                latestChallenges.map((challenge) => (
                  <Link
                    key={challenge.id}
                    href={`/app/challenges/${challenge.id}`}
                    className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-3 hover:border-[#8b897f]"
                  >
                    <span className="block break-words text-sm font-semibold text-[#22211e]">
                      {challenge.title}
                    </span>
                    <span className="mt-1 block text-xs text-[#706f68]">
                      {formatDate(challenge.updated_at, locale)}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm leading-6 text-[#55544f]">
                  {t("recent.empty")}
                </p>
              )}
            </div>
          </section>
        </aside>
      </section>

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("activity.title")}
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {recentActivity.length > 0 ? (
            recentActivity.map((event) => (
              <div
                key={event.id}
                className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4"
              >
                <p className="font-semibold text-[#22211e]">
                  {t(`activity.types.${event.type}`)}
                </p>
                <p className="mt-1 text-sm text-[#706f68]">
                  {formatDate(event.created_at, locale)}
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
