// The worksheet mode / layout and the differentiated per-level Question Options are not in the URL
// (too large to encode), so they are kept in sessionStorage per tool route: a refresh restores the
// setup. The advanced builder's own group state lives inside <WorksheetBuilder> and is session-only.

export interface WBPersist {
  worksheetMode?: "standard" | "advanced";
  worksheetLayout?: "grid" | "list";
  worksheetBorders?: boolean;
  smartProgressorEnabled?: boolean;
  hideRepeatedText?: boolean;
  condensedWording?: boolean;
  levelVariables?: Record<string, Record<string, boolean>>;
  levelDropdowns?: Record<string, string>;
  levelMultiSelect?: Record<string, Record<string, boolean>>;
}

export function loadWbPersist(key: string): WBPersist | null {
  if (!key) return null;
  try { const raw = sessionStorage.getItem(key); return raw ? (JSON.parse(raw) as WBPersist) : null; }
  catch { return null; }
}

export function saveWbPersist(key: string, value: WBPersist): void {
  if (!key) return;
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore quota / serialisation errors */ }
}
