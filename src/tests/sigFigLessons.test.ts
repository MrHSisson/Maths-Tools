// Significant-figure lessons (specs/decks/sig-figs.md, Lesson 1): every lesson step must name a real tab, level, Question Option and
// Depth item; every deck must be well formed (one caption per beat at most, valid KaTeX, real checks and hand-off presets); and every
// number claim in a deck must agree with an independent significant-figure counter.
import { describe, it, expect } from "vitest";
import katex from "katex";
import { sceneMaxStep, sigSeq, roundSeq, classifySf, roundToSf, type ToolLesson, type TeachLesson, type TeachingSlide } from "../shared";
import { __test } from "../tools/Number/Rounding";

const { TOOL_CONFIG, depthItems, lessons, teachLessons } = __test as unknown as {
  TOOL_CONFIG: { tools: Record<string, { multiSelect?: unknown; difficultySettings?: Record<string, { multiSelect?: unknown }> | null }> };
  depthItems: { id: string; tool?: string | string[]; level: string }[];
  lessons: ToolLesson[];
  teachLessons: TeachLesson[];
};

const optionsOf = (tool: string): Set<string> => {
  const t = TOOL_CONFIG.tools[tool];
  const out = new Set<string>();
  const add = (raw: unknown) => { if (!raw) return; (Array.isArray(raw) ? raw : [raw]).forEach((g: { options: { value: string }[] }) => g.options.forEach(o => out.add(o.value))); };
  add(t.multiSelect);
  Object.values(t.difficultySettings ?? {}).forEach(s => add(s.multiSelect));
  return out;
};

/** Independent counter (regex based, shares no code with the tool). */
function sfCount(n: string): number {
  if (n.includes(".")) return n.replace(".", "").replace(/^0+/, "").length;
  return n.replace(/^0+/, "").replace(/0+$/, "").length;
}
/** Exact round-half-up of a plain decimal string to `n` significant figures, by digit strings (independent of the tool's roundToSf). */
function roundSf(s: string, n: number): string {
  const [ip, fp = ""] = s.split(".");
  const digits = ip + fp, ptr0 = ip.length;
  const first = digits.search(/[1-9]/);
  const keep = first + n;
  const head = digits.slice(0, keep);
  const next = digits[keep];
  const kept = (BigInt(head || "0") + (next !== undefined && next >= "5" ? 1n : 0n)).toString().padStart(head.length, "0");
  const shift = kept.length > head.length ? 1 : 0;
  const out = kept.padEnd(Math.max(digits.length, keep) + shift, "0");
  const ptr = ptr0 + shift;
  const len = Math.max(keep + shift, ptr);
  const body = out.slice(0, len).padEnd(len, "0");
  return len > ptr ? `${body.slice(0, ptr)}.${body.slice(ptr)}` : body;
}
const dp = (s: string, n: number) => { const [i, f = ""] = s.split("."); const d = (BigInt(i + f.padEnd(n, "0").slice(0, n)) + (f[n] !== undefined && f[n] >= "5" ? 1n : 0n)).toString().padStart(i.length + n, "0"); return `${d.slice(0, d.length - n)}.${d.slice(d.length - n)}`; };
const texOf = (s: string) => [...s.matchAll(/\$([^$]+)\$/g)].map(m => m[1]);
const textsOf = (sl: TeachingSlide): string[] => {
  const out: string[] = [];
  if ("steps" in sl) out.push(...sl.steps);
  if ("body" in sl) for (const b of [...(sl.body ?? []), ...(sl.reveal ?? [])]) { if ("s" in b) out.push(b.s); }
  return out;
};

