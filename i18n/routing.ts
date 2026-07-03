import { defineRouting } from "next-intl/routing";

export const locales = [
  "en",
  "zh-CN",
  "hi",
  "es",
  "ar",
  "fr",
  "bn",
  "pt-BR",
  "id",
  "ur",
  "nb",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

const rtlLocales = ["ar", "ur"] as const;

export function isRtlLocale(locale: string) {
  return rtlLocales.some((rtlLocale) => rtlLocale === locale);
}

export const routing = defineRouting({
  locales,
  defaultLocale,
});
