"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelRequest, sendQuote } from "@/app/admin/(panel)/requests/actions";
import { Button } from "@/components/Button";
import { useToast } from "./Toast";

const inputCls = "w-full rounded-[12px] border border-border bg-white px-4 py-3 text-base text-ink focus:border-forest-500";

export function QuoteForm({
  id,
  currency,
  initial,
  canCancel,
  alreadyQuoted,
}: {
  id: string;
  currency: "USD" | "GHS";
  initial: { amount: string; depositPct: string; message: string };
  canCancel: boolean;
  alreadyQuoted: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ ...initial, validDays: "7" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await sendQuote({ id, amount: f.amount, depositPct: f.depositPct, validDays: f.validDays, message: f.message });
      if (!res.ok) return toast(res.error, "error");
      toast(res.emailed ? "Price sent to the customer" : "Price saved, but the email could not be sent. Share the link yourself.", res.emailed ? undefined : "error");
      router.refresh();
    });
  }

  function cancel() {
    if (!window.confirm("Close this request? The customer will no longer be able to accept it.")) return;
    start(async () => {
      const res = await cancelRequest(id);
      if (!res.ok) return toast(res.error, "error");
      toast("Request closed");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-[20px] border border-border bg-white p-6">
      <h2 className="font-serif text-2xl font-semibold text-forest-900">{alreadyQuoted ? "Update the price" : "Send a price"}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">Total price ({currency === "GHS" ? "GH₵" : "USD"})
          <input type="number" required min={1} step="any" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">Deposit % (100 = full only)
          <input type="number" required min={1} max={100} value={f.depositPct} onChange={(e) => setF({ ...f, depositPct: e.target.value })} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">Valid for (days)
          <input type="number" required min={1} max={60} value={f.validDays} onChange={(e) => setF({ ...f, validDays: e.target.value })} className={inputCls} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">Message to the customer (optional)
        <textarea rows={4} maxLength={1500} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="What the price includes, hotels, transport, anything they should know…" className={`${inputCls} resize-y`} />
      </label>
      <p className="text-sm text-ink-secondary">
        {currency === "GHS" ? "All places are in Ghana, so the customer pays in cedis. " : "The customer pays in dollars. "}
        Sending emails the customer a link where they can accept and pay.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>{pending ? "Sending…" : alreadyQuoted ? "Resend updated price" : "Send price"}</Button>
        {canCancel && (
          <button type="button" onClick={cancel} disabled={pending} className="text-sm font-semibold text-kente-red hover:underline">Close this request</button>
        )}
      </div>
    </form>
  );
}
