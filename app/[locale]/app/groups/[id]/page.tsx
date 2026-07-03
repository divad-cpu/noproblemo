import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database, GroupRole } from "@/lib/supabase/types";
import {
  inviteUserToGroup,
  linkChallengeToGroup,
  removeGroupMember,
  respondGroupInvitation,
  unlinkChallengeFromGroup,
  updateGroup,
  updateGroupMemberRole,
} from "../../actions";

type GroupDetailPageProps = {
  params: Promise<{ locale: Locale; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ProfileResult =
  Database["public"]["Functions"]["search_profiles"]["Returns"][number];
type Member = Database["public"]["Tables"]["group_members"]["Row"];

const roles: GroupRole[] = ["owner", "admin", "member", "viewer"];
const inviteRoles: Exclude<GroupRole, "owner">[] = ["admin", "member", "viewer"];

function getQueryValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

async function getProfileMap(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  ids: string[],
) {
  const entries = await Promise.all(
    [...new Set(ids)].map(async (id) => {
      const { data } = await supabase.rpc("search_profiles", {
        search_term: id,
      });

      return [id, data?.[0] ?? null] as const;
    }),
  );

  return new Map(entries);
}

function profileName(profile: ProfileResult | null, fallback: string) {
  return profile?.display_name || fallback;
}

export default async function GroupDetailPage({
  params,
  searchParams,
}: GroupDetailPageProps) {
  const { locale, id } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "GroupDetail" });
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/groups`);
  }

  const status = getQueryValue(query, "status");
  const error = getQueryValue(query, "error");
  const inviteSearch = getQueryValue(query, "inviteSearch")?.trim() ?? "";

  const [
    { data: group },
    { data: members },
    { data: invitations },
    { data: groupChallenges },
    { data: ownChallenges },
    { data: inviteResults },
  ] = await Promise.all([
    supabase.from("groups").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("group_members")
      .select("*")
      .eq("group_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("group_invitations")
      .select("*")
      .eq("group_id", id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("group_challenges")
      .select("*")
      .eq("group_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("challenges")
      .select("*")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50),
    inviteSearch
      ? supabase.rpc("search_profiles", { search_term: inviteSearch })
      : Promise.resolve({ data: [] as ProfileResult[] }),
  ]);

  if (!group) {
    notFound();
  }

  const safeMembers = members ?? [];
  const myMember = safeMembers.find((member) => member.user_id === user.id);
  if (!myMember) {
    notFound();
  }

  const canManage = ["owner", "admin"].includes(myMember.role);
  const isOwner = myMember.role === "owner";
  const profiles = await getProfileMap(supabase, [
    ...safeMembers.map((member) => member.user_id),
    ...(invitations ?? []).flatMap((invitation) => [
      invitation.invitee_id,
      invitation.inviter_id,
    ]),
  ]);
  const linkedChallengeIds = (groupChallenges ?? []).map(
    (link) => link.challenge_id,
  );
  const { data: linkedChallenges } =
    linkedChallengeIds.length > 0
      ? await supabase.from("challenges").select("*").in("id", linkedChallengeIds)
      : { data: [] };
  const linkableChallenges = (ownChallenges ?? []).filter(
    (challenge) => !linkedChallengeIds.includes(challenge.id),
  );

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-8">
        <Link
          href="/app/groups"
          className="text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
        >
          {t("back")}
        </Link>
        <p className="mt-6 text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-[#22211e]">
          {group.name}
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-[#55544f]">
          {group.description || t("noDescription")}
        </p>
        <p className="mt-3 text-sm text-[#706f68]">
          {t("yourRole")}: {t(`roles.${myMember.role}`)}
        </p>
      </section>

      {status ? (
        <p className="rounded-md border border-[#cbd8c5] bg-[#f6fbf4] p-4 text-sm leading-6 text-[#2f5f2d]">
          {t(`status.${status}`)}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-[#e3b8ad] bg-[#fff7f4] p-4 text-sm leading-6 text-[#7a2f1d]">
          {t(`errors.${error}`)}
        </p>
      ) : null}

      {canManage ? (
        <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-semibold text-[#22211e]">
            {t("settings.title")}
          </h2>
          <form action={updateGroup} className="mt-5 grid gap-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="groupId" value={group.id} />
            <input
              name="name"
              required
              defaultValue={group.name}
              className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616]"
            />
            <textarea
              name="description"
              rows={3}
              defaultValue={group.description ?? ""}
              className="min-h-24 resize-y rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616]"
            />
            <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#22211e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a3832]">
              {t("settings.save")}
            </button>
          </form>
        </section>
      ) : null}

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("members.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#55544f]">
          {t("members.limit")}
        </p>
        <div className="mt-5 grid gap-3">
          {safeMembers.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              locale={locale}
              groupId={group.id}
              name={profileName(profiles.get(member.user_id) ?? null, member.user_id)}
              t={t}
              canManage={canManage}
              isOwner={isOwner}
              isSelf={member.user_id === user.id}
            />
          ))}
        </div>
      </section>

      {canManage ? (
        <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-semibold text-[#22211e]">
            {t("invite.title")}
          </h2>
          <form className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              name="inviteSearch"
              defaultValue={inviteSearch}
              placeholder={t("invite.searchPlaceholder")}
              className="min-h-12 flex-1 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616]"
            />
            <button className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]">
              {t("invite.search")}
            </button>
          </form>
          {inviteSearch ? (
            <div className="mt-5 grid gap-3">
              {(inviteResults ?? []).length > 0 ? (
                (inviteResults ?? [])
                  .filter((profile) => profile.id !== user.id)
                  .map((profile) => (
                    <form
                      key={profile.id}
                      action={inviteUserToGroup}
                      className="grid gap-3 rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4 md:grid-cols-[1fr_auto_auto]"
                    >
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="groupId" value={group.id} />
                      <input type="hidden" name="inviteeId" value={profile.id} />
                      <div>
                        <p className="font-semibold text-[#22211e]">
                          {profile.display_name || t("unnamed")}
                        </p>
                        <p className="text-xs text-[#706f68]">{profile.id}</p>
                      </div>
                      <select
                        name="role"
                        defaultValue="member"
                        className="min-h-10 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-sm"
                      >
                        {inviteRoles.map((role) => (
                          <option key={role} value={role}>
                            {t(`roles.${role}`)}
                          </option>
                        ))}
                      </select>
                      <button className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#22211e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a3832]">
                        {t("invite.send")}
                      </button>
                    </form>
                  ))
              ) : (
                <p className="text-sm leading-6 text-[#55544f]">
                  {t("invite.empty")}
                </p>
              )}
            </div>
          ) : null}

          <h3 className="mt-8 text-xl font-semibold text-[#22211e]">
            {t("invitations.title")}
          </h3>
          <div className="mt-4 grid gap-3">
            {invitations && invitations.length > 0 ? (
              invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col gap-3 rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-[#22211e]">
                      {profileName(
                        profiles.get(invitation.invitee_id) ?? null,
                        invitation.invitee_id,
                      )}
                    </p>
                    <p className="text-sm text-[#706f68]">
                      {t("role")}: {t(`roles.${invitation.role}`)}
                    </p>
                  </div>
                  <form action={respondGroupInvitation}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <input type="hidden" name="response" value="canceled" />
                    <input type="hidden" name="returnTo" value="detail" />
                    <button className="text-sm font-semibold text-[#7a2f1d] underline-offset-4 hover:underline">
                      {t("invitations.cancel")}
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-[#55544f]">
                {t("invitations.empty")}
              </p>
            )}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("challenges.title")}
        </h2>
        <div className="mt-5 grid gap-3">
          {linkedChallenges && linkedChallenges.length > 0 ? (
            linkedChallenges.map((challenge) => {
              const link = (groupChallenges ?? []).find(
                (item) => item.challenge_id === challenge.id,
              );
              return (
                <div
                  key={challenge.id}
                  className="flex flex-col gap-3 rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link
                    href={`/app/challenges/${challenge.id}`}
                    className="font-semibold text-[#22211e] underline-offset-4 hover:underline"
                  >
                    {challenge.title}
                  </Link>
                  {canManage && link ? (
                    <form action={unlinkChallengeFromGroup}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="groupId" value={group.id} />
                      <input
                        type="hidden"
                        name="groupChallengeId"
                        value={link.id}
                      />
                      <button className="text-sm font-semibold text-[#7a2f1d] underline-offset-4 hover:underline">
                        {t("challenges.unlink")}
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })
          ) : (
            <p className="text-sm leading-6 text-[#55544f]">
              {t("challenges.empty")}
            </p>
          )}
        </div>
        {canManage || myMember.role === "member" ? (
          <form action={linkChallengeToGroup} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="groupId" value={group.id} />
            <select
              name="challengeId"
              className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616]"
            >
              {linkableChallenges.length > 0 ? (
                linkableChallenges.map((challenge) => (
                  <option key={challenge.id} value={challenge.id}>
                    {challenge.title}
                  </option>
                ))
              ) : (
                <option value="">{t("challenges.noneToLink")}</option>
              )}
            </select>
            <button
              disabled={linkableChallenges.length === 0}
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832] disabled:cursor-not-allowed disabled:bg-[#8b897f]"
            >
              {t("challenges.link")}
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}

function MemberRow({
  member,
  locale,
  groupId,
  name,
  t,
  canManage,
  isOwner,
  isSelf,
}: {
  member: Member;
  locale: Locale;
  groupId: string;
  name: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
  canManage: boolean;
  isOwner: boolean;
  isSelf: boolean;
}) {
  return (
    <div className="grid gap-3 rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
      <div>
        <p className="font-semibold text-[#22211e]">{name}</p>
        <p className="text-sm text-[#706f68]">
          {t("role")}: {t(`roles.${member.role}`)}
        </p>
      </div>
      {isOwner && !isSelf ? (
        <form action={updateGroupMemberRole} className="flex gap-2">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="memberId" value={member.id} />
          <select
            name="role"
            defaultValue={member.role}
            className="min-h-10 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-sm"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {t(`roles.${role}`)}
              </option>
            ))}
          </select>
          <button className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-4 py-2 text-sm font-semibold text-[#22211e] hover:border-[#8b897f]">
            {t("members.updateRole")}
          </button>
        </form>
      ) : null}
      {canManage && !isSelf && member.role !== "owner" ? (
        <form action={removeGroupMember}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="memberId" value={member.id} />
          <button className="text-sm font-semibold text-[#7a2f1d] underline-offset-4 hover:underline">
            {t("members.remove")}
          </button>
        </form>
      ) : null}
    </div>
  );
}
