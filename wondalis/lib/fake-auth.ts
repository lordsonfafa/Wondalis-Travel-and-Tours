"use client";

import { useSyncExternalStore } from "react";

// Dummy auth for the frontend phase. Remembers "signed in" in this browser only.
// Replace with the real session from the backend later.
const KEY = "wondalis-signed-in";
const EVENT = "wondalis-auth-change";

function read() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function signInDummy() {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function signOutDummy() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

/** false on the server and during hydration, then the real value. */
export function useSignedIn() {
  return useSyncExternalStore(subscribe, read, () => false);
}
