import { useEffect, useState, type ReactNode } from "react";
import PrintBasket from "./PrintBasket";
import { printCpaSheets, type CpaSheetInput } from "./printCpa";
import { decodeBasket, encodeBasket, previewOf, type BasketItem } from "./printBasket";
import type { SavedItem } from "../savedLists";
import type { BasketAction, SavedApi } from "../questionKeeper";
import { generateFromSeed } from "../seededGenerate";
import type { DecisionProblem, DecisionShellProps, GenerateContext } from "./types";

// The print basket as the shell uses it: the page that prints the saved questions, the action the toolbar control offers and the menu item.
// The saved questions themselves live in the question keeper (the current named list, kept on the device and able to mix tools); a saved
// question is its recipe (tab, level, options, seed) — see printBasket.ts — so printing rebuilds it with `generate`. Only this tool's
// questions in a sub-tool with a printable sheet (`config.questionSheet.tabs`) can be printed; the rest can be reloaded but are left out.

/** The recipe for the question on screen, or null when it has no seed. `options` are the options as the generator receives them for this sub-tool and level. */
export function decisionRecipe(problem: DecisionProblem, tab: string, level: number, options: Record<string, string>): BasketItem | null {
  const seed = (problem as { _seed?: number })._seed;
  if (typeof seed !== "number") return null;
  // what tells this question from the others in the list: its size and time, then its limit or what it asks (the opening sentence is the same for all)
  const c = problem.cpa;
  const lv = c?.extra?.level, cut = c?.extra?.cut;
  const facts = c ? [`${c.acts.length} activities`, `${c.times.projectTime} ${c.unit}`, ...(lv ? [`limit ${lv.limit} workers`] : []), ...(cut ? [cut.ask === "fewest" ? "fewest workers" : cut.ask === "show" ? `show ${cut.target} is enough` : `show ${cut.target} is not enough`, cut.given ? "histogram given" : "draw it first"] : [])] : [];
  return { tab, level, seed, options, preview: facts.length ? facts.join(" · ") : previewOf(problem.exam ? problem.exam.intro : problem.prompt) };
}

interface Args {
  config: DecisionShellProps["config"];
  /** the current saved list, from the question keeper */
  saved: SavedApi;
  generate: (level: number, ctx?: GenerateContext) => DecisionProblem;
  /** a saved question brought back onto the page (the shell takes on its sub-tool, level and options and shows the rebuilt problem) */
  onLoad: (item: SavedItem) => void;
}

interface PrintBasketState {
  /** items for the burger menu's "Printables" list */
  menuItems: { label: string; hint?: string; onClick: () => void }[];
  /** the basket as the saved-questions control (`PinButton`) offers it beside the pin */
  basket: BasketAction;
  /** the basket page, rendered once */
  ui: ReactNode;
}

export function usePrintBasket({ config, saved, generate, onLoad }: Args): PrintBasketState {
  const tabs = config.questionSheet?.tabs;
  const basket = saved.items;
  const here = (i: SavedItem) => i.page === window.location.pathname;
  const printable = (i: SavedItem) => here(i) && !!tabs?.includes(i.tab);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const print = async (mode: "questions" | "answers" | "both") => {
    const toPrint = basket.filter(printable);
    if (!toPrint.length || busy || !config.questionSheet) { if (basket.length && !toPrint.length) setNote("None of the saved questions can be printed here: they are from other tools, or have no print sheet."); return; }
    const win = window.open("", "_blank");   // opened here, at the click, before the rebuilding below
    if (!win) { alert("Please allow popups to use the PDF export."); return; }
    const questions: CpaSheetInput[] = [], answers: CpaSheetInput[] = [];
    let skipped = basket.length - toPrint.length;   // saved questions with no print sheet, or from another tool
    try {
      for (let k = 0; k < toPrint.length; k++) {
        setBusy(`Preparing question ${k + 1} of ${toPrint.length}…`);
        await new Promise((r) => setTimeout(r, 20));
        const it = toPrint[k];
        try {
          const pr = generateFromSeed(it.seed, () => generate(it.level, { subTool: it.tab, options: it.options }));
          if (mode !== "answers") questions.push(...((await config.questionSheet.build(pr, false)) ?? []));
          if (mode !== "questions") answers.push(...((await config.questionSheet.build(pr, true)) ?? []));
        } catch { skipped++; }
      }
      const sheets = [...questions, ...answers];
      if (!sheets.length) { win.close(); setNote("None of the saved questions could be rebuilt."); return; }
      printCpaSheets(sheets, win);
      setNote(skipped ? `${skipped} question${skipped > 1 ? "s" : ""} could not be printed (from another tool, no print sheet, or could not be rebuilt) and ${skipped > 1 ? "were" : "was"} left out.` : null);
    } catch {
      win.close();
      setNote("Sorry, that could not be printed.");
    } finally { setBusy(null); }
  };

  /** bring a saved question back onto the page, exactly as it was drawn (same seed and options) */
  const reload = (it: SavedItem) => { setOpen(false); setNote(null); onLoad(it); };

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?basket=${encodeBasket(basket.filter(here))}`;
    try { await navigator.clipboard.writeText(url); setNote("Link copied. Open it on any device to get these questions."); } catch { window.prompt("Copy this link:", url); }
  };

  // a basket link opens the page: its questions join this device's basket and the basket is shown
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("basket");
    if (!code) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("basket");
    window.history.replaceState(null, "", url.toString());
    const incoming = decodeBasket(code)?.filter((i) => config.subTools?.some((x) => x.key === i.tab));
    if (!incoming?.length) { setNote("That link could not be read."); setOpen(true); return; }
    const added = saved.merge(incoming);
    setNote(`${added} question${added === 1 ? "" : "s"} added from the link.`);
    setOpen(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: runs once, when the page opens with a basket link

  const menuItems: PrintBasketState["menuItems"] = config.questionSheet ? [
    { label: `Print saved questions (${basket.length})…`, hint: "Print the saved questions, or take them to another device", onClick: () => setOpen(true) },
  ] : [];

  const ui = (
    open && config.questionSheet ? (
      <PrintBasket items={basket} label={(i) => (here(i) ? config.subTools?.find((x) => x.key === i.tab)?.label ?? i.tab : i.pageTitle)} printable={printable} here={here} busy={busy} note={note}
        onLoad={reload} onRemove={(i) => { saved.remove(i); setNote(null); }} onClear={() => { saved.clear(); setNote(null); }}
        onPrint={(m) => void print(m)} onCopyLink={() => void copyLink()} onClose={() => setOpen(false)} />
    ) : null
  );

  return { menuItems, basket: { count: basket.length, onOpen: () => setOpen(true) }, ui };
}
