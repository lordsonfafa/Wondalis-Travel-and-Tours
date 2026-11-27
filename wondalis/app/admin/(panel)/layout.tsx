import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ToastProvider } from "@/components/admin/Toast";
import { requireStaff } from "@/lib/auth-guards";
import { countNewRequests } from "@/lib/db/quotes";

// Admin is private: keep it out of search results.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Wondalis Admin" },
  robots: { index: false, follow: false },
};

// Reads the session on the server and sends anyone who is not Staff or Owner to the login page.
// This is a convenience for the UI. The real protection is that every admin data function and
// action calls requireStaff() / requireOwner() itself, because a layout does not re-run on
// every client navigation and must never be the only check.
async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireStaff();
  return <>{children}</>;
}

async function Sidebar() {
  const user = await requireStaff();
  const newRequests = await countNewRequests().catch(() => 0); // a badge must never break the admin
  return <AdminSidebar isOwner={user.role === "owner"} name={user.name} newRequests={newRequests} />;
}

// Wraps every admin page except /admin/login (which lives outside this route group).
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory" />}>
    <AdminGate>
    <ToastProvider>
    <div className="min-h-screen bg-ivory lg:flex">
      {/* usePathname() is runtime data (the trip editor has a dynamic URL), so the sidebar
          sits in Suspense. The fallback is an empty green column so nothing jumps. */}
      <Suspense fallback={<aside className="hidden w-[260px] shrink-0 bg-forest-900 lg:block" />}>
        <Sidebar />
      </Suspense>
      <div className="min-w-0 flex-1 px-5 pb-28 pt-5 lg:px-10 lg:pb-14 lg:pt-10">{children}</div>
    </div>
    </ToastProvider>
    </AdminGate>
    </Suspense>
  );
}