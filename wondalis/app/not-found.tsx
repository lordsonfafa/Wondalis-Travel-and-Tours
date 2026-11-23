import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

// Next.js shows this for any unknown URL (and for notFound() calls) with a 404 status.
export default function NotFound() {
  return (
    <>
      <Nav />
      <main>
        <section className="flex flex-col items-center gap-8 px-5 pb-24 pt-20 text-center md:px-12 lg:px-24 lg:pb-40 lg:pt-[140px]">
          <div
            aria-hidden
            className="flex size-24 items-center justify-center rounded-full bg-gold-100 font-serif text-[28px] font-semibold leading-9 text-forest-900"
          >
            404
          </div>
          <h1 className="animate-fade-up font-serif text-4xl font-bold leading-tight tracking-[-0.5px] text-forest-900 lg:text-[56px] lg:leading-[64px]">
            Page not found
          </h1>
          <Button href="/">Back to home</Button>
        </section>
      </main>
      <Footer />
    </>
  );
}
