"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth-guards";
import { CATEGORIES } from "@/lib/place-categories";
import { prisma } from "@/lib/prisma";

export type PlaceResult = { ok: true } | { ok: false; error: string };

// Same rule as trip photos: a path on this site, or a file in OUR Cloudinary account.
const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const photo = z
  .string()
  .max(500)
  .refine((s) => s === "" || /^\/(?!\/)/.test(s) || (cloud !== "" && s.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`)), "Invalid photo address");

const schema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(1, "Enter the place name.").max(80),
  region: z.enum(["GHANA", "ABROAD"]),
  area: z.string().trim().max(80),
  category: z.string().trim().max(30).refine((c) => c === "" || (CATEGORIES as readonly string[]).includes(c), "Choose a category from the list."),
  description: z.string().trim().max(400),
  image: photo,
  active: z.boolean(),
  position: z.coerce.number().int().min(0).max(9999),
});

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "place";

export async function savePlace(input: unknown): Promise<PlaceResult> {
  await requireStaff();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const { id, ...d } = parsed.data;

  try {
    if (id) {
      await prisma.place.update({ where: { id }, data: d }); // the slug never changes after creation
    } else {
      const base = slugify(d.name);
      let slug = base;
      for (let n = 2; await prisma.place.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;
      await prisma.place.create({ data: { ...d, slug } });
    }
  } catch (e) {
    console.error("[places] save failed", e);
    return { ok: false, error: "Could not save this place. Please try again." };
  }
  updateTag("places");
  return { ok: true };
}

// Past requests keep their own copy of the place name, so deleting a place never changes them.
export async function deletePlace(id: string): Promise<PlaceResult> {
  await requireStaff();
  try {
    await prisma.place.delete({ where: { id } });
  } catch {
    return { ok: false, error: "That place no longer exists." };
  }
  updateTag("places");
  return { ok: true };
}
