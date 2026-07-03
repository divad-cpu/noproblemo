import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { LanguageSwitcher } from "./_components/language-switcher";

type HomeProps = {
  params: Promise<{ locale: Locale }>;
};

const foundationItems = ["stack", "backend", "scope"] as const;

export default function Home({ params }: HomeProps) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("Home");

  return (
    <main className="flex min-h-screen flex-1 bg-[#f7f7f4] px-5 py-8 text-[#161616] sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col justify-between gap-10 rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex max-w-3xl flex-col gap-3">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
                {t("eyebrow")}
              </p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                {t("title")}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[#55544f] sm:text-lg">
                {t("description")}
              </p>
            </div>
            <LanguageSwitcher locale={locale} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {foundationItems.map((item) => (
              <div
                key={item}
                className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4"
              >
                <p className="text-sm font-medium text-[#706f68]">
                  {t(`cards.${item}.label`)}
                </p>
                <p className="mt-2 text-base font-semibold text-[#22211e]">
                  {t(`cards.${item}.value`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
