import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth-guards";
import { listRequests } from "@/lib/db/quotes";
import { RequestPill } from "@/components/admin/RequestPill";
import type { QuoteView } from "@/lib/quotes";

export const metadata: Metadata = { title: "Requests" };

const filters = [
  { label: "All", value: "all" },
  { label: "Needs a price", value: "waiting" },
  { label: "Quoted", value: "quoted" },
  { label: "Paid", value: "paid" },
  { label: "Closed", value: "closed" },
] as const;

const chipBase = "inline-flex items-center whitespace-nowrap rounded-full px-[18px] py-2.5 text-[15px] font-semibold leading-5 tracking-[0.2px] transition-colors";

function matches(view: QuoteView, f: string) {
  if (f === "waiting" || f === "paid") return view === f;
  if (f === "quoted") return view === "quoted" || view === "paying";
  if (f === "closed") return view === "declined" || view === "cancelled" || view === "expired";
  return true;
}

async function Content({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const sp = await searchParams;
  const filter = filters.some((f) => f.value === sp.filter) ? sp.filter! : "all";
  await requireStaff();
  const all = await listRequests();
  const visible = all.filter((r) => matches(r.view, filter));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="hidden font-serif text-3xl font-semibold leading-tight text-forest-900 lg:block lg:text-[40px] lg:leading-[48px]">Trip requests</h1>
      <nav aria-label="Request filters" className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/requests" : `/admin/requests?filter=${f.value}`}
            scroll={false}
            aria-current={f.value === filter ? "page" : undefined}
            className={`${chipBase} ${f.value === filter ? "bg-forest-900 text-ivory" : "border border-border bg-white text-forest-900 hover:border-forest-900"}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className="rounded-[20px] border border-border bg-white p-10 text-center text-ink-secondary">No requests here yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/requests/${r.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-border bg-white p-5 hover:border-forest-500">
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-lg font-semibold text-forest-900">
                    {r.firstName} {r.lastName} <span className="text-sm font-normal text-ink-secondary">· {r.ref}</span>
                  </span>
                  <span className="truncate text-sm text-ink-secondary">
                    {r.places.length} place{r.places.length === 1 ? "" : "s"}: {r.places.map((p) => p.name).join(", ")} · {r.travellers} traveller{r.travellers === 1 ? "" : "s"}
                  </span>
                </span>
                <RequestPill view={r.view} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminRequestsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  return (
    <Suspense fallback={<p className="text-ink-secondary">Loading requests…</p>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
