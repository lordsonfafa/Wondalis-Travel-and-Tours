"use client";

import { money } from "@/lib/money";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Booking } from "@/lib/data/bookings";
import { Button } from "./Button";
import { Reveal } from "./Reveal";

type Tab = "upcoming" | "past";

const tabs: { value: Tab; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];


const chipBase =
  "inline-flex items-center whitespace-nowrap rounded-full px-5 py-2.5 text-[15px] font-semibold leading-5 tracking-[0.2px] transition-colors";

function BookingCard({ booking }: { booking: Booking }) {
  const { title, dates, travellers, totalUsd, paidUsd, currency, image, ref, when } = booking;
  const usd = (n: number) => money(n, currency);
  const settled = paidUsd >= totalUsd;
  const pct = Math.min(100, Math.round((paidUsd / totalUsd) * 100));

  return (
    <article className="flex flex-col gap-5 rounded-lg border border-border bg-white p-5 sm:flex-row sm:items-center sm:gap-6 sm:pr-6">
      <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-[16px] sm:h-[132px] sm:w-[176px]">
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 640px) 176px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <h2 className="font-serif text-2xl font-semibold leading-8 text-forest-900 sm:text-[28px] sm:leading-9">
          {title}
        </h2>
        <p className="text-base leading-6 text-ink-secondary">
          {dates} · {travellers} {travellers === 1 ? "adult" : "adults"}
        </p>
        <div
          role="progressbar"
          aria-label="Amount paid"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="h-2 w-full max-w-[360px] overflow-hidden rounded-sm bg-sand"
        >
          <div
            className={`h-full ${settled ? "bg-[#2e7d4f]" : "bg-gold-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm leading-5 text-ink-secondary">
          {settled ? `${usd(paidUsd)} paid` : `${usd(paidUsd)} of ${usd(totalUsd)} paid`}
        </p>
      </div>

      <div className="flex shrink-0 items-center">
        <div className="flex flex-row-reverse items-center gap-3 sm:flex-col sm:items-end">
          {/* Both routes are not designed in Figma yet. */}
          <Button href={`/account/bookings/${ref}`} variant="secondary">
            View
          </Button>
          {!settled && when === "upcoming" && (
            <Button href={`/account/bookings/${ref}/pay`}>Pay balance</Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function BookingsList({ bookings }: { bookings: Booking[] }) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const visible = bookings.filter((b) => b.when === tab);

  return (
    <>
      <div role="tablist" aria-label="Bookings" className="flex gap-2.5">
        {tabs.map((t) => {
          const active = t.value === tab;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              id={`tab-${t.value}`}
              aria-selected={active}
              aria-controls="bookings-panel"
              onClick={() => setTab(t.value)}
              className={`${chipBase} ${
                active
                  ? "bg-forest-900 text-ivory"
                  : "border border-border bg-white text-forest-900 hover:border-forest-900"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="bookings-panel"
        aria-labelledby={`tab-${tab}`}
        className="flex flex-col gap-5"
      >
        {visible.length === 0 ? (
          <p className="py-12 text-ink-secondary">
            No {tab} bookings.{" "}
            {tab === "upcoming" && (
              <Link href="/trips" className="font-semibold text-forest-900 underline">
                Browse trips
              </Link>
            )}
          </p>
        ) : (
          visible.map((b, i) => (
            <Reveal key={b.ref} delay={i * 100}>
              <BookingCard booking={b} />
            </Reveal>
          ))
        )}
      </div>
    </>
  );
}