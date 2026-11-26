"use client";

import { useState } from "react";

// A password box with a Show / Hide button, so people can check what they typed.
// Pass the same props you would give an <input>; the type is handled here.
export function PasswordInput({ className = "", ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-[72px]`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2.5 py-1.5 text-sm font-semibold text-forest-700 hover:text-forest-900"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
