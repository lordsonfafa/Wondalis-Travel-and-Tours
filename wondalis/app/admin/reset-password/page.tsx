import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set your password",
  robots: { index: false, follow: false },
};

// Team invitations land here as /admin/reset-password?token=...
async function Form({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return <ResetPasswordForm token={error ? null : (token ?? null)} signInHref="/admin/login" />;
}

export default function AdminResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-5 py-16">
      <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 sm:p-10">
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <Form searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
