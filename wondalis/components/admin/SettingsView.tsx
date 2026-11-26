"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import {
  inviteMember,
  refreshLiveRateNow,
  removeMember,
  resendInvite,
  saveFxSettings,
  type FxActionResult,
  type TeamActionResult,
} from "@/app/admin/(panel)/settings/actions";
import type { TeamMember } from "@/lib/db/team";
import { Switch } from "./Switch";
import { useToast } from "./Toast";

type Role = "Admin" | "Staff";

const cardCls = "flex flex-col gap-4 rounded-[20px] border border-border bg-white p-6";
const cardTitle = "font-sans text-xl font-semibold leading-7 text-forest-900";
const labelCls = "text-sm leading-5 text-ink-secondary";
const inputCls =
  "w-full rounded-[12px] border border-border bg-ivory px-4 py-3.5 text-base text-ink placeholder:text-ink-secondary focus:border-forest-500";

const rolePill: Record<Role, string> = {
  Admin: "bg-[#f5ebd4] text-forest-900",
  Staff: "bg-[#f0ebe0] text-ink-secondary",
};

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span id={id} className="text-base text-ink">
        {label}
      </span>
      <Switch checked={checked} onChange={onChange} labelId={id} />
    </div>
  );
}

export type FxSettings = {
  mode: "LIVE" | "FIXED";
  fixedRate: number;
  liveRate: number | null;
  liveRateUpdatedAt: string | null;
};

