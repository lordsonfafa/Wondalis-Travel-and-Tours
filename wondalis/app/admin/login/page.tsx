import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/AdminLoginForm";

// Admin is private: keep it out of search results.
export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen bg-ivory">
      {/* Photo panel (large screens), same layout as the customer sign-in */}
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
          className="absolute inset-0 bg-gradient-to-b from-[rgba(11,42,36,0.6)] to-[rgba(11,42,36,0.94)]"
        />
        <Link href="/" className="relative flex items-center gap-2.5">
          <Image src="/icons/star-nav.svg" alt="" width={20} height={20} />
          <span className="font-serif text-[28px] font-semibold leading-9 text-ivory">
            Wondalis
          </span>
          <span className="text-xs font-bold leading-4 tracking-[2px] text-gold-300">ADMIN</span>
        </Link>
        <p className="relative font-serif text-[56px] font-bold leading-[64px] tracking-[-0.5px] text-ivory">
          Every trip, in one place.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-5 py-12 lg:justify-start lg:pt-[18vh]">
        <Link href="/" className="flex items-center gap-2.5 lg:hidden">
          <Image src="/icons/star-nav.svg" alt="" width={20} height={20} />
          <span className="font-serif text-[28px] font-semibold leading-9 text-forest-900">
            Wondalis
          </span>
          <span className="text-xs font-bold leading-4 tracking-[2px] text-forest-500">ADMIN</span>
        </Link>

        <div className="flex w-full max-w-[400px] flex-col gap-6">
          <div className="animate-fade-up flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Image src="/icons/star-nav.svg" alt="" width={16} height={16} />
              <p className="text-xs font-bold leading-4 tracking-[2px] text-forest-500">
                ADMIN ACCESS
              </p>
            </div>
            <h1 className="font-serif text-3xl font-bold leading-[1.1] tracking-[-0.5px] text-forest-900 sm:text-4xl">
              Welcome back, <em className="font-bold italic text-forest-500">team.</em>
            </h1>
          </div>
          {/* The form reads ?error= from the URL, which is runtime data, so it sits in Suspense. */}
          <Suspense fallback={<div className="min-h-[260px]" />}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
