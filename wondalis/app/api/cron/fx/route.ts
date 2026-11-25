import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { fetchAndStoreLiveRate } from "@/lib/fx";

// Runs once a day (see vercel.json). Vercel sends "Authorization: Bearer <CRON_SECRET>" itself.
// Without the secret anyone on the internet could trigger it, so it is checked first.
function authorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export async function GET(request: Request) {
  if (!authorised(request)) return new Response("Unauthorized", { status: 401 });

  const result = await fetchAndStoreLiveRate();
  if (!result.ok) {
    console.error("[fx] daily refresh failed:", result.error); // the previous rate stays in use
    return Response.json({ ok: false, error: result.error }, { status: 502 });
  }
  revalidateTag("fx", "max");
  return Response.json({ ok: true, rate: result.rate });
}
