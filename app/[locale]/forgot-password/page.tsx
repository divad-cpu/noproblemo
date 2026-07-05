import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { SiteFooter } from "../_components/site-footer";
import { ForgotPasswordForm } from "./_components/forgot-password-form";

type ForgotPasswordPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

const statusKeys = ["reset-email-sent"] as const;
const errorKeys = [
  "missing-email",
  "reset-rate-limited",
  "reset-provider-or-smtp",
  "reset-invalid-email",
  "reset-redirect-not-allowed",
  "reset-email-failed",
] as const;

function isKnownKey<T extends readonly string[]>(
  value: string | undefined,
  keys: T,
): value is T[number] {
  return !!value && keys.includes(value);
}

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: ForgotPasswordPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Auth" });
  const status = getQueryValue(query, "status");
  const error = getQueryValue(query, "error");

  return (
    <>
      <main className="min-h-screen bg-[#f7f7f4] px-5 py-8 text-[#161616] sm:px-8 lg:px-12">
        <section className="mx-auto max-w-2xl rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
            {t("forgot.eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[#22211e]">
            {t("forgot.title")}
          </h1>
          <p className="mt-4 leading-7 text-[#55544f]">{t("forgot.body")}</p>

          {isKnownKey(status, statusKeys) ? (
            <p className="mt-6 rounded-md border border-[#cbd8c5] bg-[#f6fbf4] p-4 text-sm leading-6 text-[#2f5f2d]">
              {t(`status.${status}`)}
            </p>
          ) : null}

          {isKnownKey(error, errorKeys) ? (
            <p className="mt-6 rounded-md border border-[#e3b8ad] bg-[#fff7f4] p-4 text-sm leading-6 text-[#7a2f1d]">
              {t(`errors.${error}`)}
            </p>
          ) : null}

          <ForgotPasswordForm
            locale={locale}
            labels={{
              email: t("fields.email"),
              emailPlaceholder: t("fields.emailPlaceholder"),
              submit: t("forgot.submit"),
              submitting: t("forgot.submitting"),
              success: t("status.reset-email-sent"),
              help: t("forgot.help"),
              missingEmail: t("errors.missing-email"),
              rateLimited: t("errors.reset-rate-limited"),
              providerOrSmtp: t("errors.reset-provider-or-smtp"),
              invalidEmail: t("errors.reset-invalid-email"),
              redirectNotAllowed: t("errors.reset-redirect-not-allowed"),
              failed: t("errors.reset-email-failed"),
            }}
          />

          <Link
            href="/login"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md border border-[#dad8d0] px-5 py-3 font-semibold text-[#22211e] hover:border-[#8b897f]"
          >
            {t("forgot.backToLogin")}
          </Link>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
