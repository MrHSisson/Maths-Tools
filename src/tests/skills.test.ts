// Skill-library smoke tests — validate every skill in src/shared/skills the
// same way the generator suite validates questions: every KaTeX string renders
// under throwOnError, anim slides don't supply more captions than beats, and
// skill ids are unique/kebab-case (they're referenced by [[id|term]] markers
// in tool working steps — the generator suite checks those markers resolve).

import { describe, it, expect } from "vitest";
import katex from "katex";
import { SKILLS } from "../shared/skills";
import { slideMaxStep, type TeachingSlide, type TeachBlock } from "../shared/TeachingDeck";

const renderOk = (label: string, latex: string) => {
  try {
    katex.renderToString(latex, { throwOnError: true });
  } catch (e) {
    throw new Error(`KaTeX failed for ${label}:\n  "${latex}"\n  ${(e as Error).message}`);
  }
};

// Every $...$ segment in a rich-text string.
const inlineLatex = (s: string): string[] => [...s.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]);

const blockLatex = (b: TeachBlock, ctx: string): [string, string][] => {
  if (b.t === "math") return [[`${ctx} math block`, b.s]];
  if (b.t === "text" || b.t === "note") return inlineLatex(b.s).map((l) => [`${ctx} ${b.t} block`, l]);
  return [];
};

const slideLatex = (slide: TeachingSlide, ctx: string): [string, string][] => {
  const out: [string, string][] = inlineLatex(slide.title).map((l) => [`${ctx} title`, l]);
  if (slide.kind === "anim") {
    slide.steps.forEach((cap, i) => inlineLatex(cap).forEach((l) => out.push([`${ctx} caption[${i}]`, l])));
  } else {
    (slide.body ?? []).forEach((b, i) => out.push(...blockLatex(b, `${ctx} body[${i}]`)));
    (slide.reveal ?? []).forEach((b, i) => out.push(...blockLatex(b, `${ctx} reveal[${i}]`)));
  }
  return out;
};

describe("skill library", () => {
  it("has unique kebab-case ids", () => {
    const ids = SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  for (const skill of SKILLS) {
    describe(skill.id, () => {
      it("has slides and a description", () => {
        expect(skill.slides.length).toBeGreaterThan(0);
        expect(skill.title).toBeTruthy();
        expect(skill.description).toBeTruthy();
      });

      it("every KaTeX string renders", () => {
        skill.slides.forEach((slide, i) => {
          for (const [label, latex] of slideLatex(slide, `slide[${i}]`)) renderOk(label, latex);
        });
      });

      it("anim slides never supply more captions than beats", () => {
        skill.slides.forEach((slide, i) => {
          if (slide.kind === "anim") {
            expect(slide.steps.length, `slide[${i}] captions vs beats`).toBeLessThanOrEqual(slideMaxStep(slide) + 1);
          }
        });
      });
    });
  }
});
