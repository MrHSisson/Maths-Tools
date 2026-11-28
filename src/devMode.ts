import { useSyncExternalStore } from "react";

const event = "mt-dev-mode-change";
const signalKey = "mt-dev-session-change";
let active = false;
let requestVersion = 0;
let listeners = 0;

export const getDevMode = () => active;

function update(next: boolean) {
  active = next;
  window.dispatchEvent(new Event(event));
}

async function refresh() {
  const version = ++requestVersion;
  try {
    const response = await fetch("/api/dev-session", { cache: "no-store" });
    const result = await response.json();
    if (version === requestVersion) update(response.ok && result.active === true);
  } catch { /* A temporary network error does not end the session. */ }
}

function storageChanged(event: StorageEvent) {
  if (event.key === signalKey) void refresh();
}

async function changeSession(body: { password: string } | { lock: true }): Promise<string | null> {
  try {
    const response = await fetch("/api/dev-session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) return result.error ?? "Could not update Developing tools access.";
    ++requestVersion;
    update(result.active === true);
    try { localStorage.setItem(signalKey, crypto.randomUUID()); } catch { /* Storage is unavailable. */ }
    return null;
  } catch {
    return "Could not reach Developing tools access.";
  }
}

export const unlockDevMode = (password: string) => changeSession({ password });
export const lockDevMode = () => changeSession({ lock: true });
export const refreshDevMode = () => void refresh();

function subscribe(notify: () => void) {
  window.addEventListener(event, notify);
  if (listeners++ === 0) {
    try { localStorage.removeItem("mt-project-plan-access"); } catch { /* Storage is unavailable. */ }
    void refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", storageChanged);
  }
  return () => {
    window.removeEventListener(event, notify);
    if (--listeners === 0) {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", storageChanged);
    }
  };
}

export const useDevMode = () => useSyncExternalStore(subscribe, getDevMode, () => false);
