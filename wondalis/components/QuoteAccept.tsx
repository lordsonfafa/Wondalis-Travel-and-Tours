"use client";

import { useActionState, useState } from "react";
import { acceptQuote, declineQuote, type AcceptState } from "@/app/quote/[token]/actions";
import { Button } from "./Button";

const opt = (on: boolean) =>
  `flex cursor-pointer items-start gap-3 rounded-[14px] border-2 p-4 transition-colors ${on ? "border-forest-900 bg-white" : "border-border bg-white hover:border-forest-500"}`;

export function QuoteAccept({
  token,
  currency,
  totalLabel,
  depositLabel,
  canDeposit,
}: {
  token: string;
  currency: "USD" | "GHS";
  totalLabel: string;
  depositLabel: string | null;
  canDeposit: boolean;
}) {
  const [state, action, pending] = useActionState<AcceptState, FormData>(acceptQuote, null);
  const [plan, setPlan] = useState<"deposit" | "full">(canDeposit ? "deposit" : "full");
  const [method, setMethod] = useState<"card" | "momo" | "bank">("card");
  const [confirmDecline, setConfirmDecline] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-6">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="plan" value={plan} />
        <input type="hidden" name="method" value={method} />

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-semibold text-forest-900">How much would you like to pay now?</legend>
          {canDeposit && depositLabel && (
            <label className={opt(plan === "deposit")}>
              <input type="radio" name="plan-choice" checked={plan === "deposit"} onChange={() => setPlan("deposit")} className="mt-1 accent-forest-900" />
              <span>
                <span className="block text-base font-semibold text-forest-900">Pay a deposit: {depositLabel}</span>
                <span className="block text-sm text-ink-secondary">The balance is due before the trip.</span>
              </span>
            </label>
          )}
          <label className={opt(plan === "full")}>
            <input type="radio" name="plan-choice" checked={plan === "full"} onChange={() => setPlan("full")} className="mt-1 accent-forest-900" />
            <span>
              <span className="block text-base font-semibold text-forest-900">Pay in full: {totalLabel}</span>
            </span>
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-semibold text-forest-900">Payment method</legend>
          <label className={opt(method === "card")}>
            <input type="radio" name="method-choice" checked={method === "card"} onChange={() => setMethod("card")} className="mt-1 accent-forest-900" />
            <span className="text-base font-semibold text-forest-900">Card</span>
          </label>
          {currency === "GHS" && (
            <label className={opt(method === "momo")}>
              <input type="radio" name="method-choice" checked={method === "momo"} onChange={() => setMethod("momo")} className="mt-1 accent-forest-900" />
              <span className="text-base font-semibold text-forest-900">Mobile money</span>
            </label>
          )}
          <label className={opt(method === "bank")}>
            <input type="radio" name="method-choice" checked={method === "bank"} onChange={() => setMethod("bank")} className="mt-1 accent-forest-900" />
            <span>
              <span className="block text-base font-semibold text-forest-900">Bank transfer</span>
              <span className="block text-sm text-ink-secondary">We email you our bank details and hold your plan for 48 hours.</span>
            </span>
          </label>
        </fieldset>

        {state?.error && (
          <p role="alert" className="rounded-[12px] bg-kente-red/10 px-4 py-3 text-sm text-kente-red">
            {state.error}
          </p>
        )}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "One moment…" : method === "bank" ? "Accept and get bank details" : "Accept and pay"}
          </Button>
        </div>
      </form>

      <div className="border-t border-border pt-5">
        {confirmDecline ? (
          <form action={declineQuote.bind(null, token)} className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink-secondary">Decline this price?</span>
            <button type="submit" className="rounded-full bg-kente-red px-5 py-2.5 text-sm font-semibold text-white">
              Yes, decline
            </button>
            <button type="button" onClick={() => setConfirmDecline(false)} className="text-sm font-semibold text-forest-900 underline">
              Keep it
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setConfirmDecline(true)} className="text-sm font-semibold text-ink-secondary underline hover:text-forest-900">
            No thanks, decline this price
          </button>
        )}
      </div>
    </div>
  );
}
