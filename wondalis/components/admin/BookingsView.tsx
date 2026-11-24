"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import {
  bookingStatus,
  type AdminBooking,
  type PaymentStatus,
  type ScheduleItem,
} from "@/lib/data/admin";
import { StatusPill } from "./StatusPill";
import { useToast } from "./Toast";

const filters: ("All" | PaymentStatus)[] = ["All", "Paid", "Partial", "Due", "Cancelled"];

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

const chipBase =
  "inline-flex items-center whitespace-nowrap rounded-full px-[18px] py-2.5 text-[15px] font-semibold leading-5 tracking-[0.2px] transition-colors";
const inputCls =
  "w-full rounded-[12px] border border-border bg-ivory px-4 py-3.5 text-base text-ink focus:border-forest-500";

/** Pill for one line of the payment schedule: Paid, next due (gold), later (grey) or overdue (red). */
function SchedulePill({ item, isNext }: { item: ScheduleItem; isNext: boolean }) {
  const cls = item.paid
    ? "bg-[#e3f2e8] text-[#2e7d4f]"
    : item.overdue
      ? "bg-[#fae5e0] text-kente-red"
      : isNext
        ? "bg-[#f5ebd4] text-forest-900"
        : "bg-[#f0ebe0] text-ink-secondary";
  return (
    <span className={`shrink-0 rounded-full px-3 py-[5px] text-sm leading-5 ${cls}`}>
      {item.paid ? "Paid" : `Due ${item.due}`}
    </span>
  );
}

