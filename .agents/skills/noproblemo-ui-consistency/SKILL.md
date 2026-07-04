---
name: noproblemo-ui-consistency
description: Use when editing NoProblemo UI, layout, navigation, auth pages, settings pages, dashboard, language switching, responsive behavior, or visible copy.
---

# NoProblemo UI Consistency

Use this skill for UI work in NoProblemo. Preserve the existing calm, minimal, professional MVP direction unless the user explicitly asks for a redesign.

## Review First

Inspect the relevant UI surface before editing:

- `app/[locale]/layout.tsx`
- `app/[locale]/page.tsx`
- `app/[locale]/_components/`
- `app/[locale]/app/layout.tsx`
- `app/[locale]/app/page.tsx`
- `app/[locale]/app/settings/page.tsx`
- Related route pages under `app/[locale]/app/`
- `app/globals.css`
- `messages/*.json`

## UI Rules

- Keep responsive behavior for mobile, tablet, and desktop.
- Preserve existing color, border, spacing, radius, and typography patterns unless there is a clear reason.
- Avoid broad style churn and unrelated visual redesigns.
- Do not add heavy UI dependencies without explicit justification.
- Prefer simple Tailwind changes that match nearby code.
- Keep text from overflowing buttons, cards, headers, and forms.
- Avoid expanding all 11 languages in compact headers; use existing language-switcher patterns.
- Preserve RTL support for Arabic and Urdu.
- Use translation keys for visible UI text.
- Do not automatically translate user-generated content.

## Consistency Targets

Check these surfaces when relevant:

- Public landing header and language switcher
- Protected app shell/navigation
- Dashboard hierarchy and card density
- Auth pages
- Settings and danger-zone sections
- Challenge workspace
- Friends, groups, notifications, and admin pages

## Validation

For UI code changes, run:

```bash
npm run lint
npm run typecheck
npm run build
```

For message changes, validate JSON and key parity across all 11 locales.

## Final Response

Summarize:

- Visible UI changes
- Responsive/i18n/RTL considerations
- Files changed
- Validation results
- Remaining manual browser checks
