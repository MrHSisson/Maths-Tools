// ═══════════════════════════════════════════════════════════════════════════════
// PARKED MODE — a tertiary switch, separate from and stronger than Developing-
// tools mode (`devMode.ts`).
//
// Developing-tools mode is for things currently in the pipeline — in-progress
// tools, the build-inspection pages (Technique Library, Grapher Lab) — the
// stuff a curious visitor flipping that switch is meant to see a preview of.
//
// Parked mode is different: it gates content that exists in the repo but is
// neither live nor currently being worked on — dormant, not a current focus,
// and deliberately NOT meant to be casually discoverable. So unlike devMode
// there is no visible UI toggle for it anywhere. It only unlocks via visiting
// a URL with `?parked=1` (see `syncParkedModeFromUrl`, called once at startup),
// after which it persists in localStorage exactly like devMode does. Turning
// Developing-tools mode on does NOT reveal parked content.
//
// Currently gates: registry tools with `parked: true` (their route itself
// 404s without this flag — see App.tsx's ParkedGuard — unlike an ordinary
// `enabled: false` tool, whose route still works by direct URL) and the Teach
// slide-deck mode in ToolShell.
// ═══════════════════════════════════════════════════════════════════════════════

import { useSyncExternalStore } from "react";

const KEY = "mt-parked-mode";
const EVT = "mt-parked-mode-change";

export const getParkedMode = (): boolean => {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};

const setParkedMode = (on: boolean): void => {
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch { /* private mode etc. */ }
  window.dispatchEvent(new Event(EVT));
};

// Reads a one-time `?parked=1` / `?parked=0` URL param, persists it, and
// strips it from the address bar. Call once at app startup, before the first
// render, so route guards see the up-to-date flag immediately.
export const syncParkedModeFromUrl = (): void => {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("parked")) return;
    setParkedMode(url.searchParams.get("parked") === "1");
    url.searchParams.delete("parked");
    window.history.replaceState({}, "", url.pathname + (url.search || "") + url.hash);
  } catch { /* noop — e.g. private-mode storage restrictions */ }
};

const subscribe = (cb: () => void): (() => void) => {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb); // keep tabs in sync
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
};

export const useParkedMode = (): boolean =>
  useSyncExternalStore(subscribe, getParkedMode, () => false);
