import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AdminSettingsPageProps = {
  params: Promise<{ locale: Locale }>;
};

const checklistGroups = [
  {
    key: "appStatus",
    items: ["adminProtected", "dashboard", "guestMode", "messages"],
  },
  {
    key: "supabase",
    items: ["phase10Migration", "rls", "firstAdmin", "liveVerification"],
  },
  {
    key: "deployment",
    items: ["envTemplates", "supportEmail", "noAutomation", "validation"],
  },
] as const;

const envNames = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPPORT_EMAIL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

async function requireAdmin(locale: Locale) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/admin/settings`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    notFound();
  }
}

export default async function AdminSettingsPage({
  params,
}: AdminSettingsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);

  const t = await getTranslations({ locale, namespace: "AdminSettings" });

  return (
    <section className="rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-8">
      <Link
        href="/app/admin"
        className="text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
      >
        {t("back")}
      </Link>
      <p className="mt-6 text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 break-words text-4xl font-semibold text-[#22211e]">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-3xl leading-7 text-[#55544f]">{t("body")}</p>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {checklistGroups.map((group) => (
          <div
            key={group.key}
            className="rounded-lg border border-[#e5e2da] bg-[#fbfaf7] p-5"
          >
            <h2 className="text-xl font-semibold text-[#22211e]">
              {t(`checklists.${group.key}.title`)}
            </h2>
            <ul className="mt-4 grid gap-3">
              {group.items.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-[#55544f]">
                  <span aria-hidden="true" className="mt-2 h-2 w-2 rounded-full bg-[#4f6f52]" />
                  <span>{t(`checklists.${group.key}.${item}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-[#e5e2da] bg-[#fbfaf7] p-5">
        <h2 className="text-xl font-semibold text-[#22211e]">
          {t("environment.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#706f68]">
          {t("environment.body")}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {envNames.map((name) => (
            <code
              key={name}
              className="break-all rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-sm text-[#373632]"
            >
              {name}
            </code>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-[#e5e2da] bg-[#fbfaf7] p-5">
        <h2 className="text-xl font-semibold text-[#22211e]">
          {t("support.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#706f68]">
          {t("support.body")}
        </p>
        <a
          href="mailto:david@fideli.no"
          className="mt-3 inline-block font-semibold text-[#22211e] underline-offset-4 hover:underline"
        >
          david@fideli.no
        </a>
      </div>

      <div className="mt-6 rounded-lg border border-[#d8cbb1] bg-[#fffaf0] p-5 text-[#5f4823]">
        <h2 className="text-xl font-semibold">{t("boundaries.title")}</h2>
        <p className="mt-2 text-sm leading-6">{t("boundaries.body")}</p>
      </div>
    </section>
  );
}
