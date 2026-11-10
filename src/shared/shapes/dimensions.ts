import { boxOf, insideShape, type Pt } from "./model";
import { rectGap, segHitsRect, segsCross, type Rect, type Seg } from "./labels";
import type { Drawing, Focus } from "./drawing";

interface Dimension {
  id: string; a: Pt; b: Pt; text: string; value?: string; region?: string; outside?: boolean;
  edge?: number; helper?: string;
}
interface PlacedDimension extends Dimension {
  line: Seg; extensions: Seg[]; label: Rect; vertical: boolean; visible: boolean; found: boolean;
}

/** A dimension stays parallel to its measured span; its endpoints never slide along an edge. */
export function dimensionPlan(d: Drawing, small = false, answer = false, focus?: Focus) {
  const box = boxOf(d.polys), fs = small ? 12 : 30;
  const sc = (small ? 240 : 600) / Math.max(box.x1-box.x0, box.y1-box.y0, 1);
  const X = (x: number) => (x-box.x0)*sc, Y = (y: number) => (box.y1-y)*sc;
  const shape: Seg[] = d.polys.flatMap(p => p.map((a,i) => { const b=p[(i+1)%p.length]; return {x1:X(a[0]),y1:Y(a[1]),x2:X(b[0]),y2:Y(b[1])}; }));
  const source: Dimension[] = [
    ...d.edges.flatMap((e,i) => e.kind === "hidden" || (e.kind === "plain" && !e.label) ? [] : [{id:`edge-${i}`,a:e.a,b:e.b,text:e.kind === "plain" ? e.label : "?",value:e.value,edge:i}]),
    ...d.helpers.filter(h=>h.label || h.find).map(h=>({id:`helper-${h.id}`,a:h.a,b:h.b,text:h.find?"?":h.label!,value:h.value,helper:h.id})),
  ];
  // Short spans are placed first so nested outside dimensions can use progressively wider lanes.
  source.sort((a,b)=>Math.hypot(a.b[0]-a.a[0],a.b[1]-a.a[1])-Math.hypot(b.b[0]-b.a[0],b.b[1]-b.a[1]));
  const letters = d.regions.filter(r=>r.text).map(r => { const b=boxOf([r.pts]);return {id:r.id,text:r.text!,x:X(b.x0)+fs*.8,y:Y(b.y1)+fs*.85,w:fs,h:fs*1.2}; });
  const placed: PlacedDimension[] = [];
  const spanKey = (m: Dimension) => {const axis=m.a[1]===m.b[1]?0:1;return `${axis}:${Math.min(m.a[axis],m.b[axis])}:${Math.max(m.a[axis],m.b[axis])}`;};
  const seen = new Set<string>();
  for (const m of source) {
    const key=spanKey(m); if(m.helper && seen.has(key))continue;seen.add(key);
    const ax=X(m.a[0]),ay=Y(m.a[1]),bx=X(m.b[0]),by=Y(m.b[1]),vertical=ax===bx;
    const cx=(ax+bx)/2,cy=(ay+by)/2;
    const chars=Math.max(m.text.length,m.value?.length??0),width=chars*fs*.57+fs*.5,height=fs*1.3;
    const w=vertical?height:width,h=vertical?width:height;
    const candidates: {pos:number;cost:number}[]=[];
    const base=vertical?cx:cy;
    const extent=vertical?(box.x1-box.x0)*sc:(box.y1-box.y0)*sc;
    for(const side of [-1,1]) for(const k of [1,1.7,2.5,3.5,4.7,6,8,11,14,18]) {
      const pos=side<0?-fs*k:extent+fs*k;
      candidates.push({pos,cost:Math.abs(pos-base)/fs+k});
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
      // Prefer witness lines that reach their dimension through empty space, rather than through another cell.
      for(const e of p.extensions) for(const t of [.25,.5,.75]) {
        const x=e.x1+(e.x2-e.x1)*t,y=e.y1+(e.y2-e.y1)*t;
        const onOutline=shape.some(s=>Math.abs(s.x1-s.x2)<.1 ? Math.abs(x-s.x1)<.1 && y>=Math.min(s.y1,s.y2)-.1 && y<=Math.max(s.y1,s.y2)+.1 : Math.abs(y-s.y1)<.1 && x>=Math.min(s.x1,s.x2)-.1 && x<=Math.max(s.x1,s.x2)+.1);
        if(!onOutline && insideShape(box.x0+x/sc,box.y1-y/sc,d.polys))n+=700;
      }
      n+=shape.filter(s=>segHitsRect(s,p.label,fs*.15)).length*10000;
      n+=shape.filter(s=>segsCross(s,p.line)).length*3000;
      for(const l of letters)if(rectGap(l,p.label)<fs*.1)n+=2000;
      for(const q of placed){
        if(rectGap(p.label,q.label)<fs*.25)n+=20000;
        if(segHitsRect(p.line,q.label,fs*.2)||segHitsRect(q.line,p.label,fs*.2))n+=10000;
        if(segsCross(p.line,q.line))n+=3000;
        for(const e of p.extensions)if(segsCross(e,q.line))n+=8000;
        for(const e of q.extensions)if(segsCross(e,p.line))n+=8000;
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
