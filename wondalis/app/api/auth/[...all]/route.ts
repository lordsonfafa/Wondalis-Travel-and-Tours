import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Better Auth serves /api/auth/sign-in/email, /sign-out, /get-session and the rest from here.
export const { GET, POST } = toNextJsHandler(auth);
