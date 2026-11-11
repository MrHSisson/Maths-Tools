// Pages that list decks without being the deck editor (the Decks tab, the dashboard, a tool's menu) have no bundled decks to show first:
// they ask the shared copy once, then re-read what this device holds. `enabled` is false for a visitor who cannot see unpublished decks.
import { useEffect, useState } from "react";
import { syncFromCloud } from "./store";

/** A counter that changes when the sync has finished; use it as a dependency of anything that reads allDecks(). */
export function useSyncedDecks(enabled = true): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let on = true;
    void syncFromCloud().catch(() => false).then(() => { if (on) setN((x) => x + 1); });
    return () => { on = false; };
  }, [enabled]);
  return n;
}
