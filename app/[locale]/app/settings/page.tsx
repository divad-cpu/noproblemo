import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "../../_components/language-switcher";
import { PasswordField } from "../../_components/password-field";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deleteCurrentAccount, updatePassword, updateProfile } from "../actions";

type SettingsPageProps = {
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

const statusKeys = ["profile-saved", "password-saved"] as const;
const errorKeys = [
  "profile-update-failed",
  "password-weak",
  "password-mismatch",
  "password-update-failed",
  "account-delete-confirmation",
  "account-delete-unavailable",
  "account-delete-failed",
] as const;

function isKnownKey<T extends readonly string[]>(
  value: string | undefined,
  keys: T,
): value is T[number] {
  return !!value && keys.includes(value);
}

export default async function SettingsPage({
  params,
  searchParams,
}: SettingsPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Settings" });
  const passwordT = await getTranslations({ locale, namespace: "PasswordField" });
  const localeNames = await getTranslations({
    locale,
    namespace: "LanguageSwitcher.locales",
  });
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app/settings`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const status = getQueryValue(query, "status");
  const error = getQueryValue(query, "error");
  const preferredLocale = profile?.preferred_locale ?? locale;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <section className="rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-8">
        <Link
          href="/app"
          className="text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
        >
          {t("back")}
        </Link>
        <p className="mt-6 text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-[#22211e]">
          {t("title")}
        </h1>
        <p className="mt-4 leading-7 text-[#55544f]">{t("body")}</p>

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

      <div className="mt-8 rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4">
        <p className="text-sm font-semibold text-[#373632]">{t("account")}</p>
        <p className="mt-1 break-all text-sm text-[#706f68]">{user.email}</p>
      </div>

      <section className="mt-8 rounded-lg border border-[#e5e2da] bg-[#fbfaf7] p-5">
        <h2 className="text-xl font-semibold text-[#22211e]">
          {t("routeLanguage.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#706f68]">
          {t("routeLanguage.body")}
        </p>
        <div className="mt-4">
          <LanguageSwitcher locale={locale} />
        </div>
      </section>

      <form action={updateProfile} className="mt-8 grid gap-5">
        <input type="hidden" name="locale" value={locale} />
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[#373632]">
            {t("fields.displayName")}
          </span>
          <input
            name="displayName"
            type="text"
            maxLength={120}
            defaultValue={profile?.display_name ?? ""}
            className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e]"
            placeholder={t("fields.displayNamePlaceholder")}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[#373632]">
            {t("fields.preferredLocale")}
          </span>
          <select
            name="preferredLocale"
            defaultValue={preferredLocale}
            className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e]"
          >
            {routing.locales.map((option) => (
              <option key={option} value={option}>
                {localeNames(option)}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm leading-6 text-[#706f68]">{t("localeNote")}</p>
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]"
        >
          {t("submit")}
        </button>
      </form>

      <form action={updatePassword} className="mt-10 grid gap-5 border-t border-[#e5e2da] pt-8">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <h2 className="text-xl font-semibold text-[#22211e]">
            {t("password.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#706f68]">
            {t("password.body")}
          </p>
        </div>
        <PasswordField
          name="password"
          label={t("fields.newPassword")}
          autoComplete="new-password"
          required
          minLength={8}
          placeholder={t("fields.newPasswordPlaceholder")}
          buttonLabels={{
            show: passwordT("show"),
            hide: passwordT("hide"),
          }}
        />
        <PasswordField
          name="confirmPassword"
          label={t("fields.confirmPassword")}
          autoComplete="new-password"
          required
          minLength={8}
          placeholder={t("fields.confirmPasswordPlaceholder")}
          buttonLabels={{
            show: passwordT("show"),
            hide: passwordT("hide"),
          }}
        />
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]"
        >
          {t("password.submit")}
        </button>
      </form>
      </section>
      <section className="rounded-lg border border-[#e3b8ad] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-[#7a2f1d]">
          {t("danger.title")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#55544f]">
          {t("danger.body")}
        </p>
        <ul className="mt-4 list-disc space-y-2 ps-5 text-sm leading-6 text-[#55544f]">
          <li>{t("danger.effects.auth")}</li>
          <li>{t("danger.effects.data")}</li>
          <li>{t("danger.effects.anonymized")}</li>
          <li>{t("danger.effects.irreversible")}</li>
        </ul>
        <form action={deleteCurrentAccount} className="mt-6 grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <label className="flex gap-3 rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4 text-sm leading-6 text-[#373632]">
            <input
              name="deleteConfirmed"
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0"
              required
            />
            <span>{t("danger.confirmCheckbox")}</span>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#373632]">
              {t("danger.confirmLabel")}
            </span>
            <input
              name="deleteConfirmation"
              type="text"
              autoComplete="off"
              required
              pattern="DELETE"
              className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e]"
              placeholder={t("danger.confirmPlaceholder")}
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#7a2f1d] px-5 py-3 font-semibold text-white hover:bg-[#642614]"
          >
            {t("danger.submit")}
          </button>
        </form>
      </section>
    </div>
  );
}
