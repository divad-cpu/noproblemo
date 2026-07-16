import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import { LanguageSwitcher } from "../_components/language-switcher";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSafeLocalizedPath } from "@/lib/auth/safe-redirect";

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
    const requestHeaders = await headers();
    const nextPath = getSafeLocalizedPath(
      requestHeaders.get("x-noproblemo-pathname"),
      locale,
    );
    const search = new URLSearchParams({
      error: "auth-required",
      next: nextPath,
    });
    redirect(`/${locale}/login?${search.toString()}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";
  const t = await getTranslations({ locale, namespace: "ProtectedApp" });
  const navItems = [
    { href: "/app", label: t("nav.dashboard") },
    { href: "/app#active-challenges", label: t("nav.challenges") },
    { href: "/app/friends", label: t("nav.friends") },
    { href: "/app/groups", label: t("nav.groups") },
    { href: "/app/notifications", label: t("nav.notifications") },
    { href: "/app/settings", label: t("nav.settings") },
  ];

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 text-[#161616] sm:px-8 sm:py-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-7">
        <header className="no-print rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <Link
              href="/app"
              className="text-lg font-semibold text-[#22211e]"
            >
              {t("nav.brand")}
            </Link>

            <nav
              aria-label={t("nav.primary")}
              className="flex flex-wrap gap-1.5 sm:gap-2"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-10 items-center rounded-full px-3 py-2 text-sm font-semibold text-[#373632] hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin ? (
                <Link
                  href="/app/admin"
                  className="inline-flex min-h-10 items-center rounded-full px-3 py-2 text-sm font-semibold text-[#373632] hover:bg-slate-100"
                >
                  {t("nav.admin")}
                </Link>
              ) : null}
            </nav>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
              <LanguageSwitcher locale={locale} compact />
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#706f68]">
                  {t("nav.signedIn")}
                </span>
                <form action={`/${locale}/auth/logout`} method="post">
                  <button
                    type="submit"
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-300/80 bg-white px-4 py-2 text-sm font-semibold text-[#22211e] hover:border-slate-500"
                  >
                    {t("nav.logout")}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
