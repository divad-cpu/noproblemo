import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./_components/language-switcher";
import { SiteFooter } from "./_components/site-footer";
import { AuthStatus } from "./_components/auth-status";

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
      <main className="min-h-screen bg-transparent text-[#161616]">
        <section className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.10)] backdrop-blur sm:p-10">
            <header className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
                  {t("eyebrow")}
                </p>
                <h1 className="mt-4 max-w-4xl break-words text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  {t("title")}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[#55544f] sm:text-lg">
                  {t("description")}
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/solve"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#22211e] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#3a3832]"
                  >
                    {t("primaryCta")}
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300/80 bg-white/80 px-6 py-3 text-base font-semibold text-[#22211e] shadow-sm transition-colors hover:border-slate-500"
                  >
                    {t("signupCta")}
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-transparent px-5 py-3 text-base font-semibold text-[#373632] underline-offset-4 hover:underline"
                  >
                    {t("loginCta")}
                  </Link>
                </div>
              </div>
              <div className="flex flex-col gap-5 lg:items-end">
                <LanguageSwitcher locale={locale} />
                <AuthStatus locale={locale} />
              </div>
            </header>

            <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
              <div className="rounded-3xl border border-blue-100/80 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-5 shadow-inner">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
                  {t("workflow.eyebrow")}
                </p>
                <div className="mt-5 grid gap-3">
                  {workflowSteps.map((step, index) => (
                    <div key={step} className="flex min-w-0 gap-4 rounded-2xl bg-white/75 p-4 shadow-sm">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-semibold text-slate-950">
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
              <div className="rounded-3xl border border-slate-200/70 bg-slate-950 p-5 text-white shadow-2xl">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-300" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold">
                  {t("collaboration.title")}
                </h2>
                <p className="mt-3 leading-7 text-slate-300">
                  {t("collaboration.body")}
                </p>
                <p className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-slate-200">
                  {t("collaboration.note")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-8 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#22211e]">
                {t("what.title")}
              </h2>
              <p className="mt-3 leading-7 text-[#55544f]">{t("what.body")}</p>
            </article>
            <article className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#22211e]">
                {t("guest.title")}
              </h2>
              <p className="mt-3 leading-7 text-[#55544f]">{t("guest.body")}</p>
            </article>
            <article className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#22211e]">
                {t("account.title")}
              </h2>
              <p className="mt-3 leading-7 text-[#55544f]">{t("account.body")}</p>
            </article>
          </div>
        </section>

        <section className="px-5 pb-8 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-6xl gap-8 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
                {t("workflow.eyebrow")}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[#22211e]">
                {t("workflow.title")}
              </h2>
              <div className="mt-6 grid gap-4">
                {workflowSteps.map((step, index) => (
                  <div key={step} className="flex gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#22211e] text-sm font-semibold text-white">
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
            <div className="rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50 to-white p-6">
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
              <div key={benefit} className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
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
