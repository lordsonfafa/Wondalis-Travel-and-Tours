import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

// Account pages are private: keep them out of search results.
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <main className="flex min-h-screen bg-ivory">
      <h1 className="sr-only">Sign in or create an account</h1>

      {/* Photo panel (large screens) */}
      <div className="relative hidden shrink-0 flex-col justify-between overflow-hidden px-14 pb-14 pt-12 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-1/2 lg:self-start">
        <Image
          src="/images/hero.png"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-[rgba(11,42,36,0.35)] to-[rgba(11,42,36,0.85)]"
        />
        <Link href="/" className="relative flex items-center gap-2.5">
          <Image src="/icons/star-nav.svg" alt="" width={20} height={20} />
          <span className="font-serif text-[28px] font-semibold leading-9 text-ivory">
            Wondalis
          </span>
        </Link>
        <p className="relative font-serif text-[56px] font-bold leading-[64px] tracking-[-0.5px] text-ivory">
          Welcome home.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-5 py-12 lg:justify-start lg:pt-[18vh]">
        <Link href="/" className="flex items-center gap-2.5 lg:hidden">
          <Image src="/icons/star-nav.svg" alt="" width={20} height={20} />
          <span className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
            Wondalis
          </span>
        </Link>
        <AuthForm />
      </div>
    </main>
  );
}
