import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./_components/language-switcher";
import { SiteFooter } from "./_components/site-footer";

type HomeProps = {
  params: Promise<{ locale: Locale }>;
};

const workflowSteps = ["capture", "shape", "choose"] as const;
const benefits = ["guest", "structured", "private"] as const;

export default function Home({ params }: HomeProps) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("Home");

  return (
    <>
      <main className="min-h-screen bg-[#f7f7f4] text-[#161616]">
        <section className="px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-12 rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-10">
            <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
                  {t("eyebrow")}
                </p>
                <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                  {t("title")}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[#55544f] sm:text-lg">
                  {t("description")}
                </p>
              </div>
              <LanguageSwitcher locale={locale} />
            </header>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/solve"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-[#3a3832]"
              >
                {t("primaryCta")}
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-5 py-3 text-base font-semibold text-[#22211e] transition-colors hover:border-[#8b897f]"
              >
                {t("signupCta")}
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-transparent px-5 py-3 text-base font-semibold text-[#373632] underline-offset-4 hover:underline"
              >
                {t("loginCta")}
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 pb-8 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
            <article className="rounded-lg border border-[#dad8d0] bg-white p-5">
              <h2 className="text-xl font-semibold text-[#22211e]">
                {t("what.title")}
              </h2>
              <p className="mt-3 leading-7 text-[#55544f]">{t("what.body")}</p>
            </article>
            <article className="rounded-lg border border-[#dad8d0] bg-white p-5">
              <h2 className="text-xl font-semibold text-[#22211e]">
                {t("guest.title")}
              </h2>
              <p className="mt-3 leading-7 text-[#55544f]">{t("guest.body")}</p>
            </article>
            <article className="rounded-lg border border-[#dad8d0] bg-white p-5">
              <h2 className="text-xl font-semibold text-[#22211e]">
                {t("account.title")}
              </h2>
              <p className="mt-3 leading-7 text-[#55544f]">{t("account.body")}</p>
            </article>
          </div>
        </section>

        <section className="px-5 pb-8 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-6xl gap-8 rounded-lg border border-[#dad8d0] bg-white p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
                {t("workflow.eyebrow")}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[#22211e]">
                {t("workflow.title")}
              </h2>
              <div className="mt-6 grid gap-4">
                {workflowSteps.map((step, index) => (
                  <div key={step} className="flex gap-4 rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#22211e] text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-[#22211e]">
                        {t(`workflow.steps.${step}.title`)}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[#55544f]">
                        {t(`workflow.steps.${step}.body`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[#e5e2da] bg-[#f7f7f4] p-5">
              <h2 className="text-2xl font-semibold text-[#22211e]">
                {t("collaboration.title")}
              </h2>
              <p className="mt-3 leading-7 text-[#55544f]">
                {t("collaboration.body")}
              </p>
              <p className="mt-4 text-sm leading-6 text-[#706f68]">
                {t("collaboration.note")}
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 pb-12 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="rounded-lg border border-[#dad8d0] bg-white p-5">
                <h3 className="font-semibold text-[#22211e]">
                  {t(`benefits.${benefit}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#55544f]">
                  {t(`benefits.${benefit}.body`)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
