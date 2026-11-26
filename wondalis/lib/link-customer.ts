import { prisma } from "@/lib/prisma";

/**
 * Attaches guest booking profiles to a user. Call ONLY for a user whose email is verified, so nobody
 * can claim someone else's bookings by signing up with their address. Safe to call repeatedly.
 * One user has one customer profile; if they already have one, nothing changes.
 */
export async function linkGuestCustomer(user: { id: string; email: string }) {
  const mine = await prisma.customer.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (mine) return;
  await prisma.customer.updateMany({
    where: { email: { equals: user.email, mode: "insensitive" }, userId: null },
    data: { userId: user.id },
  });
}
