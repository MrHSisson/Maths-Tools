// ═══════════════════════════════════════════════════════════════════════════════
// DEVELOPING-TOOLS MODE — a global "show me everything unfinished" switch.
//
// When ON it reveals in-progress work that is normally hidden from general
// classroom use:
//   • tools registered with `enabled: false` (LandingPage shows them, badged DEV)
//   • the step-by-step "Worked Example" mode in every ToolShell tool
//
// The flag is persisted in localStorage and shared across the whole app (and
// across tabs) via a tiny external store, so any component can read it with the
// useDevMode() hook and the LandingPage toggle flips it for everyone.
// ═══════════════════════════════════════════════════════════════════════════════

import { useSyncExternalStore } from "react";

const KEY = "mt-dev-mode";
const EVT = "mt-dev-mode-change";

export const getDevMode = (): boolean => {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};

export const setDevMode = (on: boolean): void => {
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch { /* private mode etc. */ }
  window.dispatchEvent(new Event(EVT));
};

const subscribe = (cb: () => void): (() => void) => {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb); // keep tabs in sync
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
};

export const useDevMode = (): boolean =>
  useSyncExternalStore(subscribe, getDevMode, () => false);
