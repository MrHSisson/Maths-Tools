import { useEffect, useRef, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// The question keeper — the last few questions and the ones the teacher pins, for this visit only (memory, never stored).
// A shell hands it a snapshot of what is on screen (an id that changes with each new question, a label for the menu and
// whatever state is needed to put it back); the keeper remembers the one it replaces. Both lists are capped at MAX_KEPT.
// ═══════════════════════════════════════════════════════════════════════════

export const MAX_KEPT = 5;

export interface KeptQuestion<S> { id: string; label: string; state: S }

/** What the burger menu needs: ids and labels only, plus the actions. */
export interface QuestionKeeperMenu {
  history: Array<{ id: string; label: string }>;
  pins: Array<{ id: string; label: string }>;
  currentId: string;
  isPinned: boolean;
  canPin: boolean;
  onPick: (id: string) => void;
  onPin: () => void;
  onUnpin: (id: string) => void;
}

/** the history after `prev` has been replaced on screen by the question `currentId`: newest first, no repeats, never the current one, at most MAX_KEPT */
export function pushHistory<S>(history: Array<KeptQuestion<S>>, prev: KeptQuestion<S>, currentId: string): Array<KeptQuestion<S>> {
  return [prev, ...history.filter((x) => x.id !== prev.id && x.id !== currentId)].slice(0, MAX_KEPT);
}
/** pin the question if it is not pinned (while there is room), unpin it if it is */
export function togglePin<S>(pins: Array<KeptQuestion<S>>, current: KeptQuestion<S>): Array<KeptQuestion<S>> {
  return pins.some((x) => x.id === current.id) ? pins.filter((x) => x.id !== current.id) : pins.length < MAX_KEPT ? [...pins, current] : pins;
}

/** `enabled` false (the phone start screens, where the question on screen was never shown) keeps the history untouched */
export function useQuestionKeeper<S>(current: KeptQuestion<S>, restore: (state: S) => void, enabled = true): QuestionKeeperMenu {
  const [history, setHistory] = useState<Array<KeptQuestion<S>>>([]);
  const [pins, setPins] = useState<Array<KeptQuestion<S>>>([]);
  const prev = useRef(current);

  // a new question on screen: the one it replaced goes to the top of the history (most recent first, no repeats, never the current one)
  useEffect(() => {
    const p = prev.current;
    if (enabled && p.id !== current.id) setHistory((h) => pushHistory(h, p, current.id));
    prev.current = current;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberate: only a change of question id counts as a new question
  }, [current.id, enabled]);

  const isPinned = pins.some((x) => x.id === current.id);
  const find = (id: string) => pins.find((x) => x.id === id) ?? history.find((x) => x.id === id);
  return {
    history: history.map(({ id, label }) => ({ id, label })),
    pins: pins.map(({ id, label }) => ({ id, label })),
    currentId: current.id,
    isPinned,
    canPin: isPinned || pins.length < MAX_KEPT,
    onPick: (id) => { const k = find(id); if (k) restore(k.state); },
    onPin: () => setPins((ps) => togglePin(ps, current)),
    onUnpin: (id) => setPins((ps) => ps.filter((x) => x.id !== id)),
  };
}
