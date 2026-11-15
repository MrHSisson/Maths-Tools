import {
  ToolShell, getQuestionBg, FitWidth,
  type ToolConfig, type ToolMultiSelect, type ToolVariable, type DifficultyLevel, type AnyQuestion, type WordedQuestion, type WorkingStep,
  pick, randInt, gcdAll,
} from "../../shared";
import { applyAbout } from "../../shared";
import { ABOUT } from "./RatioSharingTool.about";
import {
  buildSharing, buildKnown, buildDifference, fa, QUANTITY_CONTEXTS,
  type ContextId,
} from "./ratioSharing";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "sharing" | "known" | "difference" | "mixed";
type Vars = Record<string, boolean>;
type Msv = Record<string, boolean>;

// ── 2. Number helpers ─────────────────────────────────────────────────────────

const NAMES = ["Alice","Ben","Charlie","Diana","Emma","Finn","Grace","Harry","Isla","Jack","Kate","Liam","Mia","Noah","Olivia","Peter"];
const someNames = (n: number): string[] => [...NAMES].sort(() => Math.random() - 0.5).slice(0, n);

/** `n` different parts in lowest terms (no common factor across them all), or null when the draw fails. */
const drawParts = (n: number, lo: number, hi: number, sumLo: number, sumHi: number): number[] | null => {
  const p = Array.from({ length: n }, () => randInt(lo, hi));
  if (new Set(p).size < n || gcdAll(p) !== 1) return null;
  const s = p.reduce((a, b) => a + b, 0);
  return s < sumLo || s > sumHi ? null : p;
};

/** Part ranges for the known-share and difference questions (and the three-part sharing questions): [lo, hi, sumLo, sumHi]. */
const KD_RANGE: Record<DifficultyLevel, Record<2 | 3, [number, number, number, number]>> = {
  level1: { 2: [1, 6, 2, 7], 3: [1, 5, 6, 10] },
  level2: { 2: [1, 11, 5, 12], 3: [1, 8, 8, 16] },
  level3: { 2: [2, 12, 10, 20], 3: [2, 9, 12, 24] },
};
/** The total shared must fall in this range for known-share and difference questions. */
const KD_TOTAL: Record<DifficultyLevel, [number, number]> = { level1: [2, 64], level2: [60, 144], level3: [40, 600] };

// ── 3. Pools, switches and Question Options ───────────────────────────────────

const SHARE_OPTIONS = [
  { value: "personA", label: "Person A", defaultActive: true },
  { value: "personB", label: "Person B", defaultActive: true },
  { value: "personC", label: "Person C", defaultActive: true, requires: ["three"] },
  { value: "both",    label: "All Shares", defaultActive: true },
];

const KNOWN_OPTIONS = [
  { value: "total", label: "Total",        defaultActive: true },
  { value: "other", label: "Other person", defaultActive: true },
];

const DIFF_OPTIONS = [
  { value: "total",   label: "Total",    defaultActive: true },
  { value: "personA", label: "Person A", defaultActive: true },
  { value: "personB", label: "Person B", defaultActive: true },
  { value: "personC", label: "Person C", defaultActive: true, requires: ["three"] },
];

const MIXED_OPTIONS = [
  { value: "sharing",    label: "Sharing",    defaultActive: true },
  { value: "known",      label: "Known",      defaultActive: true },
  { value: "difference", label: "Difference", defaultActive: true },
];

const PARTS_POOL: ToolMultiSelect = {
  key: "partCount", tab: "questions", label: "Parts in the Ratio",
  options: [
    { value: "two",   label: "Two Parts",   defaultActive: true },
    { value: "three", label: "Three Parts", defaultActive: false },
  ],
};
const CONTEXT_POOL: ToolMultiSelect = {
  key: "context", tab: "display", label: "Contexts",
  options: [
    { value: "money",      label: "Money",      defaultActive: true },
    { value: "quantities", label: "Quantities", defaultActive: false },
  ],
};

