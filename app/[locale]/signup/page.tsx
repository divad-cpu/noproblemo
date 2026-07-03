import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { SiteFooter } from "../_components/site-footer";

type SignupPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default function SignupPage({ params }: SignupPageProps) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("AuthPlaceholder");

  return (
    <>
      <main className="min-h-screen bg-[#f7f7f4] px-5 py-8 text-[#161616] sm:px-8 lg:px-12">
        <section className="mx-auto max-w-2xl rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
            {t("signup.eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[#22211e]">
            {t("signup.title")}
          </h1>
          <p className="mt-4 leading-7 text-[#55544f]">{t("signup.body")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/solve" className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]">
              {t("continueGuest")}
            </Link>
            <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#dad8d0] px-5 py-3 font-semibold text-[#22211e] hover:border-[#8b897f]">
              {t("logIn")}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