function csvCell(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function BookingsView({ initial }: { initial: AdminBooking[] }) {
  const toast = useToast();
  const [bookings, setBookings] = useState(initial);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [selectedRef, setSelectedRef] = useState(initial[0]?.ref);
  const [query, setQuery] = useState("");
  // Below xl the detail is its own screen (back arrow), as in the mobile design.
  const [detailOpen, setDetailOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const q = query.trim().toLowerCase();
  const visible = bookings.filter(
    (b) =>
      (filter === "All" || bookingStatus(b) === filter) &&
      (!q || [b.ref, b.customer, b.trip].some((v) => v.toLowerCase().includes(q))),
  );
  const selected = visible.find((b) => b.ref === selectedRef) ?? visible[0];
  const nextIndex = selected ? selected.schedule.findIndex((s) => !s.paid) : -1;
  const nextItem = nextIndex >= 0 ? selected!.schedule[nextIndex] : undefined;

  function select(ref: string) {
    setSelectedRef(ref);
    // On narrow screens the detail replaces the list, so start at the top of it.
    if (window.matchMedia("(max-width: 1279px)").matches) {
      setDetailOpen(true);
      window.scrollTo({ top: 0 });
    }
  }

  // Real CSV of what is currently listed. The backend will export from the database.
  function exportCsv() {
    const header = ["Ref", "Customer", "Trip", "Travellers", "Total (USD)", "Paid (USD)", "Status"];
    const rows = visible.map((b) => [
      b.ref, b.customer, b.trip, b.travellers, b.totalUsd, b.paidUsd, bookingStatus(b),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "wondalis-bookings.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${visible.length} booking${visible.length === 1 ? "" : "s"}`);
  }

  // Dummy: the backend will store the payment and update the schedule.
  function recordPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const amount = Number(new FormData(e.currentTarget).get("amount"));
    if (!(amount > 0)) return toast("Enter an amount above zero.", "error");

    let left = amount;
    const schedule = selected.schedule.map((item) => {
      if (!item.paid && left >= item.amountUsd) {
        left -= item.amountUsd;
        return { ...item, paid: true, overdue: false };
      }
      return item;
    });
    setBookings((all) =>
      all.map((b) => (b.ref === selected.ref ? { ...b, paidUsd: b.paidUsd + amount, schedule } : b)),
    );
    dialogRef.current?.close();
    toast(`${usd(amount)} recorded for ${selected.ref}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={`${detailOpen ? "hidden xl:flex" : "flex"} flex-col gap-6`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="animate-fade-up hidden font-serif text-3xl font-semibold leading-tight text-forest-900 lg:block lg:text-[40px] lg:leading-[48px]">
          Bookings
        </h1>
        <Button variant="secondary" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      {/* Search is part of the mobile design only. */}
      <label className="flex items-center gap-2.5 rounded-[12px] border border-border bg-white px-4 py-3.5 text-base text-ink-secondary lg:hidden">
        <span aria-hidden>⌕</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bookings"
          aria-label="Search bookings"
          className="w-full bg-transparent text-ink outline-none placeholder:text-ink-secondary"
        />
      </label>

      <div role="group" aria-label="Filter by payment status" className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={f === filter}
            onClick={() => setFilter(f)}
            className={`${chipBase} ${
              f === filter
                ? "bg-forest-900 text-ivory"
                : "border border-border bg-white text-forest-900 hover:border-forest-900"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
        {/* List */}
        <div
          className={`${detailOpen ? "hidden xl:block" : ""} min-w-0 md:overflow-x-auto md:rounded-[20px] md:border md:border-border md:bg-white md:px-6 md:py-2`}
        >
          {/* Mobile: one card per booking */}
          <ul className="flex flex-col gap-3.5 md:hidden">
            {visible.map((b) => (
              <li key={b.ref}>
                <button
                  type="button"
                  onClick={() => select(b.ref)}
                  className="flex w-full flex-col gap-2 rounded-[20px] border border-border bg-white p-[17px] text-left"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-[15px] leading-5 text-forest-900">{b.ref}</span>
                    <StatusPill status={bookingStatus(b)} />
                  </span>
                  <span className="text-xl font-semibold leading-7 text-forest-900">{b.customer}</span>
                  <span className="text-sm leading-5 text-ink-secondary">{b.trip}</span>
                  <span className="text-xl font-semibold leading-7 text-forest-900">{usd(b.totalUsd)}</span>
                </button>
              </li>
            ))}
          </ul>
          <table className="hidden w-full min-w-[560px] text-left md:table">
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
              {visible.map((b) => {
                const active = b.ref === selected?.ref;
                return (
                  <tr
                    key={b.ref}
                    onClick={() => select(b.ref)}
                    className={`cursor-pointer border-b border-border last:border-b-0 ${
                      active ? "bg-gold-100" : "hover:bg-ivory"
                    }`}
                  >
                    <td className="whitespace-nowrap py-3.5 pl-2 pr-4">
                      <button
                        type="button"
                        aria-current={active ? "true" : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          select(b.ref);
                        }}
                        className="text-forest-900 underline-offset-4 hover:underline"
                      >
                        {b.ref}
                      </button>
                    </td>
                    <td className="whitespace-nowrap py-3.5 pr-4 text-ink">{b.customer}</td>
                    <td className="whitespace-nowrap py-3.5 pr-4 text-ink">{b.trip}</td>
                    <td className="whitespace-nowrap py-3.5 pr-4 text-ink">{usd(b.paidUsd)}</td>
                    <td className="py-3.5 pr-2">
                      <StatusPill status={bookingStatus(b)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && (
            <p className="py-10 text-center text-ink-secondary">No bookings match this filter.</p>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <aside
            ref={panelRef}
            aria-label={`Booking ${selected.ref}`}
            className={`${detailOpen ? "flex" : "hidden xl:flex"} scroll-mt-6 flex-col gap-5 rounded-[20px] border border-border bg-white p-7 xl:sticky xl:top-10`}
          >
            <button
              type="button"
              onClick={() => setDetailOpen(false)}
              className="-mb-1 w-fit text-[15px] font-semibold leading-5 text-forest-700 hover:text-forest-900 xl:hidden"
            >
              ← All bookings
            </button>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
                {selected.ref}
              </h2>
              <StatusPill status={bookingStatus(selected)} />
            </div>

            <dl className="flex flex-col gap-5 text-base leading-6">
              {[
                ["Customer", selected.customer],
                ["Trip", selected.trip],
                ["Travellers", `${selected.travellers} ${selected.travellers === 1 ? "adult" : "adults"}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-ink-secondary">{k}</dt>
                  <dd className="text-right text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="h-px bg-border" />

            <h3 className="font-sans text-xl font-semibold leading-7 text-forest-900">Payments</h3>
            {selected.schedule.length === 0 ? (
              <p className="text-base text-ink-secondary">No payments.</p>
            ) : (
              <ul className="flex flex-col gap-5">
                {selected.schedule.map((item, i) => (
                  <li key={item.label} className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base leading-6 text-ink">{item.label}</span>
                      <span className="text-sm leading-5 text-ink-secondary">{usd(item.amountUsd)}</span>
                    </div>
                    <SchedulePill item={item} isNext={i === nextIndex} />
                  </li>
                ))}
              </ul>
            )}

            {!selected.cancelled && (
              <div className="flex flex-col gap-3">
                <Button
                  className="w-full"
                  onClick={() => dialogRef.current?.showModal()}
                >
                  Record payment
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  // Dummy: the backend will email or SMS the customer here.
                  onClick={() => toast(`Reminder sent to ${selected.customer}`)}
                >
                  Send reminder
                </Button>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Record payment dialog (native <dialog>: focus is trapped and Esc closes it) */}
      <dialog
        ref={dialogRef}
        aria-labelledby="record-title"
        className="m-auto w-[calc(100%-2.5rem)] max-w-md rounded-[20px] border border-border bg-white p-0 backdrop:bg-forest-900/50"
      >
        {selected && (
          <form
            // Remount when the booking changes so the amount defaults to its next instalment.
            key={`${selected.ref}-${selected.paidUsd}`}
            onSubmit={recordPayment}
            className="flex flex-col gap-5 p-7"
          >
            <div className="flex flex-col gap-1">
              <h2 id="record-title" className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
                Record payment
              </h2>
              <p className="text-base text-ink-secondary">
                {selected.ref} · {selected.customer}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="amount" className="text-sm leading-5 text-ink-secondary">Amount (USD)</label>
              <input
                id="amount"
                name="amount"
                type="number"
                min={1}
                step="any"
                required
                defaultValue={nextItem?.amountUsd}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="method" className="text-sm leading-5 text-ink-secondary">Received by</label>
              <select id="method" name="method" className={inputCls}>
                <option>Bank transfer</option>
                <option>Mobile money</option>
                <option>Cash</option>
                <option>Card</option>
              </select>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
                Cancel
              </Button>
              <Button type="submit">Record payment</Button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}