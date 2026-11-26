// The Critical Path question generator, on its own (no React, no page) so it can run in a Web Worker as well as in the page (see cpaAsync.ts).
import { generateCpa, type CpaKind, type LevelSize } from "./cpa";
import { generateCpaExam, type CpaChain } from "./cpaExam";
import type { DecisionProblem, GenerateContext } from "./types";

export const EXAM_CHAIN: Record<string, CpaChain | "asAny" | "alAny"> = {
  exAsAny: "asAny", exBuild: "asBuild", exClaim: "asClaim", exChange: "asChange", exClock: "asClock",
  exAlAny: "alAny", exCascade: "alCascade", exTable: "alTable", exHist: "alHist", exShorten: "alShorten", exAlloc: "alAlloc",
};
const KIND: Record<string, CpaKind> = {
  network: "cpaNetwork", table: "cpaTable", forward: "cpaForward", backward: "cpaBackward", full: "cpaFull", floatPaths: "cpaFloat",
  unknown: "cpaUnknown", change: "cpaChange", cascade: "cpaCascade", histogram: "cpaHistogram", level: "cpaLevel", alloc: "cpaAlloc", shorten: "cpaShorten", reason: "cpaReason", reasonA: "cpaReason",
};


// the tabs whose networks are all medium sized by default
export const CHART_SUBS = new Set(["cascade", "histogram", "level", "alloc", "shorten", "reason", "reasonA"]);
/** one of the ticked choices of a multi option, at random */
const pickOf = (v: string | undefined, fallback: string): string => { const xs = (v || fallback).split(",").filter(Boolean); return xs[Math.floor(Math.random() * xs.length)] ?? fallback; };

export function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const sub = ctx?.subTool ?? "full";
  const o = ctx?.options ?? {};
  // every multi option arrives as a comma list of what is ticked; each question draws one of them
  const size = pickOf(o.size, "") === "small" ? "small" : pickOf(o.size, "") === "medium" ? "medium" : undefined;
  if (EXAM_CHAIN[sub]) return generateCpaExam(level, EXAM_CHAIN[sub], { size, setting: "context" });
  // Float and critical paths is one tab with three kinds of question; Forward pass can ask for a clock finish time
  const floatQ = sub === "floatPaths" ? pickOf(o.floatQ, "float") : "";
  const kind: CpaKind = sub === "floatPaths" ? (floatQ === "float" ? "cpaFloat" : "cpaPaths") : KIND[sub] ?? "cpaFull";
  // Forward pass and Full analysis have three levels (6–7, 8–9, 10–12 activities); the Cascade chart has three (8–9, 10–12, then as late as possible); the rest have one or two
  const maxLv = sub === "forward" || sub === "backward" || sub === "full" || sub === "change" || sub === "cascade" || sub === "histogram" || sub === "level" || sub === "alloc" || sub === "shorten" ? 3 : 2;
  const lv = Math.min(maxLv, Math.max(1, level)) as 1 | 2 | 3;
  const reasonCase = sub === "reasonA" ? "limit" : (pickOf(o.reasonForm, lv === 1 ? "range" : "claim") as "range" | "remove" | "claim" | "glyn");
  const picked = sub === "floatPaths" ? (lv === 1 ? "one" : "more") : (pickOf(o.paths, "one") === "more" ? "more" : "one");
  // the question that names its own critical paths fixes the count: "which must start first" and the missing time have exactly one
  const paths = sub === "reason" && reasonCase === "glyn" ? (Math.random() < 0.5 ? "one" : "more") : sub === "shorten" ? (lv === 2 ? "more" : "one") : sub === "unknown" || floatQ === "first" ? "one" : picked;
  const genLevel = sub === "change" ? (pickOf(o.changeSize, "medium") === "small" ? 1 : 2) : sub === "reason" || sub === "reasonA" ? 2 : sub === "unknown" ? (lv === 2 ? 2 : 1) : sub === "cascade" ? (pickOf(o.actCount, lv === 1 ? "n89" : "n1012") === "n89" ? 2 : 3) : sub === "histogram" ? (lv === 1 && pickOf(o.histSize, "n89") === "n89" ? 2 : 3) : sub === "level" || sub === "alloc" || sub === "shorten" ? (lv === 3 ? 3 : 2) : lv;
  const workers = lv === 2 ? "several" : "one"; // the histogram's Level 3 (cut the peak) takes its workers from its own option below
  const levelWording = pickOf(o.levelWording, "time"); // the new start of the last activity needs a network that ends in one activity
  const blocks = pickOf(o.histBlocks, "whole,jump") === "whole" ? "whole" : "jump";
  const { data, prompt, answerText } = generateCpa(genLevel as 1 | 2 | 3, kind, {
    size: size ?? (sub === "change" ? "medium" : CHART_SUBS.has(sub) ? "medium" : undefined),
    setting: "context",
    paths,
    levelRef: "cascade",
    levelAsk: "time",
    reasonCase,
    pathsAsk: floatQ === "first" ? "first" : "paths",
    clockSecond: false,
    skip: sub === "table" && lv === 2,
    workers,
    changeCase: lv === 1 ? "delay" : lv === 2 ? "shorten" : Math.random() < 0.5 ? "range" : "remove",
    changeAsk: pickOf(o.changeAsk, "time") === "boxes" ? "boxes" : "time",
    shortenCase: lv === 1 ? "simple" : lv === 2 ? "two" : "trap",
    allocKind: pickOf(o.allocKind, lv === 1 ? "min" : "fixed") === "min" ? "min" : "fixed",
    histShape: blocks,
    histStart: pickOf(o.histStart, "early") === "late" ? "late" : "early",
    partial: sub === "cascade" && lv !== 2 && pickOf(o.chartGiven, "blank") === "partial",
    cascadePasses: sub === "cascade" && lv === 2,
    histLevel: sub === "histogram" && lv === 3 ? 3 : undefined,
    histWorkers: pickOf(o.histWorkers, "one") as "one" | "several" | "mixed",
    histCut: pickOf(o.histCut, "fewest") as "fewest" | "show" | "canFewer",
    histGiven: pickOf(o.histGiven, "given") === "given",
    levelLevel: lv,
    levelWorkers: pickOf(o.levelWorkers, "one") as "one" | "several" | "mixed",
    levelSize: pickOf(o.levelSize, "exam") as LevelSize,
    levelWording: levelWording as "time" | "extra" | "startLast" | "explain",
    singleEnd: sub === "level" && levelWording === "startLast" && genLevel < 3,
    unknownBox: sub === "unknown" && lv === 2,
    unknownChoice: false,
    unknownWhere: pickOf(o.unknownWhere, "on") === "off" ? "off" : "on",
    cascade: { start: lv === 3 ? "late" : "early", layout: pickOf(o.critRow, "sequence") === "rows" ? "rows" : "sequence", style: pickOf(o.ganttStyle, "blocks") === "bars" ? "bars" : "blocks" },
  });
  return {
    kind, level: lv, cpa: data, prompt,
    answer: { text: answerText, value: data.times.projectTime },
    matrixMode: "off",
  };
}

