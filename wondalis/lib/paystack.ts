import { createHmac, timingSafeEqual } from "node:crypto";

// Thin wrapper around Paystack's REST API. The secret key never leaves the server.
const API = "https://api.paystack.co";

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

export type PaystackTransaction = {
  reference: string;
  status: string; // "success" | "failed" | "abandoned" | "ongoing" | ...
  amount: number; // minor units
  currency: string;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !body?.status || !body.data) {
    throw new Error(`Paystack ${path} failed: ${body?.message ?? res.status}`);
  }
  return body.data;
}

/** Starts a payment. Returns the Paystack page the customer is sent to. */
export async function initializeTransaction(input: {
  email: string;
  amountMinor: number;
  currency: "GHS" | "USD";
  reference: string; // our own random reference, so we can find the payment again
  callbackUrl: string;
  channels: ("card" | "mobile_money")[];
  metadata: Record<string, string>;
}) {
  return call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinor,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: input.channels,
      metadata: input.metadata,
    }),
  });
}

/** Asks Paystack directly what happened to a payment. The answer comes from Paystack, not from the browser. */
export async function verifyTransaction(reference: string) {
  return call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Webhook authenticity: Paystack signs the raw body with HMAC-SHA512 using our secret key. */
export function isValidWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", secret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
