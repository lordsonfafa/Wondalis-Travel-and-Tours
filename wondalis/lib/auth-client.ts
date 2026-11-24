"use client";

import { createAuthClient } from "better-auth/react";

// Browser-side helpers that call the /api/auth routes.
export const authClient = createAuthClient();
