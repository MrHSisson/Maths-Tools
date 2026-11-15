import { useEffect, useState, type ReactNode } from "react";
import PrintBasket from "./PrintBasket";
import { printCpaSheets, type CpaSheetInput } from "./printCpa";
import { decodeBasket, encodeBasket, previewOf, type BasketItem } from "./printBasket";
import type { SavedItem } from "../savedLists";
import type { BasketAction, SavedApi } from "../questionKeeper";
import { generateFromSeed } from "../seededGenerate";
import type { PrintMode } from "../types";
import type { DecisionProblem, DecisionShellProps, GenerateContext } from "./types";

/** a tool can print saved questions when it has Critical-Path-style sheets, a skill worksheet or exam-style papers */
export const hasBasketPrint = (config: DecisionShellProps["config"]): boolean => !!(config.questionSheet || config.skillSheet || config.examSheet);

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
  /** print rebuilt exam-style and skill questions (the Worksheet's printer), into a window opened at the click */
  printProblems: (problems: DecisionProblem[], mode: PrintMode, win: Window) => Promise<void>;
}

interface PrintBasketState {
  /** items for the burger menu's "Printables" list */
  menuItems: { label: string; hint?: string; onClick: () => void }[];
  /** the basket as the saved-questions control (`PinButton`) offers it beside the pin */
  basket: BasketAction;
  /** the basket page, rendered once */
  ui: ReactNode;
}

export function usePrintBasket({ config, saved, generate, onLoad, printProblems }: Args): PrintBasketState {
  const tabs = config.questionSheet?.tabs;
  const basket = saved.items;
  const here = (i: SavedItem) => i.page === window.location.pathname;
  const sheetTab = (i: SavedItem) => !!tabs?.includes(i.tab);   // a question with a Critical-Path-style A4 sheet
  // printable: this tool's, and either that sheet or a paper / worksheet (exam-style and skill questions print through the Worksheet's printer)
  const printable = (i: SavedItem) => here(i) && (sheetTab(i) || !!config.skillSheet || !!config.examSheet);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const print = async (mode: "questions" | "answers" | "both") => {
    const toPrint = basket.filter(printable);
    if (!toPrint.length || busy || !hasBasketPrint(config)) { if (basket.length && !toPrint.length) setNote("None of the saved questions can be printed here: they are from other tools, or have no print sheet."); return; }
    // two kinds of page (a sheet, or a paper / worksheet) need two windows, and a window can only be opened here, at the click
    const withSheet = toPrint.some(sheetTab), withPaper = toPrint.some((i) => !sheetTab(i));
    const winSheet = withSheet ? window.open("", "_blank") : null;
    const winPaper = withPaper ? window.open("", "_blank") : null;
    if ((withSheet && !winSheet) || (withPaper && !winPaper)) { winSheet?.close(); winPaper?.close(); alert("Please allow popups to use the PDF export."); return; }
    const questions: CpaSheetInput[] = [], answers: CpaSheetInput[] = [], problems: DecisionProblem[] = [];
    let skipped = basket.length - toPrint.length;   // saved questions from another tool, or with no print route
    try {
      for (let k = 0; k < toPrint.length; k++) {
        setBusy(`Preparing question ${k + 1} of ${toPrint.length}…`);
        await new Promise((r) => setTimeout(r, 20));
        const it = toPrint[k];
        try {
          const pr = generateFromSeed(it.seed, () => generate(it.level, { subTool: it.tab, options: it.options }));
          if (sheetTab(it) && config.questionSheet) {
            if (mode !== "answers") questions.push(...((await config.questionSheet.build(pr, false)) ?? []));
            if (mode !== "questions") answers.push(...((await config.questionSheet.build(pr, true)) ?? []));
          } else problems.push(pr);
        } catch { skipped++; }
      }
      const sheets = [...questions, ...answers];
      if (winSheet) { if (sheets.length) printCpaSheets(sheets, winSheet); else winSheet.close(); }
      if (winPaper) { if (problems.length) await printProblems(problems, mode, winPaper); else winPaper.close(); }
      if (!sheets.length && !problems.length) { setNote("None of the saved questions could be rebuilt."); return; }
      setNote(skipped ? `${skipped} question${skipped > 1 ? "s" : ""} could not be printed (from another tool, no print route, or could not be rebuilt) and ${skipped > 1 ? "were" : "was"} left out.` : null);
    } catch {
      winSheet?.close(); winPaper?.close();
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

  const menuItems: PrintBasketState["menuItems"] = hasBasketPrint(config) ? [
    { label: `Print saved questions (${basket.length})…`, hint: "Print the saved questions, or take them to another device", onClick: () => setOpen(true) },
  ] : [];

  const ui = (
    open && hasBasketPrint(config) ? (
      <PrintBasket items={basket} label={(i) => (here(i) ? config.subTools?.find((x) => x.key === i.tab)?.label ?? i.tab : i.pageTitle)} printable={printable} here={here} busy={busy} note={note}
        onLoad={reload} onRemove={(i) => { saved.remove(i); setNote(null); }} onClear={() => { saved.clear(); setNote(null); }}
        onPrint={(m) => void print(m)} onCopyLink={() => void copyLink()} onClose={() => setOpen(false)} />
    ) : null
  );

  return { menuItems, basket: { count: basket.length, onOpen: () => setOpen(true) }, ui };
}
