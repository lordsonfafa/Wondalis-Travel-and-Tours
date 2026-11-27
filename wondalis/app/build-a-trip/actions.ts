"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth-guards";
import { notifyRequestSubmitted } from "@/lib/notify-quotes";
import { getRequestById } from "@/lib/db/quotes";
import { newToken } from "@/lib/quotes";
import { allow, clientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export type PlanState = { error: string } | null;

const text = (max: number) => z.string().trim().min(1).max(max);
const day = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.iso.date().optional());

const schema = z.object({
  places: z.array(z.string().min(1).max(40)).min(1, "Choose at least one place.").max(15, "Please choose up to 15 places."),
  travellers: z.coerce.number().int().min(1, "Enter how many people are travelling.").max(30),
  startsOn: day,
  endsOn: day,
  flexible: z.boolean(),
  notes: z.string().trim().max(1000),
  firstName: text(60),
  lastName: text(60),
  email: z.email().max(254).transform((e) => e.toLowerCase()),
  whatsapp: z.string().trim().max(30),
  residence: text(80),
});

// A public form: everything is untrusted input, and it is rate limited so it cannot be used to spam us.
export async function submitRequest(_prev: PlanState, form: FormData): Promise<PlanState> {
  const parsed = schema.safeParse({
    places: form.getAll("place").map(String),
    travellers: form.get("travellers"),
    startsOn: form.get("startsOn"),
    endsOn: form.get("endsOn"),
    flexible: form.get("flexible") === "on",
    notes: form.get("notes") ?? "",
    firstName: form.get("firstName"),
    lastName: form.get("lastName"),
    email: form.get("email"),
    whatsapp: form.get("whatsapp") ?? "",
    residence: form.get("residence"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message;
    return { error: msg && msg !== "Invalid input" && !msg.startsWith("Too small") && !msg.startsWith("Invalid") ? msg : "Please check your details and try again." };
  }
  const d = parsed.data;

  const today = new Date().toISOString().slice(0, 10);
  if (d.startsOn && d.startsOn < today) return { error: "The start date cannot be in the past." };
  if (d.endsOn && d.startsOn && d.endsOn < d.startsOn) return { error: "The end date cannot be before the start date." };

  const ip = await clientIp();
  if (!(await allow(`quote:ip:${ip}`, 5, 3600)) || !(await allow(`quote:email:${d.email}`, 3, 86400))) {
    return { error: "You have sent several requests already. Please wait a while, or contact us on WhatsApp." };
  }

  // Only active places that really exist, with their names copied so the request stays readable later.
  const places = await prisma.place.findMany({ where: { id: { in: d.places }, active: true } });
  if (places.length !== new Set(d.places).size) return { error: "Some of the places you chose are no longer available. Please reselect." };

  const session = await getSession();
  const created = await prisma.quoteRequest.create({
    data: {
      token: newToken(),
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      whatsapp: d.whatsapp,
      residence: d.residence,
      userId: session?.user.id ?? null,
      travellers: d.travellers,
      startsOn: d.startsOn ? new Date(`${d.startsOn}T00:00:00Z`) : null,
      endsOn: d.endsOn ? new Date(`${d.endsOn}T00:00:00Z`) : null,
      flexible: d.flexible,
      notes: d.notes,
      places: { create: places.map((p: { id: string; name: string; region: string }) => ({ placeId: p.id, name: p.name, region: p.region })) },
    },
  });

  const detail = await getRequestById(created.id);
  if (detail) await notifyRequestSubmitted(detail); // never throws
  redirect(`/quote/${created.token}`);
}
