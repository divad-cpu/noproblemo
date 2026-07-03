import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

type ProtectedAppPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ProtectedAppPage({
  params,
}: ProtectedAppPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "ProtectedApp" });

  return (
    <section className="rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-10">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-[#22211e]">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-3xl leading-7 text-[#55544f]">{t("body")}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/solve"
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]"
        >
          {t("actions.solve")}
        </Link>
        <Link
          href="/support"
          className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-5 py-3 font-semibold text-[#22211e] hover:border-[#8b897f]"
        >
          {t("actions.support")}
        </Link>
      </div>
      <p className="mt-6 text-sm leading-6 text-[#706f68]">{t("phaseNote")}</p>
    </section>
  );
}
