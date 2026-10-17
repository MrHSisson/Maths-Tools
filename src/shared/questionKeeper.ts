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

export function useQuestionKeeper<S>(current: KeptQuestion<S>, restore: (state: S) => void): QuestionKeeperMenu {
  const [history, setHistory] = useState<Array<KeptQuestion<S>>>([]);
  const [pins, setPins] = useState<Array<KeptQuestion<S>>>([]);
  const prev = useRef(current);

  // a new question on screen: the one it replaced goes to the top of the history (most recent first, no repeats, never the current one)
  useEffect(() => {
    const p = prev.current;
    if (p.id !== current.id) setHistory((h) => [p, ...h.filter((x) => x.id !== p.id && x.id !== current.id)].slice(0, MAX_KEPT));
    prev.current = current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id]);

  const isPinned = pins.some((x) => x.id === current.id);
  const find = (id: string) => pins.find((x) => x.id === id) ?? history.find((x) => x.id === id);
  return {
    history: history.map(({ id, label }) => ({ id, label })),
    pins: pins.map(({ id, label }) => ({ id, label })),
    currentId: current.id,
    isPinned,
    canPin: isPinned || pins.length < MAX_KEPT,
    onPick: (id) => { const k = find(id); if (k) restore(k.state); },
    onPin: () => setPins((ps) => (ps.some((x) => x.id === current.id) ? ps.filter((x) => x.id !== current.id) : ps.length < MAX_KEPT ? [...ps, current] : ps)),
    onUnpin: (id) => setPins((ps) => ps.filter((x) => x.id !== id)),
  };
}