describe("Significant figure lessons", () => {
  it("lesson ids are unique and every step names a real tab, level, Question Option, deck and Depth item", () => {
    expect(new Set(lessons.map(l => l.id)).size).toBe(lessons.length);
    for (const l of lessons) {
      expect(TOOL_CONFIG.tools[l.tool], `${l.id} tool`).toBeDefined();
      expect(l.steps.length).toBeGreaterThan(0);
      for (const s of l.steps) {
        const tool = s.tool ?? l.tool;
        const opts = optionsOf(tool);
        expect(["level1", "level2", "level3"]).toContain(s.level);
        for (const k of Object.keys(s.ms ?? {})) expect(opts.has(k), `${l.id} "${s.title}" ms ${k}`).toBe(true);
        if (s.kind === "depth") {
          const item = depthItems.find(i => i.id === s.item);
          expect(item, `${l.id} item ${s.item}`).toBeDefined();
          expect(!item!.tool || (Array.isArray(item!.tool) ? item!.tool.includes(tool) : item!.tool === tool), `${s.item} is on ${tool}`).toBe(true);
          expect(item!.level, `${s.item} level`).toBe(s.level);
        }
        if (s.kind === "teach") {
          const deck = teachLessons.find(d => d.id === s.deck);
          expect(deck, `${l.id} deck ${s.deck}`).toBeDefined();
          expect(deck!.tool).toBe(tool);
        }
        if (s.kind === "worksheet") expect(s.n ?? 15).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("the lesson follows teach → practise → set and ends each level with an extend", () => {
    const l = lessons.find(x => x.id === "identifying-sig-figs")!;
    expect(l.steps.map(s => s.kind)).toEqual(["teach", "whiteboard", "worksheet", "teach", "whiteboard", "worksheet", "depth", "whiteboard", "worksheet", "depth"]);
    expect(l.steps.map(s => s.level)).toEqual(["level1", "level1", "level1", "level2", "level2", "level2", "level2", "level3", "level3", "level3"]);
  });

  it("each deck: anim slides never exceed their beats, KaTeX renders, checks and hand-offs are real", () => {
    for (const d of teachLessons) {
      for (const sl of d.slides) {
        if (sl.kind === "anim") expect(sl.steps.length, `${d.id} "${sl.title}"`).toBeLessThanOrEqual(sceneMaxStep(sl.scene) + 1);
        if (sl.kind === "anim") expect(sl.steps.length, `${d.id} "${sl.title}" has a caption for every beat`).toBe(sceneMaxStep(sl.scene) + 1);
        if (sl.kind === "depth") expect(depthItems.some(i => i.id === sl.item.id), `${d.id} check ${sl.item.id}`).toBe(true);
        for (const t of textsOf(sl)) for (const tex of texOf(t)) expect(() => katex.renderToString(tex, { throwOnError: true }), `${d.id}: ${tex}`).not.toThrow();
        if ("body" in sl) for (const b of sl.body ?? []) if (b.t === "handoff") for (const btn of b.buttons) {
          const opts = optionsOf(btn.to.tool);
          for (const k of Object.keys(btn.to.step.ms ?? {})) expect(opts.has(k), `${d.id} hand-off ${k}`).toBe(true);
          if (btn.to.step.kind === "depth") expect(depthItems.some(i => i.id === btn.to.step.item), `${d.id} hand-off item`).toBe(true);
        }
      }
    }
  });

  it("every number a deck shows is counted the same way as the independent counter", () => {
    let scenes = 0;
    for (const d of teachLessons) {
      for (const sl of d.slides) {
        if (sl.kind !== "anim" || sl.scene.type !== "sigFigs") continue;
        scenes++;
        const raw = sl.scene.raw;
        expect(classifySf(raw).sig.length, `${d.id} ${raw}`).toBe(sfCount(raw));
        if (sl.scene.mode === "count") expect(sigSeq(sl.scene).filter(k => /^d\d+$/.test(k)).length, raw).toBe(sfCount(raw));
        // any total a caption states agrees too
        for (const st of sl.steps) for (const m of st.matchAll(/\*\*(\d+)\*\* significant figures/g)) expect(Number(m[1]), `${raw} caption`).toBe(sfCount(raw));
      }
    }
    expect(scenes).toBeGreaterThan(8);
  });

  it("the rounding lesson follows teach → practise → set with an extend at each level", () => {
    const l = lessons.find(x => x.id === "rounding-sig-figs")!;
    expect(l.tool).toBe("sf");
    expect(l.steps.map(s => s.kind)).toEqual(["depth", "teach", "whiteboard", "whiteboard", "worksheet", "teach", "whiteboard", "worksheet", "depth", "whiteboard", "worksheet", "depth"]);
    expect(l.steps.map(s => s.level)).toEqual(["level1", "level1", "level1", "level1", "level1", "level2", "level2", "level2", "level2", "level3", "level3", "level3"]);
    // the number line is off in every step but the one labelled-line practice
    const lined = l.steps.filter(s => s.ms?.labelled || s.ms?.blank);
    expect(lined.length).toBe(1);
  });

  it("every rounding slide: a caption for every beat, the right answer, the right digits kept and deciding, the right verdict", () => {
    let scenes = 0;
    for (const d of teachLessons) for (const sl of d.slides) {
      if (sl.kind !== "anim" || sl.scene.type !== "sfRound") continue;
      scenes++;
      const { raw, sf } = sl.scene;
      const seq = roundSeq(sl.scene);
      expect(sl.steps.length, `${raw} captions`).toBe(seq.length);
      const ans = roundSf(raw, sf);
      expect(roundToSf(raw, sf), `${raw} to ${sf}`).toBe(ans);
      const digits = raw.replace(".", "");
      const first = digits.search(/[1-9]/), keptCh = digits[first + sf - 1], decider = digits[first + sf];
      const last = sl.steps[sl.steps.length - 1].replace(/\*/g, "");
      expect(last.includes(`$${ans}$`), `${raw} final caption states ${ans}: ${last}`).toBe(true);
      const cap = (key: string) => sl.steps[seq.indexOf(key)];
      expect(/\$(\d)\$|zero/.test(cap("keep")) && (cap("keep").includes(`$${keptCh}$`) || (keptCh === "0" && cap("keep").includes("zero"))), `${raw} keep caption`).toBe(true);
      if (decider !== undefined) {
        expect(cap("decider").includes(`$${decider}$`), `${raw} decider caption`).toBe(true);
        expect(/5 or more/.test(cap("verdict")), `${raw} verdict`).toBe(decider >= "5");
      }
      // the number of "kept" beats is the number of significant figures asked for
      expect(seq.filter(k => /^d\d+$/.test(k)).length).toBe(sf);
    }
    expect(scenes).toBeGreaterThanOrEqual(11);
  });

  it("the rounding Depth items' numbers agree with an independent rounding", () => {
    expect(dp("0.0472", 2)).toBe("0.05");
    expect(roundSf("0.0472", 2)).toBe("0.047");
    expect(roundSf("3.052", 2)).toBe("3.1");
    expect(roundSf("9960", 2)).toBe("10000");
    expect(roundSf("4612", 2)).toBe("4600");
    expect(roundSf("0.00836", 2)).toBe("0.0084");
    expect(roundSf("46720", 2)).toBe("47000");
    expect(roundSf("4.96", 2)).toBe("5.0");
    // range: 4600 to 2 s.f.
    expect(roundSf("4550", 2)).toBe("4600"); expect(roundSf("4549", 2)).toBe("4500");
    expect(roundSf("4649", 2)).toBe("4600"); expect(roundSf("4650", 2)).toBe("4700");
    expect(roundSf("30061", 3)).toBe("30100");
    expect(roundSf("0.04503", 2)).toBe("0.045"); expect(roundSf("0.04503", 3)).toBe("0.0450");
    // 8.0 to 2 s.f.: 7.95 up to 8.049
    expect(roundSf("7.95", 2)).toBe("8.0"); expect(roundSf("7.949", 2)).toBe("7.9");
    expect(roundSf("8.049", 2)).toBe("8.0"); expect(roundSf("8.05", 2)).toBe("8.1");
  });

  it("each routine slide asks the questions its zero needs (before; after; decimal point) and reaches the right verdict", () => {
    const verdict = (raw: string, zero: number) => {
      const digits = raw.replace(".", "");
      const before = [...digits.slice(0, zero)].some(c => c !== "0");
      const after = [...digits.slice(zero + 1)].some(c => c !== "0");
      if (!before) return { qs: 1, counts: false };
      if (after) return { qs: 2, counts: true };
      return { qs: 3, counts: raw.includes(".") };
    };
    for (const d of teachLessons) for (const sl of d.slides) {
      if (sl.kind !== "anim" || sl.scene.type !== "sigFigs" || sl.scene.mode !== "routine") continue;
      const v = verdict(sl.scene.raw, sl.scene.zero ?? 0);
      expect(sigSeq(sl.scene).filter(k => /^q\d$/.test(k)).length, `${sl.scene.raw} questions`).toBe(v.qs);
      const last = sl.steps[sl.steps.length - 1].replace(/\*/g, "");
      const says = /not count/.test(last) ? false : /count/.test(last);
      expect(says, `${sl.scene.raw} verdict`).toBe(v.counts);
    }
  });
});
