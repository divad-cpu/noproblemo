"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { importGuestDraft } from "../actions";

type GuestDraft = {
  problem?: string;
  context?: string;
  outcome?: string;
  options?: string;
  nextStep?: string;
  importedChallengeId?: string;
  importedAt?: string;
};

type GuestImportCardProps = {
  locale: string;
};

const storageKey = "noproblemo.guestWorkspace.v1";
const emptyState = { status: "idle" as const };

function hasDraftContent(draft: GuestDraft) {
  return Boolean(
    draft.problem?.trim() ||
      draft.context?.trim() ||
      draft.outcome?.trim() ||
      draft.options?.trim() ||
      draft.nextStep?.trim(),
  );
}

export function GuestImportCard({ locale }: GuestImportCardProps) {
  const t = useTranslations("Dashboard.guestImport");
  const [draft, setDraft] = useState<GuestDraft | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, formAction, isPending] = useActionState(
    importGuestDraft,
    emptyState,
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved) as GuestDraft;
          setDraft(parsed);
        }
      } catch {
        setDraft(null);
      } finally {
        setIsLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (state.status !== "success" || !state.challengeId || !draft) {
      return;
    }

    const importedDraft = {
      ...draft,
      importedChallengeId: state.challengeId,
      importedAt: new Date().toISOString(),
    };

    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify(importedDraft));
      setDraft(importedDraft);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [draft, state]);

  const draftJson = useMemo(() => JSON.stringify(draft ?? {}), [draft]);

  if (!isLoaded || !draft || !hasDraftContent(draft)) {
    return null;
  }

  const isImported = Boolean(draft.importedChallengeId);
  const messageKey = state.messageKey ?? "";

  return (
    <section className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
        {t("eyebrow")}
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-[#22211e]">
        {isImported ? t("importedTitle") : t("title")}
      </h2>
      <p className="mt-3 leading-7 text-[#55544f]">
        {isImported ? t("importedBody") : t("body")}
      </p>

      {messageKey ? (
        <p
          className={`mt-4 rounded-md border p-4 text-sm leading-6 ${
            state.status === "success"
              ? "border-[#cbd8c5] bg-[#f6fbf4] text-[#2f5f2d]"
              : "border-[#e3b8ad] bg-[#fff7f4] text-[#7a2f1d]"
          }`}
        >
          {t(`messages.${messageKey}`)}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {isImported && draft.importedChallengeId ? (
          <Link
            href={`/app/challenges/${draft.importedChallengeId}`}
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]"
          >
            {t("continueImported")}
          </Link>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="draft" value={draftJson} />
            <input type="hidden" name="fallbackTitle" value={t("fallbackTitle")} />
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832] disabled:cursor-not-allowed disabled:bg-[#8b897f] sm:w-auto"
            >
              {isPending ? t("importing") : t("importAction")}
            </button>
          </form>
        )}
        <Link
          href="/solve"
          className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-5 py-3 font-semibold text-[#22211e] hover:border-[#8b897f]"
        >
          {t("reviewGuest")}
        </Link>
      </div>
    </section>
  );
}
