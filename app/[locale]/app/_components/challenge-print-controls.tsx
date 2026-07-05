"use client";

import { Link } from "@/i18n/navigation";

type ChallengePrintControlsProps = {
  backHref: string;
  backLabel: string;
  printLabel: string;
};

export function ChallengePrintControls({
  backHref,
  backLabel,
  printLabel,
}: ChallengePrintControlsProps) {
  return (
    <div className="print-screen-only mb-6 flex flex-col gap-3 sm:flex-row">
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-4 py-2 text-sm font-semibold text-[#22211e] hover:border-[#8b897f]"
      >
        {backLabel}
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#22211e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a3832]"
      >
        {printLabel}
      </button>
    </div>
  );
}
