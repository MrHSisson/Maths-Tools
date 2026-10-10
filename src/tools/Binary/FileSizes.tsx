import {
  ToolShell,
  type ToolConfig, type ToolVariable, type InfoSection, type DifficultyLevel, type AnyQuestion, type ToolMultiSelect, type WorkingStep,
  type FsRecipeDef, type FsVisual,
  mStep, randInt, weightOf, fmtT, unitName,
  recipeAt, fsStep, fileSizeStepVisual, FileSizeVisual,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════
//
// OCR J277 1.2.4 — file sizes. Spec: specs/file-sizes.md.
//
//   file size (bits) = number of things × bits per thing
//     text:   characters × bits per character
//     image:  pixels × colour depth
//     sound:  sample rate × duration × bit depth
//
// then walk the unit ladder (bits ÷ 8 → bytes ÷ 1000 → KB ÷ 1000 → MB; shared with Data Units). Every sum is exact: sizes are
// held as BigInt bits, and an answer in KB / MB is shown only when it is whole or one decimal place (BigInt tenths).
// The picture is the recipe boxes + the ladder (shared/fileSizeRecipe.ts); colour questions draw a doubling chain instead.

// ── 1. Units and exact arithmetic ─────────────────────────────────────────────

type UKey = "bits" | "bytes" | "KB" | "MB";
const UIDX: Record<UKey, number> = { bits: 0, bytes: 2, KB: 3, MB: 4 };       // positions on the shared ladder
const UNIT_BITS: Record<number, bigint> = { 0: 1n, 2: 8n, 3: 8_000n, 4: 8_000_000n };
const UNIT_WORD: Record<number, string> = { 0: "bits", 2: "bytes", 3: "KB", 4: "MB" };

type Sub = "text" | "images" | "sound";

/** Whole number → "4{,}000" inside KaTeX, "4,000" in prose. */
const K = (n: number | bigint): string => fmtT(BigInt(n) * 10n, "{,}");
const P = (n: number | bigint): string => fmtT(BigInt(n) * 10n);
const tK = (t: bigint): string => fmtT(t, "{,}");
const M = (n: number | bigint): string => `$${K(n)}$`;                         // inline maths in a worded line

/** `bits` in unit `u` as tenths, or null when it does not divide exactly. */
const tenthsIn = (bits: bigint, u: number): bigint | null => {
  const n = bits * 10n, d = UNIT_BITS[u];
  return n % d === 0n ? n / d : null;
};
/** An answer we are willing to show: bits / bytes whole; KB / MB whole or one decimal place; never zero. */
const sizeOk = (bits: bigint, u: number): boolean => {
  const t = tenthsIn(bits, u);
  return t !== null && t > 0n && (u <= 2 ? t % 10n === 0n : true);
};
/** A given size we are willing to show: whole in its own unit. */
const givenOk = (bits: bigint, u: number): boolean => {
  const t = tenthsIn(bits, u);
  return t !== null && t > 0n && t % 10n === 0n;
};

const pick = <T,>(a: readonly T[]): T => a[randInt(0, a.length - 1)];
const shuffled = <T,>(a: readonly T[]): T[] => [...a].sort(() => Math.random() - 0.5);
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n: number) => String(n).split("").map((d) => SUP[+d]).join("");
const an = (w: string) => (/^[aeiou]/i.test(w) ? "an" : "a");
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** No two consecutive questions share a context (module-level, per sub-tool). */
const lastContext: Partial<Record<Sub, string>> = {};
const pickContext = (sub: Sub, list: string[]): string => {
  let c = pick(list);
  for (let i = 0; i < 6 && c === lastContext[sub]; i++) c = pick(list);
  lastContext[sub] = c;
  return c;
};

// ── 2. Question options ───────────────────────────────────────────────────────

const LEVELS: DifficultyLevel[] = ["level1", "level2", "level3"];
const opt = (value: string, label: string, defaultActive: boolean, weight?: number) =>
  ({ value, label, defaultActive, ...(weight === undefined ? {} : { weight }) });

const SCAFFOLD_LADDER: ToolVariable = { key: "scaffoldLadder", label: "Scaffold: show the unit ladder", defaultValue: true };

const unitPool = (units: UKey[], label = "Answer in"): ToolMultiSelect => ({
  key: "answerUnit", label,
  options: units.map((u) => opt(u, u === "bits" ? "bits" : u === "bytes" ? "bytes" : u, true)),
});

// Text
const TEXT_TASK = (lv: DifficultyLevel): ToolMultiSelect | null => lv === "level1" ? null : {
  key: "task", label: "Question Types",
  options: [
    opt("findSize", "Find the file size", true, 0),
    opt("compareSets", "Compare ASCII and Unicode", true, 1),
    ...(lv === "level3" ? [opt("findChars", "Find the number of characters", true, 2), opt("findBits", "Find the bits per character", true, 2)] : []),
  ],
};
const TEXT_CHARS = (lv: DifficultyLevel): ToolMultiSelect | null => lv === "level1" ? null : {
  key: "characters", label: "Characters",
  options: [opt("given", "Number of characters given", true), opt("message", "A message to count (spaces and punctuation count)", true)],
};
const TEXT_UNIT = (lv: DifficultyLevel): ToolMultiSelect | null =>
  lv === "level1" ? null : unitPool(lv === "level2" ? ["bytes", "KB"] : ["KB", "MB"], "Answer in (or size given in)");

// Images
const IMG_TASK = (lv: DifficultyLevel): ToolMultiSelect => ({
  key: "task", label: "Question Types",
  options: lv === "level1"
    ? [opt("findSize", "Find the file size", true, 0), opt("coloursFromBits", "How many colours do n bits give?", true, 0)]
    : lv === "level2"
      ? [opt("findSize", "Find the file size", true, 0), opt("fewestBits", "Fewest bits for N colours", true, 1)]
      : [
          opt("findSize", "Find the file size", true, 0),
          opt("coloursFromBits", "How many colours do n bits give?", true, 0),
          opt("fewestBits", "Fewest bits for N colours", true, 1),
          opt("canStore", "Can n bits store N colours? (yes / no)", true, 2),
          opt("logo", "Colours given: fewest bits, then size", true, 2),
          opt("several", "Several identical images (total size)", true, 2),
          opt("findDepth", "Find the colour depth", true, 3),
          opt("findPixels", "Find the number of pixels / width", true, 3),
        ],
});
const IMG_COLOURS = (lv: DifficultyLevel): ToolMultiSelect | null => lv !== "level3" ? null : {
  key: "colours", label: "Numbers of colours (colour questions)",
  options: [opt("powers", "Powers of two (2, 4, 8, 16 …)", true), opt("notPowers", "Not powers of two (5, 9, 100 …)", true)],
};
const IMG_RES = (lv: DifficultyLevel): ToolMultiSelect | null => lv === "level2" ? null : {
  key: "resolution", label: "Resolution given as",
  options: [opt("wh", "Width × height", true), opt("pixels", "Total number of pixels", true)],
};
const IMG_UNIT = (lv: DifficultyLevel): ToolMultiSelect | null =>
  lv === "level1" ? null : unitPool(lv === "level2" ? ["bytes", "KB", "MB"] : ["KB", "MB"], "Answer in (or size given in)");

