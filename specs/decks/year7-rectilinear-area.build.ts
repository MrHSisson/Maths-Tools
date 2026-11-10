// Rebuild through the deck CLI; all authored diagrams and solutions use the live tool's builder.
import { Q, S, buildDeck } from "/src/decks/builder";
import { defaultRectilinear, type RectilinearSpec } from "/api/_rectilinear";
import { authoredSheetSlide } from "/src/decks/worksheets";
import type { CuratedQuestion, Slide } from "/src/decks/types";
export const ID = "year7-rectilinear-area";
const make = (id: string, patch: Partial<RectilinearSpec> = {}, purpose: CuratedQuestion["purpose"] = "practice") => ({ ...Q.rectilinear(id, { ...defaultRectilinear(), ...patch, reducedLabels: true }), purpose });
export const models = {
  split: make("y7-model-split", { shape: "T", width: 10, height: 7, cutWidth: 3, cutHeight: 5, scaffold: "full" }, "explain"),
  add: make("y7-model-add", { shape: "cross", width: 13, height: 11, cutWidth: 3, cutHeight: 4, scaffold: "split" }, "explain"),
  subtract: make("y7-model-subtract", { shape: "stairs3", width: 14, height: 12, cutWidth: 3, cutHeight: 4, scaffold: "split" }, "explain"),
  cutout: make("y7-model-cutout", { shape: "L", width: 8, height: 6, cutWidth: 3, cutHeight: 2, method: "subtract", scaffold: "none" }, "explain"),
  frame: make("y7-frame-model", { shape: "frame", width: 13, height: 10, cutWidth: 5, cutHeight: 4, method: "subtract", scaffold: "none" }, "explain"),
  choice: make("y7-method-choice", { shape: "comb", width: 16, height: 11, cutWidth: 3, cutHeight: 6, method: "subtract", scaffold: "none" }, "explain"),
  exit: make("y7-exit-area", { shape: "comb", width: 18, height: 13, cutWidth: 4, cutHeight: 8, method: "subtract", scaffold: "none" }, "diagnose"),
};
export const practiceOne: CuratedQuestion[] = [
  make("y7-p1", { width: 7, height: 6, cutWidth: 2, cutHeight: 3 }),
  make("y7-p2", { shape: "T", width: 11, height: 8, cutWidth: 3, cutHeight: 5 }),
  make("y7-p3", { shape: "T", width: 13, height: 9, cutWidth: 4, cutHeight: 5, orientation: 1, scaffold: "split" }),
  make("y7-p4", { shape: "stairs3", width: 14, height: 10, cutWidth: 4, cutHeight: 3, scaffold: "split" }),
  make("y7-p5", { shape: "cross", width: 13, height: 11, cutWidth: 3, cutHeight: 4, scaffold: "none" }),
  make("y7-p6", { shape: "U", width: 15, height: 9, cutWidth: 5, cutHeight: 6, scaffold: "none" }),
];
export const practiceTwo: CuratedQuestion[] = [
  make("y7-m1", { shape: "T", width: 12, height: 8, cutWidth: 3, cutHeight: 4, scaffold: "none" }),
  make("y7-m2", { shape: "stairs3", width: 13, height: 12, cutWidth: 3, cutHeight: 4, orientation: 1, scaffold: "none" }),
  make("y7-m3", { shape: "stairs3", width: 16, height: 13, cutWidth: 4, cutHeight: 3, scaffold: "none" }),
  make("y7-m4", { shape: "U", width: 16, height: 11, cutWidth: 5, cutHeight: 7, orientation: 4, scaffold: "none" }),
  make("y7-m5", { shape: "T", width: 15, height: 11, cutWidth: 4, cutHeight: 6, scaffold: "none" }),
  make("y7-m6", { shape: "comb", width: 19, height: 12, cutWidth: 4, cutHeight: 7, orientation: 3, scaffold: "none" }),
];
export const cutoutPractice: CuratedQuestion[] = [
  make("y7-c1", { shape: "L", width: 13, height: 10, cutWidth: 5, cutHeight: 6, method: "subtract", scaffold: "none" }),
  make("y7-c2", { shape: "L", width: 12, height: 9, cutWidth: 6, cutHeight: 5, method: "subtract", scaffold: "none" }),
  make("y7-c3", { shape: "comb", width: 17, height: 10, cutWidth: 3, cutHeight: 6, method: "subtract", scaffold: "none" }),
  make("y7-c4", { shape: "comb", width: 16, height: 12, cutWidth: 3, cutHeight: 7, orientation: 1, method: "subtract", scaffold: "none" }),
  make("y7-c5", { shape: "frame", width: 15, height: 11, cutWidth: 7, cutHeight: 6, method: "subtract", scaffold: "none" }),
  make("y7-c6", { shape: "frame", width: 20, height: 13, cutWidth: 8, cutHeight: 8, orientation: 4, method: "subtract", scaffold: "none" }),
];
export const worksheetQuestions: CuratedQuestion[] = [
  make("y7-w1", { task:"partition", width: 9, height: 5, cutWidth: 4, cutHeight: 2, scaffold: "none" }),
  make("y7-w2", { task:"partition", shape: "T", width: 12, height: 8, cutWidth: 3, cutHeight: 5, scaffold: "none" }),
  make("y7-w3", { task:"partition", shape: "stairs3", width: 15, height: 11, cutWidth: 4, cutHeight: 3, scaffold: "none" }),
  make("y7-w4", { task:"partition", shape: "cross", width: 13, height: 10, cutWidth: 3, cutHeight: 4, scaffold: "none" }),
  make("y7-w5", { shape: "cross", width: 14, height: 12, cutWidth: 3, cutHeight: 4, scaffold: "split" }),
  make("y7-w6", { shape: "stairs3", width: 16, height: 11, cutWidth: 3, cutHeight: 4, scaffold: "none" }),
  make("y7-w7", { shape: "stairs3", width: 17, height: 12, cutWidth: 4, cutHeight: 3, scaffold: "none" }),
  make("y7-w8", { shape: "U", width: 17, height: 11, cutWidth: 6, cutHeight: 7, scaffold: "none" }),
  make("y7-w9", { shape: "L", width: 12, height: 10, cutWidth: 3, cutHeight: 4, method: "subtract", scaffold: "none" }),
  make("y7-w10", { shape: "comb", width: 17, height: 11, cutWidth: 3, cutHeight: 6, method: "subtract", scaffold: "none" }),
  make("y7-w11", { shape: "frame", width: 19, height: 13, cutWidth: 9, cutHeight: 7, method: "subtract", scaffold: "none" }),
  make("y7-w12", { shape: "frame", width: 17, height: 13, cutWidth: 9, cutHeight: 7, method: "subtract", scaffold: "none" }),
];
const model = (sid: string, title: string, item: CuratedQuestion, prompt?: string): Slide => {
  const s = { ...S.deliberate(sid, title, [item], "Discuss the diagram before revealing the tool's canonical working. Every omitted label is implied; a question mark is deliberately unknown."), family: "teach" as const };
  void prompt;
  return s;
};
const generator = (sid: string, missing: boolean): Slide => ({ id: sid, title: missing ? "Missing lengths, then area" : "General practice", family: "practice", brief: missing ? "Find marked missing lengths by adding or subtracting, then calculate area. Use fresh questions as needed; full-width reveals the shared working." : "Area only, with all necessary boundary lengths given or directly implied; ask pupils to suggest a split before revealing the working.", els: [{ id: sid + "-el", kind: "generator", tool: "perimeter-and-area", preset: { sub: "compound", level: missing ? "level2" : "level1", multiSelect: { area: true, perimeter: false, all: !missing, missing, split: true, subtract: false }, variables: { reducedLabels: true, showSplit: false } }, seed: missing ? 421 : 123, presentation: "full", x: 24, y: 24, w: 1552, h: 852 }] });
export default async function lesson() {
  const why = { ...Q.open("y7-exit-explain", "perimeter-and-area", "level1", "Explain why we add rectangle areas when splitting, but subtract the cut-out area when using the whole rectangle.", "Splitting covers the shape exactly once. The enclosing rectangle includes an extra cut-out, so remove its area. Give area in cm²."), purpose: "explain" as const };
  const partition = [
    make("y7-partition-l", {task:"partition",width:9,height:7,cutWidth:4,cutHeight:3,scaffold:"none"}, "explain"),
    make("y7-partition-t", {task:"partition",shape:"T",width:12,height:9,cutWidth:3,cutHeight:5,scaffold:"none"}, "explain"),
    make("y7-partition-stairs", {task:"partition",shape:"stairs3",width:13,height:10,cutWidth:3,cutHeight:3,scaffold:"none"}, "explain"),
    make("y7-partition-cross", {task:"partition",shape:"cross",width:14,height:11,cutWidth:4,cutHeight:3,scaffold:"none"}, "explain"),
  ];
  return buildDeck({id:ID,title:"Area of rectilinear shapes",summary:"Partition first; find internal rectangle dimensions; split and add; subtract L, M and O cut-outs.",tool:"perimeter-and-area",slides:[
    S.title(ID+"-title","Area of rectilinear shapes","Split into rectangles · Find internal lengths · Remove cut-outs"),
    ...partition.map((q,i)=>{
      const slide=model(ID+"-partition-"+(i+1),"Split into rectangles — "+(i+1),{...q,answer:["Any valid rectangle partition with no gaps or overlaps."],explanation:["Draw straight cuts to make rectangles. No area calculation yet."]},"");
      slide.brief="Partition only: pupils use the pen or mini-whiteboards. Accept different valid partitions; discuss after all four shapes. Do not calculate areas here.";
      slide.els=slide.els.map(e=>e.kind==="questions"?{...e,y:110,h:765}:e);
      slide.els.push({id:slide.id+"-instruction",kind:"text",x:60,y:28,w:1480,h:65,size:36,text:"Draw a split into rectangles. No calculation yet."});
      return slide;
    }),
    S.discuss(ID+"-partition-discussion","Which splits are valid?","A rectilinear shape has straight sides meeting at right angles. Rectangles cover it exactly once, with no gaps or overlaps. Different partitions can work.","Which split makes the rectangle dimensions easiest to identify?","\\text{No gaps or overlaps}"),
    model(ID+"-split","Split and add: worked example",models.split),
    model(ID+"-internal-stairs","Find internal widths first",models.subtract),
    model(ID+"-internal-cross","Build an internal length by adding",models.add),
    S.deliberate(ID+"-internal-practice","Internal lengths, then area",practiceTwo,"All external lengths are given or directly implied. Draw a split, calculate the internal rectangle dimensions, then areas. Internal-length calculations appear before multiplication in the working."),
    generator(ID+"-split-generator",false),
    model(ID+"-l-cutout","L-shape: whole minus cut-out",models.cutout),
    model(ID+"-m-cutout","M-shape: remove both cut-outs",models.choice),
    model(ID+"-o-cutout","O-shape: remove the inner rectangle",models.frame),
    S.deliberate(ID+"-cutout-practice","L, M and O: choose a method",cutoutPractice,"Start with one missing corner, then two notches (M), then an enclosed hole (O). Subtract areas, not lengths."),
    { ...generator(ID+"-cutout-generator",false),title:"M and O cut-outs: general practice",els:[{id:ID+"-cutout-generator-el",kind:"generator",tool:"perimeter-and-area",preset:{sub:"compound",level:"level3",multiSelect:{area:true,perimeter:false,all:true,missing:false,same:true,mixed:false},variables:{reducedLabels:true,showSplit:false}},seed:317,presentation:"full",x:24,y:24,w:1552,h:852}]},
    authoredSheetSlide(ID+"-worksheet","Rectilinear area — partition, internal lengths, cut-outs",worksheetQuestions),
    S.summary(ID+"-summary","Choose your method",["Draw a valid partition","Calculate internal rectangle lengths before areas","Add component areas, or subtract all cut-out areas","Use square units"]),
    {...S.deliberate(ID+"-exit","Explain and apply",[models.exit,why],"No external missing-length questions. Explain which internal rectangle dimensions or removed areas are needed."),family:"retrieval" as const},
  ]});
}
