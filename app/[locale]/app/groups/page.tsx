import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { respondGroupInvitation } from "../actions";

type GroupsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Group = Database["public"]["Tables"]["groups"]["Row"];
type PendingGroupInvitation =
  Database["public"]["Functions"]["pending_group_invitations"]["Returns"][number];

const statusKeys = [
  "group-invitation-accepted",
  "group-invitation-declined",
  "group-invitation-canceled",
] as const;

const errorKeys = ["group-invitation-response-failed"] as const;

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

export default async function GroupsPage({ params, searchParams }: GroupsPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Groups" });
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/groups`);
  }

  const status = getQueryValue(query, "status");
  const error = getQueryValue(query, "error");
  const [
    { data: memberships },
    { data: invitations },
    { data: pendingInvitationDetails },
  ] = await Promise.all([
    supabase
      .from("group_members")
      .select("id, role, group_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("group_invitations")
      .select("*")
      .eq("invitee_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase.rpc("pending_group_invitations"),
  ]);
  const memberGroupIds = (memberships ?? []).map(
    (membership) => membership.group_id,
  );
  const { data: groups } =
    memberGroupIds.length > 0
      ? await supabase.from("groups").select("*").in("id", memberGroupIds)
      : { data: [] as Group[] };
  const groupMap = new Map((groups ?? []).map((group) => [group.id, group]));
  const pendingInvitationMap = new Map(
    ((pendingInvitationDetails ?? []) as PendingGroupInvitation[]).map(
      (invitation) => [invitation.invitation_id, invitation],
    ),
  );

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
          {t("eyebrow")}
        </p>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-[#22211e]">{t("title")}</h1>
            <p className="mt-4 max-w-3xl leading-7 text-[#55544f]">{t("body")}</p>
          </div>
          <Link
            href="/app/groups/new"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]"
          >
            {t("create")}
          </Link>
        </div>
      </section>

      {isKnownKey(status, statusKeys) ? (
        <p className="rounded-md border border-[#cbd8c5] bg-[#f6fbf4] p-4 text-sm leading-6 text-[#2f5f2d]">
          {t(`status.${status}`)}
        </p>
      ) : null}
      {isKnownKey(error, errorKeys) ? (
        <p className="rounded-md border border-[#e3b8ad] bg-[#fff7f4] p-4 text-sm leading-6 text-[#7a2f1d]">
          {t(`errors.${error}`)}
        </p>
      ) : null}

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("invitations.title")}
        </h2>
        <div className="mt-5 grid gap-3">
          {invitations && invitations.length > 0 ? (
            invitations.map((invitation) => {
              const pendingDetails = pendingInvitationMap.get(invitation.id);
              const safePendingDetails =
                pendingDetails?.group_id === invitation.group_id
                  ? pendingDetails
                  : null;

              return (
                <div
                  key={invitation.id}
                  className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4"
                >
                  <p className="break-words font-semibold text-[#22211e]">
                    {safePendingDetails?.group_name ?? t("unnamed")}
                  </p>
                  <p className="mt-1 text-sm text-[#706f68]">
                    {t("role")}: {t(`roles.${safePendingDetails?.invited_role ?? invitation.role}`)}
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    {(["accepted", "declined"] as const).map((response) => (
                      <form key={response} action={respondGroupInvitation}>
                        <input type="hidden" name="locale" value={locale} />
                        <input
                          type="hidden"
                          name="invitationId"
                          value={invitation.id}
                        />
                        <input type="hidden" name="response" value={response} />
                        <button className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-4 py-2 text-sm font-semibold text-[#22211e] hover:border-[#8b897f]">
                          {t(`invitations.${response}`)}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm leading-6 text-[#55544f]">
              {t("invitations.empty")}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("mine.title")}
        </h2>
        <div className="mt-5 grid gap-3">
          {memberships && memberships.length > 0 ? (
            memberships.map((membership) => (
              <Link
                key={membership.id}
                href={`/app/groups/${membership.group_id}`}
                className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4 hover:border-[#8b897f]"
              >
                <span className="block break-words font-semibold text-[#22211e]">
                  {groupMap.get(membership.group_id)?.name ?? t("unnamed")}
                </span>
                <span className="mt-1 block text-sm text-[#706f68]">
                  {t("role")}: {t(`roles.${membership.role}`)}
                </span>
              </Link>
            ))
          ) : (
            <p className="text-sm leading-6 text-[#55544f]">{t("mine.empty")}</p>
          )}
        </div>
      </section>
    </div>
  );
}
