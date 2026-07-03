import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { markAllNotificationsRead, markNotificationRead } from "../actions";

type NotificationsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

function getQueryValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
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

export default async function NotificationsPage({
  params,
  searchParams,
}: NotificationsPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Notifications" });
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/notifications`);
  }

  const status = getQueryValue(query, "status");
  const error = getQueryValue(query, "error");
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const allNotifications = (notifications ?? []) as Notification[];
  const unread = allNotifications.filter((notification) => !notification.read_at);
  const read = allNotifications.filter((notification) => notification.read_at);

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
          {t("eyebrow")}
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-[#22211e]">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-[#55544f]">
              {t("body")}
            </p>
          </div>
          {unread.length > 0 ? (
            <form action={markAllNotificationsRead}>
              <input type="hidden" name="locale" value={locale} />
              <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#22211e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a3832]">
                {t("markAllRead")}
              </button>
            </form>
          ) : null}
        </div>
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

      <NotificationSection
        title={t("unread")}
        empty={t("emptyUnread")}
        notifications={unread}
        locale={locale}
        t={t}
      />
      <NotificationSection
        title={t("read")}
        empty={t("emptyRead")}
        notifications={read}
        locale={locale}
        t={t}
      />
    </div>
  );
}

function NotificationSection({
  title,
  empty,
  notifications,
  locale,
  t,
}: {
  title: string;
  empty: string;
  notifications: Notification[];
  locale: Locale;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-semibold text-[#22211e]">{title}</h2>
      <div className="mt-5 grid gap-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#706f68]">
                    {t(`types.${notification.type}`)}
                  </p>
                  <h3 className="mt-1 font-semibold text-[#22211e]">
                    {notification.title}
                  </h3>
                  {notification.body ? (
                    <p className="mt-2 text-sm leading-6 text-[#55544f]">
                      {notification.body}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-[#706f68]">
                    {formatDateTime(notification.created_at, locale)}
                  </p>
                  <RelatedLink notification={notification} t={t} />
                </div>
                {!notification.read_at ? (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="locale" value={locale} />
                    <input
                      type="hidden"
                      name="notificationId"
                      value={notification.id}
                    />
                    <button className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-4 py-2 text-sm font-semibold text-[#22211e] hover:border-[#8b897f]">
                      {t("markRead")}
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm leading-6 text-[#55544f]">{empty}</p>
        )}
      </div>
    </section>
  );
}

function RelatedLink({
  notification,
  t,
}: {
  notification: Notification;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  if (notification.related_group_id) {
    return (
      <Link
        href={`/app/groups/${notification.related_group_id}`}
        className="mt-3 inline-flex text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
      >
        {t("openGroup")}
      </Link>
    );
  }

  if (notification.related_challenge_id) {
    return (
      <Link
        href={`/app/challenges/${notification.related_challenge_id}`}
        className="mt-3 inline-flex text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
      >
        {t("openChallenge")}
      </Link>
    );
  }

  return null;
}
