# UX/UI Guide

## Visual Direction

NoProblemo should feel minimalistic, clean, calm, professional, and easy to understand. It should be suitable for both private users and organizations without feeling heavy or corporate.

## Tone

- Plain language.
- Calm prompts.
- No pressure or hype.
- Clear distinction between guest actions and account-required actions.
- Helpful privacy-aware guidance.

## Layout Principles

- Mobile-first.
- Responsive for desktop, tablet, and mobile.
- Use constrained content widths.
- Use clear sections, generous spacing, and restrained borders.
- Avoid nested card-heavy layouts.
- Avoid visual clutter and decorative complexity.

## Current UI

- Public landing page at `/[locale]`.
- Guest workspace at `/[locale]/solve`.
- Support page at `/[locale]/support`.
- Placeholder login/signup pages.
- Neutral palette with white surfaces, warm off-white background, dark text, and subtle borders.

## Mobile, Tablet, Desktop Behavior

- Mobile: single-column flow, full-width controls, readable text, minimal side-by-side layouts.
- Tablet: use two-column layouts only where content remains readable.
- Desktop: use wider grid layouts but keep line lengths controlled.
- RTL locales must remain readable and aligned naturally.

## Dashboard Principles

Dashboard is planned, not implemented.

Future dashboard should:

- Prioritize saved challenges and recent activity.
- Keep navigation simple.
- Avoid showing private group or message data without authorization.
- Make create/search/filter actions obvious.

## Form Principles

- Use labels for every field.
- Keep fields focused and understandable.
- Validate before server writes.
- Show concise errors near fields.
- Avoid asking for account creation before guest value is clear.

## Workspace Principles

- Follow the structured problem-solving workflow.
- Keep user-generated content in user-controlled fields.
- Do not automatically translate user-generated content.
- Make save/collaboration requirements clear.
- Keep local guest work visibly separate from cloud saved work once cloud saving exists.

## Accessibility Basics

- Use semantic HTML.
- Maintain color contrast.
- Keep keyboard-accessible controls.
- Use visible focus states when custom controls are introduced.
- Avoid relying on color alone.
- Keep text sizes readable across supported languages.
