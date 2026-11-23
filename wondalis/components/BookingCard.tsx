"use client";

import { useState } from "react";
import { money, type Currency } from "@/lib/money";
import { Button } from "./Button";

const MAX_TRAVELLERS = 8;
const DEPOSIT_RATE = 0.3;


const selectCls =
  "w-full cursor-pointer appearance-none rounded-[12px] border border-border bg-ivory px-4 py-3.5 pr-10 text-base text-ink";

function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-secondary"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 8 5 5 5-5" />
    </svg>
  );
}

export function BookingCard({
  slug,
  priceUsd,
  currency,
  departure,
}: {
  slug: string;
  priceUsd: number;
  currency: Currency;
  departure: string;
}) {
  const [travellers, setTravellers] = useState(2);
  const total = travellers * priceUsd;
  const deposit = Math.round(total * DEPOSIT_RATE);

  return (
    <aside
      aria-label="Book this trip"
      className="flex flex-col gap-5 rounded-lg border border-border bg-white p-6 shadow-[0_16px_40px_rgba(11,42,36,0.1)] sm:p-8"
    >
      <div className="flex flex-col gap-0.5">
        <p className="text-sm leading-5 text-ink-secondary">From</p>
        <p className="flex items-end gap-2">
          <span className="font-serif text-[40px] font-semibold leading-[48px] text-forest-900">
            {money(priceUsd, currency)}
          </span>
          <span className="pb-0.5 text-base text-ink-secondary">per person</span>
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="departure" className="text-sm leading-5 text-ink-secondary">
          Departure date
        </label>
        <div className="relative">
          {/* One departure for now. More will come from the backend. */}
          <select id="departure" className={selectCls} defaultValue={departure}>
            <option>{departure}</option>
          </select>
          <Chevron />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="travellers" className="text-sm leading-5 text-ink-secondary">
          Travellers
        </label>
        <div className="relative">
          <select
            id="travellers"
            className={selectCls}
            value={travellers}
            onChange={(e) => setTravellers(Number(e.target.value))}
          >
            {Array.from({ length: MAX_TRAVELLERS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "adult" : "adults"}
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      </div>

      <div className="h-px w-full bg-border" />

      <div className="flex items-start justify-between text-base">
        <span className="text-ink-secondary">
          {travellers} × {money(priceUsd, currency)}
        </span>
        <span className="text-ink">{money(total, currency)}</span>
      </div>
      <div className="flex items-start justify-between gap-4 text-xl font-semibold leading-7 text-forest-900">
        <span>Deposit due today (30%)</span>
        <span>{money(deposit, currency)}</span>
      </div>

      <Button href={`/checkout?trip=${slug}&travellers=${travellers}`} className="w-full">
        Reserve my spot
      </Button>
    </aside>
  );
}