import { money, moneyCompact } from "@/lib/money";
import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { StatusPill } from "@/components/admin/StatusPill";
import { departures, kpis, recentBookings } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Dashboard" };

const card = "rounded-[20px] border border-border bg-white";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="animate-fade-up font-serif text-3xl font-semibold leading-tight text-forest-900 lg:text-[40px] lg:leading-[48px]">
          Dashboard
        </h1>
        <div className="flex items-center gap-3">
          {/* Dummy period chip: becomes a month picker once there is real data. */}
          <span className="rounded-full border border-border bg-white px-[18px] py-3 text-[15px] font-semibold leading-5 tracking-[0.2px] text-forest-900">
            Dec 2026
          </span>
          <Button href="/admin/trips/new">New trip</Button>
        </div>
      </div>

      {/* KPIs */}
      <dl className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className={`${card} flex flex-col gap-2 p-5 lg:p-6`}>
            <dt className="text-sm leading-5 text-ink-secondary">{k.label}</dt>
            <dd className="font-serif text-3xl font-semibold leading-tight text-forest-900 lg:text-[40px] lg:leading-[48px]">
              {k.usd !== undefined ? moneyCompact(k.usd, "GHS") : k.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-8 xl:grid-cols-[1fr_340px]">
        {/* Recent bookings */}
        <section className="flex min-w-0 flex-col gap-4">
          <h2 className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
            Recent bookings
          </h2>
          <div className={`${card} overflow-x-auto px-6 py-2`}>
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-border text-xs font-bold leading-4 tracking-[2px] text-ink-secondary">
                  <th scope="col" className="py-3 pr-4 font-bold">REF</th>
                  <th scope="col" className="py-3 pr-4 font-bold">CUSTOMER</th>
                  <th scope="col" className="py-3 pr-4 font-bold">TRIP</th>
                  <th scope="col" className="py-3 pr-4 font-bold">PAID</th>
                  <th scope="col" className="py-3 font-bold">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.ref} className="border-b border-border last:border-b-0">
                    <td className="whitespace-nowrap py-3.5 pr-4 text-forest-900">{b.ref}</td>
                    <td className="whitespace-nowrap py-3.5 pr-4 text-ink">{b.customer}</td>
                    <td className="whitespace-nowrap py-3.5 pr-4 text-ink">{b.trip}</td>
                    <td className="whitespace-nowrap py-3.5 pr-4 text-ink">{money(b.paidUsd, "GHS")}</td>
                    <td className="py-3.5">
                      <StatusPill status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Upcoming departures */}
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
            Upcoming departures
          </h2>
          <ul className={`${card} flex flex-col gap-6 p-6`}>
            {departures.map((d) => (
              <li key={d.trip} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xl font-semibold leading-7 text-forest-900">{d.trip}</p>
                  <p className="shrink-0 text-base leading-6 text-ink-secondary">{d.date}</p>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${d.trip} seats booked`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={d.bookedPct}
                  className="h-2 overflow-hidden rounded-sm bg-sand"
                >
                  <div className="h-full bg-gold-500" style={{ width: `${d.bookedPct}%` }} />
                </div>
                <p className="text-sm leading-5 text-ink-secondary">{d.bookedPct}% booked</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}