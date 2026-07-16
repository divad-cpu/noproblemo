import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PasswordField } from "../_components/password-field";
import { PendingSubmitButton } from "../_components/pending-submit-button";
import { SiteFooter } from "../_components/site-footer";
import {
  resendSignupConfirmation,
  signUpWithEmail,
} from "../auth/actions";
import { getSafeLocalizedPath } from "@/lib/auth/safe-redirect";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SignupPageProps = {
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

const errorKeys = [
  "missing-fields",
  "signup-weak-password",
  "signup-rate-limited",
  "signup-invalid-email",
  "signup-provider-disabled",
  "signup-failed",
  "oauth-provider",
  "oauth-start",
] as const;

const statusKeys = [
  "signup-check-email",
  "signup-existing-or-pending",
  "signup-confirmation-resent",
] as const;

function isKnownKey<T extends readonly string[]>(
  value: string | undefined,
  keys: T,
): value is T[number] {
  return !!value && keys.includes(value);
}

export default async function SignupPage({
  params,
  searchParams,
}: SignupPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Auth" });
  const passwordT = await getTranslations({ locale, namespace: "PasswordField" });
  const nextPath = getSafeLocalizedPath(getQueryValue(query, "next"), locale);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(nextPath);
  }

  const error = getQueryValue(query, "error");
  const status = getQueryValue(query, "status");

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

          {isKnownKey(error, errorKeys) ? (
            <p className="mt-6 rounded-md border border-[#e3b8ad] bg-[#fff7f4] p-4 text-sm leading-6 text-[#7a2f1d]">
              {t(`errors.${error}`)}
            </p>
          ) : null}

          {isKnownKey(status, statusKeys) ? (
            <p className="mt-6 rounded-md border border-[#cbd8c5] bg-[#f6fbf4] p-4 text-sm leading-6 text-[#2f5f2d]">
              {t(`status.${status}`)}
            </p>
          ) : null}

          <form action={signUpWithEmail} className="mt-8 grid gap-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="next" value={nextPath} />
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#373632]">
                {t("fields.displayName")}
              </span>
              <input
                name="displayName"
                type="text"
                autoComplete="name"
                className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e]"
                placeholder={t("fields.displayNamePlaceholder")}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#373632]">
                {t("fields.email")}
              </span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e]"
                placeholder={t("fields.emailPlaceholder")}
              />
            </label>
            <PasswordField
              name="password"
              label={t("fields.password")}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder={t("fields.newPasswordPlaceholder")}
              buttonLabels={{
                show: passwordT("show"),
                hide: passwordT("hide"),
              }}
            />
            <PendingSubmitButton
              idleLabel={t("signup.submit")}
              pendingLabel={`${t("signup.submit")}…`}
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832] disabled:cursor-not-allowed disabled:bg-[#8b897f]"
            />
          </form>

          <div className="mt-8 grid gap-3 border-t border-[#e5e2da] pt-6">
            <div>
              <h2 className="text-base font-semibold text-[#22211e]">
                {t("resend.title")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#706f68]">
                {t("resend.body")}
              </p>
            </div>
            <form action={resendSignupConfirmation} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="next" value={nextPath} />
              <label className="grid gap-2">
                <span className="sr-only">{t("fields.email")}</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e]"
                  placeholder={t("fields.emailPlaceholder")}
                />
              </label>
              <PendingSubmitButton
                idleLabel={t("resend.submit")}
                pendingLabel={`${t("resend.submit")}…`}
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-5 py-3 font-semibold text-[#22211e] hover:border-[#8b897f] disabled:cursor-not-allowed disabled:bg-[#f1f0ec]"
              />
            </form>
          </div>

          <p className="mt-6 rounded-md border border-[#d8e0d7] bg-[#f4f8f5] p-4 text-sm leading-6 text-[#55544f]">
            {t("emailOnly")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/solve"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#dad8d0] px-5 py-3 font-semibold text-[#22211e] hover:border-[#8b897f]"
            >
              {t("shared.continueGuest")}
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-transparent px-5 py-3 font-semibold text-[#373632] underline-offset-4 hover:underline"
            >
              {t("signup.logIn")}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