// Sound
const SND_TASK = (lv: DifficultyLevel): ToolMultiSelect | null => lv !== "level3" ? null : {
  key: "task", label: "Question Types",
  options: [
    opt("findSize", "Find the file size", true, 0),
    opt("compare", "Compare two recordings", true, 2),
    opt("findDuration", "Find the duration", true, 3),
    opt("findDepth", "Find the bit depth", true, 3),
    opt("findRate", "Find the sample rate", true, 3),
  ],
};
const SND_INPUTS = (lv: DifficultyLevel): ToolMultiSelect | null => lv !== "level3" ? null : {
  key: "inputs", label: "Units in the question",
  options: [opt("plain", "Hz and seconds", true), opt("convert", "kHz and minutes (convert first)", true)],
};
const SND_UNIT = (lv: DifficultyLevel): ToolMultiSelect | null =>
  lv === "level1" ? null : unitPool(lv === "level2" ? ["bytes", "KB"] : ["KB", "MB"], "Answer in (or size given in)");

type Pools = (lv: DifficultyLevel) => (ToolMultiSelect | null)[];
const levelSettings = (pools: Pools) =>
  Object.fromEntries(LEVELS.map((lv) => [lv, {
    dropdown: null,
    variables: lv === "level1" ? [] : [SCAFFOLD_LADDER],   // Level 1's answer is in bits: no ladder to hide
    multiSelect: pools(lv).filter((g): g is ToolMultiSelect => !!g),
  }]));

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "File Sizes",
  tools: {
    text: {
      name: "Text", instruction: "", variables: [], dropdown: null,
      difficultySettings: levelSettings((lv) => [TEXT_TASK(lv), TEXT_CHARS(lv), TEXT_UNIT(lv)]),
    },
    images: {
      name: "Images", instruction: "", variables: [], dropdown: null,
      difficultySettings: levelSettings((lv) => [IMG_TASK(lv), IMG_COLOURS(lv), IMG_RES(lv), IMG_UNIT(lv)]),
    },
    sound: {
      name: "Sound", instruction: "", variables: [], dropdown: null,
      difficultySettings: levelSettings((lv) => [SND_TASK(lv), SND_INPUTS(lv), SND_UNIT(lv)]),
    },
  },
};

// ── 3. INFO_SECTIONS ──────────────────────────────────────────────────────────

const TIP = { label: "Teacher tip", detail: "Mix levels in Differentiated mode for a class working on different parts of the calculation. All numbers are chosen to be doable without a calculator." };
const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Text", icon: "📝",
    content: [
      { label: "Overview", detail: "Characters × bits per character gives the size in bits. Bits per character is always given in the question." },
      { label: "Level 1 — Green", detail: "One multiplication, answer in bits." },
      { label: "Level 2 — Amber", detail: "Answer in bytes or KB, with optional counting of a message (spaces and punctuation count)." },
      { label: "Level 3 — Red", detail: "Comparing ASCII and Unicode, and working back to the characters or bits per character." },
      TIP,
    ],
  },
  {
    title: "Images", icon: "🖼️",
    content: [
      { label: "Overview", detail: "Width × height × colour depth gives the size in bits; then convert to bytes, KB or MB. Also colour depth: n bits give 2ⁿ colours, and the fewest bits for N colours is the smallest n where 2ⁿ is at least N." },
      { label: "Level 1 — Green", detail: "Small images in bits, and colours from bits." },
      { label: "Level 2 — Amber", detail: "Exam-size images in bytes, KB or MB (depth 8 bits makes bytes equal pixels), and the fewest bits for a power-of-two colour count." },
      { label: "Level 3 — Red", detail: "Colours that are not powers of two (the trap), colours given before the size, several images, and reverse questions." },
      TIP,
    ],
  },
  {
    title: "Sound", icon: "🔊",
    content: [
      { label: "Overview", detail: "Sample rate × duration × bit depth gives the size in bits; then convert to bytes, KB or MB." },
      { label: "Level 1 — Green", detail: "Small recordings, answer in bits." },
      { label: "Level 2 — Amber", detail: "Hz and seconds, answer in bytes or KB." },
      { label: "Level 3 — Red", detail: "kHz and minutes to convert, comparing recordings, and reverse questions." },
      TIP,
    ],
  },
  {
    title: "Question Options", icon: "⚙️",
    content: [
      { label: "Answer in", detail: "The unit of the answer. A KB or MB answer is always a whole number or one decimal place. In a reverse question (find the characters, depth, duration…) it is the unit the size is given in." },
      { label: "Scaffold (Whiteboard)", detail: "The working box shows the empty recipe — the boxes the numbers go in — and the unit ladder. Show Answer fills the boxes and lights the ladder. 'Scaffold: show the unit ladder' hides the ladder." },
      { label: "Worked Example", detail: "One picture updates beside the steps: the recipe boxes fill left to right, then the ladder lights each hop." },
    ],
  },
];

// ── 4. Plans: the working, with the picture each step carries ─────────────────

interface PlanStep { label: string; frags: string[]; unit?: string; reach?: number; chain?: { shown: number; mark?: number } }
interface Plan { steps: PlanStep[]; push: (label: string, frags: string[], unit?: string, extra?: Partial<PlanStep>) => number }
const newPlan = (): Plan => {
  const steps: PlanStep[] = [];
  return { steps, push: (label, frags, unit, extra) => { steps.push({ label, frags, unit, ...extra }); return steps.length - 1; } };
};

/** Bits → `u` on the ladder, one line per hop (÷ 8, then ÷ 1000 each). `prefix` names a set in a comparison. */
const upSteps = (plan: Plan, bits: bigint, u: number, prefix = ""): void => {
  if (u < 2) return;
  const bytesT = bits * 10n / 8n;
  plan.push(`${prefix}Bits to bytes (÷ 8):`, [K(bits), "\\div 8", `= ${tK(bytesT)}`], "bytes", { reach: 2 });
  if (u < 3) return;
  const kbT = tenthsIn(bits, 3)!;
  plan.push(`${prefix}Bytes to KB (÷ 1000):`, [tK(bytesT), "\\div 1000", `= ${tK(kbT)}`], "KB", { reach: 3 });
  if (u < 4) return;
  const mbT = tenthsIn(bits, 4)!;
  plan.push(`${prefix}KB to MB (÷ 1000):`, [tK(kbT), "\\div 1000", `= ${tK(mbT)}`], "MB", { reach: 4 });
};

/** A size given in unit `g` (whole) → bits, one line per hop (× 1000, then × 8). Returns the index of the last hop (or -1 if none). */
const downSteps = (plan: Plan, bits: bigint, g: number): number => {
  let last = -1;
  const bytes = bits / 8n;
  if (g >= 4) last = plan.push("MB to KB (× 1000):", [K(bits / 8_000_000n), "\\times 1000", `= ${K(bits / 8_000n)}`], "KB", { reach: 3 });
  if (g >= 3) last = plan.push("KB to bytes (× 1000):", [K(bits / 8_000n), "\\times 1000", `= ${K(bytes)}`], "bytes", { reach: 2 });
  if (g >= 2) last = plan.push("Bytes to bits (× 8):", [K(bytes), "\\times 8", `= ${K(bits)}`], "bits", { reach: 0 });
  return last;
};

interface Finish {
  sub: Sub; level: DifficultyLevel; task: string;
  lines: string[];
  plan: Plan;
  defs?: FsRecipeDef[];
  ladder?: { a: number; b: number };
  chain?: { n: number[]; need?: number };
  answerLatex: string; answerPlain: string; answerSuffix?: string;
  weight: number;
  check: Record<string, unknown>;
  keyParts: (string | number | bigint)[];
}

