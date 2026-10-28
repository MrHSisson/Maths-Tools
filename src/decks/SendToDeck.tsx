import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { ALL_TOOLS } from "../registry";
import { MathRenderer, InlineMath } from "../shared/components/MathRenderer";
import type { AnyQuestion, DifficultyLevel } from "../shared";
import { GENERATOR_TOOLS } from "./generators";
import { generatorSlide, titleSlide, worksheetSlide } from "./layouts";
import { QuestionWorkspace } from "./QuestionWorkspace";
import { copyQuestion, fromBank, materializeDeck } from "./questions";
import { fromGenerated } from "./SlideCanvas";
import { allDecks, bankQuestion, loadDeck, newDeckId, newQuestionId, saveDeck } from "./store";
import type { BankQuestion, CuratedQuestion, GeneratorPreset, QuestionSlideDraft, Slide } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// "Send to a deck" from a tool page's burger menu (Developing-tools mode): the Whiteboard's current tab, level and
// Question Options become a generator slide or a book activity, or the question on screen becomes a hand-picked
// practice question. The slide is added to the end of the chosen deck (or a new one) and saved like any edit.
// Loaded only when opened, so tool pages carry none of the deck code.
// ─────────────────────────────────────────────────────────────────────────────

interface SendToDeckProps {
  path: string; sub: string; level: DifficultyLevel;
  variables: Record<string, boolean>; dropdown: string; multiSelect: Record<string, boolean>;
  question: AnyQuestion; onClose: () => void;
}

type What = "generator" | "book" | "question";

export default function SendToDeck({ path, sub, level, variables, dropdown, multiSelect, question, onClose }: SendToDeckProps) {
  const tool = ALL_TOOLS.find((t) => t.path === path);
  const wired = !!tool && GENERATOR_TOOLS.some(([id]) => id === tool.id);
  const decks = useMemo(() => allDecks(), []);
  const [target, setTarget] = useState<string>(decks.find((d) => d.deck.tool === tool?.id)?.deck.id ?? decks[0]?.deck.id ?? "new");
  const [what, setWhat] = useState<What>("generator");
  const [tag] = useState("");
  const [capture, setCapture] = useState<CuratedQuestion[] | null>(null);
  const [done, setDone] = useState<{ id: string; title: string; at: number } | null>(null);
  const shown = fromGenerated(question);
  const preset: GeneratorPreset = { sub, level: level as GeneratorPreset["level"], variables, dropdown: dropdown || undefined, multiSelect };
  const lv = `Level ${level.slice(-1)}`;

  const add = async (captured?: CuratedQuestion[], context?: QuestionSlideDraft) => {
    if (!tool) return;
    if (what === "question" && !captured) {
      const q: BankQuestion = { id: newQuestionId(), tool: tool.id, level: preset.level, tag, latex: shown.latex, lines: shown.lines,
        answer: shown.suffix ? `${shown.answer}\\text{ ${shown.suffix}}` : shown.answer, working: shown.working };
      setCapture([copyQuestion(fromBank(q))]); return;
    }
    let deck = target === "new" ? null : loadDeck(target);
    if (!deck) { const id = newDeckId(); deck = { id, title: `${tool.name} deck`, summary: "", tool: tool.id, toolPath: tool.path, slides: [titleSlide(`${id}-title`, tool.name, "")] }; }
    const sid = `${deck.id}-${Date.now().toString(36)}`;
    let slide: Slide;
    if (what === "generator") slide = generatorSlide(sid, tool.id, preset, `${tool.name}: ${lv}`, Math.floor(Math.random() * 1e9));
    else if (what === "book") slide = worksheetSlide(sid, tool.id, preset, 8, 2, "Book activity", Math.floor(Math.random() * 1e9));
    else slide = { id: sid, family: "practice", title: "Skill practice", ...context, els: [{ id: `${sid}-questions`, kind: "questions", x: 100, y: 60, w: 1400, h: 790, items: captured! }] };

    const next = await materializeDeck({ ...deck, slides: [...deck.slides, slide] }, bankQuestion);
    saveDeck(next);
    setDone({ id: next.id, title: next.title, at: next.slides.length });
  };

  const radio = (v: What, label: string, hint: string) => (
    <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${what === v ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
      <input type="radio" checked={what === v} onChange={() => setWhat(v)} className="mt-1" />
      <span><span className="block font-semibold text-slate-800">{label}</span><span className="block text-xs text-slate-500">{hint}</span></span>
    </label>
  );

  if (capture) return <QuestionWorkspace start={capture} context={{ title: `${tool!.name}: fixed questions` }} identity={`${decks.find((d) => d.deck.id === target)?.deck.title ?? "New deck"} / capture:${question.key}`} tool={tool!.id} draftKey={`capture:${question.key}`} onClose={() => setCapture(null)} onApply={(items, context) => { add(items, context); setCapture(null); }} />;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/40 p-4" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-300 bg-white p-5 shadow-lift">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-slate-900">Send to a deck</h2>
          <button onClick={onClose} className="ml-auto rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>
        {!wired ? (
          <p className="mt-3 text-sm text-slate-600">This tool's questions are pictures with their own print, which decks cannot draw yet.</p>
        ) : done ? (
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            <p>Added as slide {done.at} of <b>{done.title}</b>.</p>
            <div className="flex gap-2">
              <a href={`/decks/${done.id}?edit=1&s=${done.at}`} className="rounded-xl bg-blue-900 px-4 py-2 font-semibold text-white hover:bg-blue-800">Open it in the editor</a>
              <button onClick={() => setDone(null)} className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100">Send another</button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-500">{tool!.name} · {lv} · the options ticked now.</p>
            <div className="mt-3 space-y-2">
              {radio("generator", "A generator slide with this setup", "The tool's generator live in the deck: New question, the answer, the working step by step.")}
              {radio("book", "A book activity with this setup", "Eight numbered questions to copy and answer, answers on demand, and Print.")}
              {radio("question", "This question, hand-picked", "The question on screen becomes a deck-owned draft. Open the question workspace to adapt it.")}
            </div>
            {what === "question" && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <div className="text-2xl">{shown.lines ? shown.lines.map((l, i) => <div key={i} className="text-base"><InlineMath text={l} /></div>) : <MathRenderer latex={shown.latex} />}</div>
                <p className="mt-2 text-sm text-slate-500">Added as a general-practice draft. Open Questions in the deck to adapt it and add misconception guidance.</p>
              </div>
            )}
            <label className="mt-3 block text-xs font-semibold text-slate-500">Add to the end of</label>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              {decks.map(({ deck }) => <option key={deck.id} value={deck.id}>{deck.title}</option>)}
              <option value="new">A new deck</option>
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={() => add()} className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Add slide</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
