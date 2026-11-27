"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { submitRequest, type PlanState } from "@/app/build-a-trip/actions";
import type { PlaceItem } from "@/lib/db/places";
import { Button } from "./Button";

const inputCls =
  "w-full rounded-[12px] border border-border bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink-secondary/70 focus:border-forest-500";
const chip = "inline-flex items-center whitespace-nowrap rounded-full px-[18px] py-2.5 text-[15px] font-semibold leading-5 tracking-[0.2px] transition-colors";

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm leading-5 text-ink-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}

export function PlanForm({
  places,
  today,
  defaults,
}: {
  places: PlaceItem[];
  today: string;
  defaults: { name: string; email: string };
}) {
  const [state, action, pending] = useActionState<PlanState, FormData>(submitRequest, null);
  const [selected, setSelected] = useState<string[]>([]);
  const [region, setRegion] = useState<"ALL" | "GHANA" | "ABROAD">("ALL");
  const [category, setCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(places.map((p) => p.category).filter(Boolean)))];
  const visible = places.filter((p) => (region === "ALL" || p.region === region) && (category === "All" || p.category === category));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 15 ? s : [...s, id]));
  const [first = "", ...rest] = defaults.name.split(" ");

  return (
    <form action={action} className="flex flex-col gap-14 pb-28">
      {selected.map((id) => (
        <input key={id} type="hidden" name="place" value={id} />
      ))}

      <section aria-labelledby="places-title" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 id="places-title" className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
            1. Choose the places you want to visit
          </h2>
          <p className="text-base leading-6 text-ink-secondary">Pick as many as you like (up to 15). We will price the whole plan for you.</p>
        </div>

        <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter places">
          {([["ALL", "All places"], ["GHANA", "In Ghana"], ["ABROAD", "Abroad"]] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={region === v}
              onClick={() => setRegion(v)}
              className={`${chip} ${region === v ? "bg-forest-900 text-ivory" : "border border-border bg-white text-forest-900 hover:border-forest-900"}`}
            >
              {label}
            </button>
          ))}
          {categories.length > 2 && <span aria-hidden className="mx-1 hidden w-px bg-border sm:block" />}
          {categories.length > 2 &&
            categories.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={`${chip} ${category === c ? "bg-gold-500 text-forest-900" : "border border-border bg-white text-forest-900 hover:border-forest-900"}`}
              >
                {c}
              </button>
            ))}
        </div>

        {visible.length === 0 ? (
          <p className="rounded-lg bg-sand p-6 text-base text-ink-secondary">No places match these filters.</p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => {
              const on = selected.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(p.id)}
                    className={`group flex h-full w-full flex-col overflow-hidden rounded-lg border-2 bg-white text-left transition-all ${
                      on ? "border-forest-900 shadow-[0_16px_32px_-16px_rgba(11,42,36,0.4)]" : "border-border hover:border-forest-500"
                    }`}
                  >
                    <div className="relative h-40 w-full bg-gradient-to-br from-forest-700 to-forest-900">
                      {p.image && (
                        <Image src={p.image} alt="" fill sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                      )}
                      <span
                        aria-hidden
                        className={`absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-base font-bold ${
                          on ? "bg-gold-500 text-forest-900" : "bg-ivory/90 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5 p-5">
                      <p className="text-xs font-bold leading-4 tracking-[2px] text-forest-500">
                        {(p.area || (p.region === "GHANA" ? "Ghana" : "Abroad")).toUpperCase()}
                        {p.category ? ` · ${p.category.toUpperCase()}` : ""}
                      </p>
                      <h3 className="font-serif text-2xl font-semibold leading-8 text-forest-900">{p.name}</h3>
                      {p.description && <p className="line-clamp-3 text-sm leading-5 text-ink-secondary">{p.description}</p>}
                      <span className="mt-auto pt-2 text-sm font-semibold text-forest-900">{on ? "Selected ✓ (tap to remove)" : "Tap to add"}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="trip-title" className="flex max-w-3xl flex-col gap-6">
        <h2 id="trip-title" className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
          2. Tell us about the trip
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Travellers" id="travellers">
            <input id="travellers" name="travellers" type="number" min={1} max={30} defaultValue={2} required className={inputCls} />
          </Field>
          <Field label="Preferred start (optional)" id="startsOn">
            <input id="startsOn" name="startsOn" type="date" min={today} className={inputCls} />
          </Field>
          <Field label="Preferred end (optional)" id="endsOn">
            <input id="endsOn" name="endsOn" type="date" min={today} className={inputCls} />
          </Field>
        </div>
        <label className="flex items-center gap-3 text-base text-ink">
          <input type="checkbox" name="flexible" className="size-5 accent-forest-900" />
          My dates are flexible
        </label>
        <Field label="Anything else we should know? (optional)" id="notes">
          <textarea id="notes" name="notes" rows={3} maxLength={1000} placeholder="Budget, hotel style, who is travelling, special occasions…" className={`${inputCls} resize-y`} />
        </Field>
      </section>

      <section aria-labelledby="you-title" className="flex max-w-3xl flex-col gap-6">
        <h2 id="you-title" className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
          3. Where should we send the price?
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" id="firstName">
            <input id="firstName" name="firstName" required maxLength={60} autoComplete="given-name" defaultValue={first} className={inputCls} />
          </Field>
          <Field label="Last name" id="lastName">
            <input id="lastName" name="lastName" required maxLength={60} autoComplete="family-name" defaultValue={rest.join(" ")} className={inputCls} />
          </Field>
          <Field label="Email" id="email">
            <input id="email" name="email" type="email" required autoComplete="email" defaultValue={defaults.email} className={inputCls} />
          </Field>
          <Field label="WhatsApp number (optional)" id="whatsapp">
            <input id="whatsapp" name="whatsapp" type="tel" maxLength={30} autoComplete="tel" placeholder="+233 20 123 4567" className={inputCls} />
          </Field>
          <Field label="Country you live in" id="residence">
            <input id="residence" name="residence" required maxLength={80} autoComplete="country-name" placeholder="Ghana, United Kingdom…" className={inputCls} />
          </Field>
        </div>
        {state?.error && (
          <p role="alert" className="rounded-[12px] bg-kente-red/10 px-4 py-3 text-sm text-kente-red">
            {state.error}
          </p>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-ivory px-5 py-4 shadow-[0_-8px_24px_rgba(11,42,36,0.08)]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 md:px-7 lg:px-[72px]">
          <p className="text-base text-ink">
            <span className="font-serif text-2xl font-semibold text-forest-900">{selected.length}</span>{" "}
            {selected.length === 1 ? "place" : "places"} chosen
          </p>
          <Button type="submit" disabled={pending || selected.length === 0}>
            {pending ? "Sending…" : "Get my price"}
          </Button>
        </div>
      </div>
    </form>
  );
}
