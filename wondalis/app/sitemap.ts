import type { MetadataRoute } from "next";
import { getPastTrips, getTrips } from "@/lib/db/trips";
import { SITE_URL } from "@/lib/site";

const pages = ["", "/trips", "/experiences", "/groups", "/payment-plans", "/stories", "/faq", "/contact", "/cancellation-policy", "/detty-december"];

// Published trips are added automatically, so a new trip is in the sitemap as soon as it is published.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trips, past] = await Promise.all([getTrips(), getPastTrips()]);
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, priority: p === "" ? 1 : 0.7 })),
    ...trips.map((t) => ({ url: `${SITE_URL}/trips/${t.slug}`, priority: 0.9 })),
    ...past.map((t) => ({ url: `${SITE_URL}/experiences/${t.slug}`, priority: 0.5 })),
  ];
}
