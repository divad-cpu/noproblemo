"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type GuestDraft = {
  problem: string;
  context: string;
  outcome: string;
  options: string;
  nextStep: string;
};

const storageKey = "noproblemo.guestWorkspace.v1";

const emptyDraft: GuestDraft = {
  problem: "",
  context: "",
  outcome: "",
  options: "",
  nextStep: "",
};

const guardedActions = [
  "save",
  "collaborate",
  "invite",
  "createGroup",
  "sendMessage",
  "continueLater",
  "addMember",
] as const;

export function GuestWorkspace() {
  const t = useTranslations("Solve.workspace");
  const prompt = useTranslations("LoginPrompt");
  const [draft, setDraft] = useState<GuestDraft>(emptyDraft);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          setDraft({ ...emptyDraft, ...JSON.parse(saved) });
        }
      } catch {
        setDraft(emptyDraft);
      } finally {
        setIsLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, isLoaded]);

  const markdownSummary = useMemo(() => {
    return [
      `# ${t("summaryTitle")}`,
      "",
      `## ${t("fields.problem.label")}`,
      draft.problem || t("emptyValue"),
      "",
      `## ${t("fields.context.label")}`,
      draft.context || t("emptyValue"),
      "",
      `## ${t("fields.outcome.label")}`,
      draft.outcome || t("emptyValue"),
      "",
      `## ${t("fields.options.label")}`,
      draft.options || t("emptyValue"),
      "",
      `## ${t("fields.nextStep.label")}`,
      draft.nextStep || t("emptyValue"),
    ].join("\n");
  }, [draft, t]);

  function updateDraft(field: keyof GuestDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(markdownSummary);
      setCopyStatus(t("copySuccess"));
    } catch {
      setCopyStatus(t("copyFallback"));
    }
  }

  function exportSummary() {
    const blob = new Blob([markdownSummary], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "noproblemo-guest-summary.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
      <div className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-[#22211e]">{t("title")}</h2>
          <p className="text-sm leading-6 text-[#706f68]">{t("localNotice")}</p>
        </div>

        <div className="mt-6 grid gap-5">
          {(["problem", "context", "outcome", "options", "nextStep"] as const).map(
            (field) => (
              <label key={field} className="grid gap-2">
                <span className="text-sm font-semibold text-[#22211e]">
                  {t(`fields.${field}.label`)}
                </span>
                <textarea
                  value={draft[field]}
                  onChange={(event) => updateDraft(field, event.target.value)}
                  placeholder={t(`fields.${field}.placeholder`)}
                  rows={field === "problem" ? 3 : 4}
                  className="min-h-24 resize-y rounded-md border border-[#d7d3c9] bg-[#fbfaf7] px-3 py-3 text-base leading-7 text-[#22211e] outline-none transition-colors placeholder:text-[#8b897f] focus:border-[#706f68]"
                />
              </label>
            ),
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={copySummary}
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]"
          >
            {t("copyMarkdown")}
          </button>
          <button
            type="button"
            onClick={exportSummary}
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-5 py-3 font-semibold text-[#22211e] hover:border-[#8b897f]"
          >
            {t("exportMarkdown")}
          </button>
          <button
            type="button"
            onClick={() => setIsPromptOpen(true)}
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-5 py-3 font-semibold text-[#22211e] hover:border-[#8b897f]"
          >
            {t("save")}
          </button>
        </div>
        {copyStatus ? <p className="mt-3 text-sm text-[#55544f]">{copyStatus}</p> : null}
      </div>

      <aside className="flex flex-col gap-6">
        <div className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-semibold text-[#22211e]">
            {t("summaryTitle")}
          </h2>
          <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4 text-sm leading-6 text-[#373632]">
            {markdownSummary}
          </pre>
        </div>

        <div className="rounded-lg border border-[#dad8d0] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-[#22211e]">
            {t("guestLimits.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#55544f]">
            {t("guestLimits.body")}
          </p>
          <div className="mt-4 grid gap-2">
            {guardedActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => setIsPromptOpen(true)}
                className="min-h-11 rounded-md border border-[#dad8d0] bg-white px-4 py-2 text-start text-sm font-semibold text-[#373632] hover:border-[#8b897f]"
              >
                {t(`blockedActions.${action}`)}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {isPromptOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/25 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-lg rounded-lg border border-[#dad8d0] bg-white p-5 shadow-xl sm:p-6">
            <h2 className="text-2xl font-semibold text-[#22211e]">
              {prompt("title")}
            </h2>
            <p className="mt-3 leading-7 text-[#55544f]">{prompt("body")}</p>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => setIsPromptOpen(false)}
                className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-5 py-3 font-semibold text-[#22211e] hover:border-[#8b897f]"
              >
                {prompt("continueWithoutSaving")}
              </button>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]"
              >
                {prompt("loginAndSave")}
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-5 py-3 font-semibold text-[#22211e] hover:border-[#8b897f]"
              >
                {prompt("signupAndSave")}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
