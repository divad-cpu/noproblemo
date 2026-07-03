import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { SiteFooter } from "../_components/site-footer";
import { GuestWorkspace } from "./_components/guest-workspace";

type SolvePageProps = {
  params: Promise<{ locale: Locale }>;
};

export default function SolvePage({ params }: SolvePageProps) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("Solve");

  return (
    <>
      <main className="min-h-screen bg-[#f7f7f4] px-5 py-8 text-[#161616] sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-sm font-semibold text-[#373632] underline-offset-4 hover:underline">
              {t("backHome")}
            </Link>
            <p className="text-sm text-[#706f68]">{t("supportHint")} support@noproblemo.tech</p>
          </nav>

          <section className="rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-10">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-[#22211e]">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-[#55544f]">{t("body")}</p>
          </section>

          <GuestWorkspace />
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