/** Assemble the question: add the Answer step, stamp every step with its picture, store the scaffold. */
const finish = (f: Finish): AnyQuestion => {
  const { plan } = f;
  plan.push("Answer:", [f.answerLatex], f.answerSuffix, { reach: f.ladder?.b, chain: f.chain ? { shown: f.chain.n.length, mark: f.chain.n.length - 1 } : undefined });
  let reach = f.ladder?.a ?? 0;
  let chain: { shown: number; mark?: number } | undefined;
  const working: WorkingStep[] = plan.steps.map((s, i) => {
    if (s.reach !== undefined) reach = s.reach;
    if (s.chain) chain = s.chain;
    const visual: FsVisual = {
      recipes: (f.defs ?? []).map((d) => recipeAt(d, i)),
      ladder: f.ladder ? { a: f.ladder.a, b: f.ladder.b, reach } : undefined,
      chain: f.chain && chain ? { n: f.chain.n, shown: chain.shown, mark: chain.mark, need: f.chain.need } : undefined,
    };
    const base = mStep(s.label, s.frags.length === 1 ? s.frags[0] : s.frags, s.unit);
    return fsStep(base, visual);
  });
  const id = randInt(0, 999999);
  const unitConv = plan.steps.filter((s) => /(Bits to bytes|Bytes to KB|KB to MB|MB to KB|KB to bytes|Bytes to bits)/.test(s.label)).length;
  return {
    kind: "worded",
    lines: f.lines,
    answer: f.answerPlain,
    answerLatex: f.answerLatex,
    ...(f.answerSuffix ? { answerSuffix: f.answerSuffix } : {}),
    working,
    key: `file-sizes-${f.sub}-${f.level}-${f.task}-${f.keyParts.join("-")}-${id}`,
    difficulty: f.level,
    _difficultyScore: f.weight,
    _fsScaffold: { defs: f.defs ?? [], ladder: f.ladder, chain: f.chain },
    _fsCheck: { sub: f.sub, task: f.task, ...f.check },
    _fsMeta: { steps: plan.steps.length - 1, unitConv },
  } as unknown as AnyQuestion;
};

/** A size answer: latex, plain text and suffix for unit `u` (bits → tenths of `u`). */
const sizeAnswer = (bits: bigint, u: number) => {
  const t = tenthsIn(bits, u)!;
  const unit = unitName(u, t);
  return { latex: tK(t), plain: `${fmtT(t)} ${unit}`, suffix: unit, tenths: t };
};
const countAnswer = (n: number, one: string, many: string) => ({ latex: K(n), plain: `${P(n)} ${n === 1 ? one : many}`, suffix: n === 1 ? one : many });

/** The active options of a pool (missing values fall back to the pool's own default). */
const active = (ms: Record<string, boolean>, g: ToolMultiSelect | null): string[] => {
  if (!g) return [];
  const on = g.options.filter((o) => (ms[o.value] ?? o.defaultActive)).map((o) => o.value);
  return on.length ? on : [g.options[0].value];
};
const taskOf = (ms: Record<string, boolean>, g: ToolMultiSelect | null, only: string): { task: string; weight: number } => {
  if (!g) return { task: only, weight: 0 };
  const task = pick(active(ms, g));
  return { task, weight: weightOf(g.options, task) };
};
/** Answer units in play, as ladder indexes that suit `bits`; `extra` adds units that may always be offered. */
const feasibleUnits = (ms: Record<string, boolean>, g: ToolMultiSelect | null, ok: (u: number) => boolean, extra: UKey[] = []): number[] =>
  shuffled([...new Set([...active(ms, g), ...extra])].map((u) => UIDX[u as UKey]).filter((u) => u !== undefined && ok(u)));

// ── 5. TEXT ───────────────────────────────────────────────────────────────────

const TEXT_CONTEXTS = ["text file", "message", "note", "caption", "password", "email", "poem"];
const MESSAGES = [
  "See you soon!", "Hello, world", "Thanks a lot.", "Call me back!", "Good morning, Sam", "Running late, sorry", "Happy birthday!",
  "Lunch at one?", "On my way now.", "Well done, team!", "Hi Mum, call me", "Dinner is ready", "Where are you?", "Good luck today!", "Please reply soon.",
];
const T_L1_CHARS = [10, 12, 15, 20, 24, 25, 30, 40, 50, 60, 100];
const T_L2_CHARS = [500, 1000, 2000, 2500, 4000, 5000, 8000, 10000];
const T_L3_CHARS = [3000, 5000, 6000, 8000, 10000, 20000, 50000];

const textRecipe = (chars: { v: string; at: number; unknown?: boolean }, bpc: { v: string; at: number; unknown?: boolean }, bits: { v: string; at: number }, title?: string): FsRecipeDef => ({
  title, ops: ["×", "="],
  slots: [
    { label: "characters", vals: [{ at: chars.at, v: chars.v }], unknown: chars.unknown },
    { label: "bits per character", vals: [{ at: bpc.at, v: bpc.v }], unknown: bpc.unknown },
    { label: "file size (bits)", vals: [{ at: bits.at, v: bits.v }] },
  ],
});

