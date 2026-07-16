"use client";

import { useId, useState } from "react";

type PasswordFieldProps = {
  name: string;
  label: string;
  buttonLabels: {
    show: string;
    hide: string;
  };
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
};

export function PasswordField({
  name,
  label,
  buttonLabels,
  placeholder,
  autoComplete,
  required,
  minLength,
  disabled,
}: PasswordFieldProps) {
  const inputId = useId();
  const [isVisible, setIsVisible] = useState(false);
  const buttonLabel = isVisible ? buttonLabels.hide : buttonLabels.show;

  return (
    <div className="grid gap-2">
      <label
        htmlFor={inputId}
        className="text-sm font-semibold text-[#373632]"
      >
        {label}
      </label>
      <span className="relative block">
        <input
          id={inputId}
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          disabled={disabled}
          className="min-h-12 w-full rounded-md border border-[#dad8d0] bg-white px-4 py-3 pe-28 text-[#161616] outline-none focus:border-[#22211e] disabled:cursor-not-allowed disabled:bg-[#f1f0ec]"
          placeholder={placeholder}
        />
        <button
          type="button"
          aria-label={buttonLabel}
          aria-controls={inputId}
          aria-pressed={isVisible}
          disabled={disabled}
          onClick={() => setIsVisible((value) => !value)}
          className="absolute end-2 top-1/2 inline-flex min-h-8 max-w-24 -translate-y-1/2 items-center justify-center rounded-md border border-[#dad8d0] bg-white px-2 text-xs font-semibold text-[#373632] hover:border-[#8b897f] disabled:cursor-not-allowed disabled:bg-[#f1f0ec]"
        >
          <span className="truncate">{buttonLabel}</span>
        </button>
      </span>
    </div>
  );
}
