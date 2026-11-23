import Link from "next/link";

const columns = [
  {
    title: "EXPLORE",
    links: [
      { label: "All trips", href: "/trips" },
      { label: "Detty December", href: "/detty-december" },
      { label: "Experiences", href: "/experiences" },
      { label: "Groups & weddings", href: "/groups" },
    ],
  },
  {
    title: "SUPPORT",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Payment plans", href: "/payment-plans" },
      { label: "Cancellation policy", href: "/cancellation-policy" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "CONTACT",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Accra, Ghana", href: "/contact" },
      { label: "WhatsApp", href: "#" }, // TODO: real WhatsApp link
      { label: "Instagram", href: "#" }, // TODO: real Instagram link
      { label: "Email us", href: "mailto:hello@wondalis.com" }, // TODO: real email
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-forest-900">
      <div className="kente-band" aria-hidden />
      <div className="mx-auto flex max-w-[1440px] flex-col gap-14 px-5 pb-10 pt-16 md:px-12 lg:px-24 lg:pt-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:flex lg:justify-between">
          <p className="font-serif text-[28px] font-semibold leading-9 text-ivory">
            Wondalis
          </p>
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <p className="text-xs font-bold leading-4 tracking-[2px] text-gold-300">
                {col.title}
              </p>
              {col.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-base text-on-dark-muted transition-colors hover:text-ivory"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="h-px w-full bg-forest-700" />
        <p className="text-sm text-on-dark-muted">
          © 2026 Wondalis Travel &amp; Tour. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
