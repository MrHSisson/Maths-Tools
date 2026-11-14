// "Filed under": which category (a strand, or a topic inside one) a deck sits in on the Decks page. The categories are Harry's to control
// (src/decks/categoryTree.ts); this is the same filing as dragging a card, from inside the deck editor.
import { useState } from "react";
import { useCategories } from "./categories";
import { menuOptions, placeOf } from "./categoryTree";

export function FileUnder({ deckId, strand }: { deckId: string; /** The strand the deck still carries from before categories were Harry's to control. */ strand?: string }) {
  const { data, act } = useCategories(true);
  const [error, setError] = useState<string | null>(null);
  if (data === undefined) return <p className="text-xs text-slate-400">Loading the categories…</p>;
  if (data === null) return <p className="text-xs text-slate-400">The categories are not available here (the sharing service is not reachable).</p>;
  return (
    <div className="space-y-1">
      <select value={placeOf({ id: deckId, strand }, data) ?? ""} onChange={async (e) => setError(await act({ op: "file", deckId, categoryId: e.target.value || null }))} aria-label="Filed under"
        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800">
        <option value="">Not filed</option>
        {menuOptions(data).map((o) => <option key={o.id} value={o.id}>{o.depth ? "   " : ""}{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
