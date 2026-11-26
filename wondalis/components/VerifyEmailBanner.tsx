"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

// Shown on My bookings while the account's email is unverified. Guest bookings made with this
// email only show up here after it is verified.
export function VerifyEmailBanner({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-gold-100 px-5 py-4 text-[15px] text-forest-900">
      <p>
        {state === "sent"
          ? `We sent a confirmation link to ${email}.`
          : "Please confirm your email. Bookings you made as a guest will appear here once you do."}
      </p>
      {state !== "sent" && (
        <button
          type="button"
          disabled={state === "sending"}
          onClick={async () => {
            setState("sending");
            const { error } = await authClient.sendVerificationEmail({ email, callbackURL: "/" });
            setState(error ? "error" : "sent");
          }}
          className="font-semibold underline disabled:opacity-60"
        >
          {state === "sending" ? "Sending…" : state === "error" ? "Try again" : "Send confirmation email"}
        </button>
      )}
    </div>
  );
}
