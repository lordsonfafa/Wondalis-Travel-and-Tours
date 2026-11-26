// Server-side auth configuration (Better Auth).
// Never import this file from a client component: it holds the database connection.

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { sendInBackground } from "@/lib/email";
import { resetPasswordEmail, verifyEmail } from "@/lib/email-templates";
import { linkGuestCustomer } from "@/lib/link-customer";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60, // the emailed link works for one hour
    sendResetPassword: async ({ user, url }) => {
      sendInBackground(resetPasswordEmail(user.email, user.name, url));
    },
  },

  // Email verification. Sign-in is NOT blocked for unverified emails (less friction at checkout
  // time), but guest bookings are only attached to an account once its email is verified, so
  // nobody can claim someone else's bookings by signing up with their address.
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      sendInBackground(verifyEmail(user.email, user.name, url));
    },
    afterEmailVerification: async (user) => {
      await linkGuestCustomer(user);
    },
  },

  // Google sign-in. Only switched on when both keys are set, so the app still starts without them.
  // Google confirms the email itself, so these accounts count as verified (their guest bookings
  // attach automatically) and may merge with an existing email+password account for the same address.
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
      : {},
  account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },

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
      "/request-password-reset": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
    },
  },
});
