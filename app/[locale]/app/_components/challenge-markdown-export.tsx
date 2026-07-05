"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type ExportSection = {
  key: string;
  title: string;
  content: string;
};

type ExportSolution = {
  title: string;
  description: string;
  pros: string;
  cons: string;
  risk: number | null;
  effort: number | null;
  impact: number | null;
  resourcesNeeded: string;
  priority: number | null;
};

type ExportTask = {
  title: string;
  description: string;
  responsiblePerson: string;
  deadline: string;
  completed: boolean;
  position: number;
};

type ChallengeMarkdownExportProps = {
  challenge: {
    title: string;
    shortDescription: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  printHref: string;
  sections: ExportSection[];
  solutions: ExportSolution[];
  tasks: ExportTask[];
};

function valueOrDash(value: string | number | null) {
  if (value === null || value === "") return "-";

  return String(value);
}

export function ChallengeMarkdownExport({
  challenge,
  printHref,
  sections,
  solutions,
  tasks,
}: ChallengeMarkdownExportProps) {
  const t = useTranslations("Workspace.export");
  const [status, setStatus] = useState("");

  const markdown = useMemo(() => {
    const lines = [
      `# ${challenge.title}`,
      "",
      `**${t("shortDescription")}**: ${valueOrDash(challenge.shortDescription)}`,
      `**${t("status")}**: ${challenge.status}`,
      "",
    ];

    sections.forEach((section) => {
      lines.push(`## ${section.title}`, section.content || "-", "");
    });

    lines.push(`## ${t("solutions")}`, "");
    if (solutions.length === 0) {
      lines.push("-", "");
    } else {
      solutions.forEach((solution, index) => {
        lines.push(
          `### ${index + 1}. ${solution.title}`,
          "",
          solution.description || "-",
          "",
          `- **${t("pros")}**: ${valueOrDash(solution.pros)}`,
          `- **${t("cons")}**: ${valueOrDash(solution.cons)}`,
          `- **${t("risk")}**: ${valueOrDash(solution.risk)}`,
          `- **${t("effort")}**: ${valueOrDash(solution.effort)}`,
          `- **${t("impact")}**: ${valueOrDash(solution.impact)}`,
          `- **${t("resourcesNeeded")}**: ${valueOrDash(solution.resourcesNeeded)}`,
          `- **${t("priority")}**: ${valueOrDash(solution.priority)}`,
          "",
        );
      });
    }

    lines.push(`## ${t("tasks")}`, "");
    if (tasks.length === 0) {
      lines.push("-", "");
    } else {
      tasks.forEach((task, index) => {
        lines.push(
          `### ${index + 1}. ${task.title}`,
          "",
          task.description || "-",
          "",
          `- **${t("responsiblePerson")}**: ${valueOrDash(task.responsiblePerson)}`,
          `- **${t("deadline")}**: ${valueOrDash(task.deadline)}`,
          `- **${t("completed")}**: ${task.completed ? t("yes") : t("no")}`,
          `- **${t("position")}**: ${task.position}`,
          "",
        );
      });
    }

    return lines.join("\n");
  }, [challenge, sections, solutions, tasks, t]);

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown);
      setStatus(t("copySuccess"));
    } catch {
      setStatus(t("copyFallback"));
    }
  }

  function downloadMarkdown() {
    const blob = new Blob([markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "noproblemo-challenge.md";
    link.click();
    URL.revokeObjectURL(url);
    setStatus(t("downloadSuccess"));
  }

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6">
      <h2 className="text-2xl font-semibold text-[#22211e]">{t("title")}</h2>
      <p className="mt-2 text-sm leading-6 text-[#55544f]">{t("body")}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={printHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832]"
        >
          {t("pdfButton")}
        </Link>
        <button
          type="button"
          onClick={copyMarkdown}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300/80 bg-white px-5 py-3 font-semibold text-[#22211e] hover:border-slate-500"
        >
          {t("copy")}
        </button>
        <button
          type="button"
          onClick={downloadMarkdown}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300/80 bg-white px-5 py-3 font-semibold text-[#22211e] hover:border-slate-500"
        >
          {t("download")}
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#706f68]">{t("pdfHint")}</p>
      {status ? <p className="mt-3 text-sm text-[#55544f]">{status}</p> : null}
    </section>
  );
}
