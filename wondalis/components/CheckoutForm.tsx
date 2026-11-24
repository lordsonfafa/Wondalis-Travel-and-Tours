"use client";

import { money, tripCurrency } from "@/lib/money";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./Button";
import { departureLabel, type Trip } from "@/lib/data/trips";
import { commonCountries, otherCountries } from "@/lib/data/countries";

const DEPOSIT_RATE = 0.3;

const methods = [
  { value: "card", title: "Card", desc: "Visa, Mastercard" },
  { value: "momo", title: "Mobile money", desc: "MTN MoMo, Telecel Cash, AirtelTigo" },
  { value: "bank", title: "Bank transfer", desc: "Instructions sent after booking" },
] as const;

type Plan = "deposit" | "full";
type Method = (typeof methods)[number]["value"];


const gutter = "px-5 md:px-12 lg:px-24";
const inputCls =
  "w-full rounded-[12px] border border-border bg-ivory px-4 py-3.5 text-base text-ink placeholder:text-ink-secondary/70 focus:border-forest-500";
const cardCls = "flex min-w-0 flex-col gap-5 rounded-lg border border-border bg-white p-6 sm:p-8";
const cardTitle = "font-sans text-xl font-semibold leading-7 text-forest-900";

function TextField({
  label,
  id,
  type = "text",
  placeholder,
  autoComplete,
  required = true,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm leading-5 text-ink-secondary">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className={inputCls}
      />
    </div>
  );
}

function CountryField({
  label,
  id,
  autoComplete,
}: {
  label: string;
  id: string;
  autoComplete?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm leading-5 text-ink-secondary">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={id}
          required
          defaultValue=""
          autoComplete={autoComplete}
          className={`${inputCls} cursor-pointer appearance-none pr-10 invalid:text-ink-secondary/70`}
        >
          <option value="" disabled>
            Select a country
          </option>
          <optgroup label="Common">
            {commonCountries.map((c) => (
              <option key={c} value={c} className="text-ink">
                {c}
              </option>
            ))}
          </optgroup>
          <optgroup label="All countries">
            {otherCountries.map((c) => (
              <option key={c} value={c} className="text-ink">
                {c}
              </option>
            ))}
          </optgroup>
        </select>
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
      </div>
    </div>
  );
}

