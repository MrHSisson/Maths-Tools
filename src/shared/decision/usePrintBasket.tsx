import { useEffect, useState, type ReactNode } from "react";
import { Printer } from "lucide-react";
import PrintBasket from "./PrintBasket";
import { printCpaSheets, type CpaSheetInput } from "./printCpa";
import { BASKET_MAX, addItem, decodeBasket, encodeBasket, hasItem, loadBasket, mergeItems, previewOf, removeItem, saveBasket, type BasketItem } from "./printBasket";
import { generateFromSeed } from "../seededGenerate";
import type { DecisionProblem, DecisionShellProps, GenerateContext } from "./types";

// The print basket as the shell uses it: the saved questions, the toolbar button, the menu items, the page and the little "added" message,
// in one place. A saved question is its recipe (tab, level, options, seed) — see printBasket.ts — so printing rebuilds it with `generate`.

interface Args {
  config: DecisionShellProps["config"];
  problem: DecisionProblem;
  subTool: string;
  level: number;
  /** the options as the generator receives them for this sub-tool and level */
  optionsFor: (sub: string, level: number) => GenerateContext["options"];
  generate: (level: number, ctx?: GenerateContext) => DecisionProblem;
  /** a saved question brought back onto the page: the shell takes on its sub-tool, level and options and shows the rebuilt problem */
  onLoad: (item: BasketItem, problem: DecisionProblem) => void;
}

interface PrintBasketState {
  /** the question on screen can be saved (a sub-tool with a sheet, with a seed) */
  canSave: boolean;
  /** items for the burger menu's "Printables" list */
  menuItems: { label: string; hint?: string; onClick: () => void }[];
  /** the toolbar button beside the pin (null when the question cannot be saved) */
  button: (size?: "bar" | "phone") => ReactNode;
  /** the basket page and the "added" message, rendered once */
  ui: ReactNode;
}

