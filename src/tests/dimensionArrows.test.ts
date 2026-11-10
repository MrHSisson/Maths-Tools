import { describe, expect, it } from "vitest";
import { withSeededRandom } from "./seededRandom";
import { genCompound } from "../tools/Geometry/perimeterArea/compound";
import { rectilinearQuestion } from "../decks/rectilinear";
import { defaultRectilinear } from "../../api/_rectilinear";
import { extras } from "../shared/questionExtras";
import { dimensionPlan } from "../shared/shapes/dimensions";
import { rectGap, segHitsRect, segsCross } from "../shared/shapes/labels";
import type { Drawing } from "../shared/shapes/drawing";

function audit(d:Drawing,small:boolean) {
  const p=dimensionPlan(d,small),bad:string[]=[];
  d.edges.forEach((e,i)=>{
    if(e.kind === "plain" && e.label || e.kind === "missing")expect(p.dimensions.some(m=>m.edge===i)).toBe(true);
    if(e.kind === "hidden") {
      const axis=e.a[1]===e.b[1]?0:1,lo=Math.min(e.a[axis],e.b[axis]),hi=Math.max(e.a[axis],e.b[axis]);
      expect(d.edges.some(f=>f.kind === "plain" && f.label && (f.a[1]===f.b[1]?0:1)===axis && Math.min(f.a[axis],f.b[axis])===lo && Math.max(f.a[axis],f.b[axis])===hi)).toBe(true);
    }
  });
  for(let i=0;i<p.dimensions.length;i++) {
    const a=p.dimensions[i], {line:l}=a;
    expect(Math.abs(a.vertical?l.x1-p.X(a.a[0]):l.y1-p.Y(a.a[1]))).toBeCloseTo(10,8);
    // Full-width / full-height endpoints stay tied to the actual measured span.
    expect(a.vertical?[l.y1,l.y2]:[l.x1,l.x2]).toEqual(a.vertical?[Math.min(p.Y(a.a[1]),p.Y(a.b[1])),Math.max(p.Y(a.a[1]),p.Y(a.b[1]))]:[Math.min(p.X(a.a[0]),p.X(a.b[0])),Math.max(p.X(a.a[0]),p.X(a.b[0]))]);
    if(p.shape.some(s=>segHitsRect(s,a.label,.1)))bad.push("text touches outline");
    for(let j=i+1;j<p.dimensions.length;j++) {
      const b=p.dimensions[j];
      if(rectGap(a.label,b.label)<0)bad.push("text overlaps");
      if(a.segments.some(s=>segHitsRect(s,b.label,.1))||b.segments.some(s=>segHitsRect(s,a.label,.1)))bad.push("dimension crosses text");
      if(a.segments.some(s=>b.segments.some(t=>segsCross(s,t))))bad.push("dimension lines cross");
    }
  }
  return bad;
}
describe("rectilinear dimension arrows",()=>{
  it("keeps measured endpoints and clears right-angle corners across authored families and orientations",()=>{
    const bad:string[]=[];
    for(const shape of ["L","T","stairs3","cross","U","comb","frame"] as const) for(let orientation=0;orientation<8;orientation++) for(const method of ["split","subtract"] as const) {
      const d=extras(rectilinearQuestion({...defaultRectilinear(),shape,width:17,height:13,cutWidth:5,cutHeight:4,orientation,method}))._diagram as Drawing;
      for(const small of [false,true])bad.push(...audit(d,small).map(x=>`${shape}/${orientation}/${method}/${small}: ${x}`));
    }
    expect(bad).toEqual([]);
  });
  it("keeps missing-length positions fixed on reveal and avoids collisions on seeded live questions",()=>withSeededRandom(20261110,()=>{
    const bad:string[]=[];
    for(const level of ["level1","level2","level3"] as const) for(let i=0;i<30;i++) {
      const d=genCompound(level,{area:true,perimeter:false,missing:i%2===0,all:i%2!==0,same:true,mixed:false},{reducedLabels:i%4!==0,showSplit:i%3===0}).drawing;
      for(const small of [false,true]){
        bad.push(...audit(d,small).map(x=>`${level}/${i}/${small}: ${x}`));
        expect(dimensionPlan(d,small).dimensions.map(m=>m.line)).toEqual(dimensionPlan(d,small,true).dimensions.map(m=>m.line));
      }
    }
    expect(bad).toEqual([]);
  }));
});