const buildText = (level: DifficultyLevel, ms: Record<string, boolean>): AnyQuestion | null => {
  const taskPool = TEXT_TASK(level), unitG = TEXT_UNIT(level), charsG = TEXT_CHARS(level);
  const { task, weight } = taskOf(ms, taskPool, "findSize");
  const sub: Sub = "text";

  if (task === "findSize") {
    const useMessage = level !== "level1" && active(ms, charsG).includes("message") && (!active(ms, charsG).includes("given") || Math.random() < 0.5);
    let chars: number, bpc: number, msg: string | null = null, units: number[];
    if (level === "level1") {
      chars = pick(T_L1_CHARS); bpc = pick([7, 8, 16]);
      if (BigInt(chars * bpc) >= 2000n) return null;
      units = [0];
    } else if (useMessage) {
      msg = pick(MESSAGES); chars = msg.length; bpc = pick([8, 8, 16]);
      units = feasibleUnits(ms, unitG, (u) => sizeOk(BigInt(chars * bpc), u)).filter((u) => u === 2);   // a short message is only sensible in bytes
    } else {
      chars = pick(level === "level2" ? T_L2_CHARS : T_L3_CHARS); bpc = pick([8, 8, 16, 7]);
      units = feasibleUnits(ms, unitG, (u) => sizeOk(BigInt(chars * bpc), u));
    }
    if (!units.length) return null;
    const u = units[0];
    const bits = BigInt(chars) * BigInt(bpc);
    const ans = sizeAnswer(bits, u);
    const plan = newPlan();
    if (msg) plan.push("Count the characters (spaces and punctuation count):", [K(chars)], "characters");
    const mult = plan.push("Characters × bits per character:", [K(chars), `\\times ${bpc}`, `= ${K(bits)}`], "bits", { reach: 0 });
    upSteps(plan, bits, u);
    const ctx = pickContext(sub, TEXT_CONTEXTS);
    const lines = msg
      ? [`Each character uses ${M(bpc)} bits.`, `How many ${UNIT_WORD[u]} is the message “$\\texttt{${msg.replace(/ /g, "\\ ")}}$”?`]
      : [`${cap(an(ctx))} ${ctx} has ${M(chars)} characters. Each character uses ${M(bpc)} bits.`, `Calculate the file size in ${UNIT_WORD[u]}.`];
    return finish({
      sub, level, task, lines, plan,
      defs: [textRecipe({ v: K(chars), at: 0 }, { v: String(bpc), at: 0 }, { v: K(bits), at: mult })],
      ladder: level === "level1" ? undefined : { a: 0, b: u },
      answerLatex: ans.latex, answerPlain: ans.plain, answerSuffix: ans.suffix, weight,
      check: { chars, bpc, bits, unit: u, ansT: ans.tenths, message: msg },
      keyParts: [msg ?? chars, bpc, u],
    });
  }

  if (task === "compareSets") {
    const chars = pick(level === "level2" ? T_L2_CHARS : T_L3_CHARS);
    const [b1, b2] = [8, 16];
    const bitsA = BigInt(chars * b1), bitsB = BigInt(chars * b2), diff = bitsB - bitsA;
    const units = feasibleUnits(ms, unitG, (u) => sizeOk(bitsA, u) && sizeOk(bitsB, u) && sizeOk(diff, u));
    if (!units.length) return null;
    const u = units[0];
    const ans = sizeAnswer(diff, u);
    const plan = newPlan();
    const m1 = plan.push("ASCII: characters × bits per character:", [K(chars), `\\times ${b1}`, `= ${K(bitsA)}`], "bits", { reach: 0 });
    upSteps(plan, bitsA, u, "ASCII: ");
    const m2 = plan.push("Unicode: characters × bits per character:", [K(chars), `\\times ${b2}`, `= ${K(bitsB)}`], "bits", { reach: 0 });
    upSteps(plan, bitsB, u, "Unicode: ");
    plan.push("Difference:", [tK(tenthsIn(bitsB, u)!), `- ${tK(tenthsIn(bitsA, u)!)}`, `= ${ans.latex}`], ans.suffix);
    const ctx = pickContext(sub, ["document", "essay", "report", "story"]);
    return finish({
      sub, level, task, plan,
      lines: [`${cap(an(ctx))} ${ctx} has ${M(chars)} characters.`, `In ASCII each character uses ${M(b1)} bits and in Unicode ${M(b2)} bits.`, `How many ${UNIT_WORD[u]} larger is the Unicode file?`],
      defs: [
        textRecipe({ v: K(chars), at: 0 }, { v: String(b1), at: 0 }, { v: K(bitsA), at: m1 }, "ASCII"),
        textRecipe({ v: K(chars), at: 0 }, { v: String(b2), at: 0 }, { v: K(bitsB), at: m2 }, "Unicode"),
      ],
      ladder: { a: 0, b: u },
      answerLatex: ans.latex, answerPlain: ans.plain, answerSuffix: ans.suffix, weight,
      check: { chars, bpcA: b1, bpcB: b2, bits: diff, unit: u, ansT: ans.tenths },
      keyParts: [chars, u],
    });
  }

  // reverse: findChars (size + bits per character → characters) / findBits (size + characters → bits per character)
  const chars = pick(T_L3_CHARS);
  const bpc = task === "findChars" ? pick([8, 8, 16]) : pick([7, 8, 16]);
  const bits = BigInt(chars) * BigInt(bpc);
  const gs = feasibleUnits(ms, unitG, (u) => givenOk(bits, u), ["bits"]);
  if (!gs.length) return null;
  const g = gs[0];
  const plan = newPlan();
  const conv = downSteps(plan, bits, g);
  const unknownChars = task === "findChars";
  const answer = unknownChars ? chars : bpc;
  const div = plan.push(unknownChars ? "Bits ÷ bits per character:" : "Bits ÷ characters:", [K(bits), `\\div ${unknownChars ? bpc : K(chars)}`, `= ${K(answer)}`], unknownChars ? "characters" : "bits", {});
  const ans = unknownChars ? countAnswer(chars, "character", "characters") : countAnswer(bpc, "bit", "bits");
  const sizeText = `${M(g === 0 ? bits : BigInt(tenthsIn(bits, g)! / 10n))} ${UNIT_WORD[g]}`;
  const lines = unknownChars
    ? [`A text file is ${sizeText}. Each character uses ${M(bpc)} bits.`, "How many characters does it contain?"]
    : [`A file of ${M(chars)} characters is ${sizeText}.`, "How many bits does each character use?"];
  const bitsAt = Math.max(conv, 0);
  return finish({
    sub, level, task, plan, lines,
    defs: [textRecipe(
      { v: K(chars), at: unknownChars ? div : 0, unknown: unknownChars },
      { v: String(bpc), at: unknownChars ? 0 : div, unknown: !unknownChars },
      { v: K(bits), at: bitsAt },
    )],
    ladder: g > 0 ? { a: g, b: 0 } : undefined,
    answerLatex: ans.latex, answerPlain: ans.plain, answerSuffix: ans.suffix, weight,
    check: { chars, bpc, bits, given: g, answer },
    keyParts: [chars, bpc, g],
  });
};

// ── 6. IMAGES ─────────────────────────────────────────────────────────────────

const I_L1_SIDES = [4, 5, 8, 10, 16, 20, 25, 30, 32];
const I_L1_PIXELS = [100, 200, 400, 640];
const I_L2_RES: [number, number][] = [[600, 400], [640, 480], [800, 600], [1000, 500], [300, 200], [400, 250], [500, 400], [1000, 1000], [1200, 800]];
const I_L3_PIXELS = [20000, 60000, 120000, 240000, 480000, 1000000];
const I_CONTEXTS_1 = ["image", "icon", "logo", "sprite", "emoji"];
const I_CONTEXTS_2 = ["image", "photo", "screenshot", "poster", "drawing"];
const POW2 = [2, 4, 8, 16, 32, 64, 128, 256];
const NOT_POW2 = [3, 5, 6, 9, 10, 17, 30, 100, 200];
const LOGO_SIZES: [number, number][] = [[8, 4], [6, 5], [10, 4], [5, 5], [8, 8], [4, 3], [10, 6]];

/** Fewest bits for N colours: the smallest n with 2ⁿ ≥ N. */
const fewestBits = (colours: number): number => { let n = 1; while (2 ** n < colours) n++; return n; };
const chainRows = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);

/** [pixels × depth = size]; the pixels box shows "W × H" first and then the product when `pxAt` is reached. */
const imageRecipe = (px: { wh?: string; v: string; at: number }, depth: { v: string; at: number; unknown?: boolean }, bits: { v: string; at: number }, count?: { v: string }): FsRecipeDef => ({
  ops: count ? ["×", "×", "="] : ["×", "="],
  slots: [
    { label: "pixels", vals: px.wh ? [{ at: 0, v: px.wh }, { at: px.at, v: px.v }] : [{ at: px.at, v: px.v }] },
    { label: "colour depth (bits)", vals: [{ at: depth.at, v: depth.v }], unknown: depth.unknown },
    ...(count ? [{ label: "images", vals: [{ at: 0, v: count.v }] }] : []),
    { label: "file size (bits)", vals: [{ at: bits.at, v: bits.v }] },
  ],
});

/** Colours given → bits per pixel, as two lines; returns the index of the line that states n. */
const coloursToBitsSteps = (plan: Plan, colours: number, chainShown = chainRows(fewestBits(colours)).length): number => {
  const n = fewestBits(colours), prev = 2 ** (n - 1);
  plan.push("Powers of two:", [`2^{${n - 1}} = ${prev}`, `,\\ 2^{${n}} = ${2 ** n}`], undefined, { chain: { shown: chainShown } });
  const exact = 2 ** n === colours;
  return plan.push(exact ? `${colours} is exactly 2${sup(n)}:` : `${prev} is less than ${colours}, but ${2 ** n} is at least ${colours}:`, [`n = ${n}`], "bits per pixel", { chain: { shown: chainShown, mark: n - 1 } });
};

