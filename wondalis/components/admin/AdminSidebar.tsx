"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Dashboard", href: "/admin" },
  { label: "Trips", href: "/admin/trips" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Settings", href: "/admin/settings" },
];

/** Sidebar on large screens, bottom tab bar below that. */
export function AdminSidebar() {
  const pathname = usePathname();
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

      {/* Mobile and tablet bottom tab bar */}
      <nav
        aria-label="Admin"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-forest-700 bg-forest-900 lg:hidden"
      >
        {items.map((it) => {
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] leading-4 ${
                active ? "text-ivory" : "text-on-dark-muted"
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
    </>
  );
}
