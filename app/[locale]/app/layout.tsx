import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ProtectedAppLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

function getSafeLocale(locale: string): Locale {
  return routing.locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;
}

export default async function ProtectedAppLayout({
  children,
  params,
}: ProtectedAppLayoutProps) {
  const { locale: rawLocale } = await params;
  const locale = getSafeLocale(rawLocale);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app`);
  }

  const t = await getTranslations({ locale, namespace: "ProtectedApp" });

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-5 py-8 text-[#161616] sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <nav className="flex flex-col gap-3 rounded-lg border border-[#dad8d0] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
          >
            {t("nav.home")}
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/app"
              className="text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
            >
              {t("nav.dashboard")}
            </Link>
            <Link
              href="/app/settings"
              className="text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
            >
              {t("nav.settings")}
            </Link>
            <Link
              href="/app/friends"
              className="text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
            >
              {t("nav.friends")}
            </Link>
            <Link
              href="/app/groups"
              className="text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
            >
              {t("nav.groups")}
            </Link>
            <span className="text-sm text-[#706f68]">{t("nav.signedIn")}</span>
            <form action={`/${locale}/auth/logout`} method="post">
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-4 py-2 text-sm font-semibold text-[#22211e] hover:border-[#8b897f]"
              >
                {t("nav.logout")}
              </button>
            </form>
          </div>
        </nav>
        {children}
      </div>
    </main>
  );
}