const buildImages = (level: DifficultyLevel, ms: Record<string, boolean>): AnyQuestion | null => {
  const taskG = IMG_TASK(level), colG = IMG_COLOURS(level), resG = IMG_RES(level), unitG = IMG_UNIT(level);
  const { task, weight } = taskOf(ms, taskG, "findSize");
  const sub: Sub = "images";
  const tasksOn = active(ms, taskG);
  const ctx = pickContext(sub, level === "level1" ? I_CONTEXTS_1 : I_CONTEXTS_2);
  const colourSets = level === "level3" ? active(ms, colG) : ["powers"];
  const colourPool = (): number[] => [...(colourSets.includes("powers") ? POW2 : []), ...(colourSets.includes("notPowers") ? NOT_POW2 : [])];

  // ── colour questions (a chain, no recipe)
  if (task === "coloursFromBits") {
    const alone = tasksOn.length === 1;
    const n = pick(alone ? [1, 2, 3, 4, 5, 6, 7, 8, 10] : [1, 2, 3, 4, 5, 6, 8]);
    const colours = 2 ** n;
    const plan = newPlan();
    plan.push("Colours = 2ⁿ:", [`2^{${n}}`, `= ${K(colours)}`], "colours", { chain: { shown: n, mark: n - 1 } });
    const lines = Math.random() < 0.5
      ? [`How many colours can ${M(n)} ${n === 1 ? "bit" : "bits"} store?`]
      : [`${cap(an(ctx))} ${ctx} has a colour depth of ${M(n)} ${n === 1 ? "bit" : "bits"}.`, "How many different colours can it use?"];
    const ans = countAnswer(colours, "colour", "colours");
    return finish({ sub, level, task, plan, lines, chain: { n: chainRows(n) }, answerLatex: ans.latex, answerPlain: ans.plain, answerSuffix: ans.suffix, weight, check: { n, colours }, keyParts: [n] });
  }
  if (task === "fewestBits") {
    const pool = colourPool();
    const colours = pick(level === "level2" ? POW2 : pool);
    const n = fewestBits(colours);
    const plan = newPlan();
    coloursToBitsSteps(plan, colours);
    const ans = countAnswer(n, "bit", "bits");
    return finish({
      sub, level, task, plan,
      lines: [`${cap(an(ctx))} ${ctx} uses ${M(colours)} colours.`, "State the fewest bits needed for each pixel."],
      chain: { n: chainRows(n), need: colours }, answerLatex: ans.latex, answerPlain: ans.plain, answerSuffix: ans.suffix, weight,
      check: { colours, n }, keyParts: [colours],
    });
  }
  if (task === "canStore") {
    const colours = pick(colourPool());
    const need = fewestBits(colours);
    const bitsGiven = Math.random() < 0.5 ? need : need - 1;
    if (bitsGiven < 1) return null;
    const yes = bitsGiven >= need;
    const have = 2 ** bitsGiven;
    const plan = newPlan();
    plan.push(`${bitsGiven} ${bitsGiven === 1 ? "bit gives" : "bits give"} 2ⁿ colours:`, [`2^{${bitsGiven}}`, `= ${have}`], "colours", { chain: { shown: bitsGiven, mark: bitsGiven - 1 } });
    plan.push(`Compare with the ${colours} colours needed:`, [`${have} ${yes ? "\\ge" : "<"} ${colours}`], undefined, { chain: { shown: bitsGiven, mark: bitsGiven - 1 } });
    return finish({
      sub, level, task, plan,
      lines: [`Can ${M(bitsGiven)} ${bitsGiven === 1 ? "bit" : "bits"} store ${M(colours)} colours?`],
      chain: { n: chainRows(Math.max(bitsGiven, 1)), need: colours },
      answerLatex: `\\mathrm{${yes ? "Yes" : "No"}}`, answerPlain: yes ? `Yes (2^${bitsGiven} = ${have} colours)` : `No (2^${bitsGiven} = ${have} colours)`, weight,
      check: { colours, bits: bitsGiven, yes }, keyParts: [bitsGiven, colours],
    });
  }

  // ── size questions (recipe + ladder)
  const resOn = level === "level2" ? ["wh"] : active(ms, resG);
  const usePixels = resOn.includes("pixels") && (!resOn.includes("wh") || Math.random() < 0.5);
  const pickRes = (): { w: number; h: number; px: number; wh: boolean } => {
    if (level === "level1") {
      if (usePixels) return { w: 0, h: 0, px: pick(I_L1_PIXELS), wh: false };
      const w = pick(I_L1_SIDES), h = Math.random() < 0.5 ? w : pick(I_L1_SIDES);
      return { w, h, px: w * h, wh: true };
    }
    if (usePixels) return { w: 0, h: 0, px: pick(I_L3_PIXELS), wh: false };
    const [w, h] = pick(I_L2_RES);
    return { w, h, px: w * h, wh: true };
  };
  const sentence = (r: { w: number; h: number; px: number; wh: boolean }, tail: string): string => {
    if (!r.wh) return `${cap(an(ctx))} ${ctx} has ${M(r.px)} pixels ${tail}`;
    if (level === "level1" && Math.random() < 0.5) return `${cap(an(ctx))} ${ctx} is ${M(r.w)} pixels wide and ${M(r.h)} pixels high ${tail}`;
    return `${cap(an(ctx))} ${ctx} is ${M(r.w)} $\\times$ ${M(r.h)} pixels ${tail}`;
  };
  const pxStep = (plan: Plan, r: { w: number; h: number; px: number; wh: boolean }): number =>
    r.wh ? plan.push("Width × height:", [K(r.w), `\\times ${K(r.h)}`, `= ${K(r.px)}`], "pixels") : -1;

  if (task === "findSize") {
    const r = pickRes();
    const viaColours = level === "level3" && Math.random() < 0.5;
    const depth = viaColours ? pick([1, 2, 4, 8]) : level === "level1" ? pick([1, 2, 2, 3, 3, 4, 4]) : level === "level2" ? pick([4, 8, 8, 16, 24]) : pick([4, 8, 16, 24]);
    const bits = BigInt(r.px) * BigInt(depth);
    let units: number[];
    if (level === "level1") { if (bits >= 3000n) return null; units = [0]; }
    else { units = feasibleUnits(ms, unitG, (u) => sizeOk(bits, u)); if (!units.length) return null; }
    const u = units[0];
    const ans = sizeAnswer(bits, u);
    const plan = newPlan();
    const colSteps = viaColours ? coloursToBitsSteps(plan, 2 ** depth) : -1;
    const px = pxStep(plan, r);
    const mult = plan.push("Pixels × bits per pixel:", [K(r.px), `\\times ${depth}`, `= ${K(bits)}`], "bits", { reach: 0 });
    upSteps(plan, bits, u);
    const lines = viaColours
      ? [sentence(r, `and uses ${M(2 ** depth)} colours.`), `Calculate the file size in ${UNIT_WORD[u]}.`]
      : [sentence(r, `with a colour depth of ${M(depth)} ${depth === 1 ? "bit" : "bits"}.`), `Calculate the file size in ${UNIT_WORD[u]}.`];
    return finish({
      sub, level, task, plan, lines,
      defs: [imageRecipe(
        { wh: r.wh ? `${K(r.w)} × ${K(r.h)}` : undefined, v: K(r.px), at: r.wh ? px : 0 },
        { v: String(depth), at: viaColours ? colSteps : 0, unknown: viaColours },
        { v: K(bits), at: mult },
      )],
      chain: viaColours ? { n: chainRows(depth), need: 2 ** depth } : undefined,
      ladder: level === "level1" ? undefined : { a: 0, b: u },
      answerLatex: ans.latex, answerPlain: ans.plain, answerSuffix: ans.suffix, weight,
      check: { px: r.px, depth, bits, unit: u, ansT: ans.tenths },
      keyParts: [r.wh ? `${r.w}x${r.h}` : r.px, depth, u],
    });
  }

  if (task === "logo") {
    const colours = pick(NOT_POW2.filter((c) => c <= 30));
    const n = fewestBits(colours);
    const [w, h] = pick(LOGO_SIZES);
    const px = w * h, bits = BigInt(px * n);
    const plan = newPlan();
    const nAt = coloursToBitsSteps(plan, colours);
    const pxAt = pxStep(plan, { w, h, px, wh: true });
    const mult = plan.push("Pixels × bits per pixel:", [K(px), `\\times ${n}`, `= ${K(bits)}`], "bits", { reach: 0 });
    const ans = sizeAnswer(bits, 0);
    return finish({
      sub, level, task, plan,
      lines: [`A logo uses ${M(colours)} colours and is ${M(w)} $\\times$ ${M(h)} pixels.`, "Calculate the file size in bits."],
      defs: [imageRecipe({ wh: `${w} × ${h}`, v: K(px), at: pxAt }, { v: String(n), at: nAt, unknown: true }, { v: K(bits), at: mult })],
      chain: { n: chainRows(n), need: colours },
      answerLatex: ans.latex, answerPlain: ans.plain, answerSuffix: ans.suffix, weight,
      check: { px, depth: n, bits, unit: 0, ansT: ans.tenths, colours },
      keyParts: [colours, w, h],
    });
  }

  if (task === "several") {
    const [w, h] = pick(I_L2_RES), depth = pick([8, 8, 16]), count = pick([10, 12, 20, 25, 30]);
    const px = w * h, one = BigInt(px * depth), bits = one * BigInt(count);
    const units = feasibleUnits(ms, unitG, (u) => sizeOk(bits, u));
    if (!units.length) return null;
    const u = units[0];
    const ans = sizeAnswer(bits, u);
    const plan = newPlan();
    const pxAt = plan.push("Width × height:", [K(w), `\\times ${K(h)}`, `= ${K(px)}`], "pixels");
    plan.push("One image: pixels × bits per pixel:", [K(px), `\\times ${depth}`, `= ${K(one)}`], "bits", { reach: 0 });
    const tot = plan.push(`All ${count} images:`, [K(one), `\\times ${count}`, `= ${K(bits)}`], "bits", { reach: 0 });
    upSteps(plan, bits, u);
    return finish({
      sub, level, task, plan,
      lines: [`${M(count)} images are each ${M(w)} $\\times$ ${M(h)} pixels with a colour depth of ${M(depth)} bits.`, `Calculate the total size in ${UNIT_WORD[u]}.`],
      defs: [imageRecipe({ wh: `${K(w)} × ${K(h)}`, v: K(px), at: pxAt }, { v: String(depth), at: 0 }, { v: K(bits), at: tot }, { v: String(count) })],
      ladder: { a: 0, b: u },
      answerLatex: ans.latex, answerPlain: ans.plain, answerSuffix: ans.suffix, weight,
      check: { px, depth, count, bits, unit: u, ansT: ans.tenths },
      keyParts: [`${w}x${h}`, depth, count, u],
    });
  }

  // reverse: findDepth (size, W × H → depth) / findPixels (size, depth → pixels or width)
  const asWidth = task === "findPixels" && resOn.includes("wh") && (!resOn.includes("pixels") || Math.random() < 0.5);
  const depth = pick([1, 2, 4, 8, 16]);
  let w = 0, h = 0, px: number;
  if (task === "findDepth" || asWidth) { [w, h] = pick(I_L2_RES); px = w * h; } else px = pick(I_L3_PIXELS);
  const bits = BigInt(px) * BigInt(depth);
  const gs = feasibleUnits(ms, unitG, (u) => givenOk(bits, u), ["bytes"]);
  if (!gs.length) return null;
  const g = gs[0];
  const size = `${M(BigInt(tenthsIn(bits, g)! / 10n))} ${UNIT_WORD[g]}`;
  const plan = newPlan();
  const conv = downSteps(plan, bits, g);
  const bitsAt = Math.max(conv, 0);
  let lines: string[], ans: ReturnType<typeof countAnswer>, defs: FsRecipeDef, answerValue: number;
  if (task === "findDepth") {
    const pxAt = plan.push("Width × height:", [K(w), `\\times ${K(h)}`, `= ${K(px)}`], "pixels");
    const div = plan.push("Bits ÷ pixels:", [K(bits), `\\div ${K(px)}`, `= ${depth}`], "bits per pixel");
    lines = [`An image file is ${size} and is ${M(w)} $\\times$ ${M(h)} pixels.`, "State the colour depth."];
    ans = countAnswer(depth, "bit", "bits"); answerValue = depth;
    defs = imageRecipe({ wh: `${K(w)} × ${K(h)}`, v: K(px), at: pxAt }, { v: String(depth), at: div, unknown: true }, { v: K(bits), at: bitsAt });
  } else if (asWidth) {
    const div = plan.push("Bits ÷ bits per pixel:", [K(bits), `\\div ${depth}`, `= ${K(px)}`], "pixels");
    plan.push("Pixels ÷ height:", [K(px), `\\div ${K(h)}`, `= ${K(w)}`], "pixels wide");
    lines = [`An image file is ${size}. It is ${M(h)} pixels high and has a colour depth of ${M(depth)} ${depth === 1 ? "bit" : "bits"}.`, "How many pixels wide is it?"];
    ans = countAnswer(w, "pixel wide", "pixels wide"); answerValue = w;
    defs = imageRecipe({ v: K(px), at: div }, { v: String(depth), at: 0 }, { v: K(bits), at: bitsAt });
    defs.slots[0].unknown = true;
  } else {
    const div = plan.push("Bits ÷ bits per pixel:", [K(bits), `\\div ${depth}`, `= ${K(px)}`], "pixels");
    lines = [`An image file is ${size} and has a colour depth of ${M(depth)} ${depth === 1 ? "bit" : "bits"}.`, "How many pixels does it contain?"];
    ans = countAnswer(px, "pixel", "pixels"); answerValue = px;
    defs = imageRecipe({ v: K(px), at: div }, { v: String(depth), at: 0 }, { v: K(bits), at: bitsAt });
    defs.slots[0].unknown = true;
  }
  return finish({
    sub, level, task, plan, lines, defs: [defs],
    ladder: g > 0 ? { a: g, b: 0 } : undefined,
    answerLatex: ans.latex, answerPlain: ans.plain, answerSuffix: ans.suffix, weight,
    check: { px, depth, bits, given: g, answer: answerValue, width: asWidth ? w : undefined, height: asWidth ? h : undefined },
    keyParts: [px, depth, g],
  });
};

