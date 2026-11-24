// Server-side auth configuration (Better Auth).
// Never import this file from a client component: it holds the database connection.

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  // Our own column on the user table. `input: false` means a visitor can NEVER set it
  // through the sign-up form: without it, anyone could sign up with { role: "owner" }.
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "customer", input: false },
    },
  },

  // Slow down password guessing. Counters live in the database (table RateLimit) so they
  // are shared by every server instance; in-memory counters would reset per instance.
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },
});
