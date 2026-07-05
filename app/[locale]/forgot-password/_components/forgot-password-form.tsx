"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { getRecoverySupabaseClient } from "@/lib/supabase/recovery-client";

type ForgotPasswordFormProps = {
  locale: Locale;
  labels: {
    email: string;
    emailPlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    help: string;
    missingEmail: string;
    rateLimited: string;
    providerOrSmtp: string;
    invalidEmail: string;
    redirectNotAllowed: string;
    failed: string;
  };
};

type FormState = "idle" | "submitting" | "success" | "error";
type ResetFailureReason =
  | "rate-limit"
  | "provider-or-smtp"
  | "redirect-url"
  | "invalid-email"
  | "unknown";

function classifyResetFailure(error: {
  code?: string;
  message?: string;
  status?: number;
}): ResetFailureReason {
  const code = (error.code ?? "").toLowerCase();
  const message = (error.message ?? "").toLowerCase();

  if (error.status === 429 || code.includes("rate") || message.includes("rate")) {
    return "rate-limit";
  }

  if (
    code.includes("email") ||
    message.includes("invalid email") ||
    message.includes("email address is invalid")
  ) {
    return "invalid-email";
  }

  if (
    code.includes("redirect") ||
    message.includes("redirect") ||
    message.includes("not allowed") ||
    message.includes("url is not allowed")
  ) {
    return "redirect-url";
  }

  if (
    code.includes("smtp") ||
    code.includes("provider") ||
    message.includes("smtp") ||
    message.includes("provider") ||
    message.includes("email provider") ||
    message.includes("mail")
  ) {
    return "provider-or-smtp";
  }

  return "unknown";
}

function messageForReason(
  reason: ResetFailureReason,
  labels: ForgotPasswordFormProps["labels"],
) {
  switch (reason) {
    case "rate-limit":
      return labels.rateLimited;
    case "provider-or-smtp":
      return labels.providerOrSmtp;
    case "redirect-url":
      return labels.redirectNotAllowed;
    case "invalid-email":
      return labels.invalidEmail;
    case "unknown":
      return labels.failed;
  }
}

function warnResetFailure(reason: ResetFailureReason) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`Password reset request failed: ${reason}`);
  }
}

export function ForgotPasswordForm({ locale, labels }: ForgotPasswordFormProps) {
  const supabase = useMemo(() => getRecoverySupabaseClient(), []);
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldownSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting" || cooldownSeconds > 0) {
      return;
    }

    const form = event.currentTarget;
    setState("submitting");
    setMessage("");

    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setState("error");
      setMessage(labels.missingEmail);
      return;
    }

    const redirectTo = `${window.location.origin}/${locale}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      const reason = classifyResetFailure(error);
      warnResetFailure(reason);
      if (reason === "rate-limit") {
        setCooldownSeconds(60);
      }
      setState("error");
      setMessage(messageForReason(reason, labels));
      return;
    }

    setState("success");
    setMessage(labels.success);
    form.reset();
  }

  const isSubmitting = state === "submitting";
  const isSubmitDisabled = isSubmitting || cooldownSeconds > 0;

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
      {message ? (
        <p
          className={`rounded-md border p-4 text-sm leading-6 ${
            state === "error"
              ? "border-[#e3b8ad] bg-[#fff7f4] text-[#7a2f1d]"
              : "border-[#cbd8c5] bg-[#f6fbf4] text-[#2f5f2d]"
          }`}
        >
          {message}
        </p>
      ) : null}
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-[#373632]">
          {labels.email}
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isSubmitDisabled}
          className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e] disabled:cursor-not-allowed disabled:bg-[#f1f0ec]"
          placeholder={labels.emailPlaceholder}
        />
      </label>
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832] disabled:cursor-not-allowed disabled:bg-[#8b897f]"
      >
        {isSubmitting ? labels.submitting : labels.submit}
      </button>
      <p className="text-sm leading-6 text-[#706f68]">{labels.help}</p>
    </form>
  );
}
