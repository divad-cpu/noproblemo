import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createChallenge } from "../../actions";

type NewChallengePageProps = {
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

export default async function NewChallengePage({
  params,
  searchParams,
}: NewChallengePageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "CreateChallenge" });
  const error = getQueryValue(query, "error");

  return (
    <section className="mx-auto w-full max-w-3xl rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-8">
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

      {error === "missing-title" || error === "create-failed" ? (
        <p className="mt-6 rounded-md border border-[#e3b8ad] bg-[#fff7f4] p-4 text-sm leading-6 text-[#7a2f1d]">
          {t(`errors.${error}`)}
        </p>
      ) : null}

      <form action={createChallenge} className="mt-8 grid gap-5">
        <input type="hidden" name="locale" value={locale} />
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[#373632]">
            {t("fields.title")}
          </span>
          <input
            name="title"
            type="text"
            required
            maxLength={160}
            className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e]"
            placeholder={t("fields.titlePlaceholder")}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[#373632]">
            {t("fields.shortDescription")}
          </span>
          <textarea
            name="shortDescription"
            rows={4}
            maxLength={500}
            className="min-h-28 resize-y rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e]"
            placeholder={t("fields.shortDescriptionPlaceholder")}
          />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]"
        >
          {t("submit")}
        </button>
      </form>
    </section>
  );
}
