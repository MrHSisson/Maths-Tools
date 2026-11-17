import { describe, expect, it } from "vitest";
import snapshot from "../decks/data/year7-rectilinear-area.json";
import type { DeckDef } from "../decks/types";
import { rectilinearQuestion } from "../decks/rectilinear";
import { extras } from "../shared/questionExtras";
import type { Drawing } from "../shared/shapes/drawing";

const deck = snapshot as DeckDef;
const sequence = (index:number) => {
  const el=deck.slides[index].els.find(e=>e.kind==="questions");
  if(el?.kind!=="questions")throw Error("Expected a question sequence");
  return el.items;
};
describe("rebuilt Year 7 lesson progression",()=>{
  it("retains only fresh slides with visible headers and no discussion prompts",()=>{
    expect(deck.slides).toHaveLength(12);
    for(const slide of deck.slides){
      expect(slide.id.startsWith("rectilinear-r2-")).toBe(true);
      expect(slide.els.some(e=>e.kind==="text"&&e.text.toLowerCase()===slide.title.toLowerCase())).toBe(true);
      expect(slide.title).not.toMatch(/discuss/i);
      expect(slide.family).not.toBe("discussion");
      expect(slide.els.some(e=>e.kind==="depth")).toBe(false);
    }
  });
  it("keeps the four partitions together, then alternates T and L without internal-length arithmetic",()=>{
    const partitions=sequence(1),area=sequence(2);
    expect(partitions.map(q=>q.rectilinear?.shape)).toEqual(["L","T","stairs3","cross"]);
    expect(partitions.every(q=>q.rectilinear?.task==="partition"&&q.rectilinear.scaffold==="none")).toBe(true);
    expect(area.map(q=>q.rectilinear?.shape)).toEqual(["T","L","T","L"]);
    for(const q of area){
      expect(q.rectilinear?.scaffold).toBe("none");
      expect(rectilinearQuestion(q.rectilinear!).working.some(w=>w.label?.includes("Find the internal"))).toBe(false);
    }
    expect(sequence(3).map(q=>q.rectilinear?.scaffold)).toEqual(["split","none","split","none"]);
  });
  it("provides four worksheet questions per stage: partitions, internal lengths, then cut-outs with the N among them",()=>{
    const sheet=deck.slides[8].els.find(e=>e.kind==="worksheet");
    if(sheet?.kind!=="worksheet")throw Error("Expected the authored worksheet");
    const qs=sheet.authored!;
    expect(qs).toHaveLength(12);
    // A: four partition tasks (the first with a supplied split); B and C: first item scaffolded, the rest independent
    expect(qs.slice(0,4).every(q=>q.rectilinear?.task==="partition")).toBe(true);
    expect(qs.map(q=>q.rectilinear?.scaffold)).toEqual(["split","none","none","none","full","none","none","none","full","none","none","none"]);
    expect(qs.slice(4,8).map(q=>q.rectilinear?.shape)).toEqual(["stairs3","stairs3","cross","stairs4"]);
    expect(qs.slice(4,8).every(q=>rectilinearQuestion(q.rectilinear!).working.some(w=>w.label?.includes("Find the internal")))).toBe(true);
    expect(qs.slice(8).map(q=>q.rectilinear?.shape).sort()).toEqual(["N","U","comb","frame"]);
    expect(qs.slice(8).every(q=>q.rectilinear?.method==="subtract")).toBe(true);
    const all=[...Array.from({length:7},(_,i)=>sequence(i+1)).flat(),...qs];
    expect(all.every(q=>q.id.startsWith("rectilinear-r2-")&&!q.rectilinear?.missingLength)).toBe(true);
  });
  it("gives the internal-length practice six fresh graded questions with the crowded step lengths drawn inside",()=>{
    const items=sequence(4);
    expect(items.map(q=>q.rectilinear?.shape)).toEqual(["stairs3","cross","stairs3","cross","stairs3","stairs4"]);
    expect(new Set(items.map(q=>q.answer[0])).size).toBe(6);
    expect(items.every(q=>q.rectilinear?.insideLengths&&rectilinearQuestion(q.rectilinear).working.some(w=>w.label?.includes("Find the internal")))).toBe(true);
    // the lengths either side of a 270° corner are never both outside: some of each pair is drawn inside, but not every length
    for(const q of items){
      const d=extras(rectilinearQuestion(q.rectilinear!))._diagram as Drawing;
      const inside=d.edges.filter(e=>e.inside).length;
      expect(inside).toBeGreaterThan(0);
      expect(inside).toBeLessThan(d.edges.filter(e=>e.kind==="plain"&&e.label).length);
    }
  });
});
