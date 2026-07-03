# Phase Handoff Template

Use this template for future Codex prompts.

```text
You are continuing the NoProblemo project.

Read first:
- CURRENT_STATE.md
- docs/CODEX_PROJECT_MAP.md
- AGENTS.md
- Relevant installed Next.js docs in node_modules/next/dist/docs/

Task:
Implement Phase [NUMBER] only: [PHASE NAME].

Before changing files:
1. Inspect the current repository state.
2. Check package.json.
3. Check relevant app routes/components.
4. Check relevant docs.
5. Report what already exists.
6. Report what is missing for this phase.
7. Then implement only this phase.

In scope:
- [specific item]
- [specific item]

Out of scope:
- Do not rebuild from scratch.
- Do not change unrelated files.
- Do not expose secrets.
- Do not read or print .env.local values.
- Do not implement later phases.
- Do not add heavy dependencies unless explicitly justified.

Architecture and design:
- Preserve Next.js App Router, TypeScript, Tailwind CSS, next-intl, Supabase direction, and Vercel direction.
- Preserve minimalistic, calm, professional responsive UI.
- Keep user-generated content separate from UI translations.

Documentation updates:
- CURRENT_STATE.md
- docs/CODEX_PROJECT_LOG.md
- docs/CHANGELOG.md
- Any phase-specific docs that became inaccurate

Validation:
Run available commands:
- npm run lint
- npm run typecheck
- npm run build

If validation fails:
- Fix the cause.
- Re-run validation.
- Do not finish until validation passes or a true external blocker is documented.

Final response:
- Changed files
- Created files
- Validation commands and results
- What was added
- Security/privacy impact
- Remaining warnings or unknowns
```
