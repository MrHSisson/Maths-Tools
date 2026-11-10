// Complete rebuild. Every slide/question ID belongs to this version; no old slide is retained.
import { Q, S, buildDeck } from "/src/decks/builder";
import { defaultRectilinear, type RectilinearSpec } from "/api/_rectilinear";
import { authoredSheetSlide } from "/src/decks/worksheets";
import type { CuratedQuestion, Slide } from "/src/decks/types";
export const ID = "year7-rectilinear-area";
const prefix = "rectilinear-r2";
function question(id:string, shape:RectilinearSpec["shape"], width:number, height:number, cutWidth:number, cutHeight:number, options:Partial<Omit<RectilinearSpec,"version"|"missingLength">>={}, purpose:CuratedQuestion["purpose"]="practice"):CuratedQuestion {
  return {...Q.rectilinear(`${prefix}-${id}`,{...defaultRectilinear(),shape,width,height,cutWidth,cutHeight,scaffold:"none",...options,reducedLabels:true}),purpose};
}
const model=(q:CuratedQuestion):CuratedQuestion=>({...q,purpose:"explain"});
export const partitionQuestions=[
  question("partition-l","L",9,7,4,3,{task:"partition"},"explain"),
  question("partition-t","T",12,9,3,5,{task:"partition"},"explain"),
  question("partition-stairs","stairs3",13,10,3,3,{task:"partition"},"explain"),
  question("partition-cross","cross",14,11,4,3,{task:"partition"},"explain"),
];
export const areaQuestions=[
  model(question("area-t1","T",10,7,3,5)),
  question("area-l1","L",8,6,3,2),
  question("area-t2","T",13,9,4,5,{orientation:4}),
  question("area-l2","L",11,8,4,5,{orientation:4}),
];
export const internalTeaching=[
  model(question("internal-model-stairs","stairs3",14,10,4,3,{scaffold:"split"})),
  question("internal-check-stairs","stairs3",13,11,3,4),
  model(question("internal-model-cross","cross",13,11,3,4,{scaffold:"split"})),
  question("internal-check-cross","cross",15,12,4,4),
];
export const internalPractice=[
  question("internal-p1","stairs3",15,12,4,4),
  question("internal-p2","stairs3",16,11,5,3,{orientation:1}),
  question("internal-p3","cross",14,12,3,4),
  question("internal-p4","cross",17,13,5,4,{orientation:1}),
  question("internal-p5","stairs3",18,13,4,4,{orientation:4}),
  question("internal-p6","stairs4",20,15,4,3),
];
export const oneCutout=[
  model(question("cut-l1","L",8,7,3,4,{method:"subtract"})),
  question("cut-l2","L",12,8,5,3,{method:"subtract",orientation:4}),
  model(question("cut-u1","U",14,10,6,6,{method:"subtract"})),
  question("cut-u2","U",17,12,7,8,{method:"subtract"}),
];
export const twoCutouts=[
  model(question("cut-m1","comb",16,11,3,6,{method:"subtract"})),
  question("cut-m2","comb",19,12,4,7,{method:"subtract"}),
  model(question("cut-n1","N",17,12,4,7,{method:"subtract"})),
  question("cut-n2","N",20,14,5,8,{method:"subtract"}),
];
export const frames=[
  model(question("cut-o1","frame",13,10,5,4,{method:"subtract"})),
  question("cut-o2","frame",15,11,7,6,{method:"subtract"}),
];
export const worksheetQuestions=[
  question("w1","T",12,8,3,5,{scaffold:"full"},"explain"),
  question("w2","L",9,7,4,3),
  question("w3","T",14,9,4,5,{orientation:4}),
  question("w4","L",13,9,5,4,{orientation:4}),
  question("w5","stairs3",15,11,4,3,{scaffold:"full"}),
  question("w6","cross",14,12,4,3,{orientation:1}),
  question("w7","cross",15,13,4,4),
  question("w8","stairs4",20,14,4,3),
  question("w9","U",16,11,6,7,{method:"subtract",scaffold:"full"}),
  question("w11","comb",18,13,4,8,{method:"subtract"}),
  question("w12","frame",19,14,9,7,{method:"subtract"}),
  question("w10","N",19,13,4,8,{method:"subtract"}),
];
export const questionSets={partitionQuestions,areaQuestions,internalTeaching,internalPractice,oneCutout,twoCutouts,frames,worksheetQuestions};
function header(slide:Slide,title:string):Slide {
  return {...slide,title,els:[...slide.els.map(e=>["questions","generator","worksheet"].includes(e.kind)?{...e,x:24,y:112,w:1552,h:764}:e),{id:`${slide.id}-header`,kind:"text",x:48,y:25,w:1504,h:66,text:title,size:40,bold:true}]};
}
function sequence(id:string,title:string,items:CuratedQuestion[],brief:string):Slide {
  return header({...S.deliberate(`${prefix}-${id}`,title,items,brief),family:items.every(q=>q.purpose==="practice")?"practice":"teach"},title);
}
function live(id:string,title:string,level:"level2"|"level3",seed:number):Slide {
  return header(S.general(`${prefix}-${id}`,title,"perimeter-and-area",{sub:"compound",level,multiSelect:{area:true,perimeter:false,all:true,missing:false,same:true,mixed:false,split:true,subtract:false},variables:{reducedLabels:true,showSplit:false}},seed,"Optional continuation. All external lengths given or directly implied; no external missing-side exercise."),title);
}
export default async function lesson(){
  return buildDeck({id:ID,title:"Area of rectilinear shapes",summary:"Fresh lesson: partition; T/L area; internal dimensions; L/U, M/N and O cut-outs. Worksheet: four questions per stage with first-item scaffolds. No discussion slides.",tool:"perimeter-and-area",slides:[
    S.title(`${prefix}-title`,"Area of rectilinear shapes","Partition · Find internal lengths · Remove cut-outs"),
    sequence("partitions","Split into rectangles",partitionQuestions,"Four questions in ONE sequence: L, T, staircase, cross. Draw partitions only, no areas. Accept different rectangle partitions with no gaps or overlaps."),
    sequence("area","Area by splitting",areaQuestions,"Four unpartitioned questions in T–L–T–L order. Model the first, then pupils attempt the remaining three. Reveal partition, rectangle areas and total. No internal-length arithmetic needed in this set."),
    sequence("internal-teaching","Find internal lengths first",internalTeaching,"Two teaching pairs. First staircase model: supplied partition, calculate 14−4=10 before area; second staircase for pupils. Then a cross model adding the adjacent spans, followed by a pupil check. All boundary lengths given or implied."),
    sequence("internal-practice","Internal lengths: practice",internalPractice,"Six graded questions matching the teaching. The final four-step staircase needs two internal widths and is an extension/continuation question. No U/N/M/O here; those belong to cut-outs."),
    sequence("one-cutout","Remove one part: L and U",oneCutout,"L model and pupil check, then U transfer model and pupil check. Reveal whole rectangle, removed rectangle, then subtract their AREAS. Paired checks can continue next lesson if needed."),
    sequence("two-cutouts","Remove two parts: M and N",twoCutouts,"M has two same-side notches; N has opposing offset notches. Model/check each. Find overall dimensions from given spans where necessary, then remove BOTH rectangular areas."),
    sequence("frames","Remove a hole: O shapes",frames,"Outer rectangle minus enclosed inner rectangle. One model and one pupil check. Do not multiply border thicknesses."),
    header(authoredSheetSlide(`${prefix}-worksheet`,"Rectilinear area — independent practice",worksheetQuestions),"Independent practice"),
    S.summary(`${prefix}-review`,"Check your method",["Partition into rectangles with no gaps or overlaps","Find required internal dimensions before areas","Add component areas, or subtract every removed area","Check dimensions and use square units"]),
    live("optional-split","Optional: internal-length practice","level2",421),
    live("optional-cutout","Optional: cut-out practice","level3",317),
  ]});
}
