// Creates (or promotes) the Owner account. Run it yourself, once, on a machine you trust:
//
//   PowerShell:  $env:OWNER_EMAIL="you@example.com"; $env:OWNER_PASSWORD="a long passphrase"; npx tsx prisma/create-owner.ts
//
// Why a script and not a sign-up page: the sign-up form can only ever create customers
// (role is not accepted from the browser). Only code running on the server may set a role.

import "dotenv/config";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  const name = process.env.OWNER_NAME?.trim() || "Owner";

  if (!email || !password) throw new Error("Set OWNER_EMAIL and OWNER_PASSWORD.");
  if (password.length < 12) throw new Error("Use a password of at least 12 characters.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    // Goes through Better Auth so the password is hashed the same way as at sign-in.
    await auth.api.signUpEmail({ body: { name, email, password } });
  }

  await prisma.user.update({ where: { email }, data: { role: "owner", emailVerified: true } });
  console.log(`${email} is now an Owner.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
