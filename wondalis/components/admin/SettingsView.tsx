"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { USD_TO_GHS } from "@/lib/money";
import { Switch } from "./Switch";
import { useToast } from "./Toast";

type Role = "Owner" | "Admin" | "Staff";
type Member = { name: string; email?: string; role: Role; invited?: boolean };

// Dummy team and settings, as in the design. The backend will load and save these.
const initialTeam: Member[] = [
  { name: "Admin", role: "Owner" },
  { name: "Staff member", role: "Staff" },
  { name: "Staff member", role: "Staff" },
];

const cardCls = "flex flex-col gap-4 rounded-[20px] border border-border bg-white p-6";
const cardTitle = "font-sans text-xl font-semibold leading-7 text-forest-900";
const labelCls = "text-sm leading-5 text-ink-secondary";
const inputCls =
  "w-full rounded-[12px] border border-border bg-ivory px-4 py-3.5 text-base text-ink placeholder:text-ink-secondary focus:border-forest-500";

const rolePill: Record<Role, string> = {
  Owner: "bg-[#e3f2e8] text-[#2e7d4f]",
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

export function SettingsView() {
  const toast = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [rate, setRate] = useState(USD_TO_GHS.toFixed(2));
  const [show, setShow] = useState({ GBP: true, EUR: true, CAD: false });
  const [methods, setMethods] = useState({ Card: true, "Mobile money": true, "Bank transfer": true });
  const [deposit, setDeposit] = useState("30");
  const [balanceDays, setBalanceDays] = useState("14");
  const [policy, setPolicy] = useState("");
  const [team, setTeam] = useState(initialTeam);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Staff">("Staff");

  function save() {
    const r = Number(rate);
    const d = Number(deposit);
    const days = Number(balanceDays);
    if (!(r > 0)) return toast("Enter an exchange rate above 0", "error");
    if (!(d >= 1 && d <= 100)) return toast("Deposit must be between 1% and 100%", "error");
    if (!Number.isInteger(days) || days < 0) return toast("Balance days must be a whole number", "error");
    toast("Settings saved");
  }

  function toggleMethod(name: keyof typeof methods, next: boolean) {
    if (!next && Object.values(methods).filter(Boolean).length === 1) {
      toast("Keep at least one payment method on", "error");
      return;
    }
    setMethods((m) => ({ ...m, [name]: next }));
  }

  function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (team.some((m) => m.email?.toLowerCase() === email.toLowerCase())) {
      toast("That person has already been invited", "error");
      return;
    }
    setTeam((t) => [...t, { name: email, email, role: inviteRole, invited: true }]);
    setInviteEmail("");
    setInviteRole("Staff");
    dialogRef.current?.close();
    toast(`Invite sent to ${email}`);
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
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rate" className={labelCls}>1 USD in GHS</label>
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
              {team.map((m, i) => (
                <li key={`${m.name}-${i}`} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[15px] font-semibold text-forest-900">
                      {m.name[0].toUpperCase()}
                    </span>
                    <span className="truncate text-xl font-semibold leading-7 text-forest-900">{m.name}</span>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-[5px] text-sm leading-5 ${rolePill[m.role]}`}>
                    {m.invited ? `${m.role} · Invited` : m.role}
                  </span>
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
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button type="submit">Send invite</Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}