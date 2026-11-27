// Reads for custom-trip requests. Not cached (they change by the minute and hold personal data).
// Admin callers must call requireStaff() first; the customer page is keyed by the unguessable token.

import { formatRef } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { formatQuoteRef, quoteCurrency, quoteView, type QuoteView } from "@/lib/quotes";

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

const include = {
  places: { orderBy: { name: "asc" as const } },
  booking: { include: { payments: { select: { status: true, providerRef: true } } } },
};

type Row = NonNullable<Awaited<ReturnType<typeof load>>>;
const load = (where: { id: string } | { token: string }) => prisma.quoteRequest.findUnique({ where, include });

export type QuoteDetail = {
  id: string;
  token: string;
  ref: string;
  view: QuoteView;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  residence: string;
  travellers: number;
  startsOn: string | null;
  endsOn: string | null;
  flexible: boolean;
  notes: string;
  places: { name: string; region: "GHANA" | "ABROAD" }[];
  currency: "USD" | "GHS";
  quotedUsd: number | null;
  depositPct: number | null;
  message: string;
  validUntil: string | null; // ISO timestamp
  createdAt: string; // ISO timestamp
  bookingRef: string | null;
  paidReference: string | null; // Paystack reference of the paid payment, for the confirmation link
};

function toDetail(r: Row): QuoteDetail {
  return {
    id: r.id,
    token: r.token,
    ref: formatQuoteRef(r.refNumber),
    view: quoteView(r),
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    whatsapp: r.whatsapp,
    residence: r.residence,
    travellers: r.travellers,
    startsOn: iso(r.startsOn),
    endsOn: iso(r.endsOn),
    flexible: r.flexible,
    notes: r.notes,
    places: r.places.map((p: { name: string; region: string }) => ({ name: p.name, region: p.region === "GHANA" ? "GHANA" : "ABROAD" })),
    currency: quoteCurrency(r.places.map((p: { region: string }) => p.region)),
    quotedUsd: r.quotedUsdCents === null ? null : r.quotedUsdCents / 100,
    depositPct: r.depositPct,
    message: r.quoteMessage ?? "",
    validUntil: r.validUntil?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    bookingRef: r.booking ? formatRef(r.booking.refNumber) : null,
    paidReference: r.booking?.payments.find((p: { status: string; providerRef: string | null }) => p.status === "PAID")?.providerRef ?? null,
  };
}

/** The customer's private quote page. The 36-character token is the only key. */
export async function getQuoteByToken(token: string): Promise<QuoteDetail | null> {
  if (!/^[a-f0-9]{36}$/.test(token)) return null;
  const row = await load({ token });
  return row ? toDetail(row) : null;
}

export async function getRequestById(id: string): Promise<QuoteDetail | null> {
  const row = await load({ id });
  return row ? toDetail(row) : null;
}

export async function listRequests(): Promise<QuoteDetail[]> {
  const rows = await prisma.quoteRequest.findMany({ include, orderBy: { createdAt: "desc" }, take: 300 });
  return rows.map(toDetail);
}

/** How many requests are waiting for a price: shown as a badge in the admin sidebar. */
export const countNewRequests = () => prisma.quoteRequest.count({ where: { status: "NEW" } });
