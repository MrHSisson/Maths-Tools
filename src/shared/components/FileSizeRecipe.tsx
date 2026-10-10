// Draws the File Sizes pictures: the recipe boxes, the doubling chain and the unit ladder. See shared/fileSizeRecipe.ts.

import { Fragment } from "react";
import type { QOSnapshot, WorkingStep } from "../types";
import type { FsChain, FsLadder, FsRecipe, FsVisual } from "../fileSizeRecipe";
import { UnitLadder } from "./UnitLadder";

/** Everything stops at MB: GB, TB and PB would only distract in a file-size question. */
const TOP_UNIT = 4;

export function FileSizeRecipe({ recipe }: { recipe: FsRecipe }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {recipe.title && <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{recipe.title}</div>}
      <div className="flex flex-wrap items-end justify-center gap-x-1.5 gap-y-2">
        {recipe.slots.map((s, i) => {
          const last = i === recipe.slots.length - 1;
          const filled = s.value !== "";
          const tone = s.unknown ? "border-amber-500 bg-amber-50 text-amber-700"
            : !filled ? "border-dashed border-slate-300 bg-white text-transparent"
            : s.fresh ? "border-emerald-500 bg-emerald-50 text-emerald-800"
            : last ? "border-blue-900 bg-blue-50 text-blue-950"
            : "border-slate-300 bg-white text-slate-900";
          return (
            <Fragment key={i}>
              {i > 0 && <span className="pb-2 text-xl font-bold text-slate-500">{recipe.ops[i - 1]}</span>}
              <div className="flex flex-col items-center">
                <div className="mb-0.5 max-w-[6rem] text-center text-[11px] font-semibold leading-tight text-slate-500">{s.label}</div>
                <div className={`flex h-11 min-w-[3.6rem] items-center justify-center whitespace-nowrap rounded-lg border-2 px-2 text-base font-bold transition-colors ${tone}`}>
                  {s.unknown ? "?" : s.value || "0"}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

/** 1 bit → 2 colours, 2 bits → 4 …, the row that first reaches the target colour count ringed. */
export function ColourChain({ chain }: { chain: FsChain }) {
  return (
    <div className="mx-auto flex w-56 flex-col items-stretch gap-1 select-none">
      <div className="mb-0.5 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Each extra bit doubles the colours</div>
      {chain.n.map((n, i) => {
        const shown = i < chain.shown;
        const ringed = chain.mark === i;
        return (
          <div key={n} className={`flex items-center justify-between rounded-lg border-2 px-3 py-0.5 text-base font-bold ${ringed ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700"}`}
            style={{ opacity: shown ? 1 : 0.15, transition: "opacity 0.25s ease" }}>
            <span>{n} {n === 1 ? "bit" : "bits"}</span><span className="text-slate-400">→</span><span>{(2 ** n).toLocaleString("en-GB")} colours</span>
          </div>
        );
      })}
      {chain.need !== undefined && <div className="mt-0.5 text-center text-sm font-semibold text-amber-700">Need at least {chain.need.toLocaleString("en-GB")} colours</div>}
    </div>
  );
}

export function FileSizeVisual({ visual, ladderOn = true, ladderRelevantOnly = false }: { visual: FsVisual; ladderOn?: boolean; ladderRelevantOnly?: boolean }) {
  const lad: FsLadder | undefined = ladderOn ? visual.ladder : undefined;
  return (
    <div className="flex flex-col items-center gap-3">
      {visual.recipes.map((r, i) => <FileSizeRecipe key={i} recipe={r} />)}
      {visual.chain && <ColourChain chain={visual.chain} />}
      {lad && <UnitLadder a={lad.a} b={lad.b} showAnswer={false} relevantOnly={ladderRelevantOnly} reach={lad.reach} maxUnit={TOP_UNIT} />}
    </div>
  );
}

/** `stepVisualRenderer` for `fsStep` tools: the recipe / chain / ladder snapshot. Null for any other step. */
export const fileSizeStepVisual = (step: WorkingStep, _colorScheme?: string, qo?: QOSnapshot): JSX.Element | null => {
  const extra = step.extra as { kind?: string; visual?: FsVisual } | undefined;
  if (extra?.kind !== "fileSizeSnapshot" || !extra.visual) return null;
  // the step picture draws only the units the walk uses — bigger, and nothing to distract (the whiteboard scaffold draws them all)
  return <FileSizeVisual visual={extra.visual} ladderOn={qo?.variables?.scaffoldLadder !== false} ladderRelevantOnly />;
};
