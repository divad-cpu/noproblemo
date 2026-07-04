import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import { LanguageSwitcher } from "../_components/language-switcher";
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
    <main className="min-h-screen bg-[#f7f7f4] px-4 py-6 text-[#161616] sm:px-8 sm:py-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-lg border border-[#dad8d0] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
              href="/app"
              className="text-lg font-semibold text-[#22211e]"
            >
              {t("nav.brand")}
            </Link>

            <nav
              aria-label={t("nav.primary")}
              className="flex flex-wrap gap-2"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-10 items-center rounded-md px-3 py-2 text-sm font-semibold text-[#373632] hover:bg-[#f1f0ec]"
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin ? (
                <Link
                  href="/app/admin"
                  className="inline-flex min-h-10 items-center rounded-md px-3 py-2 text-sm font-semibold text-[#373632] hover:bg-[#f1f0ec]"
                >
                  {t("nav.admin")}
                </Link>
              ) : null}
            </nav>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
              <LanguageSwitcher locale={locale} compact />
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#706f68]">
                  {t("nav.signedIn")}
                </span>
                <form action={`/${locale}/auth/logout`} method="post">
                  <button
                    type="submit"
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-4 py-2 text-sm font-semibold text-[#22211e] hover:border-[#8b897f]"
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