// ── 7. SOUND ──────────────────────────────────────────────────────────────────

const S_L1 = { rate: [10, 20, 50, 100, 200], dur: [2, 4, 5, 10], depth: [4, 8, 16] };
const S_L2 = { rate: [400, 500, 1000, 2000, 4000], dur: [5, 10, 20, 30, 60], depth: [8, 16] };
const S_CONTEXTS = ["voice memo", "ringtone", "sound effect", "podcast clip", "song clip", "doorbell"];
const S_REV = { dur: [10, 20, 30, 60, 120], depth: [8, 16], rate: [500, 1000, 2000] };

interface Rec { rate: number; dur: number; depth: number; kHz: boolean; mins: boolean }
const recBits = (r: Rec): bigint => BigInt(r.rate) * BigInt(r.dur) * BigInt(r.depth);
const rateText = (r: Rec): string => (r.kHz ? `${M(r.rate / 1000)} kHz` : `${M(r.rate)} Hz`);
const durText = (r: Rec): string => (r.mins ? `${M(r.dur / 60)} ${r.dur === 60 ? "minute" : "minutes"}` : `${M(r.dur)} seconds`);

const soundRecipe = (rate: { v: string; at: number }, dur: { v: string; at: number }, depth: { v: string; at: number; unknown?: boolean }, bits: { v: string; at: number }, title?: string, rateUnknown?: boolean, durUnknown?: boolean, convAt: { rate: number; dur: number } = { rate: 0, dur: 0 }): FsRecipeDef => ({
  title, ops: ["×", "×", "="],
  slots: [
    { label: "sample rate (Hz)", vals: [{ at: Math.max(rate.at, convAt.rate), v: rate.v }], unknown: rateUnknown || convAt.rate > 0 },
    { label: "duration (s)", vals: [{ at: Math.max(dur.at, convAt.dur), v: dur.v }], unknown: durUnknown || convAt.dur > 0 },
    { label: "bit depth (bits)", vals: [{ at: depth.at, v: depth.v }], unknown: depth.unknown },
    { label: "file size (bits)", vals: [{ at: bits.at, v: bits.v }] },
  ],
});

