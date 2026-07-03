import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type SiteFooterProps = {
  locale: Locale;
};

export async function SiteFooter({ locale }: SiteFooterProps) {
  const t = await getTranslations({ locale, namespace: "Footer" });

  return (
    <footer className="border-t border-[#e5e2da] bg-white px-5 py-8 text-[#55544f] sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-[#22211e]">{t("brand")}</p>
          <p className="mt-1 text-sm">{t("tagline")}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm sm:items-end">
          <Link href="/support" className="font-medium text-[#22211e] underline-offset-4 hover:underline">
            {t("supportLink")}
          </Link>
          <a className="text-[#55544f] underline-offset-4 hover:underline" href="mailto:support@noproblemo.tech">
            support@noproblemo.tech
          </a>
        </div>
      </div>
    </footer>
  );
}
