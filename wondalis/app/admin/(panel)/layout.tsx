import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ToastProvider } from "@/components/admin/Toast";

// Admin is private: keep it out of search results.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Wondalis Admin" },
  robots: { index: false, follow: false },
};

// Wraps every admin page except /admin/login (which lives outside this route group).
// TODO (backend): check the session and role on the server here and redirect to /admin/login.
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
    <div className="min-h-screen bg-ivory lg:flex">
      {/* usePathname() is runtime data (the trip editor has a dynamic URL), so the sidebar
          sits in Suspense. The fallback is an empty green column so nothing jumps. */}
      <Suspense fallback={<aside className="hidden w-[260px] shrink-0 bg-forest-900 lg:block" />}>
        <AdminSidebar />
      </Suspense>
      <div className="min-w-0 flex-1 px-5 pb-28 pt-5 lg:px-10 lg:pb-14 lg:pt-10">{children}</div>
    </div>
    </ToastProvider>
  );
}