export function usePrintBasket({ config, problem, subTool, level, optionsFor, generate, onLoad }: Args): PrintBasketState {
  const key = `mt-print-basket:${config.pageTitle}`;
  const tabs = config.questionSheet?.tabs;
  const [basket, setBasketState] = useState<BasketItem[]>(() => loadBasket(key));
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; open: boolean } | null>(null);
  const setBasket = (next: BasketItem[]) => { setBasketState(next); saveBasket(key, next); };

  // the little message after adding or removing, which goes by itself
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  /** the question on screen as a recipe, or null when it cannot be saved (no seed, an exam question, a sub-tool without a sheet) */
  const recipe: BasketItem | null = (() => {
    const seed = (problem as { _seed?: number })._seed;
    if (typeof seed !== "number" || problem.exam || !tabs?.includes(subTool)) return null;
    // what tells this question from the others in the list: its size and time, then its limit or what it asks (the opening sentence is the same for all)
    const c = problem.cpa;
    const lv = c?.extra?.level, cut = c?.extra?.cut;
    const facts = c ? [`${c.acts.length} activities`, `${c.times.projectTime} ${c.unit}`, ...(lv ? [`limit ${lv.limit} workers`] : []), ...(cut ? [cut.ask === "fewest" ? "fewest workers" : cut.ask === "show" ? `show ${cut.target} is enough` : `can it be ${cut.target}?`, cut.given ? "histogram given" : "draw it first"] : [])] : [];
    return { tab: subTool, level, seed, options: optionsFor(subTool, level), preview: facts.length ? facts.join(" · ") : previewOf(problem.prompt) };
  })();
  const inBasket = !!recipe && hasItem(basket, recipe);

  const toggle = () => {
    if (!recipe) return;
    if (inBasket) { const next = removeItem(basket, recipe); setBasket(next); setToast({ text: `Removed from print basket (${next.length})`, open: false }); return; }
    if (basket.length >= BASKET_MAX) { setNote(`The basket holds ${BASKET_MAX} questions: remove one to add another.`); setOpen(true); return; }
    const next = addItem(basket, recipe);
    setBasket(next);
    setToast({ text: `Added to print basket (${next.length})`, open: true });
  };

  const print = async (mode: "questions" | "answers" | "both") => {
    if (!basket.length || busy || !config.questionSheet) return;
    const win = window.open("", "_blank");   // opened here, at the click, before the rebuilding below
    if (!win) { alert("Please allow popups to use the PDF export."); return; }
    const questions: CpaSheetInput[] = [], answers: CpaSheetInput[] = [];
    let skipped = 0;
    try {
      for (let k = 0; k < basket.length; k++) {
        setBusy(`Preparing question ${k + 1} of ${basket.length}…`);
        await new Promise((r) => setTimeout(r, 20));
        const it = basket[k];
        try {
          const pr = generateFromSeed(it.seed, () => generate(it.level, { subTool: it.tab, options: it.options }));
          if (mode !== "answers") questions.push(...((await config.questionSheet.build(pr, false)) ?? []));
          if (mode !== "questions") answers.push(...((await config.questionSheet.build(pr, true)) ?? []));
        } catch { skipped++; }
      }
      const sheets = [...questions, ...answers];
      if (!sheets.length) { win.close(); setNote("None of the saved questions could be rebuilt."); return; }
      printCpaSheets(sheets, win);
      setNote(skipped ? `${skipped} question${skipped > 1 ? "s" : ""} could not be rebuilt and ${skipped > 1 ? "were" : "was"} left out.` : null);
    } catch {
      win.close();
      setNote("Sorry, that could not be printed.");
    } finally { setBusy(null); }
  };

  /** bring a saved question back onto the page, exactly as it was drawn (same seed and options) */
  const reload = (it: BasketItem) => {
    try {
      const pr = generateFromSeed(it.seed, () => generate(it.level, { subTool: it.tab, options: it.options }));
      onLoad(it, pr);
      setOpen(false);
      setNote(null);
    } catch { setNote("That question could not be rebuilt."); }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?basket=${encodeBasket(basket)}`;
    try { await navigator.clipboard.writeText(url); setNote("Link copied. Open it on any device to get these questions."); } catch { window.prompt("Copy this link:", url); }
  };

  // a basket link opens the page: its questions join this device's basket and the basket is shown
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("basket");
    if (!code) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("basket");
    window.history.replaceState(null, "", url.toString());
    const incoming = decodeBasket(code)?.filter((i) => tabs?.includes(i.tab));
    if (!incoming?.length) { setNote("That basket link could not be read."); setOpen(true); return; }
    const next = mergeItems(basket, incoming);
    setBasket(next);
    setNote(`${next.length - basket.length} question${next.length - basket.length === 1 ? "" : "s"} added from the link.`);
    setOpen(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: runs once, when the page opens with a basket link

  const menuItems: PrintBasketState["menuItems"] = config.questionSheet ? [
    ...(recipe ? [{ label: inBasket ? "Remove from print basket" : "Add to print basket", hint: "Save this question to print later", onClick: toggle }] : []),
    { label: `Print basket (${basket.length})…`, hint: "Print the saved questions, or take them to another device", onClick: () => setOpen(true) },
  ] : [];

  const button = (size: "bar" | "phone" = "bar"): ReactNode => {
    if (!recipe) return null;
    const title = inBasket ? "In the print basket: remove it" : "Add this question to the print basket";
    const tone = inBasket ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-slate-200 text-blue-900 active:bg-slate-50";
    return (
      <button onClick={toggle} aria-label={title} aria-pressed={inBasket} title={title}
        className={`relative shrink-0 border rounded-xl flex items-center justify-center ${tone} ${size === "phone" ? "w-14 h-12" : "w-10 xl:w-11 h-10"}`}>
        <Printer size={size === "phone" ? 20 : 18} />
        {basket.length > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">{basket.length}</span>}
      </button>
    );
  };

  const ui = (
    <>
      {open && config.questionSheet && (
        <PrintBasket items={basket} tabLabel={(t) => config.subTools?.find((x) => x.key === t)?.label ?? t} busy={busy} note={note}
          onLoad={reload} onRemove={(i) => { setBasket(removeItem(basket, i)); setNote(null); }} onClear={() => { setBasket([]); setNote(null); }}
          onPrint={(m) => void print(m)} onCopyLink={() => void copyLink()} onClose={() => setOpen(false)} />
      )}
      {toast && (
        <div role="status" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 rounded-xl bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 shadow-lift">
          {toast.text}
          {toast.open && <button onClick={() => { setToast(null); setOpen(true); }} className="underline underline-offset-2 text-blue-200 hover:text-white">Open basket</button>}
        </div>
      )}
    </>
  );

  return { canSave: !!recipe, menuItems, button, ui };
}