const NUMERICAL_VAR: ToolVariable = { key: "numerical", tab: "method", label: "Numerical method", displayOnly: true, defaultValue: false };
const CHECK_VAR: ToolVariable = { key: "showCheck", tab: "method", label: "Check answer", displayOnly: true, defaultValue: false };
const UNSIMPLIFIED_VAR: ToolVariable = { key: "unsimplified", tab: "numbers", label: "Unsimplified ratios*", defaultValue: false };

const askPool = (key: string, label: string, options: { value: string; label: string; defaultActive: boolean; requires?: string[] }[]): ToolMultiSelect =>
  ({ key, tab: "questions", label, options });

const pools = (ask: ToolMultiSelect): ToolMultiSelect[] => [ask, PARTS_POOL, CONTEXT_POOL];

const entry = (name: string, ask: ToolMultiSelect) => ({
  name,
  variables: [NUMERICAL_VAR, CHECK_VAR, UNSIMPLIFIED_VAR],
  dropdown: null,
  multiSelect: pools(ask),
  // Level 3 always uses the numerical method, so its switch goes
  difficultySettings: { level3: { variables: [CHECK_VAR, UNSIMPLIFIED_VAR] } },
});

// ── 4. TOOL_CONFIG ────────────────────────────────────────────────────────────

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Ratio Sharing",
  tools: {
    sharing:    entry("Sharing in a Ratio", askPool("shareType", "Ask for", SHARE_OPTIONS)),
    known:      entry("Known Amounts",      askPool("knownType", "Ask for", KNOWN_OPTIONS)),
    difference: entry("Given Difference",   askPool("diffType",  "Ask for", DIFF_OPTIONS)),
    mixed:      entry("Mixed",              askPool("mixedPool", "Include", MIXED_OPTIONS)),
  },
};

// ── 5. What the options say about this question ───────────────────────────────

/** Three parts only when ticked (an unticked option is `false`, but an absent one must not switch it on). */
const partCount = (msv: Msv): 2 | 3 => {
  const three = msv["three"] === true, two = msv["two"] !== false;
  return three && (!two || Math.random() < 0.5) ? 3 : 2;
};
const pickContext = (msv: Msv): ContextId => {
  const q = msv["quantities"] === true, m = msv["money"] !== false;
  return q && (!m || Math.random() < 0.5) ? pick(QUANTITY_CONTEXTS) : "money";
};
/** One ask from a pool, ignoring Person C unless the ratio has three parts. */
const pickAsk = (msv: Msv, options: { value: string }[], n: number): string => {
  const ok = options.filter((o) => msv[o.value] !== false && (n === 3 || o.value !== "personC"));
  return (ok.length ? pick(ok) : options[0]).value;
};
const personIndex = (v: string): number => ({ personA: 0, personB: 1, personC: 2 }[v] ?? 0);

/** The ratio as shown when "Unsimplified ratios" is on: every part multiplied by 2 or 3 (null when off). */
const unsimplify = (parts: number[], on: boolean): number[] | undefined => {
  if (!on) return undefined;
  const k = pick([2, 3]);
  return parts.map((p) => p * k);
};

// ── 6. Sharing generator ──────────────────────────────────────────────────────

