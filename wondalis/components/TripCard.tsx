import Image from "next/image";
import type { Trip } from "@/lib/data/trips";
import { money, tripCurrency } from "@/lib/money";
import { Button } from "./Button";

export function TripCard({ trip }: { trip: Trip }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-16px_rgba(11,42,36,0.28)]">
      <div className="relative h-60 w-full overflow-hidden">
        <Image
          src={trip.image}
          alt={trip.title}
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-ivory px-3.5 py-2 text-sm leading-5 text-forest-900">
          {trip.dates}
        </span>
      </div>
      <div className="flex flex-col gap-2.5 p-6">
        <p className="text-xs font-bold leading-4 tracking-[2px] text-forest-500">
          {trip.location}
        </p>
        <h3 className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
          {trip.title}
        </h3>
        <p className="text-sm leading-5 text-ink-secondary">{trip.nights} nights</p>
        <div className="h-px w-full bg-border" />
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm leading-5 text-ink-secondary">From</span>
            <span className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
              {money(trip.priceUsd, tripCurrency(trip.type))}
            </span>
          </div>
          <Button href={`/trips/${trip.slug}`}>View trip</Button>
        </div>
      </div>
    </article>
  );
}