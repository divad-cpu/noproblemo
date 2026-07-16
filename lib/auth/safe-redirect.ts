import type { Locale } from "@/i18n/routing";

const validationOrigin = "https://noproblemo.invalid";

export function getSafeLocalizedPath(
  value: string | null | undefined,
  locale: Locale,
  fallback = `/${locale}/app`,
) {
  const candidate = value?.trim();

  if (!candidate || candidate.includes("\\")) {
    return fallback;
  }

  try {
    const url = new URL(candidate, validationOrigin);
    const localePrefix = `/${locale}`;

    if (
      url.origin !== validationOrigin ||
      (url.pathname !== localePrefix &&
        !url.pathname.startsWith(`${localePrefix}/`))
    ) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