function OptionCard({
  name,
  value,
  checked,
  onChange,
  title,
  desc,
  amount,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  desc: string;
  amount?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-4 rounded-[16px] transition-colors focus-within:ring-2 focus-within:ring-forest-500/40 ${
        checked
          ? "border-2 border-gold-500 bg-gold-100 p-[19px]"
          : "border border-border bg-white p-5 hover:border-gold-300"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        aria-hidden
        className={`size-[22px] shrink-0 rounded-full border-2 ${
          checked ? "border-forest-900 bg-forest-900" : "border-gold-300 bg-white"
        }`}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xl font-semibold leading-7 text-forest-900">{title}</span>
        <span className="text-sm leading-5 text-ink-secondary">{desc}</span>
      </span>
      {amount && (
        <span className="text-xl font-semibold leading-7 text-forest-900">{amount}</span>
      )}
    </label>
  );
}

export function CheckoutForm({
  trip,
  travellers,
  image,
}: {
  trip: Trip;
  travellers: number;
  image: string;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("deposit");
  const [method, setMethod] = useState<Method>("card");

  const currency = tripCurrency(trip.type);
  const usd = (n: number) => money(n, currency);
  const total = travellers * trip.priceUsd;
  const deposit = Math.round(total * DEPOSIT_RATE);
  const dueToday = plan === "deposit" ? deposit : total;
  const remaining = total - dueToday;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Dummy flow: no payment is taken. The backend will create the booking
    // and hand off to the payment gateway here.
    const ref = `WTT-${Math.floor(100000 + Math.random() * 900000)}`;
    const q = new URLSearchParams({
      trip: trip.slug,
      travellers: String(travellers),
      plan,
      method,
      ref,
    });
    router.push(`/confirmation?${q}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`mx-auto flex max-w-[1440px] flex-col gap-8 pb-36 pt-6 sm:pt-10 lg:flex-row lg:items-start lg:gap-12 lg:pb-28 ${gutter}`}
    >
      {/* Form column */}
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        {/* Mobile: compact trip summary at the top. The full breakdown sits in the sidebar from lg up. */}
        <div className="flex items-center gap-4 rounded-lg border border-border bg-white p-4 lg:hidden">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-md">
            <Image src={image} alt="" fill sizes="56px" className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-base font-semibold leading-6 text-forest-900">{trip.title}</p>
            <p className="text-sm leading-5 text-ink-secondary">
              {departureLabel(trip)} · {travellers} {travellers === 1 ? "adult" : "adults"}
            </p>
          </div>
        </div>

        <h1 className="font-serif text-3xl font-semibold leading-tight text-forest-900 lg:text-[40px] lg:leading-[48px]">
          Traveller details
        </h1>

        <section className={cardCls}>
          <h2 className={cardTitle}>Lead traveller</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="First name" id="firstName" autoComplete="given-name" />
            <TextField label="Last name" id="lastName" autoComplete="family-name" />
            <TextField
              label="Email"
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
            />
            <TextField
              label="WhatsApp number"
              id="whatsapp"
              type="tel"
              placeholder="+1 000 000 0000"
              autoComplete="tel"
            />
            <CountryField label="Country of residence" id="residence" autoComplete="country-name" />
            <CountryField label="Passport nationality" id="nationality" />
          </div>
        </section>

        {Array.from({ length: travellers - 1 }, (_, i) => i + 2).map((n) => (
          <section key={n} className={cardCls}>
            <h2 className={cardTitle}>Traveller {n}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="First name" id={`firstName${n}`} />
              <TextField label="Last name" id={`lastName${n}`} />
            </div>
          </section>
        ))}

        <fieldset className={cardCls}>
          <legend className="sr-only">Choose how to pay</legend>
          <h2 aria-hidden className={cardTitle}>
            Choose how to pay
          </h2>
          <OptionCard
            name="plan"
            value="deposit"
            checked={plan === "deposit"}
            onChange={() => setPlan("deposit")}
            title="Pay a 30% deposit today"
            desc="Pay the balance in instalments before departure."
            amount={usd(deposit)}
          />
          <OptionCard
            name="plan"
            value="full"
            checked={plan === "full"}
            onChange={() => setPlan("full")}
            title="Pay in full today"
            desc="Settle the full amount now."
            amount={usd(total)}
          />
        </fieldset>

        <fieldset className={cardCls}>
          <legend className="sr-only">Payment method</legend>
          <h2 aria-hidden className={cardTitle}>
            Payment method
          </h2>
          {methods.map((m) => (
            <OptionCard
              key={m.value}
              name="method"
              value={m.value}
              checked={method === m.value}
              onChange={() => setMethod(m.value)}
              title={m.title}
              desc={m.desc}
            />
          ))}
        </fieldset>
      </div>

      {/* Order summary */}
      <aside
        aria-label="Order summary"
        className="hidden w-full shrink-0 flex-col gap-5 rounded-lg border border-border bg-white p-6 shadow-[0_16px_40px_rgba(11,42,36,0.1)] sm:p-8 lg:sticky lg:top-8 lg:flex lg:w-[420px]"
      >
        <h2 className={cardTitle}>Your trip</h2>
        <div className="flex items-center gap-4">
          <div className="relative size-[88px] shrink-0 overflow-hidden rounded-md">
            <Image src={image} alt="" fill sizes="88px" className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-xl font-semibold leading-7 text-forest-900">{trip.title}</p>
            <p className="text-sm leading-5 text-ink-secondary">
              {departureLabel(trip)} · {travellers} {travellers === 1 ? "adult" : "adults"}
            </p>
          </div>
        </div>

        <div className="h-px w-full bg-border" />
        <div className="flex items-start justify-between text-base">
          <span className="text-ink-secondary">
            {travellers} × {usd(trip.priceUsd)}
          </span>
          <span className="text-ink">{usd(total)}</span>
        </div>

        <div className="h-px w-full bg-border" />
        <div className="flex items-start justify-between text-xl font-semibold leading-7 text-forest-900">
          <span>{plan === "deposit" ? "Due today (30%)" : "Due today"}</span>
          <span>{usd(dueToday)}</span>
        </div>
        <div className="flex items-start justify-between text-base">
          <span className="text-ink-secondary">Remaining balance</span>
          <span className="text-ink">{usd(remaining)}</span>
        </div>

        <Button type="submit" className="w-full">
          Continue to payment
        </Button>
      </aside>

      {/* Mobile: sticky bar with what is due today and the main action. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-ivory px-5 py-4 shadow-[0_-8px_24px_rgba(11,42,36,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm leading-5 text-ink-secondary">Due today</span>
            <span className="font-serif text-2xl font-semibold leading-8 text-forest-900">{usd(dueToday)}</span>
          </div>
          <Button type="submit" className="flex-1 sm:flex-none">
            Continue to payment
          </Button>
        </div>
      </div>
    </form>
  );
}