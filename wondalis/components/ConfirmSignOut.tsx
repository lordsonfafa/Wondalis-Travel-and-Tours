"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

// A "Sign out" button that asks first. Used by the customer nav and the admin sidebar.
// Signing out deletes the Session row on the server and clears the cookie, then goes to `redirectTo`.
export function ConfirmSignOut({
  className,
  role,
  redirectTo = "/",
}: {
  className?: string;
  role?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    await authClient.signOut();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      <button type="button" role={role} onClick={() => dialogRef.current?.showModal()} className={className}>
        Sign out
      </button>

      {/* Native <dialog>: Esc closes it, focus stays inside, and it sits above everything else. */}
      <dialog
        ref={dialogRef}
        aria-labelledby="signout-title"
        onClick={(e) => {
          if (e.target === dialogRef.current && !pending) dialogRef.current?.close(); // click on the backdrop
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-[20px] bg-ivory p-6 text-ink shadow-2xl backdrop:bg-black/50"
      >
        <h2 id="signout-title" className="font-serif text-2xl text-forest-900">
          Sign out?
        </h2>
        <p className="mt-2 text-[15px] leading-6 text-ink-secondary">
          You will need to sign in again to see your account.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            autoFocus
            disabled={pending}
            onClick={() => dialogRef.current?.close()}
            className="rounded-full border-[1.5px] border-forest-900 px-5 py-3 text-[15px] font-semibold text-forest-900 hover:bg-forest-900 hover:text-ivory disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={confirm}
            className="rounded-full bg-forest-900 px-5 py-3 text-[15px] font-semibold text-ivory hover:bg-forest-700 disabled:opacity-60"
          >
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </dialog>
    </>
  );
}
