import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

// Better Auth sends people here as /account/reset-password?token=...  (or ?error=INVALID_TOKEN).
async function Form({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return <ResetPasswordForm token={error ? null : (token ?? null)} />;
}

export default function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  return (
    <>
      <Nav />
      <main className="px-5 py-16 md:px-12 lg:py-24">
        <div className="mx-auto w-full max-w-md rounded-lg border border-border bg-white p-6 sm:p-10">
          <Suspense fallback={<div className="min-h-[200px]" />}>
            <Form searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
