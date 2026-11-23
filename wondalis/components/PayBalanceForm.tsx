"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Booking } from "@/lib/data/bookings";
import { money } from "@/lib/money";
import { Button } from "./Button";

const gutter = "px-5 md:px-12 lg:px-24";

const methods = [
  { value: "card", title: "Card", desc: "Visa, Mastercard" },
  { value: "momo", title: "Mobile money", desc: "MTN MoMo, Telecel Cash, AirtelTigo" },
  { value: "bank", title: "Bank transfer", desc: "Instructions sent after you confirm" },
] as const;

type Method = (typeof methods)[number]["value"];

export function PayBalanceForm({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("card");

  const balanceUsd = booking.totalUsd - booking.paidUsd;
  const amount = money(balanceUsd, booking.currency);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Dummy flow: no payment is taken and the booking data does not change.
    // The backend will start the payment here and update the booking when it succeeds.
    router.push(`/account/bookings/${booking.ref}?paid=1`);
  }

  return (
    <div className={`mx-auto flex max-w-[1440px] flex-col gap-8 pb-20 pt-10 lg:pb-[120px] lg:pt-12 ${gutter}`}>
      <Link
        href={`/account/bookings/${booking.ref}`}
        className="animate-fade-up w-fit text-[15px] font-semibold leading-5 text-forest-700 hover:text-forest-900"
      >
        ← Back to booking
      </Link>

      <div className="animate-fade-up flex flex-col gap-2">
        <p className="text-xs font-bold leading-4 tracking-[2px] text-forest-500">{booking.ref}</p>
        <h1 className="font-serif text-3xl font-semibold leading-tight text-forest-900 lg:text-[40px] lg:leading-[48px]">
          Pay your balance
        </h1>
      </div>

      <form onSubmit={onSubmit} className="grid items-start gap-6 lg:grid-cols-[1fr_440px]">
        <fieldset className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-white p-6 sm:p-8">
          <legend className="sr-only">Payment method</legend>
          <h2 className="text-xl font-semibold leading-7 text-forest-900">Payment method</h2>
          {methods.map((m) => (
            <label
              key={m.value}
              className={`flex cursor-pointer items-center gap-4 rounded-[16px] border p-4 transition-colors focus-within:ring-2 focus-within:ring-forest-500/40 ${
                method === m.value ? "border-forest-900 bg-gold-100/40" : "border-border bg-ivory"
              }`}
            >
              <input
                type="radio"
                name="method"
                value={m.value}
                checked={method === m.value}
                onChange={() => setMethod(m.value)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={`size-[22px] shrink-0 rounded-full border-2 ${
                  method === m.value ? "border-forest-900 bg-forest-900 ring-2 ring-inset ring-ivory" : "border-border bg-white"
                }`}
              />
              <span className="flex flex-col">
                <span className="text-base font-semibold leading-6 text-forest-900">{m.title}</span>
                <span className="text-sm leading-5 text-ink-secondary">{m.desc}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <aside
          aria-label="Payment summary"
          className="flex flex-col gap-5 rounded-lg border border-border bg-white p-6 shadow-[0_16px_40px_rgba(11,42,36,0.1)] sm:p-8 lg:sticky lg:top-28"
        >
          <h2 className="text-xl font-semibold leading-7 text-forest-900">{booking.title}</h2>
          <dl className="flex flex-col gap-3 text-base leading-6">
            <div className="flex justify-between gap-6">
              <dt className="text-ink-secondary">Trip total</dt>
              <dd className="text-ink">{money(booking.totalUsd, booking.currency)}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-ink-secondary">Already paid</dt>
              <dd className="text-ink">{money(booking.paidUsd, booking.currency)}</dd>
            </div>
            <div className="h-px w-full bg-border" />
            <div className="flex justify-between gap-6 text-xl font-semibold leading-7 text-forest-900">
              <dt>Due now</dt>
              <dd>{amount}</dd>
            </div>
          </dl>
          <Button type="submit" className="w-full">
            Pay {amount}
          </Button>
          <p className="text-center text-sm leading-5 text-ink-secondary">
            Secure payment. You will get a receipt by email.
          </p>
        </aside>
      </form>
    </div>
  );
}