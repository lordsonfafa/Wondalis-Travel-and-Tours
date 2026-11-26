"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "./Button";

const inputCls =
  "w-full rounded-[12px] border border-border bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink-secondary/70 focus:border-forest-500";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (email) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-[-0.5px] text-forest-900">
          Check your email
        </h1>
        <p className="text-base leading-6 text-ink-secondary">
          If an account exists for {email}, we have sent a link to reset your password.
        </p>
        <div>
          <Button href="/account/sign-in" variant="secondary">
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const value = String(new FormData(e.currentTarget).get("email") ?? "").trim();
        setError(null);
        setPending(true);
        const { error } = await authClient.requestPasswordReset({ email: value, redirectTo: "/account/reset-password" });
        setPending(false);
        // Same screen whether or not the email has an account, so this form never reveals who has one.
        if (error?.status === 429) return setError("Too many requests. Wait a minute and try again.");
        setEmail(value);
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-[-0.5px] text-forest-900">
          Reset your password
        </h1>
        <p className="text-base leading-6 text-ink-secondary">
          Enter your email and we will send you a reset link.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm leading-5 text-ink-secondary">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputCls}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-[12px] bg-kente-red/10 px-4 py-3 text-sm text-kente-red">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <Link href="/account/sign-in" className="text-center text-[15px] font-semibold text-forest-900 underline">
        Back to sign in
      </Link>
    </form>
  );
}
