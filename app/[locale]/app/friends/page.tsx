import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import {
  removeFriend,
  respondFriendRequest,
  sendFriendRequest,
} from "../actions";

type FriendsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type FriendRequest = Database["public"]["Tables"]["friend_requests"]["Row"];
type ProfileResult =
  Database["public"]["Functions"]["search_profiles"]["Returns"][number];

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

export default async function FriendsPage({
  params,
  searchParams,
}: FriendsPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Friends" });
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/friends`);
  }

  const search = getQueryValue(query, "search")?.trim() ?? "";
  const status = getQueryValue(query, "status");
  const error = getQueryValue(query, "error");

  const [
    { data: requests },
    { data: friendships },
    { data: searchResults },
  ] = await Promise.all([
    supabase
      .from("friend_requests")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("friendships")
      .select("*")
      .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`)
      .order("created_at", { ascending: false }),
    search
      ? supabase.rpc("search_profiles", { search_term: search })
      : Promise.resolve({ data: [] as ProfileResult[] }),
  ]);

  const allRequests = requests ?? [];
  const allFriendships = friendships ?? [];
  const incoming = allRequests.filter(
    (request) => request.receiver_id === user.id && request.status === "pending",
  );
  const outgoing = allRequests.filter(
    (request) => request.sender_id === user.id && request.status === "pending",
  );
  const profileIds = [
    ...allRequests.flatMap((request) => [request.sender_id, request.receiver_id]),
    ...allFriendships.flatMap((friendship) => [
      friendship.user_one_id,
      friendship.user_two_id,
    ]),
  ].filter((id) => id !== user.id);
  const profiles = await getProfileMap(supabase, profileIds);

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-[#22211e]">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-[#55544f]">{t("body")}</p>
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

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("search.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#55544f]">
          {t("search.body")}
        </p>
        <form className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            name="search"
            defaultValue={search}
            className="min-h-12 flex-1 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e]"
            placeholder={t("search.placeholder")}
          />
          <button className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]">
            {t("search.submit")}
          </button>
        </form>
        {search ? (
          <div className="mt-5 grid gap-3">
            {(searchResults ?? []).length > 0 ? (
              (searchResults ?? [])
                .filter((profile) => profile.id !== user.id)
                .map((profile) => (
                  <form
                    key={profile.id}
                    action={sendFriendRequest}
                    className="flex flex-col gap-3 rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="receiverId" value={profile.id} />
                    <div>
                      <p className="font-semibold text-[#22211e]">
                        {profile.display_name || t("search.unnamed")}
                      </p>
                      <p className="text-xs text-[#706f68]">{profile.id}</p>
                    </div>
                    <button className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#22211e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a3832]">
                      {t("search.send")}
                    </button>
                  </form>
                ))
            ) : (
              <p className="text-sm leading-6 text-[#55544f]">
                {t("search.empty")}
              </p>
            )}
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-semibold text-[#22211e]">
            {t("incoming.title")}
          </h2>
          <div className="mt-5 grid gap-3">
            {incoming.length > 0 ? (
              incoming.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  locale={locale}
                  name={profileName(profiles.get(request.sender_id) ?? null, request.sender_id)}
                  t={t}
                  mode="incoming"
                />
              ))
            ) : (
              <p className="text-sm leading-6 text-[#55544f]">
                {t("incoming.empty")}
              </p>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-semibold text-[#22211e]">
            {t("outgoing.title")}
          </h2>
          <div className="mt-5 grid gap-3">
            {outgoing.length > 0 ? (
              outgoing.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  locale={locale}
                  name={profileName(profiles.get(request.receiver_id) ?? null, request.receiver_id)}
                  t={t}
                  mode="outgoing"
                />
              ))
            ) : (
              <p className="text-sm leading-6 text-[#55544f]">
                {t("outgoing.empty")}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("friends.title")}
        </h2>
        <div className="mt-5 grid gap-3">
          {allFriendships.length > 0 ? (
            allFriendships.map((friendship) => {
              const friendId =
                friendship.user_one_id === user.id
                  ? friendship.user_two_id
                  : friendship.user_one_id;
              return (
                <form
                  key={friendship.id}
                  action={removeFriend}
                  className="flex flex-col gap-3 rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="friendshipId" value={friendship.id} />
                  <div>
                    <p className="font-semibold text-[#22211e]">
                      {profileName(profiles.get(friendId) ?? null, friendId)}
                    </p>
                    <p className="text-xs text-[#706f68]">{friendId}</p>
                  </div>
                  <button className="text-sm font-semibold text-[#7a2f1d] underline-offset-4 hover:underline">
                    {t("friends.remove")}
                  </button>
                </form>
              );
            })
          ) : (
            <p className="text-sm leading-6 text-[#55544f]">
              {t("friends.empty")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function RequestCard({
  request,
  locale,
  name,
  t,
  mode,
}: {
  request: FriendRequest;
  locale: Locale;
  name: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
  mode: "incoming" | "outgoing";
}) {
  return (
    <div className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4">
      <p className="font-semibold text-[#22211e]">{name}</p>
      <p className="text-xs text-[#706f68]">{request.id}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {mode === "incoming" ? (
          <>
            <form action={respondFriendRequest}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="requestId" value={request.id} />
              <input type="hidden" name="response" value="accepted" />
              <button className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#22211e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a3832]">
                {t("incoming.accept")}
              </button>
            </form>
            <form action={respondFriendRequest}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="requestId" value={request.id} />
              <input type="hidden" name="response" value="declined" />
              <button className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-4 py-2 text-sm font-semibold text-[#22211e] hover:border-[#8b897f]">
                {t("incoming.decline")}
              </button>
            </form>
          </>
        ) : (
          <form action={respondFriendRequest}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="response" value="canceled" />
            <button className="text-sm font-semibold text-[#7a2f1d] underline-offset-4 hover:underline">
              {t("outgoing.cancel")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
