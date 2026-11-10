import { boxOf, insideShape, type Pt } from "./model";
import { rectGap, segHitsRect, segsCross, type Rect, type Seg } from "./labels";
import type { Drawing, Focus } from "./drawing";

export interface Dimension {
  id: string; a: Pt; b: Pt; text: string; value?: string; region?: string; outside?: boolean;
  edge?: number; helper?: string;
}
export interface PlacedDimension extends Dimension {
  line: Seg; extensions: Seg[]; label: Rect; vertical: boolean; visible: boolean; found: boolean;
}

/** A dimension stays parallel to its measured span; its endpoints never slide along an edge. */
export function dimensionPlan(d: Drawing, small = false, answer = false, focus?: Focus) {
  const box = boxOf(d.polys), fs = small ? 12 : 30;
  const sc = (small ? 240 : 600) / Math.max(box.x1-box.x0, box.y1-box.y0, 1);
  const X = (x: number) => (x-box.x0)*sc, Y = (y: number) => (box.y1-y)*sc;
  const shape: Seg[] = d.polys.flatMap(p => p.map((a,i) => { const b=p[(i+1)%p.length]; return {x1:X(a[0]),y1:Y(a[1]),x2:X(b[0]),y2:Y(b[1])}; }));
  const source: Dimension[] = d.measurements ?? d.edges.flatMap((e,i) => e.kind === "hidden" || (e.kind === "plain" && !e.label) ? [] : [{id:`edge-${i}`,a:e.a,b:e.b,text:e.kind === "plain" ? e.label : "?",value:e.value,edge:i}]);
  const letters = d.regions.filter(r=>r.text).map(r => { const b=boxOf([r.pts]);return {id:r.id,text:r.text!,x:X(b.x0)+fs*.8,y:Y(b.y1)+fs*.85,w:fs,h:fs*1.2}; });
  const placed: PlacedDimension[] = [];
  const spanKey = (m: Dimension) => {const axis=m.a[1]===m.b[1]?0:1;return `${axis}:${Math.min(m.a[axis],m.b[axis])}:${Math.max(m.a[axis],m.b[axis])}`;};
  const seen = new Set<string>();
  for (const m of source) {
    const key=spanKey(m); if(seen.has(key))continue;seen.add(key);
    const ax=X(m.a[0]),ay=Y(m.a[1]),bx=X(m.b[0]),by=Y(m.b[1]),vertical=ax===bx;
    const cx=(ax+bx)/2,cy=(ay+by)/2;
    const chars=Math.max(m.text.length,m.value?.length??0),width=chars*fs*.57+fs*.5,height=fs*1.3;
    const w=vertical?height:width,h=vertical?width:height;
    const candidates: {pos:number;cost:number}[]=[];
    const region=m.region?d.regions.find(r=>r.id===m.region):undefined;
    if(region && !m.outside){const r=boxOf([region.pts]);const lo=vertical?X(r.x0):Y(r.y1),hi=vertical?X(r.x1):Y(r.y0);
      [0.5,0.65,0.35].forEach((t,i)=>candidates.push({pos:lo+(hi-lo)*t,cost:i*3}));}
    const base=vertical?cx:cy;
    for(const sign of [-1,1]) for(const k of [1,1.7,2.5,3.5,4.7,6,8,11]) {
      const pos=base+sign*fs*k;
      const mx=box.x0+(vertical?pos:cx)/sc,my=box.y1-(vertical?cy:pos)/sc;
      const inside=insideShape(mx,my,d.polys);
      candidates.push({pos,cost:12+k*2+(m.outside&&inside?250:0)});
    }
    const make=(pos:number):PlacedDimension=>{
      const line=vertical?{x1:pos,y1:Math.min(ay,by),x2:pos,y2:Math.max(ay,by)}:{x1:Math.min(ax,bx),y1:pos,x2:Math.max(ax,bx),y2:pos};
      const label={x:vertical?pos:cx,y:vertical?cy:pos,w,h};
      const extension=(x:number,y:number,tx:number,ty:number):Seg=>{const len=Math.hypot(tx-x,ty-y)||1,gap=Math.min(fs*.18,len/2);return{x1:x+(tx-x)/len*gap,y1:y+(ty-y)/len*gap,x2:tx,y2:ty};};
      const extensions=vertical?[extension(ax,ay,pos,ay),extension(bx,by,pos,by)]:[extension(ax,ay,ax,pos),extension(bx,by,bx,pos)];
      const found=answer || (m.edge!==undefined && !!focus?.reveal?.includes(m.edge)) || !!(m.helper&&focus?.revealHelpers?.includes(m.helper));
      return {...m,line,extensions,label,vertical,visible:!m.helper||!!d.helpers.find(h=>h.id===m.helper)?.always||!!focus?.helpers?.includes(m.helper),found};
    };
    const score=(p:PlacedDimension,cost:number)=>{
      let n=cost;
      n+=shape.filter(s=>segHitsRect(s,p.label,fs*.15)).length*10000;
      n+=shape.filter(s=>segsCross(s,p.line)).length*3000;
      for(const l of letters)if(rectGap(l,p.label)<fs*.1)n+=2000;
      for(const q of placed){
        if(rectGap(p.label,q.label)<fs*.25)n+=20000;
        if(segHitsRect(p.line,q.label,fs*.2)||segHitsRect(q.line,p.label,fs*.2))n+=10000;
        if(segsCross(p.line,q.line))n+=3000;
        for(const e of p.extensions)if(segHitsRect(e,q.label,fs*.15))n+=4000;
        for(const e of q.extensions)if(segHitsRect(e,p.label,fs*.15))n+=4000;
      }
      return n;
    };
    let best=make(candidates[0].pos),cost=Infinity;
    for(const c of candidates){const p=make(c.pos),n=score(p,c.cost);if(n<cost){best=p;cost=n;}}
    placed.push(best);
  }
  const xs=[0,(box.x1-box.x0)*sc,...placed.flatMap(p=>[p.line.x1,p.line.x2,p.label.x-p.label.w/2,p.label.x+p.label.w/2])];
  const ys=[0,(box.y1-box.y0)*sc,...placed.flatMap(p=>[p.line.y1,p.line.y2,p.label.y-p.label.h/2,p.label.y+p.label.h/2])];
  const pad=fs*.8,x=Math.min(...xs)-pad,y=Math.min(...ys)-pad,W=Math.max(...xs)-x+pad,H=Math.max(...ys)-y+pad;
  return {x,y,W,H,fs,sc,X,Y,shape,letters,dimensions:placed};
}
