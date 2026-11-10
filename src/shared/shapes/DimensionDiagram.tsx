import { useEffect, useMemo, useRef, useState } from "react";
import { dimensionPlan } from "./dimensions";
import type { Drawing, Focus } from "./drawing";

/** Boundary arrows stay ten screen pixels from their own edge, including on resized slides. */
export function DimensionDiagram({d,showAnswer,small=false,fillBox=false,dataIndex,focus,hideCaption=false,pixelSize}:{d:Drawing;showAnswer:boolean;small?:boolean;fillBox?:boolean;dataIndex?:number;focus?:Focus;hideCaption?:boolean;pixelSize?:{w:number;h:number}}) {
  const svg=useRef<SVGSVGElement>(null),[size,setSize]=useState<{w:number;h:number}|null>(null);
  useEffect(()=>{
    if(!svg.current)return;
    const measure=()=>{if(!svg.current)return;const {width:w,height:h}=svg.current.getBoundingClientRect();setSize(old=>old&&Math.abs(old.w-w)<.1&&Math.abs(old.h-h)<.1?old:{w,h});};
    const observer=new ResizeObserver(measure);observer.observe(svg.current);
    const resize=()=>requestAnimationFrame(()=>requestAnimationFrame(measure));
    window.addEventListener("resize",resize);measure();
    return()=>{observer.disconnect();window.removeEventListener("resize",resize);};
  },[]);

  const p=useMemo(()=>{
    let plan=dimensionPlan(d,small,showAnswer,focus);
    const viewport=size??pixelSize;
    if(viewport?.w && viewport.h)for(let i=0;i<5;i++){const cap=hideCaption?0:d.caption.length*plan.fs,scale=Math.min(viewport.w/plan.W,viewport.h/(plan.H+cap));plan=dimensionPlan(d,small,showAnswer,focus,10/scale);}
    return plan;
  },[d,small,showAnswer,focus,size,hideCaption,pixelSize]);
  const {X,Y,fs}=p,capH=hideCaption?0:d.caption.length*fs;
  const path=(pts:Drawing["polys"][number])=>pts.map((q,i)=>`${i?"L":"M"}${X(q[0])},${Y(q[1])}`).join(" ")+" Z";
  const arrow=(x:number,y:number,dx:number,dy:number,key:string)=>{const a=Math.min(fs*.22,p.gap*.5),b=a*.55;return <path key={key} d={`M${x},${y} L${x+dx*a-dy*b},${y+dy*a+dx*b} L${x+dx*a+dy*b},${y+dy*a-dx*b} Z`} fill="currentColor"/>;};
  const shown=d.regions.filter(r=>r.always||focus?.regions?.includes(r.id));
  return <svg ref={svg} role="img" aria-label={[d.caption.join(" "),...p.dimensions.map(m=>`${m.vertical?"vertical":"horizontal"} edge: ${m.found?(m.value??m.text):m.text}`)].filter(Boolean).join("; ")} data-dimension-diagram="" data-edge-gap="10" viewBox={`${p.x} ${p.y-capH} ${p.W} ${p.H+capH}`} style={{display:"block",width:"100%",height:fillBox?"100%":"auto"}} {...(dataIndex!==undefined?{"data-q-index":dataIndex}:{})}>
    {!hideCaption&&d.caption.map((c,i)=><text key={i} x={p.x+p.W/2} y={p.y-capH+fs*(i+.7)} textAnchor="middle" fontSize={fs*.65} fill="#334155">{c}</text>)}
    <path data-shape-outline="" d={d.polys.map(path).join(" ")} fill="#e0e7ff" fillRule="evenodd" stroke="#4338ca" strokeWidth={small?1.5:2.5} strokeLinejoin="round"/>
    {shown.map(r=><path key={r.id} d={path(r.pts)} fill={r.color} fillOpacity={.55} stroke="#4338ca" strokeWidth={small?1:1.5} strokeDasharray="5 4"/>)}
    {d.helpers.filter(h=>!h.label&&(h.always||focus?.helpers?.includes(h.id))).map(h=><line key={h.id} x1={X(h.a[0])} y1={Y(h.a[1])} x2={X(h.b[0])} y2={Y(h.b[1])} stroke="#64748b" strokeWidth={small?1:1.5} strokeDasharray="5 4"/>)}
    {p.letters.filter(l=>shown.some(r=>r.id===l.id)).map(l=><text key={l.id} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="central" fontSize={fs*.85} fontWeight={700} fill="#334155">{l.text}</text>)}
    {p.dimensions.map(m=>{const {line:l,label:r,vertical:v}=m,text=m.found?(m.value??m.text):m.text,color=m.text==="?"?(m.found?"#166534":"#b45309"):"#1e3a8a";
      return <g key={m.id} data-dimension={m.id} data-edge={m.edge} data-source={`${X(m.a[0])},${Y(m.a[1])},${X(m.b[0])},${Y(m.b[1])}`} data-arrow={`${l.x1},${l.y1},${l.x2},${l.y2}`} color={color}>
        {m.segments.map((s,i)=><line key={i} {...s} stroke="currentColor" strokeWidth={small?.8:1.3} vectorEffect="non-scaling-stroke"/>)}
        {arrow(l.x1,l.y1,v?0:1,v?1:0,"start")}{arrow(l.x2,l.y2,v?0:-1,v?-1:0,"end")}
        <text x={r.x} y={r.y} transform={v?`rotate(-90 ${r.x} ${r.y})`:undefined} textAnchor="middle" dominantBaseline="central" fontSize={fs} fontWeight={600} fill={color} stroke="white" strokeWidth={small?2:4} paintOrder="stroke">{text}</text>
      </g>;})}
  </svg>;
}
