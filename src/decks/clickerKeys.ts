// What a USB presentation clicker sends, and what the deck player does with it.
// Clickers are just keyboards: most send Page Down / Page Up, some send the arrow keys, Enter, or the media keys, and the
// "black screen" button sends "." (or "b"); "start" sends F5 and "end" sends Escape. Several send the key with a
// non-standard `key` value (or none), so `code` and the legacy `keyCode` are read too.
export type ClickerAction = "next" | "back" | "first" | "last" | "blank" | "full" | null;

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown", "PageDown", "Enter", "MediaTrackNext", "MediaNextTrack", "n", "N"]);
const BACK_KEYS = new Set(["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "MediaTrackPrevious", "MediaPreviousTrack", "p", "P"]);
// legacy keyCode: 34/33 page down/up, 39/37 right/left, 40/38 down/up, 13 enter, 176/177 media next/previous
const NEXT_CODES = new Set([34, 39, 40, 13, 176]);
const BACK_CODES = new Set([33, 37, 38, 177]);

export type KeyLike = { key: string; code?: string; keyCode?: number; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean };

export function clickerAction(e: KeyLike): ClickerAction {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  const { key, code = "", keyCode = 0 } = e;
  if (key === "Home") return "first";
  if (key === "End") return "last";
  if (key === "F5") return "full";
  if (key === "." || code === "Period") return "blank";
  if (key === " " || key === "Spacebar" || code === "Space") return "next";
  if (NEXT_KEYS.has(key) || NEXT_KEYS.has(code) || (key === "Unidentified" || key === "") && NEXT_CODES.has(keyCode)) return "next";
  if (BACK_KEYS.has(key) || BACK_KEYS.has(code) || (key === "Unidentified" || key === "") && BACK_CODES.has(keyCode)) return "back";
  if (NEXT_CODES.has(keyCode) && !key) return "next";
  if (BACK_CODES.has(keyCode) && !key) return "back";
  return null;
}