const generateSharingQuestion = (level: DifficultyLevel, askValue: string | null, variables: Vars, msv: Msv): WordedQuestion => {
  const useBar = level !== "level3" && !(variables["numerical"] ?? false);
  const check = variables["showCheck"] ?? false;
  const n = partCount(msv);
  const ctx = pickContext(msv);
  const money = ctx === "money";

  for (let att = 0; att < 400; att++) {
    const names = someNames(n);
    let parts: number[] = [];
    let partValue = 0;

    if (n === 2) {
      if (level === "level1") {
        parts = pick([[1,2],[1,3],[1,4],[1,5],[1,6],[2,3],[2,5],[3,4]]);
        if (Math.random() < 0.5) parts = [parts[1], parts[0]];
        partValue = randInt(2, 12);
        if ((parts[0] + parts[1]) * partValue > 64) continue;
      } else if (level === "level2") {
        const a = randInt(1, 11), b = randInt(1, 11);
        if (gcdAll([a, b]) !== 1 || a === b) continue;
        parts = [a, b];
        const rs = a + b;
        if (rs < 5 || rs > 12) continue;
        partValue = randInt(2, 12);
        if (Math.max(a, b) * partValue > 144) continue;
        if (rs * partValue < 60) continue;
      } else {
        const a = randInt(3, 9), b = randInt(3, 9);
        if (gcdAll([a, b]) !== 1 || a === b) continue;
        parts = [a, b];
        const rs = a + b;
        if (rs < 8 || rs > 25) continue;
        partValue = money && Math.random() >= 0.7 ? randInt(10, 30) + 0.5 : randInt(10, 30);
      }
    } else {
      const [lo, hi, sLo, sHi] = KD_RANGE[level][3];
      const p = drawParts(3, lo, hi, sLo, sHi);
      if (!p) continue;
      parts = p;
      const rs = p[0] + p[1] + p[2];
      if (level === "level1") {
        partValue = randInt(2, 12);
        if (rs * partValue > 64) continue;
      } else if (level === "level2") {
        partValue = randInt(2, 12);
        if (rs * partValue < 60 || Math.max(...p) * partValue > 144) continue;
      } else {
        partValue = money && Math.random() >= 0.7 ? randInt(10, 30) + 0.5 : randInt(10, 30);
      }
    }

    const total = parts.reduce((a, b) => a + b, 0) * partValue;
    if (total < 10 || total > 500) continue;
    const display = unsimplify(parts, variables["unsimplified"] ?? false);
    const ask = askValue ?? pickAsk(msv, SHARE_OPTIONS, n);
    return buildSharing({ names, parts, partValue, ctx, display, bar: useBar, check, level, ask: ask === "both" ? "both" : personIndex(ask) });
  }
  return buildSharing({ names: someNames(2), parts: [1, 2], partValue: 30, bar: useBar, check, level, ask: "both" });
};

// ── 7. Known Amounts generator ────────────────────────────────────────────────

const generateKnownAmountsQuestion = (level: DifficultyLevel, askValue: string | null, variables: Vars, msv: Msv): WordedQuestion => {
  const useBar = level !== "level3" && !(variables["numerical"] ?? false);
  const check = variables["showCheck"] ?? false;
  const n = partCount(msv);
  const ctx = pickContext(msv);

  for (let att = 0; att < 400; att++) {
    const names = someNames(n);
    const [lo, hi, sLo, sHi] = KD_RANGE[level][n];
    const parts = drawParts(n, lo, hi, sLo, sHi);
    if (!parts) continue;
    const rs = parts.reduce((a, b) => a + b, 0);
    const [tLo, tHi] = KD_TOTAL[level];
    const pLo = Math.ceil(tLo / rs), pHi = Math.floor(tHi / rs);
    if (pLo > pHi) continue;
    const partValue = randInt(pLo, pHi);
    const known = randInt(0, n - 1);
    const knownAmount = parts[known] * partValue;
    if (knownAmount < 1 || knownAmount > 400) continue;
    const ask = askValue ?? pickAsk(msv, KNOWN_OPTIONS, n);
    let other = 0;
    if (ask === "other") {
      const others = parts.map((_, i) => i).filter((i) => i !== known);
      other = pick(others);
    }
    return buildKnown({
      names, parts, partValue, ctx, display: unsimplify(parts, variables["unsimplified"] ?? false), bar: useBar, check, level,
      known, ask: ask === "total" ? "total" : other,
    });
  }
  return buildKnown({ names: someNames(2), parts: [2, 3], partValue: 20, bar: useBar, check, level, known: 0, ask: "total" });
};

// ── 8. Given Difference generator ─────────────────────────────────────────────

