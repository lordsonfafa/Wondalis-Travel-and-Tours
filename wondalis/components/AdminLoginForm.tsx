"use client";

import { useRouter } from "next/navigation";
import { Button } from "./Button";

const inputCls =
  "w-full rounded-[12px] border border-border bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink-secondary/70 focus:border-forest-500";

export function AdminLoginForm() {
  const router = useRouter();

  return (
    <form
      // Dummy auth: nothing is checked. The backend will verify the email and
      // password, confirm the user is an admin (Owner or Staff), and start a session.
      onSubmit={(e) => {
        e.preventDefault();
        router.push("/admin");
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm leading-5 text-ink-secondary">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="admin@example.com"
          className={inputCls}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm leading-5 text-ink-secondary">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={inputCls}
        />
      </div>
      <Button type="submit" className="w-full">
        Sign in
      </Button>
    </form>
  );
}
