import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { SiteFooter } from "../_components/site-footer";

type SupportPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default function SupportPage({ params }: SupportPageProps) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("Support");

  return (
    <>
      <main className="min-h-screen bg-[#f7f7f4] px-5 py-8 text-[#161616] sm:px-8 lg:px-12">
        <section className="mx-auto max-w-3xl rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#22211e]">
            {t("title")}
          </h1>
          <p className="mt-4 leading-7 text-[#55544f]">{t("body")}</p>
          <div className="mt-6 rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4">
            <p className="text-sm font-medium text-[#706f68]">{t("emailLabel")}</p>
            <a className="mt-1 inline-block text-lg font-semibold text-[#22211e] underline-offset-4 hover:underline" href="mailto:support@noproblemo.tech">
              support@noproblemo.tech
            </a>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#706f68]">{t("helpText")}</p>
          <Link
            href="/"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-5 py-3 font-semibold text-[#22211e] hover:border-[#8b897f]"
          >
            {t("backHome")}
          </Link>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
