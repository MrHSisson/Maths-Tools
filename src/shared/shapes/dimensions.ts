import { boxOf, insideShape, type Pt } from "./model";
import { rectGap, segHitsRect, segsCross, type Rect, type Seg } from "./labels";
import type { Drawing, Focus } from "./drawing";

interface PlacedDimension {
  id: string; a: Pt; b: Pt; text: string; value?: string; edge: number;
  options: {rect:Rect; cost:number}[]; line: Seg; segments: Seg[]; label: Rect; vertical: boolean; visible: boolean; found: boolean;
}

/** Each arrow follows its own boundary edge at a fixed perpendicular gap; no overall dimension frame. */
export function dimensionPlan(d: Drawing, small = false, answer = false, focus?: Focus, gap = 10) {
  const box = boxOf(d.polys), fs = small ? 12 : 30;
  const sc = (small ? 240 : 600) / Math.max(box.x1-box.x0, box.y1-box.y0, 1);
  const X = (x: number) => (x-box.x0)*sc, Y = (y: number) => (box.y1-y)*sc;
  const shape: Seg[] = d.polys.flatMap(p => p.map((a,i) => { const b=p[(i+1)%p.length]; return {x1:X(a[0]),y1:Y(a[1]),x2:X(b[0]),y2:Y(b[1])}; }));
  const letters = d.regions.filter(r=>r.text).map(r => { const b=boxOf([r.pts]);return {id:r.id,text:r.text!,x:X(b.x0)+fs*.8,y:Y(b.y1)+fs*.85,w:fs,h:fs*1.2}; });
  const placed: PlacedDimension[] = [];
  d.edges.forEach((e,i)=>{
    if(e.kind === "hidden" || e.kind === "plain" && !e.label)return;
    const ax=X(e.a[0]),ay=Y(e.a[1]),bx=X(e.b[0]),by=Y(e.b[1]),vertical=ax===bx;
    const dx=e.b[0]-e.a[0],dy=e.b[1]-e.a[1],len=Math.hypot(dx,dy)||1;
    let nx=dy/len,ny=-dx/len;
    if(insideShape((e.a[0]+e.b[0])/2+nx*.001,(e.a[1]+e.b[1])/2+ny*.001,d.polys)){nx=-nx;ny=-ny;}
    ny=-ny;
    const line=vertical?{x1:ax+nx*gap,y1:Math.min(ay,by),x2:ax+nx*gap,y2:Math.max(ay,by)}:{x1:Math.min(ax,bx),y1:ay+ny*gap,x2:Math.max(ax,bx),y2:ay+ny*gap};
    const text=e.kind === "plain"?e.label:"?",chars=Math.max(text.length,e.value?.length??0);
    const width=chars*fs*.57+fs*.25,height=fs*1.25,w=vertical?height:width,h=vertical?width:height;
    let label:Rect={x:(line.x1+line.x2)/2+nx*(height/2+4),y:(line.y1+line.y2)/2+ny*(height/2+4),w,h},best=Infinity;
    const options:{rect:Rect;cost:number}[]=[];
    for(const padding of gap>=height/2+1?[height/2+4,0]:[height/2+4])for(const extra of [0,fs*.35,fs*.7,fs*1.1,fs*1.7,fs*2.5,fs*3.5])for(const t of [.5,.3,.7,.35,.65,.2,.8,.05,.95,-.15,1.15]){
      const r={x:line.x1+(line.x2-line.x1)*t+nx*(padding+extra),y:line.y1+(line.y2-line.y1)*t+ny*(padding+extra),w,h};
      let cost=extra+Math.abs(t-.5)*fs+(padding===0?2:0);
      options.push({rect:r,cost});
      cost+=shape.filter(s=>segHitsRect(s,r,fs*.08)).length*100000;
      if(insideShape(box.x0+r.x/sc,box.y1-r.y/sc,d.polys))cost+=100000;
      for(const p of placed){const space=rectGap(p.label,r);if(space<0)cost+=200000;else cost+=Math.max(0,fs*.1-space)*2;if(segHitsRect(p.line,r,fs*.1))cost+=20000;}
      if(cost<best){best=cost;label=r;}
    }
    placed.push({id:`edge-${i}`,a:e.a,b:e.b,text,value:e.value,edge:i,options,line,segments:[],label,vertical,visible:true,found:answer||!!focus?.reveal?.includes(i)});
  });
  for(let pass=0;pass<3;pass++)for(const p of pass%2?[...placed].reverse():placed){
    let best=Infinity;
    for(const option of p.options){const r=option.rect;let cost=option.cost;
      cost+=shape.filter(s=>segHitsRect(s,r,fs*.08)).length*100000;
      if(insideShape(box.x0+r.x/sc,box.y1-r.y/sc,d.polys))cost+=100000;
      for(const q of placed)if(q!==p){const space=rectGap(q.label,r);if(space<0)cost+=200000;else cost+=Math.max(0,fs*.1-space)*2;if(segHitsRect(q.line,r,fs*.1))cost+=20000;}
      if(cost<best){best=cost;p.label=r;}
    }
  }
  // At a re-entrant corner, two fixed-offset arrows can cross. Break the later stroke locally;
  // retain both endpoint arrowheads and the exact measured spans.
  placed.forEach((p,i)=>{
    const lo=p.vertical?p.line.y1:p.line.x1,hi=p.vertical?p.line.y2:p.line.x2;
    const cuts:[number,number][]=[];
    placed.forEach((q,j)=>{
      if(j<i && segsCross(p.line,q.line)){const c=p.vertical?q.line.y1:q.line.x1;cuts.push([c-gap*.3,c+gap*.3]);}
      if(segHitsRect(p.line,q.label,1)){const c=p.vertical?q.label.y:q.label.x,r=(p.vertical?q.label.h:q.label.w)/2+2;cuts.push([c-r,c+r]);}
    });
    let at=lo;
    const segment=(a:number,b:number)=>p.vertical?{x1:p.line.x1,y1:a,x2:p.line.x2,y2:b}:{x1:a,y1:p.line.y1,x2:b,y2:p.line.y2};
    for(const [a,b] of cuts.sort((a,b)=>a[0]-b[0])){if(a>=hi||b<=lo)continue;if(a>at)p.segments.push(segment(at,Math.min(a,hi)));at=Math.min(hi,Math.max(at,b));}
    if(at<hi)p.segments.push(segment(at,hi));
  });
  const xs=[0,(box.x1-box.x0)*sc,...placed.flatMap(p=>[p.line.x1,p.line.x2,p.label.x-p.label.w/2,p.label.x+p.label.w/2])];
  const ys=[0,(box.y1-box.y0)*sc,...placed.flatMap(p=>[p.line.y1,p.line.y2,p.label.y-p.label.h/2,p.label.y+p.label.h/2])];
  const pad=fs*.6,x=Math.min(...xs)-pad,y=Math.min(...ys)-pad,W=Math.max(...xs)-x+pad,H=Math.max(...ys)-y+pad;
  return {x,y,W,H,fs,sc,gap,X,Y,shape,letters,dimensions:placed};
}
