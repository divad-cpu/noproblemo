import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ChallengePageProps = {
  params: Promise<{ locale: Locale; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function ChallengePage({
  params,
  searchParams,
}: ChallengePageProps) {
  const { locale, id } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "ChallengeDetail" });
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?error=auth-required&next=/${locale}/app`);
  }

  const [{ data: challenge }, { data: sections }] = await Promise.all([
    supabase
      .from("challenges")
      .select("*")
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle(),
    supabase
      .from("challenge_sections")
      .select("*")
      .eq("challenge_id", id)
      .order("position", { ascending: true }),
  ]);

  if (!challenge) {
    notFound();
  }

  const status = getQueryValue(query, "status");

  return (
    <section className="rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-8">
      <Link
        href="/app"
        className="text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
      >
        {t("back")}
      </Link>

      {status === "created" ? (
        <p className="mt-6 rounded-md border border-[#cbd8c5] bg-[#f6fbf4] p-4 text-sm leading-6 text-[#2f5f2d]">
          {t("created")}
        </p>
      ) : null}

      <p className="mt-6 text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
        {t("eyebrow")}
      </p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold leading-tight text-[#22211e]">
            {challenge.title}
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-[#55544f]">
            {challenge.short_description || t("noDescription")}
          </p>
        </div>
        <span className="inline-flex w-fit rounded-md border border-[#e5e2da] bg-[#fbfaf7] px-3 py-1 text-sm font-semibold text-[#373632]">
          {t("status")}: {challenge.status}
        </span>
      </div>

      <div className="mt-8 rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-5">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("phaseSevenTitle")}
        </h2>
        <p className="mt-3 leading-7 text-[#55544f]">{t("phaseSevenBody")}</p>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-[#22211e]">
          {t("sections.title")}
        </h2>
        <div className="mt-4 grid gap-3">
          {sections && sections.length > 0 ? (
            sections.map((section) => (
              <article
                key={section.id}
                className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4"
              >
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#706f68]">
                  {t(`sections.keys.${section.section_key}`)}
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#373632]">
                  {section.content || t("sections.empty")}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4 text-sm leading-6 text-[#55544f]">
              {t("sections.none")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
