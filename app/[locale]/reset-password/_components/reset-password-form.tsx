"use client";

import { useEffect, useMemo, useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";

type ResetPasswordFormProps = {
  labels: {
    newPassword: string;
    newPasswordPlaceholder: string;
    confirmPassword: string;
    confirmPasswordPlaceholder: string;
    submit: string;
    preparing: string;
    ready: string;
    success: string;
    weakPassword: string;
    mismatch: string;
    updateFailed: string;
    linkInvalid: string;
  };
};

type RecoveryState = "checking" | "ready" | "error" | "updated";

export function ResetPasswordForm({ labels }: ResetPasswordFormProps) {
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");
  const [message, setMessage] = useState("");
  const supabase = useMemo(() => createClientSupabaseClient(), []);

  useEffect(() => {
    let active = true;

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
          setRecoveryState("error");
          setMessage(labels.linkInvalid);
          return;
        }
        window.history.replaceState(null, "", url.pathname);
        setRecoveryState("ready");
        setMessage(labels.ready);
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!active) return;
        if (error) {
          setRecoveryState("error");
          setMessage(labels.linkInvalid);
          return;
        }
        window.history.replaceState(null, "", url.pathname);
        setRecoveryState("ready");
        setMessage(labels.ready);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;

      if (session) {
        setRecoveryState("ready");
        setMessage(labels.ready);
      } else {
        setRecoveryState("error");
        setMessage(labels.linkInvalid);
      }
    }

    prepareRecoverySession();

    return () => {
      active = false;
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

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setRecoveryState("ready");
      setMessage(labels.updateFailed);
      return;
    }

    await supabase.auth.signOut();
    setRecoveryState("updated");
    setMessage(labels.success);
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
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-[#373632]">
          {labels.newPassword}
        </span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={!isReady}
          className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e] disabled:cursor-not-allowed disabled:bg-[#f1f0ec]"
          placeholder={labels.newPasswordPlaceholder}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-[#373632]">
          {labels.confirmPassword}
        </span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={!isReady}
          className="min-h-12 rounded-md border border-[#dad8d0] bg-white px-4 py-3 text-[#161616] outline-none focus:border-[#22211e] disabled:cursor-not-allowed disabled:bg-[#f1f0ec]"
          placeholder={labels.confirmPasswordPlaceholder}
        />
      </label>
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
