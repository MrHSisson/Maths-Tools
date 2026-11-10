import { useMemo } from "react";
import { dimensionPlan } from "./dimensions";
import type { Drawing, Focus } from "./drawing";

/** Full-span arrows replace floating pills, equality tabs and caption text on rectilinear pictures. */
export function DimensionDiagram({d,showAnswer,small=false,fillBox=false,dataIndex,focus,hideCaption=false}:{d:Drawing;showAnswer:boolean;small?:boolean;fillBox?:boolean;dataIndex?:number;focus?:Focus;hideCaption?:boolean}) {
  const p=useMemo(()=>dimensionPlan(d,small,showAnswer,focus),[d,small,showAnswer,focus]);
  const {X,Y,fs}=p;
  const capH=hideCaption?0:d.caption.length*fs;
  const path=(pts:Drawing["polys"][number])=>pts.map((q,i)=>`${i?"L":"M"}${X(q[0])},${Y(q[1])}`).join(" ")+" Z";
  const arrow=(x:number,y:number,dx:number,dy:number,key:string)=>{const a=fs*.22,b=fs*.12;return <path key={key} d={`M${x},${y} L${x+dx*a-dy*b},${y+dy*a+dx*b} L${x+dx*a+dy*b},${y+dy*a-dx*b} Z`} fill="currentColor"/>;};
  const shown=d.regions.filter(r=>r.always||focus?.regions?.includes(r.id));
  return <svg data-dimension-diagram="" viewBox={`${p.x} ${p.y-capH} ${p.W} ${p.H+capH}`} style={{display:"block",width:"100%",height:fillBox?"100%":"auto"}} {...(dataIndex!==undefined?{"data-q-index":dataIndex}:{})}>
    {!hideCaption && d.caption.map((c,i)=><text key={i} x={p.x+p.W/2} y={p.y-capH+fs*(i+.7)} textAnchor="middle" fontSize={fs*.65} fill="#334155">{c}</text>)}
    <path d={d.polys.map(path).join(" ")} fill="#e0e7ff" fillRule="evenodd" stroke="#4338ca" strokeWidth={small?1.5:2.5} strokeLinejoin="round"/>
    {shown.map(r=><path key={r.id} d={path(r.pts)} fill={r.color} fillOpacity={.55} stroke="#4338ca" strokeWidth={small?1:1.5} strokeDasharray="5 4"/>)}
    {d.helpers.filter(h=>!h.label&&(h.always||focus?.helpers?.includes(h.id))).map(h=><line key={h.id} x1={X(h.a[0])} y1={Y(h.a[1])} x2={X(h.b[0])} y2={Y(h.b[1])} stroke="#64748b" strokeWidth={small?1:1.5} strokeDasharray="5 4"/>)}
    {p.letters.filter(l=>shown.some(r=>r.id===l.id)).map(l=><text key={l.id} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="central" fontSize={fs*.85} fontWeight={700} fill="#334155">{l.text}</text>)}
    {p.dimensions.filter(m=>m.visible).map(m=>{const {line:l,label:r,vertical:v}=m;const text=m.found?(m.value??m.text):m.text;const color=m.text==="?"?(m.found?"#166534":"#b45309"):"#1e3a8a";
      const gap=(v?r.h:r.w)/2+fs*.12,mid=v?r.y:r.x,lo=v?l.y1:l.x1,hi=v?l.y2:l.x2;
      const part=(a:number,b:number,key:string)=>b>a?<line key={key} x1={v?l.x1:a} y1={v?a:l.y1} x2={v?l.x1:b} y2={v?b:l.y1} stroke="currentColor" strokeWidth={small?.8:1.3}/>:null;
      return <g key={m.id} data-dimension={m.id} data-span={`${m.a.join(",")}:${m.b.join(",")}`} color={color}>
        {m.extensions.map((e,i)=><line key={i} {...{x1:e.x1,y1:e.y1,x2:e.x2,y2:e.y2}} stroke="currentColor" strokeWidth={small?.6:1} opacity={.55}/>)}
        {part(lo,Math.min(hi,mid-gap),"before")}{part(Math.max(lo,mid+gap),hi,"after")}
        {arrow(l.x1,l.y1,v?0:1,v?1:0,"start")}{arrow(l.x2,l.y2,v?0:-1,v?-1:0,"end")}
        <text x={r.x} y={r.y} transform={v?`rotate(-90 ${r.x} ${r.y})`:undefined} textAnchor="middle" dominantBaseline="central" fontSize={fs} fontWeight={600} fill={color} stroke="white" strokeWidth={small?2:4} paintOrder="stroke">{text}</text>
      </g>;})}
  </svg>;
}
