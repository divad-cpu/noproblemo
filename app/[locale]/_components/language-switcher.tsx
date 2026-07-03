import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

type LanguageSwitcherProps = {
  locale: Locale;
};

export async function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const t = await getTranslations({
    locale,
    namespace: "LanguageSwitcher",
  });

  return (
    <nav aria-label={t("label")} className="flex shrink-0 flex-col gap-2">
      <p className="text-sm font-medium text-[#706f68]">{t("label")}</p>
      <div className="flex max-w-full flex-wrap gap-2">
        {routing.locales.map((option) => {
          const isCurrent = option === locale;

          return (
            <Link
              key={option}
              href="/"
              locale={option}
              aria-current={isCurrent ? "page" : undefined}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                isCurrent
                  ? "border-[#22211e] bg-[#22211e] text-white"
                  : "border-[#dad8d0] bg-white text-[#373632] hover:border-[#8b897f]"
              }`}
            >
              {t(`locales.${option}`)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