/** One recording's working: any unit conversions of the inputs, then rate × duration × depth. Returns the recipe def. */
const recordingSteps = (plan: Plan, r: Rec, u: number | null, prefix = "", title?: string): FsRecipeDef => {
  const convAt = { rate: 0, dur: 0 };
  if (r.mins) convAt.dur = plan.push(`${prefix}Duration in seconds:`, [`${K(r.dur / 60)}`, "\\times 60", `= ${K(r.dur)}`], "seconds", { reach: 0 });
  if (r.kHz) convAt.rate = plan.push(`${prefix}Sample rate in Hz:`, [`${K(r.rate / 1000)}`, "\\times 1000", `= ${K(r.rate)}`], "Hz", { reach: 0 });
  const bits = recBits(r);
  const mult = plan.push(`${prefix}Rate × duration × bit depth:`, [K(r.rate), `\\times ${K(r.dur)}`, `\\times ${r.depth}`, `= ${K(bits)}`], "bits", { reach: 0 });
  if (u !== null) upSteps(plan, bits, u, prefix);
  return soundRecipe({ v: K(r.rate), at: 0 }, { v: K(r.dur), at: 0 }, { v: String(r.depth), at: 0 }, { v: K(bits), at: mult }, title, false, false, convAt);
};

const buildSound = (level: DifficultyLevel, ms: Record<string, boolean>): AnyQuestion | null => {
  const taskG = SND_TASK(level), inG = SND_INPUTS(level), unitG = SND_UNIT(level);
  const { task, weight } = taskOf(ms, taskG, "findSize");
  const sub: Sub = "sound";
  const ctx = pickContext(sub, S_CONTEXTS);
  const inputs = level === "level3" ? active(ms, inG) : ["plain"];
  const mkRec = (): Rec => {
    if (level === "level1") return { rate: pick(S_L1.rate), dur: pick(S_L1.dur), depth: pick(S_L1.depth), kHz: false, mins: false };
    const convert = inputs.includes("convert") && (!inputs.includes("plain") || Math.random() < 0.6);
    if (!convert) return { rate: pick(S_L2.rate), dur: pick(S_L2.dur), depth: pick(S_L2.depth), kHz: false, mins: false };
    const kHz = Math.random() < 0.7, mins = !kHz || Math.random() < 0.7;   // at least one input needs converting
    return {
      rate: kHz ? pick([1, 2, 3, 4]) * 1000 : pick(S_L2.rate),
      dur: mins ? pick([1, 2, 3]) * 60 : pick(S_L2.dur),
      depth: pick(S_L2.depth), kHz, mins,
    };
  };
  const recLine = (r: Rec): string => `a sample rate of ${rateText(r)}, a duration of ${durText(r)} and a bit depth of ${M(r.depth)} bits`;

  if (task === "findSize") {
    const r = mkRec();
    const bits = recBits(r);
    let units: number[];
    if (level === "level1") { if (bits >= 20000n || r.rate === r.dur) return null; units = [0]; }
    else { units = feasibleUnits(ms, unitG, (u) => sizeOk(bits, u)); if (!units.length) return null; }
    const u = units[0];
    const ans = sizeAnswer(bits, u);
    const plan = newPlan();
    const def = recordingSteps(plan, r, level === "level1" ? null : u);
    return finish({
      sub, level, task, plan,
      lines: [`${cap(an(ctx))} ${ctx} has ${recLine(r)}.`, `Calculate the file size in ${UNIT_WORD[u]}.`],
      defs: [def], ladder: level === "level1" ? undefined : { a: 0, b: u },
      answerLatex: ans.latex, answerPlain: ans.plain, answerSuffix: ans.suffix, weight,
      check: { rate: r.rate, dur: r.dur, depth: r.depth, bits, unit: u, ansT: ans.tenths, inputConv: (r.kHz ? 1 : 0) + (r.mins ? 1 : 0) },
      keyParts: [r.rate, r.dur, r.depth, u],
    });
  }

  if (task === "compare") {
    const a = mkRec();
    let b: Rec;
    const equal = Math.random() < 1 / 8;
    if (equal) {
      // change two parameters so the product is unchanged: one up by k, another down by k
      const k = pick([2, 4]);
      const dims = shuffled(["rate", "dur", "depth"] as const);
      const [p, q] = [dims[0], dims[1]];
      const bB = { ...a, kHz: false, mins: false } as Rec;
      (bB as unknown as Record<string, number>)[p] = (a as unknown as Record<string, number>)[p] * k;
      (bB as unknown as Record<string, number>)[q] = (a as unknown as Record<string, number>)[q] / k;
      const inSet = S_L2.rate.includes(bB.rate) && S_L2.dur.includes(bB.dur) && S_L2.depth.includes(bB.depth);
      if (!inSet || recBits(bB) !== recBits(a)) return null;
      b = bB;
    } else {
      b = { ...mkRec(), kHz: false, mins: false, ...{} };
      b.rate = pick(S_L2.rate); b.dur = pick(S_L2.dur); b.depth = pick(S_L2.depth);
      if (recBits(b) === recBits(a)) return null;
      // differ in about two parameters: keep one of A's values so the comparison is about a pair of changes
      const keep = pick(["rate", "dur", "depth"] as const);
      (b as unknown as Record<string, number>)[keep] = (a as unknown as Record<string, number>)[keep];
      if (recBits(b) === recBits(a)) return null;
    }
    // a rate that is a whole number of kHz is sometimes written that way
    if (a.rate % 1000 === 0 && inputs.includes("convert") && !a.kHz && Math.random() < 0.5) a.kHz = true;
    const bitsA = recBits(a), bitsB = recBits(b);
    const bigger = bitsA === bitsB ? null : bitsB > bitsA ? "B" : "A";
    const diff = bitsA === bitsB ? 0n : bitsA > bitsB ? bitsA - bitsB : bitsB - bitsA;
    const units = feasibleUnits(ms, unitG, (u) => sizeOk(bitsA, u) && sizeOk(bitsB, u) && (diff === 0n || sizeOk(diff, u)));
    if (!units.length) return null;
    const u = units[0];
    const plan = newPlan();
    const dA = recordingSteps(plan, a, u, "A: ", "Sound A");
    const dB = recordingSteps(plan, b, u, "B: ", "Sound B");
    const ta = tenthsIn(bitsA, u)!, tb = tenthsIn(bitsB, u)!;
    let ansPlain: string, ansLatex: string, suffix: string | undefined;
    if (bigger === null) {
      plan.push("Compare:", [tK(ta), "=", tK(tb)], UNIT_WORD[u]);
      ansLatex = `\\mathrm{Same}`; ansPlain = `They are the same size (${fmtT(ta)} ${UNIT_WORD[u]} each)`; suffix = undefined;
    } else {
      const big = bigger === "B" ? tb : ta, small = bigger === "B" ? ta : tb;
      const d = sizeAnswer(diff, u);
      plan.push("Difference:", [tK(big), `- ${tK(small)}`, `= ${d.latex}`], UNIT_WORD[u]);
      ansLatex = `\\mathrm{${bigger}, by}\\ ${d.latex}`; ansPlain = `${bigger}, by ${d.plain}`; suffix = d.suffix;
    }
    return finish({
      sub, level, task, plan,
      lines: [`Sound A has ${recLine(a)}.`, `Sound B has ${recLine(b)}.`, `Which file is larger, and by how many ${UNIT_WORD[u]}?`],
      defs: [dA, dB], ladder: { a: 0, b: u },
      answerLatex: ansLatex, answerPlain: ansPlain, ...(suffix ? { answerSuffix: suffix } : {}), weight,
      check: { bitsA, bitsB, unit: u, bigger, diff },
      keyParts: [recBits(a), recBits(b), u],
    });
  }

  // reverse: findDuration / findDepth / findRate — size given in bytes / KB (or MB)
  const rate = pick(S_REV.rate), dur = pick(S_REV.dur), depth = pick(S_REV.depth);
  const bits = BigInt(rate) * BigInt(dur) * BigInt(depth);
  const gs = feasibleUnits(ms, unitG, (u) => givenOk(bits, u), ["bytes"]);
  if (!gs.length) return null;
  const g = gs[0];
  const size = `${M(BigInt(tenthsIn(bits, g)! / 10n))} ${UNIT_WORD[g]}`;
  const plan = newPlan();
  const conv = downSteps(plan, bits, g);
  const bitsAt = Math.max(conv, 0);
  const known = { rate: `${M(rate)} Hz`, dur: `${M(dur)} seconds`, depth: `${M(depth)} bits` };
  let lines: string[], div: number, ans: ReturnType<typeof countAnswer>, answerValue: number;
  if (task === "findDuration") {
    div = plan.push("Bits ÷ (rate × bit depth):", [K(bits), `\\div \\left(${K(rate)} \\times ${depth}\\right)`, `= ${K(dur)}`], "seconds");
    lines = [`A recording is ${size} with a sample rate of ${known.rate} and a bit depth of ${known.depth}.`, "State the duration in seconds."];
    ans = countAnswer(dur, "second", "seconds"); answerValue = dur;
  } else if (task === "findDepth") {
    div = plan.push("Bits ÷ (rate × duration):", [K(bits), `\\div \\left(${K(rate)} \\times ${K(dur)}\\right)`, `= ${depth}`], "bits");
    lines = [`A recording is ${size} with a sample rate of ${known.rate} and a duration of ${known.dur}.`, "State the bit depth."];
    ans = countAnswer(depth, "bit", "bits"); answerValue = depth;
  } else {
    div = plan.push("Bits ÷ (duration × bit depth):", [K(bits), `\\div \\left(${K(dur)} \\times ${depth}\\right)`, `= ${K(rate)}`], "Hz");
    lines = [`A recording is ${size} with a duration of ${known.dur} and a bit depth of ${known.depth}.`, "State the sample rate in Hz."];
    ans = countAnswer(rate, "Hz", "Hz"); answerValue = rate;
  }
  const def = soundRecipe(
    { v: K(rate), at: task === "findRate" ? div : 0 },
    { v: K(dur), at: task === "findDuration" ? div : 0 },
    { v: String(depth), at: task === "findDepth" ? div : 0, unknown: task === "findDepth" },
    { v: K(bits), at: bitsAt },
    undefined, task === "findRate", task === "findDuration",
  );
  return finish({
    sub, level, task, plan, lines, defs: [def],
    ladder: g > 0 ? { a: g, b: 0 } : undefined,
    answerLatex: ans.latex, answerPlain: ans.plain, answerSuffix: ans.suffix, weight,
    check: { rate, dur, depth, bits, given: g, answer: answerValue },
    keyParts: [rate, dur, depth, g],
  });
};