const generateDifferenceQuestion = (level: DifficultyLevel, askValue: string | null, variables: Vars, msv: Msv): WordedQuestion => {
  const useBar = level !== "level3" && !(variables["numerical"] ?? false);
  const check = variables["showCheck"] ?? false;
  const n = partCount(msv);
  const ctx = pickContext(msv);

  for (let att = 0; att < 400; att++) {
    const names = someNames(n);
    const [lo, hi, sLo, sHi] = KD_RANGE[level][n];
    const parts = drawParts(n, lo, hi, sLo, sHi);
    if (!parts) continue;
    const rs = parts.reduce((a, b) => a + b, 0);
    const [tLo, tHi] = KD_TOTAL[level];
    const pLo = Math.ceil(tLo / rs), pHi = Math.floor(tHi / rs);
    if (pLo > pHi) continue;
    const partValue = randInt(pLo, pHi);
    let a = 0, b = 1;
    if (n === 3) {
      a = randInt(0, 2);
      b = pick([0, 1, 2].filter((i) => i !== a));
    }
    const ask = askValue ?? pickAsk(msv, DIFF_OPTIONS, n);
    return buildDifference({
      names, parts, partValue, ctx, display: unsimplify(parts, variables["unsimplified"] ?? false), bar: useBar, check, level,
      a, b, style: pick([1, 2, 3] as const), ask: ask === "total" ? "total" : personIndex(ask),
    });
  }
  return buildDifference({ names: someNames(2), parts: [2, 3], partValue: 20, bar: useBar, check, level, a: 0, b: 1, style: 3, ask: "total" });
};

// ── 9. Mixed generator ────────────────────────────────────────────────────────

const generateMixedQuestion = (level: DifficultyLevel, variables: Vars, msv: Msv): WordedQuestion => {
  const kind = pick(MIXED_OPTIONS.filter((o) => msv[o.value] !== false)).value;
  if (kind === "sharing") return generateSharingQuestion(level, null, variables, msv);
  if (kind === "known") return generateKnownAmountsQuestion(level, null, variables, msv);
  return generateDifferenceQuestion(level, null, variables, msv);
};

// ── 10. generateQuestion ──────────────────────────────────────────────────────

// The ask is drawn inside each generator (it depends on the number of parts), from its own pool.
const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;
  if (t === "sharing")    return generateSharingQuestion(level, null, variables, multiSelectValues);
  if (t === "known")      return generateKnownAmountsQuestion(level, null, variables, multiSelectValues);
  if (t === "difference") return generateDifferenceQuestion(level, null, variables, multiSelectValues);
  return generateMixedQuestion(level, variables, multiSelectValues);
};

// ── 11. Bar colour helpers ────────────────────────────────────────────────────

const getBarEmptyBg = (cs: string) => getQuestionBg(cs);
const getBarKnownBg = (cs: string) => ({ blue: "#7eb8e0", pink: "#e07eb8", yellow: "#e0e07e" }[cs] ?? "#93c5fd");
const getBarDiffBg  = (cs: string) => ({ blue: "#d8b4fe", pink: "#fed8b4", yellow: "#b4fed8" }[cs] ?? "#e9d5ff");

// ── 15. Bar component ─────────────────────────────────────────────────────────

const BOX_W = 52, BOX_H = 48, BOX_GAP = 3, NAME_W = 110;

