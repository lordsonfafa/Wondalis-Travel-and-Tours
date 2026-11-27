import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export type PlaceItem = {
  id: string;
  slug: string;
  name: string;
  region: "GHANA" | "ABROAD";
  area: string;
  category: string;
  description: string;
  image: string;
  active: boolean;
  position: number;
};

type Row = { id: string; slug: string; name: string; region: string; area: string; category: string; description: string; image: string; active: boolean; position: number };
const toItem = (p: Row): PlaceItem => ({ ...p, region: p.region === "GHANA" ? "GHANA" : "ABROAD" });

/** Active places for the public "Build a trip" page. Cached; saving a place refreshes it at once. */
export async function getPlaces(): Promise<PlaceItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("places");
  const rows = await prisma.place.findMany({ where: { active: true }, orderBy: [{ position: "asc" }, { name: "asc" }] });
  return rows.map(toItem);
}

/** Every place, for the admin. Not cached: call requireStaff() first. */
export async function listAllPlaces(): Promise<PlaceItem[]> {
  const rows = await prisma.place.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] });
  return rows.map(toItem);
}
