import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// An OPTIMISTIC check only: it looks for the presence of a session cookie and sends visitors
// without one to the login page before any admin page renders. It does not prove the cookie is
// valid or that the person is staff. That is checked on the server by requireStaff().
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const open = pathname === "/admin/login" || pathname === "/admin/reset-password"; // no session yet by design
  if (!open && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
