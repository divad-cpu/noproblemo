import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { GuestImportCard } from "./_components/guest-import-card";

type DashboardPageProps = {
  params: Promise<{ locale: Locale }>;
};

type Challenge = Database["public"]["Tables"]["challenges"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Group = Database["public"]["Tables"]["groups"]["Row"];

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
  };
}) {
  return (
    <article className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-[#22211e]">
            {challenge.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#55544f]">
            {challenge.short_description || labels.noDescription}
          </p>
        </div>
        <span className="inline-flex w-fit rounded-md border border-[#e5e2da] bg-[#fbfaf7] px-3 py-1 text-sm font-semibold text-[#373632]">
          {labels.status}: {challenge.status}
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

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Dashboard" });
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
    { data: groupMemberships },
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
      .from("group_members")
      .select("id, role, group_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);
  const groupIds = (groupMemberships ?? []).map((membership) => membership.group_id);
  const { data: dashboardGroups } =
    groupIds.length > 0
      ? await supabase.from("groups").select("*").in("id", groupIds)
      : { data: [] as Group[] };
  const groupMap = new Map((dashboardGroups ?? []).map((group) => [group.id, group]));

  const savedChallenges = challenges ?? [];
  const activeChallenges = savedChallenges.filter((challenge) =>
    ["draft", "active"].includes(challenge.status),
  );
  const latestChallenges = savedChallenges.slice(0, 5);
  const displayName = getDisplayName(profile, user.email);
  const cardLabels = {
    status: t("challenge.status"),
    updated: t("challenge.updated"),
    continue: t("challenge.continue"),
    noDescription: t("challenge.noDescription"),
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
          {t("eyebrow")}
        </p>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-[#22211e]">
              {displayName
                ? t("titleWithName", { name: displayName })
                : t("title")}
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-[#55544f]">
              {t("body")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
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
        </div>
      </section>

      <GuestImportCard locale={locale} />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#dad8d0] bg-white p-5">
          <p className="text-sm font-medium text-[#706f68]">
            {t("summary.total")}
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#22211e]">
            {savedChallenges.length}
          </p>
        </div>
        <div className="rounded-lg border border-[#dad8d0] bg-white p-5">
          <p className="text-sm font-medium text-[#706f68]">
            {t("summary.active")}
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#22211e]">
            {activeChallenges.length}
          </p>
        </div>
        <div className="rounded-lg border border-[#dad8d0] bg-white p-5">
          <p className="text-sm font-medium text-[#706f68]">
            {t("summary.future")}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#55544f]">
            {t("futureNote")}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          href="/app/friends"
          className="rounded-lg border border-[#dad8d0] bg-white p-5 hover:border-[#8b897f]"
        >
          <p className="text-sm font-medium text-[#706f68]">
            {t("social.friendRequests")}
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#22211e]">
            {incomingFriendRequests ?? 0}
          </p>
        </Link>
        <Link
          href="/app/groups"
          className="rounded-lg border border-[#dad8d0] bg-white p-5 hover:border-[#8b897f]"
        >
          <p className="text-sm font-medium text-[#706f68]">
            {t("social.groupInvitations")}
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#22211e]">
            {groupInvitations ?? 0}
          </p>
        </Link>
        <Link
          href="/app/groups"
          className="rounded-lg border border-[#dad8d0] bg-white p-5 hover:border-[#8b897f]"
        >
          <p className="text-sm font-medium text-[#706f68]">
            {t("social.groups")}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#55544f]">
            {groupMemberships && groupMemberships.length > 0
              ? groupMemberships
                  .map((membership) => groupMap.get(membership.group_id)?.name)
                  .filter(Boolean)
                  .join(", ")
              : t("social.noGroups")}
          </p>
        </Link>
      </section>

      {challengesError ? (
        <section className="rounded-lg border border-[#e3b8ad] bg-[#fff7f4] p-5 text-[#7a2f1d]">
          <h2 className="text-xl font-semibold">{t("errors.listTitle")}</h2>
          <p className="mt-2 text-sm leading-6">{t("errors.listBody")}</p>
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
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

        <aside className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-semibold text-[#22211e]">
            {t("recent.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#706f68]">
            {t("recent.body")}
          </p>
          <div className="mt-5 grid gap-3">
            {latestChallenges.length > 0 ? (
              latestChallenges.map((challenge) => (
                <Link
                  key={challenge.id}
                  href={`/app/challenges/${challenge.id}`}
                  className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4 hover:border-[#8b897f]"
                >
                  <span className="block font-semibold text-[#22211e]">
                    {challenge.title}
                  </span>
                  <span className="mt-1 block text-sm text-[#706f68]">
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
        </aside>
      </section>
    </div>
  );
}