const BarRow = ({ person, boxes, fillBg, borderColor, cellLabel, totalLabel }: {
  person: string; boxes: number;
  fillBg: string; borderColor: string;
  cellLabel?: string; totalLabel?: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="font-bold text-base text-right flex-shrink-0" style={{ width: NAME_W, color: "#000" }}>{person}</div>
    <div className="flex flex-shrink-0" style={{ gap: BOX_GAP }}>
      {Array.from({ length: boxes }, (_, bi) => (
        <div key={bi} className="flex items-center justify-center rounded"
          style={{ width: BOX_W, height: BOX_H, border: `3px solid ${borderColor}`, backgroundColor: fillBg, flexShrink: 0 }}>
          {cellLabel && (
            <span className="font-bold text-center leading-tight" style={{ color: "#000", fontSize: "0.7rem" }}>{cellLabel}</span>
          )}
        </div>
      ))}
    </div>
    {totalLabel && <span className="text-lg font-bold ml-2" style={{ color: "#000" }}>= {totalLabel}</span>}
  </div>
);

// ── 16. ratioStepRenderer ─────────────────────────────────────────────────────

type BarEntry = { person: string; boxes: number; isKnown?: boolean; knownAmount?: number | null; value?: number; total?: number };

// The bar model alone (no heading): the one picture the cascade keeps on screen and updates in place.
const barVisual = (step: WorkingStep): JSX.Element | null => {
  const d = (step.extra ?? {}) as Record<string, unknown>;
  const f = (n: number) => fa(d.ctx as string | undefined, n);
  // a box is small: a quantity shows its number only (the unit is in the question and the totals)
  const box = (n: number) => (d.ctx && d.ctx !== "money" ? String(n) : f(n));
  const bars = d.bars as BarEntry[] | undefined;
  if (!bars) return null;
  const T = step.type;
  if (T === "bar_empty") return (
    <div className="flex flex-col gap-3" style={{ width: "fit-content", margin: "0 auto" }}>
      {bars.map((bar, i) => <BarRow key={i} person={bar.person} boxes={bar.boxes} fillBg={getBarEmptyBg("default")} borderColor="#1e3a8a" />)}
    </div>
  );
  if (T === "bar_filled") return (
    <div className="flex flex-col gap-3" style={{ width: "fit-content", margin: "0 auto" }}>
      {bars.map((bar, i) => (
        <BarRow key={i} person={bar.person} boxes={bar.boxes} fillBg={getBarEmptyBg("default")} borderColor="#1e3a8a"
          cellLabel={bar.value !== undefined ? box(bar.value) : undefined}
          totalLabel={bar.total !== undefined ? f(bar.total) : undefined} />
      ))}
    </div>
  );
  if (T === "ka_bar_known") return (
    <div className="flex flex-col gap-3" style={{ width: "fit-content", margin: "0 auto" }}>
      {bars.map((bar, i) => (
        <BarRow key={i} person={bar.person} boxes={bar.boxes}
          fillBg={bar.isKnown ? getBarKnownBg("default") : getBarEmptyBg("default")} borderColor="#1e3a8a"
          totalLabel={bar.isKnown && bar.knownAmount != null ? f(bar.knownAmount) : undefined} />
      ))}
    </div>
  );
  if (T === "diff_bar") {
    const smallerCount = typeof d.smallerPerson === "number" ? bars[d.smallerPerson].boxes : Math.min(bars[0].boxes, bars[1].boxes);
    return (
      <div className="flex flex-col gap-3" style={{ width: "fit-content", margin: "0 auto" }}>
        {bars.map((bar, i) => {
          const isLarger = i === (d.largerPerson as number);
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="font-bold text-base text-right flex-shrink-0" style={{ width: NAME_W, color: "#000" }}>{bar.person}</div>
              <div className="flex flex-shrink-0" style={{ gap: BOX_GAP }}>
                {Array.from({ length: bar.boxes }, (_, bi) => {
                  const isDiff = isLarger && bi >= smallerCount;
                  return (
                    <div key={bi} className="rounded flex-shrink-0"
                      style={{ width: BOX_W, height: BOX_H, border: `3px solid ${isDiff ? "#a855f7" : "#1e3a8a"}`, backgroundColor: isDiff ? getBarDiffBg("default") : getBarEmptyBg("default") }} />
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-2 mt-1" style={{ marginLeft: NAME_W + 12 }}>
          <div className="rounded" style={{ width: Math.round(BOX_W * 0.55), height: Math.round(BOX_H * 0.55), border: "3px solid #a855f7", backgroundColor: getBarDiffBg("default"), flexShrink: 0 }} />
          <span className="text-base font-bold" style={{ color: "#000" }}>= {f(d.difference as number)}</span>
        </div>
      </div>
    );
  }
  return null;
};

const BAR_STEP_TYPES = new Set(["bar_empty", "bar_filled", "ka_bar_known", "diff_bar"]);

/** `stepVisualRenderer`: the bar model for a bar step; `false` for the other steps of this tool (they are
 *  caption-only — the bar stays on screen); `null` for anything else. */
const ratioStepVisual = (step: WorkingStep): JSX.Element | null | false => {
  if (!step.extra) return null;
  // FitWidth scales a long bar down to the screen (mobile) rather than overflowing the panel.
  return BAR_STEP_TYPES.has(step.type) ? <FitWidth>{barVisual(step)}</FitWidth> : false;
};

const ratioStepRenderer = (step: WorkingStep): JSX.Element | null => {
  if (!step.extra) return null;
  const d = step.extra as Record<string, unknown>;
  const f = (n: number) => fa(d.ctx as string | undefined, n);
  const T = step.type;
  const bars = d.bars as BarEntry[] | undefined;

  if (T === "simplify" || T.startsWith("check_")) return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>{T === "simplify" ? "Simplify the ratio:" : "Check:"}</h4>
      <div className="text-2xl font-medium" style={{ color: "#000" }}>{step.plain.replace(/^(Simplify the ratio first: |Check: )/, "")}</div>
    </div>
  );

  if (T === "bar_empty" && bars) return (
    <div>
      <h4 className="text-xl font-semibold mb-4 text-center" style={{ color: "#000" }}>Bar Model:</h4>
      {barVisual(step)}
    </div>
  );

  if (T === "bar_total") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Total parts:</h4>
      <div className="text-3xl font-medium" style={{ color: "#000" }}>{d.sum as number} parts</div>
    </div>
  );

  if (T === "bar_part") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Value of 1 part:</h4>
      <div className="text-3xl font-medium" style={{ color: "#000" }}>
        {f(d.total as number)} ÷ {d.sum as number} = {f(d.value as number)}
      </div>
    </div>
  );

  if (T === "bar_filled" && bars) return (
    <div>
      <h4 className="text-xl font-semibold mb-4 text-center" style={{ color: "#000" }}>Calculate shares:</h4>
      {barVisual(step)}
    </div>
  );

  if (T === "ka_bar_known" && bars) return (
    <div>
      <h4 className="text-xl font-semibold mb-4 text-center" style={{ color: "#000" }}>Bar Model — Given information:</h4>
      {barVisual(step)}
    </div>
  );

  if (T === "ka_identify") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Identify the ratio part:</h4>
      <div className="text-3xl font-bold" style={{ color: "#000" }}>
        {d.knownPerson as string} has {d.ratioPart as number} part{(d.ratioPart as number) !== 1 ? "s" : ""}
      </div>
    </div>
  );

  if (T === "ka_part_val") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Calculate value of 1 part:</h4>
      <div className="text-3xl font-bold" style={{ color: "#000" }}>
        {f(d.knownAmount as number)} ÷ {d.ratioPart as number} = {f(d.partValue as number)}
      </div>
    </div>
  );

  if (T === "ka_total_bar") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Add all parts to find total:</h4>
      <div className="text-3xl font-bold" style={{ color: "#000" }}>
        {(d.shares as number[]).map(s => f(s)).join(" + ")} = {f(d.total as number)}
      </div>
    </div>
  );

  if (T === "ka_other_bar") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Read {d.otherPerson as string}'s share from bar:</h4>
      <div className="text-3xl font-bold" style={{ color: "#000" }}>{f(d.share as number)}</div>
    </div>
  );

  if (T === "diff_bar" && bars) return (
    <div>
      <h4 className="text-xl font-semibold mb-4 text-center" style={{ color: "#000" }}>Bar Model — showing the difference:</h4>
      {barVisual(step)}
    </div>
  );

  if (T === "diff_identify") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>The difference represents:</h4>
      <div className="text-3xl font-bold" style={{ color: "#000" }}>
        {d.partDiff as number} part{(d.partDiff as number) !== 1 ? "s" : ""} = {f(d.difference as number)}
      </div>
    </div>
  );

  if (T === "diff_part_val") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Calculate value of 1 part:</h4>
      <div className="text-3xl font-bold" style={{ color: "#000" }}>
        {f(d.difference as number)} ÷ {d.partDiff as number} = {f(d.partValue as number)}
      </div>
    </div>
  );

  if (T === "diff_read") return (
    <div className="text-center">
      <h4 className="text-xl font-semibold mb-3" style={{ color: "#000" }}>Read {d.person as string}'s share from bar:</h4>
      <div className="text-3xl font-bold" style={{ color: "#000" }}>{f(d.share as number)}</div>
    </div>
  );

  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

applyAbout(TOOL_CONFIG, ABOUT);

export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      generateQuestion={generateQuestion}
      stepRenderer={ratioStepRenderer}
      stepVisualRenderer={ratioStepVisual}
      defaults={{ displayFontSize: 1, numQuestions: 5, numColumns: 2, maxColumns: 2 }}
    />
  );
}
