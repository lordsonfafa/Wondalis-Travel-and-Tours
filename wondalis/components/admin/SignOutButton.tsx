"use client";

import { ConfirmSignOut } from "@/components/ConfirmSignOut";

// Asks for confirmation, ends the session on the server, then returns to the admin login page.
// A plain link to /admin/login would leave the person signed in.
export function SignOutButton({ className, role }: { className?: string; role?: string }) {
  return <ConfirmSignOut className={className} role={role} redirectTo="/admin/login" />;
}
