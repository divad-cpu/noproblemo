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
  sendGroupMessage,
  softDeleteMessage,
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
type Message = Database["public"]["Tables"]["messages"]["Row"];
type ActivityEvent = Database["public"]["Tables"]["activity_events"]["Row"];

const statusKeys = [
  "group-created",
  "group-saved",
  "group-invite-sent",
  "group-invitation-canceled",
  "group-member-removed",
  "group-role-updated",
  "group-challenge-linked",
  "group-challenge-unlinked",
  "message-sent",
  "message-deleted",
] as const;

const errorKeys = [
  "group-save-failed",
  "group-invite-failed",
  "group-member-remove-failed",
  "group-role-update-failed",
  "group-challenge-link-failed",
  "group-challenge-unlink-failed",
  "message-send-failed",
  "message-delete-failed",
] as const;

const roles: GroupRole[] = ["owner", "admin", "member", "viewer"];
const inviteRoles: Exclude<GroupRole, "owner">[] = ["admin", "member", "viewer"];

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

function formatDateTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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
    { data: messages },
    { data: activityEvents },
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
    supabase
      .from("messages")
      .select("*")
      .eq("group_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("activity_events")
      .select("*")
      .eq("group_id", id)
      .order("created_at", { ascending: false })
      .limit(8),
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
    ...(messages ?? []).flatMap((message) =>
      message.sender_id ? [message.sender_id] : [],
    ),
    ...(activityEvents ?? []).flatMap((event) =>
      event.actor_id ? [event.actor_id] : [],
    ),
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
  const safeMessages = (messages ?? []) as Message[];
  const safeActivityEvents = (activityEvents ?? []) as ActivityEvent[];

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
        <h1 className="mt-3 break-words text-4xl font-semibold text-[#22211e]">
          {group.name}
        </h1>
        <p className="mt-4 max-w-3xl break-words leading-7 text-[#55544f]">
          {group.description || t("noDescription")}
        </p>
        <p className="mt-3 text-sm text-[#706f68]">
          {t("yourRole")}: {t(`roles.${myMember.role}`)}
        </p>
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
              aria-label={t("settings.name")}
              className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616]"
            />
            <textarea
              name="description"
              rows={3}
              defaultValue={group.description ?? ""}
              aria-label={t("settings.description")}
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
          {t("messages.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#55544f]">
          {t("messages.body")}
        </p>
        {myMember.role !== "viewer" ? (
          <form action={sendGroupMessage} className="mt-5 grid gap-3">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="groupId" value={group.id} />
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
          {safeMessages.length > 0 ? (
            safeMessages.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                locale={locale}
                groupId={group.id}
                author={profileName(
                  message.sender_id
                    ? profiles.get(message.sender_id) ?? null
                    : null,
                  t("messages.unknownSender"),
                )}
                t={t}
                canDelete={
                  message.sender_id === user.id || ["owner", "admin"].includes(myMember.role)
                }
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
          {safeActivityEvents.length > 0 ? (
            safeActivityEvents.map((event) => (
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
              aria-label={t("invite.searchPlaceholder")}
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
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-[#22211e]">
                          {profile.display_name || t("unnamed")}
                        </p>
                        <p className="break-all text-xs text-[#706f68]">{profile.id}</p>
                      </div>
                      <select
                        name="role"
                        defaultValue="member"
                        aria-label={t("role")}
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
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-[#22211e]">
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
                    className="break-words font-semibold text-[#22211e] underline-offset-4 hover:underline"
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
              aria-label={t("challenges.title")}
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

function MessageRow({
  message,
  locale,
  groupId,
  author,
  t,
  canDelete,
}: {
  message: Message;
  locale: Locale;
  groupId: string;
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
            <input type="hidden" name="groupId" value={groupId} />
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
      <div className="min-w-0">
        <p className="break-words font-semibold text-[#22211e]">{name}</p>
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
            aria-label={t("role")}
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
