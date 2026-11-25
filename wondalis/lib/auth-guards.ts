// Server-side helpers that answer "who is this?" and "may they do this?".
// Call them at the START of every admin page, data function and server action.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type StaffRole = "staff" | "owner";

/** The signed-in session, or null. Reads the request's cookie, so it runs at request time. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Staff or Owner only. Anyone else is sent to the admin login page.
 * Returns a small user object: only what callers need.
 */
export async function requireStaff() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const role = (session.user as { role?: string }).role;
  if (role !== "staff" && role !== "owner") redirect("/admin/login?error=forbidden");

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: role as StaffRole,
  };
}

/** Owner only (Settings, team, payment configuration). Staff are sent back to the dashboard. */
export async function requireOwner() {
  const user = await requireStaff();
  if (user.role !== "owner") redirect("/admin");
  return user;
}

/**
 * Any signed-in user (customer pages). Anyone else is sent to the customer sign-in page.
 * Customer pages must filter their data by the returned `id`, never by an id from the URL.
 */
export async function requireCustomer() {
  const session = await getSession();
  if (!session) redirect("/account/sign-in");
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}
