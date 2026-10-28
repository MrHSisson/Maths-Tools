import { useState } from "react";
import { Search } from "lucide-react";
import { Menu, MenuHeading, MenuItem, input } from "./EditorChrome";
import { GENERATOR_TOOL_INFO } from "./generators";

// Searchable tool selection shared by the central generator dialog.

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const matches = (haystack: string, query: string) => { const h = haystack.toLowerCase(); return words(query).every((w) => h.includes(w)); };

function ToolList({ value, onPick }: { value: string; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const shown = GENERATOR_TOOL_INFO.filter((t) => matches(`${t.name} ${t.group ?? ""} ${t.category}`, q));
  const strands = [...new Set(shown.map((t) => t.category))];
  return (
    <div>
      <div className="sticky top-0 z-10 bg-white p-1">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2 top-2.5 text-slate-400" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tools" aria-label="Search tools" className={`${input} pl-7`} />
        </div>
      </div>
      {!shown.length && <p className="px-2 py-2 text-xs text-slate-500">No tool matches “{q}”.</p>}
      {strands.map((c) => (
        <div key={c}>
          <MenuHeading>{c}</MenuHeading>
          {shown.filter((t) => t.category === c).map((t) => (
            <MenuItem key={t.id} label={t.id === value ? `${t.name}  ✓` : t.name} note={t.group} onClick={() => onPick(t.id)} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Choose a tool: a searchable list grouped by strand (the landing page's own grouping). */
export function ToolPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const info = GENERATOR_TOOL_INFO.find((t) => t.id === value);
  return (
    <Menu full wide title="Choose a tool" button={<span className="truncate">{info?.name ?? value}</span>}>
      {(close) => <ToolList value={value} onPick={(id) => { close(); if (id !== value) onChange(id); }} />}
    </Menu>
  );
}
