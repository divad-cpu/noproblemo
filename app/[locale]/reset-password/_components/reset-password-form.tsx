"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { authClient } from "@/lib/neon/client";
import { PasswordField } from "../../_components/password-field";

type ResetPasswordFormProps = {
  locale: Locale;
  labels: {
    newPassword: string;
    newPasswordPlaceholder: string;
    confirmPassword: string;
    confirmPasswordPlaceholder: string;
    showPassword: string;
    hidePassword: string;
    submit: string;
    preparing: string;
    ready: string;
    success: string;
    weakPassword: string;
    mismatch: string;
    updateFailed: string;
    linkInvalid: string;
    recoveryHelp: string;
  };
};

type RecoveryState = "checking" | "ready" | "error" | "updated";
export function ResetPasswordForm({ locale, labels }: ResetPasswordFormProps) {
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");
  const [message, setMessage] = useState("");
  const token = useRef<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    token.current ??= url.searchParams.get("token");
    const invalid = url.searchParams.has("error") || !token.current;
    url.searchParams.delete("token");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    const timer = window.setTimeout(() => {
      setRecoveryState(invalid ? "error" : "ready");
      setMessage(invalid ? labels.linkInvalid : labels.ready);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [labels.linkInvalid, labels.ready]);

  async function handleSubmit(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 8) {
      setRecoveryState("ready");
      setMessage(labels.weakPassword);
      return;
    }

    if (password !== confirmPassword) {
      setRecoveryState("ready");
      setMessage(labels.mismatch);
      return;
    }

    if (recoveryState !== "ready" || !token.current) return;
    setRecoveryState("checking");
    const { error } = await authClient.resetPassword({ newPassword: password, token: token.current })
      .catch(() => ({ error: { message: "Request failed" } }));

    if (error) {
      setRecoveryState("ready");
      setMessage(labels.updateFailed);
      return;
    }

    token.current = null;
    await authClient.signOut().catch(() => undefined);
    setRecoveryState("updated");
    setMessage(labels.success);
    window.location.assign(`/${locale}/login?status=password-reset-success`);
  }

  const isReady = recoveryState === "ready";

  return (
    <form action={handleSubmit} className="mt-8 grid gap-4">
      <p
        className={`rounded-md border p-4 text-sm leading-6 ${
          recoveryState === "error"
            ? "border-[#e3b8ad] bg-[#fff7f4] text-[#7a2f1d]"
            : "border-[#cbd8c5] bg-[#f6fbf4] text-[#2f5f2d]"
        }`}
      >
        {message || labels.preparing}
      </p>
      {recoveryState === "error" ? (
        <p className="text-sm leading-6 text-[#706f68]">
          {labels.recoveryHelp}
        </p>
      ) : null}
      <PasswordField
        name="password"
        label={labels.newPassword}
        autoComplete="new-password"
        required
        minLength={8}
        disabled={!isReady}
        placeholder={labels.newPasswordPlaceholder}
        buttonLabels={{
          show: labels.showPassword,
          hide: labels.hidePassword,
        }}
      />
      <PasswordField
        name="confirmPassword"
        label={labels.confirmPassword}
        autoComplete="new-password"
        required
        minLength={8}
        disabled={!isReady}
        placeholder={labels.confirmPasswordPlaceholder}
        buttonLabels={{
          show: labels.showPassword,
          hide: labels.hidePassword,
        }}
      />
      <button
        type="submit"
        disabled={!isReady}
        className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#22211e] px-5 py-3 font-semibold text-white hover:bg-[#3a3832] disabled:cursor-not-allowed disabled:bg-[#8b897f]"
      >
        {labels.submit}
      </button>
    </form>
  );
}
