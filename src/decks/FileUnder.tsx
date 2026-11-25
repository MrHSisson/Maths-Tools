// "Filed under" in the deck editor's About the deck: which folders a deck is in, in the topic tree and in the class tree. The same filing as dragging a card
// on the Decks page (components/FolderView.tsx). A deck can be in several folders; ticking one adds it, unticking takes it out.
import { useState } from "react";
import { flatten, setDeckFolders, useReload, useTree, type Tree } from "./folders";

const LABEL: Record<Tree, string> = { topic: "Topic folders", class: "Class folders" };

export function FileUnder({ deckId }: { deckId: string }) {
  return (
    <div className="space-y-3">
      {(["topic", "class"] as Tree[]).map((t) => <Picker key={t} deckId={deckId} tree={t} />)}
    </div>
  );
}

function Picker({ deckId, tree }: { deckId: string; tree: Tree }) {
  const [reload, bump] = useReload();
  const data = useTree(tree, reload);
  const [error, setError] = useState<string | null>(null);
  const title = <div className="text-xs font-semibold text-slate-500">{LABEL[tree]}</div>;
  if (data === undefined) return <div>{title}<p className="text-xs text-slate-400">Loading the folders…</p></div>;
  if (data === null) return <div>{title}<p className="text-xs text-slate-400">The folders are not available here (the sharing service is not reachable).</p></div>;
  const mine = new Set(data.byDeck[deckId] ?? []);
  const toggle = async (id: string, on: boolean) => { const next = on ? [...mine, id] : [...mine].filter((f) => f !== id); setError(await setDeckFolders(deckId, tree, next)); bump(); };
  const rows = flatten(data.folders);
  return (
    <div>
      {title}
      <div className="max-h-44 overflow-auto rounded-lg border border-slate-300 bg-white p-1 text-sm text-slate-800">
        {rows.length === 0 && <p className="px-2 py-1 text-xs text-slate-400">No folders yet: make one on the Decks page.</p>}
        {rows.map(({ folder, depth }) => (
          <label key={folder.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-slate-50" style={{ paddingLeft: 8 + depth * 16 }}>
            <input type="checkbox" className="h-4 w-4 accent-blue-900" checked={mine.has(folder.id)} onChange={(e) => void toggle(folder.id, e.target.checked)} />{folder.name}
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
