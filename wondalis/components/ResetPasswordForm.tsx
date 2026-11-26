"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "./Button";
import { PasswordInput } from "./PasswordInput";

const inputCls =
  "w-full rounded-[12px] border border-border bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink-secondary/70 focus:border-forest-500";

export function ResetPasswordForm({ token, signInHref = "/account/sign-in" }: { token: string | null; signInHref?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  if (!token) {
    return (
      <div role="alert" className="flex flex-col gap-4">
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-[-0.5px] text-forest-900">Link expired</h1>
        <p className="text-base leading-6 text-ink-secondary">
          This reset link is invalid or has expired. Request a new one and try again.
        </p>
        <div>
          <Button href="/account/forgot-password">Request a new link</Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-[-0.5px] text-forest-900">Password changed</h1>
        <p className="text-base leading-6 text-ink-secondary">You can now sign in with your new password.</p>
        <div>
          <Button href={signInHref}>Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const password = String(form.get("password") ?? "");
        if (password !== String(form.get("confirm") ?? "")) return setError("The two passwords do not match.");
        setError(null);
        setPending(true);
        const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
        setPending(false);
        if (error) return setError("This link is invalid or has expired. Request a new one.");
        setDone(true);
      }}
      className="flex flex-col gap-6"
    >
      <h1 className="font-serif text-4xl font-bold leading-tight tracking-[-0.5px] text-forest-900">Choose a new password</h1>
      {(["password", "confirm"] as const).map((id) => (
        <div key={id} className="flex flex-col gap-1.5">
          <label htmlFor={id} className="text-sm leading-5 text-ink-secondary">
            {id === "password" ? "New password" : "Confirm new password"}
          </label>
          <PasswordInput id={id} name={id} required minLength={8} autoComplete="new-password" className={inputCls} />
        </div>
      ))}
      {error && (
        <p role="alert" className="rounded-[12px] bg-kente-red/10 px-4 py-3 text-sm text-kente-red">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </Button>
      <Link href={signInHref} className="text-center text-[15px] font-semibold text-forest-900 underline">
        Back to sign in
      </Link>
    </form>
  );
}
