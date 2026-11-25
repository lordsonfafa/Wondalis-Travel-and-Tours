import { isValidWebhookSignature } from "@/lib/paystack";
import { applyTransaction } from "@/lib/payments";

// Paystack calls this URL when something happens to a payment. It is public, so the first thing
// we do is check the signature: only Paystack knows our secret key. Anything unsigned is dropped.
export async function POST(request: Request) {
  const raw = await request.text(); // the signature covers the exact raw bytes, so read the text, not JSON
  if (!isValidWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string; status?: string; amount?: number; currency?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    const { reference, status, amount, currency } = event.data;
    if (typeof amount === "number" && typeof currency === "string") {
      await applyTransaction({ reference, status: status ?? "success", amount, currency });
    }
  }
  // Always answer 200 for valid, signed events (even ones we ignore) so Paystack stops retrying them.
  return new Response("ok");
}
