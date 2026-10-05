import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, EyeOff, ListChecks } from "lucide-react";
import { InlineMath } from "./MathRenderer";
import { LV_LABELS, LV_SELECTOR } from "../colors";
import { DEPTH_PURPOSES, type DepthItem, type DepthPurpose } from "../depth";
import type { DifficultyLevel } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Depth mode — the picker and the two-beat question view (see src/shared/depth.ts).
// Controlled by ToolShell: the level toggle and the open item live there so both are
// shareable in the URL (`?mode=depth&level=2&item=<id>`).
// ─────────────────────────────────────────────────────────────────────────────

const PURPOSE_STYLE: Record<DepthPurpose, { badge: string; card: string }> = {
  diagnose: { badge: "bg-blue-100 text-blue-900", card: "border-blue-200 hover:border-blue-400" },
  explain: { badge: "bg-amber-100 text-amber-900", card: "border-amber-200 hover:border-amber-400" },
  extend: { badge: "bg-emerald-100 text-emerald-900", card: "border-emerald-200 hover:border-emerald-400" },
};
const LEVEL_ORDER: DifficultyLevel[] = ["level1", "level2", "level3"];
const purposeLabel = (p: DepthPurpose) => DEPTH_PURPOSES.find((x) => x.key === p)?.label ?? p;

export interface DepthModeProps {
  /** The items for the current sub-tool (all levels). */
  items: DepthItem[];
  level: DifficultyLevel;
  onLevelChange: (l: DifficultyLevel) => void;
  /** The open item, or null for the picker. */
  itemId: string | null;
  onItemChange: (id: string | null) => void;
  /** Phone layout: smaller type. */
  narrow?: boolean;
}