export function SettingsView({ fx, team, meId }: { fx: FxSettings; team: TeamMember[]; meId: string }) {
  const toast = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [fxMode, setFxMode] = useState(fx.mode);
  const [rate, setRate] = useState(String(fx.fixedRate));
  const [liveRate, setLiveRate] = useState(fx.liveRate);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState(fx.liveRateUpdatedAt);
  const [fxBusy, setFxBusy] = useState(false);
  const [show, setShow] = useState({ GBP: true, EUR: true, CAD: false });
  const [methods, setMethods] = useState({ Card: true, "Mobile money": true, "Bank transfer": true });
  const [deposit, setDeposit] = useState("30");
  const [balanceDays, setBalanceDays] = useState("14");
  const [policy, setPolicy] = useState("");
  const router = useRouter();
  const [teamBusy, setTeamBusy] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Staff">("Staff");

  function save() {
    const d = Number(deposit);
    const days = Number(balanceDays);
    if (!(d >= 1 && d <= 100)) return toast("Deposit must be between 1% and 100%", "error");
    if (!Number.isInteger(days) || days < 0) return toast("Balance days must be a whole number", "error");
    toast("Settings saved");
  }

  // The rate has its own Save button because it is the only setting wired to the database so far.
  async function runFx(action: () => Promise<FxActionResult>, success: string) {
    setFxBusy(true);
    const result = await action();
    setFxBusy(false);
    if (!result.ok) return toast(result.error, "error");
    setLiveRate(result.liveRate);
    setLiveUpdatedAt(result.liveRateUpdatedAt);
    toast(success);
  }
  const saveRate = () => runFx(() => saveFxSettings({ mode: fxMode, fixedRate: Number(rate) }), "Rate settings saved");
  const refreshRate = () => runFx(refreshLiveRateNow, "Live rate updated");

  function toggleMethod(name: keyof typeof methods, next: boolean) {
    if (!next && Object.values(methods).filter(Boolean).length === 1) {
      toast("Keep at least one payment method on", "error");
      return;
    }
    setMethods((m) => ({ ...m, [name]: next }));
  }

  async function runTeam(action: () => Promise<TeamActionResult>, success: string) {
    setTeamBusy(true);
    const result = await action();
    setTeamBusy(false);
    if (!result.ok) return toast(result.error, "error");
    toast(success);
    router.refresh(); // reload the team list from the server
  }

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = inviteEmail.trim();
    setTeamBusy(true);
    const result = await inviteMember({ name: inviteName, email, role: inviteRole });
    setTeamBusy(false);
    if (!result.ok) return toast(result.error, "error");
    setInviteName("");
    setInviteEmail("");
    setInviteRole("Staff");
    dialogRef.current?.close();
    toast(`Invite sent to ${email}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="hidden font-serif text-[32px] font-semibold leading-[40px] text-forest-900 lg:block lg:text-[40px] lg:leading-[48px]">
          Settings
        </h1>
        <Button onClick={save}>Save changes</Button>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <section className={cardCls} aria-labelledby="currencies-title">
            <h2 id="currencies-title" className={cardTitle}>Currencies</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="base" className={labelCls}>Base currency</label>
                <select
                  id="base"
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="USD">USD</option>
                  <option value="GHS">GHS</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-[12px] border border-border bg-ivory p-4">
              <p className={labelCls} id="rate-source-label">Exchange rate (USD to GHS)</p>
              <div role="radiogroup" aria-labelledby="rate-source-label" className="flex gap-2">
                {(["LIVE", "FIXED"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={fxMode === m}
                    onClick={() => setFxMode(m)}
                    className={`rounded-full border-[1.5px] px-5 py-2.5 text-[15px] font-semibold ${
                      fxMode === m
                        ? "border-forest-900 bg-forest-900 text-ivory"
                        : "border-border bg-white text-forest-900 hover:border-forest-900"
                    }`}
                  >
                    {m === "LIVE" ? "Live" : "Fixed"}
                  </button>
                ))}
              </div>

              <p className="text-sm leading-5 text-ink-secondary">
                {liveRate === null
                  ? "No live rate fetched yet. Prices use the fixed rate until the first daily update."
                  : `Live rate: 1 USD = GH₵${liveRate.toFixed(4)} · updated ${
                      liveUpdatedAt
                        ? new Date(liveUpdatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
                        : "unknown"
                    }`}
              </p>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="rate" className={labelCls}>
                  Fixed rate{fxMode === "LIVE" ? " (used only if no live rate is available)" : ""}
                </label>
                <div className="relative">
                  <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-ink">
                    GH₵
                  </span>
                  <input
                    id="rate"
                    inputMode="decimal"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className={`${inputCls} pl-[60px]`}
                  />
                </div>
              </div>

              <p className="text-sm leading-5 text-ink-secondary">
                Bookings keep the rate they were made at, so changing this never changes an existing booking.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={saveRate} disabled={fxBusy}>
                  Save rate settings
                </Button>
                <Button variant="secondary" onClick={refreshRate} disabled={fxBusy}>
                  Refresh live rate now
                </Button>
              </div>
            </div>
            {(["GBP", "EUR", "CAD"] as const).map((c) => (
              <ToggleRow
                key={c}
                id={`show-${c}`}
                label={`Show ${c}`}
                checked={show[c]}
                onChange={(v) => setShow((s) => ({ ...s, [c]: v }))}
              />
            ))}
          </section>

          <section className={cardCls} aria-labelledby="methods-title">
            <h2 id="methods-title" className={cardTitle}>Payment methods</h2>
            {(Object.keys(methods) as (keyof typeof methods)[]).map((m) => (
              <ToggleRow
                key={m}
                id={`method-${m}`}
                label={m}
                checked={methods[m]}
                onChange={(v) => toggleMethod(m, v)}
              />
            ))}
          </section>

          <section className={cardCls} aria-labelledby="deposit-title">
            <h2 id="deposit-title" className={cardTitle}>Deposit and balance</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="deposit" className={labelCls}>Deposit</label>
                <div className="relative">
                  <input
                    id="deposit"
                    inputMode="numeric"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    className={`${inputCls} pr-10`}
                  />
                  <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base text-ink-secondary">
                    %
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="days" className={labelCls}>Balance due </label>
                <div className="relative">
                  <input
                    id="days"
                    inputMode="numeric"
                    value={balanceDays}
                    onChange={(e) => setBalanceDays(e.target.value)}
                    className={`${inputCls} pr-16`}
                  />
                  <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base text-ink-secondary">
                    days
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className={cardCls} aria-labelledby="team-title">
            <div className="flex items-center justify-between gap-4">
              <h2 id="team-title" className={cardTitle}>Team</h2>
              <Button variant="secondary" onClick={() => dialogRef.current?.showModal()}>
                Invite user
              </Button>
            </div>
            <ul className="flex flex-col gap-4">
              {team.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[15px] font-semibold text-forest-900">
                      {(m.name[0] ?? "?").toUpperCase()}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-xl font-semibold leading-7 text-forest-900">
                        {m.name}
                        {m.id === meId && <span className="text-base font-normal text-ink-secondary"> (you)</span>}
                      </span>
                      <span className="truncate text-sm leading-5 text-ink-secondary">{m.email}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`rounded-full px-3 py-[5px] text-sm leading-5 ${rolePill[m.role]}`}>
                      {m.invited ? `${m.role} · Invited` : m.role}
                    </span>
                    {m.id !== meId && (
                      <span className="flex gap-3 text-sm">
                        {m.invited && (
                          <button
                            type="button"
                            disabled={teamBusy}
                            onClick={() => runTeam(() => resendInvite(m.id), `Invite re-sent to ${m.email}`)}
                            className="text-forest-700 underline disabled:opacity-60"
                          >
                            Resend
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={teamBusy}
                          onClick={() => {
                            if (window.confirm(`Remove ${m.name}? They will be signed out and lose admin access.`)) {
                              runTeam(() => removeMember(m.id), `${m.name} removed`);
                            }
                          }}
                          className="text-kente-red underline disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={cardCls} aria-labelledby="policy-title">
            <h2 id="policy-title" className={cardTitle}>Cancellation policy</h2>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="policy" className={labelCls}>Shown on trip pages and checkout</label>
              <textarea
                id="policy"
                rows={4}
                value={policy}
                onChange={(e) => setPolicy(e.target.value)}
                placeholder="Add your cancellation policy"
                className={`${inputCls} min-h-[110px] resize-y`}
              />
            </div>
          </section>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="invite-title"
        className="m-auto w-[calc(100%-2.5rem)] max-w-md rounded-[20px] border border-border bg-white p-0 backdrop:bg-forest-900/50"
      >
        <form onSubmit={invite} className="flex flex-col gap-5 p-7">
          <h2 id="invite-title" className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
            Invite a team member
          </h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-name" className={labelCls}>Name</label>
            <input
              id="invite-name"
              required
              maxLength={80}
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Full name"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-email" className={labelCls}>Email</label>
            <input
              id="invite-email"
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="name@wondalis.com"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-role" className={labelCls}>Role</label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "Admin" | "Staff")}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="Staff">Staff: bookings, customers, payments, trips</option>
              <option value="Admin">Admin: everything, including Settings and the team</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button type="submit" disabled={teamBusy}>{teamBusy ? "Sending…" : "Send invite"}</Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}