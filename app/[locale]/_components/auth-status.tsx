import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AuthStatusProps = {
  locale: Locale;
};

export async function AuthStatus({ locale }: AuthStatusProps) {
  const t = await getTranslations({ locale, namespace: "AuthStatus" });
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <div className="flex flex-col gap-2 sm:items-end">
        <Link
          href="/app"
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#22211e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a3832]"
        >
          {t("openApp")}
        </Link>
        <form action={`/${locale}/auth/logout`} method="post">
          <button
            type="submit"
            className="text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
          >
            {t("logout")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <Link
        href="/login"
        className="text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
      >
        {t("login")}
      </Link>
      <Link
        href="/signup"
        className="text-sm font-semibold text-[#373632] underline-offset-4 hover:underline"
      >
        {t("signup")}
      </Link>
    </div>
  );
}