export function DepthMode({ items, level, onLevelChange, itemId, onItemChange, narrow = false }: DepthModeProps) {
  const [purpose, setPurpose] = useState<DepthPurpose | "all">("all");
  const [revealed, setRevealed] = useState(false);
  const [check, setCheck] = useState<number | null>(null); // index into `starts` while a quick check runs

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const current = itemId ? byId.get(itemId) : undefined;
  const starts = useMemo(
    () => items.filter((i) => i.startHere).sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)),
    [items],
  );
  const atLevel = useMemo(() => items.filter((i) => i.level === level), [items, level]);
  const visible = atLevel.filter((i) => purpose === "all" || i.purpose === purpose);

  // New item → back to the question beat. A level change under an open item → back to the picker.
  useEffect(() => { setRevealed(false); }, [itemId]);
  useEffect(() => { if (current && current.level !== level) onItemChange(null); }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (id: string) => {
    const it = byId.get(id);
    if (!it) return;
    if (it.level !== level) onLevelChange(it.level);
    onItemChange(id);
  };
  const toPicker = () => { setCheck(null); onItemChange(null); };
  const startCheck = () => { if (starts.length) { setCheck(0); open(starts[0].id); } };
  const nextCheck = () => {
    if (check === null) return;
    if (check + 1 < starts.length) { setCheck(check + 1); open(starts[check + 1].id); } else toPicker();
  };

  const big = narrow ? "text-xl" : "text-3xl";
  const mid = narrow ? "text-base" : "text-2xl";

  // ── Picker ────────────────────────────────────────────────────────────────
  if (!current) {
    return (
      <div className={`rounded-xl shadow-lg bg-white ${narrow ? "p-4" : "p-8"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div>
            <h2 className={`${narrow ? "text-lg" : "text-2xl"} font-bold text-gray-900`}>Depth</h2>
            <p className="text-sm text-gray-500">Fixed questions for diagnosing, explaining and extending. Pick one to suit the class.</p>
          </div>
          {starts.length > 0 && (
            <button onClick={startCheck} className="px-4 py-2 rounded-lg bg-blue-900 text-white font-bold text-sm shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <ListChecks size={16} /> Start here
              <span className="font-normal opacity-80">one quick question per level</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 my-4">
          {([{ key: "all", label: "All" }, ...DEPTH_PURPOSES] as { key: DepthPurpose | "all"; label: string; blurb?: string }[]).map((p) => {
            const n = p.key === "all" ? atLevel.length : atLevel.filter((i) => i.purpose === p.key).length;
            const on = purpose === p.key;
            return (
              <button key={p.key} onClick={() => setPurpose(p.key)}
                className={`px-4 py-1.5 rounded-full font-bold text-sm border-2 transition-colors ${on ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                {p.label} <span className={on ? "opacity-80" : "text-gray-400"}>{n}</span>
              </button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">No questions here yet for this level.</p>
        ) : (
          <div className={`grid gap-3 ${narrow ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"}`}>
            {visible.map((it) => (
              <button key={it.id} onClick={() => open(it.id)}
                className={`text-left rounded-xl border-2 bg-white p-4 shadow-sm transition-colors ${PURPOSE_STYLE[it.purpose].card}`}>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${PURPOSE_STYLE[it.purpose].badge}`}>{purposeLabel(it.purpose)}</span>
                <div className="mt-2 font-bold text-gray-900 text-lg leading-snug">{it.title}</div>
                {it.options && <div className="mt-1 text-xs text-gray-500">{it.options.length} choices</div>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Open item: question beat, then answer beat ────────────────────────────
  const lv = LV_SELECTOR[current.level];
  const followUp = (id?: string) => (id ? byId.get(id) : undefined);
  const notSecure = followUp(current.ifNotSecure);
  const secure = followUp(current.ifSecure);
  const inCheck = check !== null;

  return (
    <div className={`rounded-xl shadow-lg bg-white ${narrow ? "p-4" : "p-8"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <button onClick={toPicker} className="flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-blue-900">
          <ArrowLeft size={16} /> {inCheck ? "End quick check" : "All questions"}
        </button>
        <div className="flex items-center gap-2">
          {inCheck && <span className="text-sm font-bold text-gray-500">Question {check! + 1} of {starts.length}</span>}
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${lv.bg} ${lv.text}`}>{LV_LABELS[current.level]}</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${PURPOSE_STYLE[current.purpose].badge}`}>{purposeLabel(current.purpose)}</span>
        </div>
      </div>

      <div className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-3">{current.title}</div>
      <div className={`${big} font-semibold text-gray-900 leading-relaxed flex flex-col gap-2`}>
        {current.question.map((line, i) => <div key={i}><InlineMath text={line} /></div>)}
      </div>

      {current.options && (
        <div className={`grid gap-3 mt-6 ${narrow ? "grid-cols-1" : current.options.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
          {current.options.map((o, i) => {
            const right = revealed && o.correct;
            const wrong = revealed && !o.correct;
            return (
              <div key={i}
                className={`rounded-xl border-2 p-4 transition-colors ${right ? "border-green-500 bg-green-50" : wrong ? "border-gray-200 bg-gray-50" : "border-gray-300 bg-white"}`}>
                <div className="flex items-center gap-3">
                  <span className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold ${right ? "bg-green-600 text-white" : "bg-blue-900 text-white"}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className={`${mid} font-semibold text-gray-900`}><InlineMath text={o.text} /></span>
                </div>
                {right && <div className="mt-2 text-sm font-bold text-green-700">Correct</div>}
                {wrong && o.misconception && <div className="mt-2 text-sm text-gray-600"><span className="font-bold text-gray-700">Shows: </span><InlineMath text={o.misconception} /></div>}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button onClick={() => setRevealed((r) => !r)}
          className="px-6 py-3 rounded-xl bg-blue-900 text-white font-bold text-lg shadow-lg hover:bg-blue-800 flex items-center gap-2">
          {revealed ? <><EyeOff size={20} /> Hide answer</> : <><Eye size={20} /> Show answer</>}
        </button>
      </div>

      {revealed && (
        <div className="mt-6 flex flex-col gap-4">
          <div className={`rounded-xl border-2 border-green-300 bg-green-50 p-5 ${mid} text-gray-900 leading-relaxed flex flex-col gap-2`}>
            {current.answer.map((line, i) => <div key={i}><InlineMath text={line} /></div>)}
          </div>
          {current.teacherNote && (
            <div className="rounded-xl bg-gray-100 p-4 text-sm text-gray-700"><span className="font-bold">Teacher: </span><InlineMath text={current.teacherNote} /></div>
          )}
          <div className="flex flex-wrap gap-3 justify-center">
            {notSecure && (
              <button onClick={() => open(notSecure.id)} className="px-4 py-2 rounded-lg border-2 border-gray-300 bg-white font-bold text-sm text-gray-800 hover:bg-gray-50 text-left">
                <span className="block text-xs text-gray-500">Class not secure</span>{notSecure.title}
              </button>
            )}
            {secure && (
              <button onClick={() => open(secure.id)} className="px-4 py-2 rounded-lg border-2 border-emerald-300 bg-emerald-50 font-bold text-sm text-emerald-900 hover:bg-emerald-100 text-left">
                <span className="block text-xs text-emerald-700">Class secure</span>{secure.title}
              </button>
            )}
            {inCheck && (
              <button onClick={nextCheck} className="px-4 py-2 rounded-lg bg-blue-900 text-white font-bold text-sm hover:bg-blue-800">
                {check! + 1 < starts.length ? "Next quick check question" : "Finish quick check"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
