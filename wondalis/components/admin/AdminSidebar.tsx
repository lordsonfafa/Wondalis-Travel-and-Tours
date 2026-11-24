"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
  { label: "Dashboard", href: "/admin" },
  { label: "Trips", href: "/admin/trips" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Settings", href: "/admin/settings" },
];

// Mobile bottom bar: three main tabs, then a "More" sheet for the rest (as in the mobile design).
const mainTabs = items.filter((it) =>
  ["/admin", "/admin/trips", "/admin/bookings"].includes(it.href),
);
const moreItems = items.filter((it) => !mainTabs.includes(it));

/** Sidebar on large screens; top bar and bottom tab bar below that. */
export function AdminSidebar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] shrink-0 flex-col gap-10 bg-forest-900 px-5 py-8 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <Link href="/admin" className="flex items-center gap-2.5 pl-2">
          <Image src="/icons/star-nav.svg" alt="" width={18} height={18} />
          <span className="font-serif text-[28px] font-semibold leading-9 text-ivory">Wondalis</span>
        </Link>

        <nav aria-label="Admin" className="flex flex-col gap-1.5">
          {items.map((it) => {
            const active = isActive(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-[12px] px-4 py-3 text-base transition-colors ${
                  active
                    ? "bg-forest-700 text-ivory"
                    : "text-on-dark-muted hover:bg-forest-700/50 hover:text-ivory"
                }`}
              >
                <Image
                  src="/icons/star-nav.svg"
                  alt=""
                  width={14}
                  height={14}
                  className={active ? "" : "opacity-50"}
                />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center gap-3 pl-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-gold-500 text-[15px] font-semibold text-forest-900">
            A
          </span>
          <span className="text-base text-ivory">Admin</span>
          {/* Dummy sign-out: the backend will end the session here. */}
          <Link href="/admin/login" className="ml-auto text-sm text-on-dark-muted hover:text-ivory">
            Sign out
          </Link>
        </div>
      </aside>

      {/* Mobile and tablet top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-ivory px-5 lg:hidden">
        <span className="flex items-center gap-2 font-serif text-xl font-semibold leading-7 text-forest-900">
          <Image src="/icons/star-nav.svg" alt="" width={16} height={16} />
          {pathname === "/admin"
            ? "Wondalis Admin"
            : (items.find((it) => it.href !== "/admin" && isActive(it.href))?.label ?? "Wondalis Admin")}
        </span>
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-gold-500 text-[15px] font-semibold text-forest-900"
        >
          A
        </span>
      </header>

      {/* Mobile and tablet bottom tab bar */}
      {moreOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setMoreOpen(false)} aria-hidden />
      )}
      {moreOpen && (
        <div
          role="menu"
          aria-label="More"
          className="fixed bottom-[84px] right-3 z-40 flex w-52 flex-col gap-1 rounded-[16px] border border-border bg-white p-2 shadow-[0_16px_40px_rgba(11,42,36,0.18)] lg:hidden"
        >
          {moreItems.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              role="menuitem"
              onClick={() => setMoreOpen(false)}
              className="rounded-[10px] px-4 py-3 text-base text-forest-900 hover:bg-ivory"
            >
              {it.label}
            </Link>
          ))}
          {/* Dummy sign-out: the backend will end the session here. */}
          <Link
            href="/admin/login"
            role="menuitem"
            className="rounded-[10px] px-4 py-3 text-base text-ink-secondary hover:bg-ivory"
          >
            Sign out
          </Link>
        </div>
      )}
      <nav
        aria-label="Admin"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-forest-700 bg-forest-900 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {mainTabs.map((it) => {
          const active = isActive(it.href) && !moreOpen;
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              onClick={() => setMoreOpen(false)}
              className={`flex flex-col items-center gap-1 px-1 py-3 text-xs leading-5 ${
                active ? "text-ivory" : "text-on-dark-muted"
              }`}
            >
              <Image
                src="/icons/star-nav.svg"
                alt=""
                width={18}
                height={18}
                className={active ? "" : "opacity-50"}
              />
              {it.label}
            </Link>
          );
        })}
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((o) => !o)}
          className={`flex flex-col items-center gap-1 px-1 py-3 text-xs leading-5 ${
            moreOpen || moreItems.some((it) => isActive(it.href)) ? "text-ivory" : "text-on-dark-muted"
          }`}
        >
          <Image
            src="/icons/star-nav.svg"
            alt=""
            width={18}
            height={18}
            className={moreOpen || moreItems.some((it) => isActive(it.href)) ? "" : "opacity-50"}
          />
          More
        </button>
      </nav>
    </>
  );
}