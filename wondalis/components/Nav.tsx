"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ConfirmSignOut } from "@/components/ConfirmSignOut";
import { Button } from "./Button";

const links = [
  { label: "Trips", href: "/trips" },
  { label: "Experiences", href: "/experiences" },
  { label: "Stories", href: "/stories" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

/**
 * usePathname() is only known at request time on routes with dynamic segments
 * (e.g. /account/bookings/[ref]), so the nav sits in its own Suspense boundary
 * and every page can render <Nav /> safely.
 */
export function Nav() {
  return (
    <Suspense fallback={<header className="h-[88px] border-b border-border bg-ivory" />}>
      <NavInner />
    </Suspense>
  );
}

function NavInner() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const signedIn = Boolean(session?.user); // false until the session has loaded
  const pathname = usePathname();

  // A link is active on its own page and on pages below it (e.g. /trips/accra).
  const isActive = (href: string) =>
    !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  const accountHref = signedIn ? "/account/bookings" : "/account/sign-in";
  const accountLabel = signedIn ? "My bookings" : "Sign in";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-border bg-ivory/85 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "shadow-[0_8px_24px_-12px_rgba(11,42,36,0.25)]" : ""
      }`}
    >
      <nav
        aria-label="Main"
        className={`flex items-center justify-between px-5 transition-[height] duration-300 md:px-12 lg:px-24 ${
          scrolled ? "h-16" : "h-[88px]"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/icons/star-nav.svg" alt="" width={20} height={20} />
          <span className="flex flex-col">
            <span
              className={`font-serif font-semibold text-forest-900 transition-all duration-300 ${
                scrolled ? "text-2xl leading-7" : "text-[28px] leading-9"
              }`}
            >
              Wondalis
            </span>
            <span
              className={`overflow-hidden text-xs font-bold leading-4 tracking-[2px] text-gold-500 transition-all duration-300 ${
                scrolled ? "max-h-0 opacity-0" : "max-h-4 opacity-100"
              }`}
            >
              TRAVEL &amp; TOUR
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-10 text-base text-ink xl:flex">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-gold-500 after:transition-all after:duration-300 ${
                    active
                      ? "font-semibold text-forest-900 after:w-full"
                      : "hover:text-forest-500 after:w-0 hover:after:w-full"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href={accountHref}
            aria-current={pathname.startsWith("/account") ? "page" : undefined}
            className="hidden text-[15px] font-semibold tracking-[0.2px] text-forest-900 sm:block"
          >
            {accountLabel}
          </Link>
          {signedIn && (
            <ConfirmSignOut className="hidden text-[15px] tracking-[0.2px] text-ink-secondary hover:text-forest-900 sm:block" />
          )}
          <Button href="/trips" className={scrolled ? "py-2.5!" : ""}>
            Book a trip
          </Button>

          {/* Menu button: the link list is hidden below the xl breakpoint */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
            className="flex size-11 items-center justify-center rounded-full border border-border bg-white text-forest-900 xl:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              {open ? (
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full border-b border-border bg-ivory shadow-[0_16px_32px_-16px_rgba(11,42,36,0.25)] xl:hidden"
        >
          <ul className="flex flex-col px-5 py-3 md:px-12 lg:px-24">
            {[...links, { label: accountLabel, href: accountHref }].map((l) => {
              const active = isActive(l.href);
              return (
                <li key={l.label} className="border-b border-border last:border-b-0">
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between py-4 text-lg ${
                      active ? "font-semibold text-forest-900" : "text-ink"
                    }`}
                  >
                    {l.label}
                    {active && <span aria-hidden className="size-2 rounded-full bg-gold-500" />}
                  </Link>
                </li>
              );
            })}
            {signedIn && (
              <li className="border-b border-border last:border-b-0">
                <ConfirmSignOut className="flex w-full items-center py-4 text-left text-lg text-ink-secondary" />
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}