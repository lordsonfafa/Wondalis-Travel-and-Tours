"use client";

import { createContext, useContext } from "react";

// Hands the site's current USD→GHS rate (read once on the server) to client components.
const FxContext = createContext<number | null>(null);

export function FxProvider({ rate, children }: { rate: number; children: React.ReactNode }) {
  return <FxContext.Provider value={rate}>{children}</FxContext.Provider>;
}

export function useFxRate(): number {
  const rate = useContext(FxContext);
  if (rate === null) throw new Error("useFxRate must be used inside <FxProvider>");
  return rate;
}
