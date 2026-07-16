"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { getRecoverySupabaseClient } from "@/lib/supabase/recovery-client";
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

type RecoveryState = "checking" | "ready" | "submitting" | "error" | "updated";
type RecoveryFailureReason =
  | "expired-link"
  | "verifier-missing-or-expired"
  | "unknown";

function classifyRecoveryFailure(error?: {
  code?: string;
  message?: string;
  status?: number;
}): RecoveryFailureReason {
  const code = (error?.code ?? "").toLowerCase();
  const message = (error?.message ?? "").toLowerCase();

  if (code.includes("expired") || message.includes("expired")) {
    return "expired-link";
  }

  if (
    code.includes("verifier") ||
    code.includes("pkce") ||
    code.includes("flow_state") ||
    code.includes("invalid_grant") ||
    message.includes("verifier") ||
    message.includes("pkce") ||
    message.includes("flow state") ||
    message.includes("invalid grant") ||
    message.includes("auth code")
  ) {
    return "verifier-missing-or-expired";
  }

  return "unknown";
}

function warnRecoveryFailure(reason: RecoveryFailureReason) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`Password reset exchange failed: ${reason}`);
  }
}

export function ResetPasswordForm({ locale, labels }: ResetPasswordFormProps) {
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");
  const [message, setMessage] = useState("");
  const supabase = useMemo(() => getRecoverySupabaseClient(), []);

  useEffect(() => {
    let active = true;

    function markReady() {
      if (!active) return;
      setRecoveryState("ready");
      setMessage(labels.ready);
    }

    function markFailed(reason: RecoveryFailureReason) {
      if (!active) return;
      warnRecoveryFailure(reason);
      setRecoveryState("error");
      setMessage(labels.linkInvalid);
    }

    async function prepareRecoverySession() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) {
          markFailed(classifyRecoveryFailure(error));
          return;
        }
        window.history.replaceState(null, "", url.pathname);
        markReady();
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!active) return;
        if (error) {
          markFailed(classifyRecoveryFailure(error));
          return;
        }
        window.history.replaceState(null, "", url.pathname);
        markReady();
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;

      if (session) {
        markReady();
      } else {
        markFailed("verifier-missing-or-expired");
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        markReady();
      }
    });

    prepareRecoverySession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [labels.linkInvalid, labels.ready, supabase]);

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

    setRecoveryState("submitting");
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setRecoveryState("ready");
      setMessage(labels.updateFailed);
      return;
    }

    await supabase.auth.signOut();
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
        {recoveryState === "submitting" ? `${labels.submit}…` : labels.submit}
      </button>
    </form>
  );
}
