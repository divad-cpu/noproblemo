"use client";

import { useTranslations } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";

type LanguageSwitcherProps = {
  locale: Locale;
  compact?: boolean;
};

export function LanguageSwitcher({ locale, compact = false }: LanguageSwitcherProps) {
  const t = useTranslations("LanguageSwitcher");

  function localeHref(targetLocale: Locale) {
    const { pathname, search, hash } = window.location;
    const segments = pathname.split("/");
    const currentLocale = segments[1];

    if (routing.locales.includes(currentLocale as Locale)) {
      segments[1] = targetLocale;
      return `${segments.join("/")}${search}${hash}`;
    }

    return `/${targetLocale}`;
  }

  function switchLocale(targetLocale: Locale) {
    window.location.assign(localeHref(targetLocale));
  }

  if (compact) {
    return (
      <label className="flex min-w-0 items-center gap-2">
        <span className="sr-only">{t("label")}</span>
        <select
          value={locale}
          aria-label={t("label")}
          onChange={(event) => switchLocale(event.target.value as Locale)}
          className="h-10 max-w-44 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-sm font-semibold text-[#22211e] outline-none hover:border-[#8b897f]"
        >
          {routing.locales.map((option) => (
            <option key={option} value={option}>
              {t(`locales.${option}`)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <nav aria-label={t("label")} className="flex shrink-0 flex-col gap-2">
      <p className="text-sm font-medium text-[#706f68]">{t("label")}</p>
      <select
        value={locale}
        aria-label={t("label")}
        onChange={(event) => switchLocale(event.target.value as Locale)}
        className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-3 py-2 text-sm font-semibold text-[#22211e] outline-none hover:border-[#8b897f]"
      >
        {routing.locales.map((option) => (
          <option key={option} value={option}>
            {t(`locales.${option}`)}
          </option>
        ))}
      </select>
    </nav>
  );
}
