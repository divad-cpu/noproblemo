const foundationItems = [
  ["Stack", "Next.js, TypeScript, Tailwind CSS"],
  ["Backend", "Supabase configured, migrations deferred"],
  ["Scope", "No auth, payments, AI, email, or cron in Phase 1"],
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 bg-[#f7f7f4] px-5 py-8 text-[#161616] sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col justify-between gap-12 rounded-lg border border-[#dad8d0] bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#706f68]">
            Phase 1 foundation
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            NoProblemo is ready for careful, incremental product work.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[#55544f] sm:text-lg">
            This deployment is intentionally minimal. It verifies the Next.js
            App Router foundation, project documentation, environment templates,
            and security guardrails before feature development begins.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {foundationItems.map(([label, value]) => (
            <div
              key={label}
              className="rounded-md border border-[#e5e2da] bg-[#fbfaf7] p-4"
            >
              <p className="text-sm font-medium text-[#706f68]">{label}</p>
              <p className="mt-2 text-base font-semibold text-[#22211e]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
