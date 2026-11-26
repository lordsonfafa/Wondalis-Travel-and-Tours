import { prisma } from "@/lib/prisma";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Staff"; // "Admin" is the database role "owner"
  invited: boolean; // true until they have chosen a password
};

/** Everyone with admin access. Call requireOwner() first. */
export async function listTeam(): Promise<TeamMember[]> {
  const rows = await prisma.user.findMany({
    where: { role: { in: ["owner", "staff"] } },
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, emailVerified: true },
  });
  return rows.map((u: { id: string; name: string; email: string; role: string; emailVerified: boolean }) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === "owner" ? "Admin" : "Staff",
    invited: !u.emailVerified,
  }));
}
