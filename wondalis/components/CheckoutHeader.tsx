import Image from "next/image";
import Link from "next/link";

const gutter = "px-5 md:px-12 lg:px-24";

/** Slim header used on checkout screens: no site nav, just logo and a reassurance. */
export function CheckoutHeader() {
  return (
    <header className="border-b border-border bg-ivory">
      <div className={`mx-auto flex h-[88px] max-w-[1440px] items-center justify-between ${gutter}`}>
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/icons/star-nav.svg" alt="" width={20} height={20} />
          <span className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
            Wondalis
          </span>
        </Link>
        <p className="text-base text-ink-secondary">Secure checkout</p>
      </div>
    </header>
  );
}
