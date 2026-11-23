"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInDummy } from "@/lib/fake-auth";
import { Button } from "./Button";

type Mode = "signin" | "create";

const tabs: { value: Mode; label: string }[] = [
  { value: "signin", label: "Sign in" },
  { value: "create", label: "Create account" },
];

const copy: Record<Mode, { eyebrow: string; lead: string; accent: string }> = {
  signin: { eyebrow: "WELCOME BACK", lead: "Good to see you", accent: "again." },
  create: { eyebrow: "NEW HERE", lead: "Your next trip starts", accent: "here." },
};

const inputCls =
  "w-full rounded-[12px] border border-border bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink-secondary/70 focus:border-forest-500";

function Field({
  label,
  id,
  type = "text",
  placeholder,
  autoComplete,
  minLength,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-sm leading-5 text-ink-secondary">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        className={inputCls}
      />
    </div>
  );
}

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");

  // Dummy auth: nothing is checked or stored. The backend will sign the user in
  // (or create the account) here, and "Continue with Google" will start the OAuth flow.
  function enter() {
    signInDummy();
    router.push("/");
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    enter();
  }

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-6">
      <div key={`heading-${mode}`} className="animate-fade-up flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <Image src="/icons/star-nav.svg" alt="" width={16} height={16} />
          <p className="text-xs font-bold leading-4 tracking-[2px] text-forest-500">
            {copy[mode].eyebrow}
          </p>
        </div>
        <h2 className="font-serif text-3xl font-bold leading-[1.1] tracking-[-0.5px] text-forest-900 sm:text-4xl">
          {copy[mode].lead}{" "}
          <em className="font-bold italic text-forest-500">{copy[mode].accent}</em>
        </h2>
      </div>

      <div
        role="tablist"
        aria-label="Account"
        className="grid grid-cols-2 gap-1 rounded-full border border-border bg-sand p-1"
      >
        {tabs.map((t) => {
          const active = t.value === mode;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMode(t.value)}
              className={`rounded-full px-4 py-2.5 text-[15px] font-semibold leading-5 tracking-[0.2px] transition-colors ${
                active ? "bg-forest-900 text-ivory" : "text-ink-secondary hover:text-forest-900"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <form key={`form-${mode}`} onSubmit={onSubmit} className="flex flex-col gap-6">
        {mode === "create" && (
          <Field label="Full name" id="name" autoComplete="name" />
        )}
        <Field
          label="Email"
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
        />
        <div className="flex flex-col gap-2">
          <Field
            label="Password"
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={mode === "create" ? 8 : undefined}
          />
          {mode === "signin" && (
            <Link
              href="/account/forgot-password"
              className="self-end text-sm leading-5 text-forest-700 hover:underline"
            >
              Forgot password?
            </Link>
          )}
        </div>

        <Button type="submit" className="w-full">
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm leading-5 text-ink-secondary">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button variant="secondary" className="w-full" onClick={enter}>
        Continue with Google
      </Button>
    </div>
  );
}
