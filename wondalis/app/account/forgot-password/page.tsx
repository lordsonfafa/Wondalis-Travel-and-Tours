import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

// Account pages are private: keep them out of search results.
export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <>
      <Nav />
      <main className="px-5 py-16 md:px-12 lg:py-24">
        <div className="mx-auto w-full max-w-md rounded-lg border border-border bg-white p-6 sm:p-10">
          <ForgotPasswordForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