// ── 8. generateQuestion ───────────────────────────────────────────────────────

const BUILDERS: Record<Sub, (level: DifficultyLevel, ms: Record<string, boolean>) => AnyQuestion | null> = { text: buildText, images: buildImages, sound: buildSound };

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const sub: Sub = tool === "images" ? "images" : tool === "sound" ? "sound" : "text";
  // Parameters are drawn, then checked against the answer-format rules (whole / one decimal); retry until they fit.
  for (let attempt = 0; attempt < 400; attempt++) {
    const q = BUILDERS[sub](level, multiSelectValues);
    if (q) return q;
  }
  throw new Error(`file-sizes: no valid ${sub} question at ${level}`);
};

// ── 9. The recipe, empty, in the working box (Whiteboard) ────────────────────

interface Scaffold { defs: FsRecipeDef[]; ladder?: { a: number; b: number }; chain?: { n: number[]; need?: number } }

// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

export const __test = { TOOL_CONFIG, generateQuestion, MESSAGES, fewestBits, sizeOk };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      // displayFontSize 1: these are sentences, not one-line sums, so the whiteboard question starts one size smaller
      defaults={{ numQuestions: 12, numColumns: 2, hideAnswerStep: true, displayFontSize: 1 }}
      stepVisualRenderer={fileSizeStepVisual}
      stepVisualKeepsWorking
      workingScaffold={{
        label: "the recipe",
        render: (q, showAnswer, _cs, qo) => {
          const sc = (q as unknown as { _fsScaffold?: Scaffold })._fsScaffold;
          if (!sc) return null;
          const at = showAnswer ? Infinity : -1;   // blank boxes until Show Answer fills them
          const visual: FsVisual = {
            recipes: sc.defs.map((d) => recipeAt(d, at)),
            ladder: sc.ladder ? { a: sc.ladder.a, b: sc.ladder.b, reach: showAnswer ? sc.ladder.b : sc.ladder.a } : undefined,
            chain: sc.chain ? { n: sc.chain.n, shown: showAnswer ? sc.chain.n.length : 0, mark: showAnswer ? sc.chain.n.length - 1 : undefined, need: sc.chain.need } : undefined,
          };
          return <FileSizeVisual visual={visual} ladderOn={qo?.variables?.scaffoldLadder !== false} />;
        },
      }}
    />
  );
}
