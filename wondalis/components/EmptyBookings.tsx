import { EmptyState } from "./EmptyState";

/** Shown when a signed-in customer has no bookings at all. */
export function EmptyBookings() {
  return <EmptyState title="No bookings yet" actionLabel="Browse trips" actionHref="/trips" />;
}
