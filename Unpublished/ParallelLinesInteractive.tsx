import { useState, useEffect, useRef, useCallback } from "react";
import { Home, Menu, X, RefreshCw, Maximize2, Minimize2, ChevronUp, ChevronDown } from "lucide-react";

const INFO_SECTIONS = [
  { title: "Parallel Lines & Angles", icon: "📐", content: [
    { label: "Overview", detail: "Interactive canvas for exploring angles formed when a transversal crosses parallel lines." },
    { label: "Transversal", detail: "Drag the blue circle to rotate the transversal." },
    { label: "Parallel Lines", detail: "Drag the orange handles to move each line up or down." },
    { label: "Non-Parallel Line", detail: "Enable via ⋯ menu. Drag its handle and adjust the offset." },
    { label: "Revealing Angles", detail: "Click a sector or its letter to show/hide the value." },
    { label: "Pan & Recentre", detail: "Drag the background to pan. ◎ snaps back to centre." },
  ]},
  { title: "Toolbar", icon: "🛠️", content: [
    { label: "◎ Recentre", detail: "Centres around the midpoint of visible intersections." },
    { label: "↺ Reset", detail: "Resets positions, preserving visibility settings." },
    { label: "Fullscreen", detail: "Fills the screen. Escape or click again to exit." },
    { label: "⋯ Settings", detail: "Line toggles, angle preset, offset and angle hiding." },
  ]},
];

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ height: "80vh" }} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div><h2 className="text-2xl font-bold text-gray-900">Tool Information</h2><p className="text-sm text-gray-400 mt-0.5">A guide to all features and options</p></div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"><X size={20} /></button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {INFO_SECTIONS.map(s => (
          <div key={s.title}>
            <div className="flex items-center gap-2 mb-3"><span className="text-xl">{s.icon}</span><h3 className="text-lg font-bold text-blue-900">{s.title}</h3></div>
            <div className="flex flex-col gap-2">
              {s.content.map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-7 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
        <button onClick={onClose} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors">Close</button>
      </div>
    </div>
  </div>
);

const COL: Record<string,string> = {
  A:"#3b82f6", B:"#ec4899", C:"#7c3aed", D:"#d97706",
  E:"#ef4444", F:"#0891b2", G:"#16a34a", H:"#64748b",
  M:"#f97316", N:"#84cc16", O:"#6366f1", P:"#e11d48",
};

// ── NavMenuDropdown ──────────────────────────────────────────────────────────
interface NavMenuDropdownProps { colorScheme:string; setColorScheme:(s:string)=>void; onClose:()=>void; onOpenInfo:()=>void; }
const NavMenuDropdown = ({ colorScheme, setColorScheme, onClose, onOpenInfo }: NavMenuDropdownProps) => {
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e:MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth:200 }}>
      <div className="py-1">
        <button onClick={() => setColorOpen(!colorOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 transition-transform duration-200 ${colorOpen?"rotate-90":""}`}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Colour Scheme</span>
          </div>
          <span className="text-xs text-gray-400 font-normal capitalize">{colorScheme}</span>
        </button>
        {colorOpen && (
          <div className="border-t border-gray-100">
            {["default","blue","pink","yellow"].map(s => (
              <button key={s} onClick={() => { setColorScheme(s); onClose(); }}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold transition-colors capitalize ${colorScheme===s?"bg-blue-900 text-white":"text-gray-600 hover:bg-gray-50"}`}>
                {s}
                {colorScheme===s && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1"/>
        <button onClick={() => { onOpenInfo(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};

// ── CanvasMenuDropdown ───────────────────────────────────────────────────────
interface CanvasMenuProps {
  onClose:()=>void; showL2:boolean; showNP:boolean; npOffset:number;
  onToggleL2:()=>void; onToggleNP:()=>void; onStepOffset:(d:number)=>void;
  hiddenAngles:Record<string,boolean>; onToggleAngle:(l:string)=>void;
  showHandles:boolean; onToggleHandles:()=>void;
  lineAngleDeg:number; onSetLineAngle:(d:number)=>void;
}
const CanvasMenuDropdown = ({ onClose, showL2, showNP, npOffset, onToggleL2, onToggleNP, onStepOffset, hiddenAngles, onToggleAngle, showHandles, onToggleHandles, lineAngleDeg, onSetLineAngle }: CanvasMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const holdInterval = useRef<ReturnType<typeof setInterval>|null>(null);
  useEffect(() => {
    const h = (e:MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  const startHold = (d:number) => { onStepOffset(d); holdTimer.current = setTimeout(() => { holdInterval.current = setInterval(()=>onStepOffset(d),60); },350); };
  const stopHold = () => { if(holdTimer.current) clearTimeout(holdTimer.current); if(holdInterval.current) clearInterval(holdInterval.current); holdTimer.current=holdInterval.current=null; };
  const offLabel = (npOffset>0?"+":"")+npOffset+"°";
  const ANGLES:[string,number,string][] = [["↕",-90,"Vertical"],["↘",45,"SE"],["↔",0,"Horizontal"],["↗",-45,"NE"]];

  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-y-auto" style={{ minWidth:230, maxHeight:"80vh" }}>
      <div className="py-1">
        {/* Line visibility */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lower Parallel Line</p>
          <button onClick={onToggleL2} className={`w-full px-4 py-2 rounded-lg font-bold text-sm transition-colors ${showL2?"bg-blue-900 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{showL2?"Visible":"Hidden"}</button>
        </div>
        {/* NP line */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Non-Parallel Line</p>
          <button onClick={onToggleNP} className={`w-full px-4 py-2 rounded-lg font-bold text-sm transition-colors mb-3 ${showNP?"bg-blue-900 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{showNP?"Visible":"Hidden"}</button>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Offset from Parallel</p>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <button className="w-8 h-7 rounded border-2 border-blue-900 bg-white text-blue-900 flex items-center justify-center hover:bg-blue-50 select-none" onMouseDown={()=>startHold(1)} onMouseUp={stopHold} onMouseLeave={stopHold} onTouchStart={e=>{e.preventDefault();startHold(1);}} onTouchEnd={stopHold}><ChevronUp size={14}/></button>
              <button className="w-8 h-7 rounded border-2 border-blue-900 bg-white text-blue-900 flex items-center justify-center hover:bg-blue-50 select-none" onMouseDown={()=>startHold(-1)} onMouseUp={stopHold} onMouseLeave={stopHold} onTouchStart={e=>{e.preventDefault();startHold(-1);}} onTouchEnd={stopHold}><ChevronDown size={14}/></button>
            </div>
            <span className="text-2xl font-black text-blue-900 min-w-[52px] text-center">{offLabel}</span>
          </div>
        </div>
        {/* Line angle */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Parallel Line Angle</p>
          <div className="flex gap-1">
            {ANGLES.map(([icon,deg,title]) => (
              <button key={deg} onClick={()=>onSetLineAngle(deg)} title={title}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${lineAngleDeg===deg?"bg-blue-900 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {icon}
              </button>
            ))}
          </div>
        </div>
        {/* Handles */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Drag Handles</p>
          <button onClick={onToggleHandles} className={`w-full px-4 py-2 rounded-lg font-bold text-sm transition-colors ${showHandles?"bg-blue-900 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{showHandles?"Visible":"Hidden"}</button>
        </div>
        {/* Angle grid */}
        <div className="px-4 py-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hide / Show Angles</p>
          {[{label:"Upper",letters:["A","B","C","D"]},{label:"Lower",letters:["E","F","G","H"],hide:!showL2},{label:"Non-parallel",letters:["M","N","O","P"],hide:!showNP}].map(group => group.hide ? null : (
            <div key={group.label} className="mb-2">
              <p className="text-xs text-gray-400 mb-1 font-semibold">{group.label} intersection</p>
              <div className="grid grid-cols-4 gap-1">
                {group.letters.map(l => (
                  <button key={l} onClick={()=>onToggleAngle(l)} className="h-8 rounded-lg font-black text-sm text-white" style={{background:COL[l], opacity:hiddenAngles[l]?0.25:1}}>{l}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Types ────────────────────────────────────────────────────────────────────
interface DS {
  hx:number; hy:number; tvAngle:number;
  l1:number; l2:number; npY:number;
  showNP:boolean; showL2:boolean; npOffset:number;
  showHandles:boolean; panX:number; panY:number;
}
interface HR { letter:string; px:number; py:number; s:number; e:number; R:number; }
interface LR { letter:string; x:number; y:number; r:number; }

const ALL_LETTERS = ["A","B","C","D","E","F","G","H","M","N","O","P"];
const makeDef = ():DS => ({ hx:0.5, hy:0.07, tvAngle:Math.PI/2, l1:0.28, l2:0.72, npY:0.5, showNP:false, showL2:true, npOffset:5, showHandles:true, panX:0, panY:0 });

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ParallelLinesAngles() {
  const [isNavMenuOpen,    setIsNavMenuOpen]    = useState(false);
  const [isCanvasMenuOpen, setIsCanvasMenuOpen] = useState(false);
  const [isInfoOpen,       setIsInfoOpen]       = useState(false);
  const [isFullscreen,     setIsFullscreen]     = useState(false);
  const [colorScheme,      setColorScheme]      = useState("default");
  const [lineAngleDeg,     setLineAngleDeg]     = useState(0);
  const colorSchemeRef = useRef("default");
  const lineAngleRef   = useRef(0);
  const [, forceUpdate] = useState(0);
  const redrawUI = useCallback(()=>forceUpdate(n=>n+1),[]);

  const S            = useRef<DS>(makeDef());
  const hiddenAngles = useRef<Record<string,boolean>>(Object.fromEntries(ALL_LETTERS.map(l=>[l,false])));
  const visible      = useRef<Record<string,boolean>>(Object.fromEntries(ALL_LETTERS.map(l=>[l,false])));
  const W = useRef(1), H = useRef(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef   = useRef<HTMLDivElement>(null);
  const hitRegions   = useRef<HR[]>([]);
  const labelRegions = useRef<LR[]>([]);
  const dragging  = useRef<string|null>(null);
  const dragMoved = useRef(false);
  const panStart  = useRef<{rawX:number;rawY:number;panX:number;panY:number}|null>(null);

  const pxF = (fx:number) => fx*W.current;
  const pyF = (fy:number) => fy*H.current;
  const nxF = (x:number)  => x/W.current;
  const nyF = (y:number)  => y/H.current;

  // ── Core geometry (always horizontal) ──────────────────────────────────────
  const tvXatY = useCallback((y:number) => {
    const {hx,hy,tvAngle} = S.current;
    const sinA = Math.sin(tvAngle);
    if (Math.abs(sinA)<1e-6) return pxF(hx);
    return pxF(hx)+((y-pyF(hy))/sinA)*Math.cos(tvAngle);
  },[]);

  const intersections = useCallback(()=>({
    p1:{x:tvXatY(pyF(S.current.l1)), y:pyF(S.current.l1)},
    p2:{x:tvXatY(pyF(S.current.l2)), y:pyF(S.current.l2)},
  }),[tvXatY]);

  const npIntersection = useCallback(()=>({x:tvXatY(pyF(S.current.npY)), y:pyF(S.current.npY)}),[tvXatY]);

  const tvAcuteDeg = useCallback(()=>{
    let deg = Math.abs(S.current.tvAngle*180/Math.PI);
    if(deg>90) deg=180-deg;
    return Math.max(1,Math.min(90,deg));
  },[]);

  const npDirRad = useCallback(()=>-S.current.npOffset*Math.PI/180,[]);

  const parallelAngles = useCallback(()=>{
    const theta=tvAcuteDeg();
    const leansRight=Math.cos(S.current.tvAngle)>=0;
    return leansRight?{tl:theta,tr:180-theta,bl:180-theta,br:theta}:{tl:180-theta,tr:theta,bl:theta,br:180-theta};
  },[tvAcuteDeg]);

  const npAngles = useCallback(()=>{
    const theta=tvAcuteDeg();
    let a=Math.abs(theta-S.current.npOffset);
    if(a>90) a=180-a;
    a=Math.max(1,Math.min(90,a));
    const lr=Math.cos(npDirRad())>=0;
    return lr?{tl:180-a,tr:a,bl:a,br:180-a}:{tl:a,tr:180-a,bl:180-a,br:a};
  },[tvAcuteDeg,npDirRad]);

  // ── Draw ─────────────────────────────────────────────────────────────────
  const norm = (a:number)=>{ a%=2*Math.PI; return a<0?a+2*Math.PI:a; };

  const draw = useCallback(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"); if(!ctx) return;
    const Wv=W.current, Hv=H.current;
    if(Wv<2||Hv<2) return;

    ctx.clearRect(0,0,Wv,Hv);
    hitRegions.current=[]; labelRegions.current=[];

    const bgMap:Record<string,string>={blue:"#D1E7F8",pink:"#F8D1E7",yellow:"#F8F4D1",default:"#ffffff"};
    ctx.fillStyle=bgMap[colorSchemeRef.current]??"#ffffff";
    ctx.fillRect(0,0,Wv,Hv);

    ctx.save();
    // Pan
    ctx.translate(S.current.panX, S.current.panY);
    // Rotation around canvas centre — purely cosmetic, all maths stays horizontal
    const rotRad = lineAngleRef.current * Math.PI / 180;
    const cx = Wv/2, cy = Hv/2;
    if(rotRad!==0){ ctx.translate(cx,cy); ctx.rotate(rotRad); ctx.translate(-cx,-cy); }

    const INF  = Math.hypot(Wv,Hv)*2;
    const unit = Math.min(Wv,Hv);
    const R    = unit*0.065;
    const LW   = unit*0.004;
    const HBL  = unit*0.025;
    const HOR  = unit*0.018;
    const TICK = unit*0.025;

    const {p1,p2}=intersections();
    const npIP=S.current.showNP?npIntersection():null;
    const tvd=S.current.tvAngle;
    const pAng=parallelAngles();

    const vals:Record<string,number>={A:pAng.tl,B:pAng.tr,C:pAng.bl,D:pAng.br,E:pAng.tl,F:pAng.tr,G:pAng.bl,H:pAng.br};
    if(npIP){const na=npAngles(); vals.M=na.tl;vals.N=na.tr;vals.O=na.bl;vals.P=na.br;}

    ctx.lineJoin="round";

    // Parallel lines
    const lineYs=S.current.showL2?[pyF(S.current.l1),pyF(S.current.l2)]:[pyF(S.current.l1)];
    lineYs.forEach(y=>{
      ctx.save();
      ctx.strokeStyle="#111827"; ctx.lineWidth=LW; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(-Wv*2,y); ctx.lineTo(Wv*3,y); ctx.stroke();
      ctx.translate(Wv*0.22,y);
      ctx.beginPath(); ctx.moveTo(-TICK,-TICK*0.85); ctx.lineTo(TICK*0.3,0); ctx.lineTo(-TICK,TICK*0.85); ctx.stroke();
      ctx.restore();
    });

    // NP line
    if(S.current.showNP&&npIP){
      const npd=npDirRad();
      ctx.save(); ctx.strokeStyle="#111827"; ctx.lineWidth=LW; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(npIP.x-Math.cos(npd)*INF,npIP.y-Math.sin(npd)*INF); ctx.lineTo(npIP.x+Math.cos(npd)*INF,npIP.y+Math.sin(npd)*INF);
      ctx.stroke(); ctx.restore();
    }

    // Transversal
    ctx.save(); ctx.strokeStyle="#111827"; ctx.lineWidth=LW; ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(pxF(S.current.hx)-Math.cos(tvd)*INF, pyF(S.current.hy)-Math.sin(tvd)*INF);
    ctx.lineTo(pxF(S.current.hx)+Math.cos(tvd)*INF, pyF(S.current.hy)+Math.sin(tvd)*INF);
    ctx.stroke(); ctx.restore();

    // Sectors
    const drawSectors=(qx:number,qy:number,labels:string[],values:Record<string,number>,dir1:number,dir2:number)=>{
      const dirs=[norm(dir1),norm(dir2),norm(dir1+Math.PI),norm(dir2+Math.PI)].sort((a,b)=>a-b);
      const secs=[];
      for(let i=0;i<4;i++){const s=dirs[i],eR=dirs[(i+1)%4],e=eR<=s?eR+2*Math.PI:eR; secs.push({s,e,mid:norm((s+e)/2)});}
      const cls=(mid:number)=>{const m=norm(mid),top=m>Math.PI,right=m<Math.PI/2||m>3*Math.PI/2; if(top&&right)return"tr"; if(top&&!right)return"tl"; if(!top&&right)return"br"; return"bl";};
      const sMap:Record<string,{s:number;e:number;mid:number}>={};
      secs.forEach(s=>{sMap[cls(s.mid)]=s;});
      const qMap:Record<string,string>={tl:labels[0],tr:labels[1],bl:labels[2],br:labels[3]};
      Object.entries(qMap).forEach(([quad,letter])=>{
        const sec=sMap[quad]; if(!sec) return;
        if(hiddenAngles.current[letter]) return;
        const col=COL[letter], show=visible.current[letter], val=values[letter];
        const isRA=Math.abs(Math.round(val)-90)<0.5;
        ctx.save(); ctx.globalAlpha=0.62; ctx.fillStyle=col;
        ctx.beginPath();
        if(isRA){const sq=R*0.72,a1x=Math.cos(sec.s),a1y=Math.sin(sec.s),a2x=Math.cos(sec.e),a2y=Math.sin(sec.e);ctx.moveTo(qx,qy);ctx.lineTo(qx+a1x*sq,qy+a1y*sq);ctx.lineTo(qx+a1x*sq+a2x*sq,qy+a1y*sq+a2y*sq);ctx.lineTo(qx+a2x*sq,qy+a2y*sq);ctx.closePath();}
        else{ctx.moveTo(qx,qy);ctx.arc(qx,qy,R,sec.s,sec.e,false);ctx.closePath();}
        ctx.fill(); ctx.globalAlpha=0.85; ctx.strokeStyle="#111827"; ctx.lineWidth=LW*0.8; ctx.stroke(); ctx.restore();
        hitRegions.current.push({letter,px:qx,py:qy,s:sec.s,e:sec.e,R});
        const labelR=R+unit*0.045, fontSize=Math.round(unit*0.042);
        const lx=qx+Math.cos(sec.mid)*labelR, ly=qy+Math.sin(sec.mid)*labelR;
        const labelTxt=show&&val!==undefined?Math.round(val)+"°":letter;
        ctx.save();
        // Translate to label position, undo canvas rotation so text is always upright
        ctx.translate(lx,ly);
        ctx.rotate(-lineAngleRef.current*Math.PI/180);
        ctx.font=show?`900 ${fontSize}px Segoe UI,sans-serif`:`italic 900 ${fontSize}px Georgia,serif`;
        ctx.fillStyle=col; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(labelTxt,0,0); ctx.restore();
        labelRegions.current.push({letter,x:lx,y:ly,r:fontSize*0.75});
      });
      ctx.save(); ctx.fillStyle="#111827"; ctx.beginPath(); ctx.arc(qx,qy,unit*0.006,0,2*Math.PI); ctx.fill(); ctx.restore();
    };

    drawSectors(p1.x,p1.y,["A","B","C","D"],vals,0,tvd);
    if(S.current.showL2) drawSectors(p2.x,p2.y,["E","F","G","H"],vals,0,tvd);
    if(S.current.showNP&&npIP) drawSectors(npIP.x,npIP.y,["M","N","O","P"],vals,tvd,npDirRad());

    if(S.current.showHandles){
      ctx.save(); ctx.fillStyle="#bfdbfe"; ctx.strokeStyle="#1d4ed8"; ctx.lineWidth=LW;
      ctx.beginPath(); ctx.arc(pxF(S.current.hx),pyF(S.current.hy),HBL,0,2*Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
      const oH=S.current.showL2?[p1,p2]:[p1];
      if(S.current.showNP&&npIP) oH.push(npIP);
      oH.forEach(p=>{ ctx.save(); ctx.fillStyle="#fed7aa"; ctx.strokeStyle="#c2410c"; ctx.lineWidth=LW*0.8; ctx.beginPath(); ctx.arc(p.x,p.y,HOR,0,2*Math.PI); ctx.fill(); ctx.stroke(); ctx.restore(); });
    }

    ctx.restore(); // end pan+rotate
  },[intersections,npIntersection,parallelAngles,npAngles,npDirRad,tvXatY]);

  // ── ResizeObserver ───────────────────────────────────────────────────────
  useEffect(()=>{
    const card=cardRef.current; if(!card) return;
    const ro=new ResizeObserver(()=>{
      const canvas=canvasRef.current; if(!canvas) return;
      const dpr=window.devicePixelRatio||1, w=card.clientWidth, h=card.clientHeight;
      if(w<2||h<2) return;
      W.current=w; H.current=h;
      canvas.width=w*dpr; canvas.height=h*dpr;
      canvas.style.width=w+"px"; canvas.style.height=h+"px";
      canvas.getContext("2d")?.setTransform(dpr,0,0,dpr,0,0);
      draw();
    });
    ro.observe(card); return ()=>ro.disconnect();
  },[draw]);

  useEffect(()=>{setTimeout(()=>draw(),50);},[isFullscreen,draw]);
  useEffect(()=>{ draw(); },[colorScheme,draw]);

  // ── Pointer helpers ──────────────────────────────────────────────────────
  // Inverse-rotate mouse pos from screen space back into horizontal geometry space
  const unrotate = useCallback((rx:number,ry:number)=>{
    const rot=-lineAngleRef.current*Math.PI/180;
    const cx=W.current/2, cy=H.current/2;
    const dx=rx-cx-S.current.panX, dy=ry-cy-S.current.panY;
    return { x: cx + dx*Math.cos(rot) - dy*Math.sin(rot), y: cy + dx*Math.sin(rot) + dy*Math.cos(rot) };
  },[]);

  const getPos = useCallback((e:MouseEvent|TouchEvent)=>{
    const rect=canvasRef.current!.getBoundingClientRect();
    const sx=W.current/rect.width, sy=H.current/rect.height;
    const src="touches" in e?(e as TouchEvent).touches[0]??(e as TouchEvent).changedTouches[0]:e as MouseEvent;
    const rx=(src.clientX-rect.left)*sx, ry=(src.clientY-rect.top)*sy;
    return unrotate(rx,ry);
  },[unrotate]);

  const getRawPos = useCallback((e:MouseEvent|TouchEvent)=>{
    const rect=canvasRef.current!.getBoundingClientRect();
    const sx=W.current/rect.width, sy=H.current/rect.height;
    const src="touches" in e?(e as TouchEvent).touches[0]??(e as TouchEvent).changedTouches[0]:e as MouseEvent;
    return {x:(src.clientX-rect.left)*sx, y:(src.clientY-rect.top)*sy};
  },[]);

  const dst=(ax:number,ay:number,bx:number,by:number)=>Math.hypot(ax-bx,ay-by);
  const hitR=()=>Math.min(W.current,H.current)*0.04;

  const pickDraggable=useCallback((pos:{x:number;y:number})=>{
    const {p1,p2}=intersections();
    const npIP=S.current.showNP?npIntersection():null;
    const hr=hitR();
    if(dst(pos.x,pos.y,pxF(S.current.hx),pyF(S.current.hy))<hr*1.5) return"handle";
    if(dst(pos.x,pos.y,p1.x,p1.y)<hr) return"line1";
    if(S.current.showL2&&dst(pos.x,pos.y,p2.x,p2.y)<hr) return"line2";
    if(npIP&&dst(pos.x,pos.y,npIP.x,npIP.y)<hr) return"npline";
    return"pan";
  },[intersections,npIntersection]);

  const applyDrag=useCallback((pos:{x:number;y:number})=>{
    const s=S.current, margin=Math.min(W.current,H.current)*0.06;
    if(dragging.current==="handle"){
      const newX=Math.max(margin,Math.min(W.current-margin,pos.x));
      const newY=Math.max(margin,Math.min(H.current*Math.min(s.l1,s.l2,s.npY)-margin,pos.y));
      const refX=tvXatY(pyF(s.l1));
      s.tvAngle=Math.atan2(pyF(s.l1)-newY,refX-newX);
      s.hx=nxF(newX); s.hy=nyF(newY);
    } else if(dragging.current==="line1"){ s.l1=Math.max(s.hy+0.05,Math.min(0.95,nyF(pos.y))); }
    else if(dragging.current==="line2"){ s.l2=Math.max(s.hy+0.05,Math.min(0.95,nyF(pos.y))); }
    else if(dragging.current==="npline"){ s.npY=Math.max(s.hy+0.05,Math.min(0.95,nyF(pos.y))); }
  },[tvXatY]);

  const angleContains=(r:HR,mx:number,my:number)=>{
    const dx=mx-r.px,dy=my-r.py; if(Math.hypot(dx,dy)>r.R) return false;
    const angle=norm(Math.atan2(dy,dx)), s=norm(r.s), eAdj=r.e<=s?r.e+2*Math.PI:r.e, aAdj=angle<s?angle+2*Math.PI:angle;
    return aAdj>=s&&aAdj<=eAdj;
  };

  const tryReveal=useCallback((pos:{x:number;y:number})=>{
    for(const r of hitRegions.current){ if(angleContains(r,pos.x,pos.y)){ visible.current[r.letter]=!visible.current[r.letter]; draw(); return; } }
    for(const lr of labelRegions.current){ if(Math.hypot(pos.x-lr.x,pos.y-lr.y)<lr.r){ visible.current[lr.letter]=!visible.current[lr.letter]; draw(); return; } }
  },[draw]);

  // ── Event listeners ──────────────────────────────────────────────────────
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const onDown=(e:MouseEvent|TouchEvent)=>{ dragMoved.current=false; const pos=getPos(e); dragging.current=pickDraggable(pos); if(dragging.current==="pan"){const raw=getRawPos(e); panStart.current={rawX:raw.x,rawY:raw.y,panX:S.current.panX,panY:S.current.panY};} };
    const onMove=(e:MouseEvent|TouchEvent)=>{
      if(!dragging.current){ if(e instanceof MouseEvent){const pos=getPos(e); canvas.style.cursor=pickDraggable(pos)==="pan"?"move":"grab";} return; }
      dragMoved.current=true; canvas.style.cursor="grabbing";
      if(dragging.current==="pan"&&panStart.current){ const raw=getRawPos(e); S.current.panX=Math.max(-W.current*0.5,Math.min(W.current*0.5,panStart.current.panX+(raw.x-panStart.current.rawX))); S.current.panY=Math.max(-H.current*0.5,Math.min(H.current*0.5,panStart.current.panY+(raw.y-panStart.current.rawY))); }
      else applyDrag(getPos(e));
      draw();
    };
    const onUp=()=>{ dragging.current=null; };
    const onClick=(e:MouseEvent)=>{ if(!dragMoved.current) tryReveal(getPos(e)); };
    const onTS=(e:TouchEvent)=>{e.preventDefault(); onDown(e);};
    const onTM=(e:TouchEvent)=>{e.preventDefault(); onMove(e);};
    const onTE=(e:TouchEvent)=>{if(!dragMoved.current) tryReveal(getPos(e)); dragging.current=null;};
    canvas.addEventListener("mousedown",onDown as EventListener);
    canvas.addEventListener("mousemove",onMove as EventListener);
    canvas.addEventListener("mouseup",onUp); canvas.addEventListener("mouseleave",onUp);
    canvas.addEventListener("click",onClick);
    canvas.addEventListener("touchstart",onTS as EventListener,{passive:false});
    canvas.addEventListener("touchmove",onTM as EventListener,{passive:false});
    canvas.addEventListener("touchend",onTE as EventListener);
    return ()=>{ canvas.removeEventListener("mousedown",onDown as EventListener); canvas.removeEventListener("mousemove",onMove as EventListener); canvas.removeEventListener("mouseup",onUp); canvas.removeEventListener("mouseleave",onUp); canvas.removeEventListener("click",onClick); canvas.removeEventListener("touchstart",onTS as EventListener); canvas.removeEventListener("touchmove",onTM as EventListener); canvas.removeEventListener("touchend",onTE as EventListener); };
  },[draw,pickDraggable,applyDrag,tryReveal,getPos,getRawPos]);

  useEffect(()=>{ const h=(e:KeyboardEvent)=>{if(e.key==="Escape") setIsFullscreen(false);}; document.addEventListener("keydown",h); return ()=>document.removeEventListener("keydown",h); },[]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const resetTool=useCallback(()=>{
    const prev={showL2:S.current.showL2,showNP:S.current.showNP};
    S.current=makeDef(); S.current.showL2=prev.showL2; S.current.showNP=prev.showNP;
    visible.current=Object.fromEntries(ALL_LETTERS.map(l=>[l,false]));
    hiddenAngles.current=Object.fromEntries(ALL_LETTERS.map(l=>[l,false]));
    redrawUI(); draw();
  },[draw,redrawUI]);

  const recentre=useCallback(()=>{
    const s=S.current;
    const p1x=tvXatY(pyF(s.l1)),p1y=pyF(s.l1);
    const p2x=tvXatY(pyF(s.l2)),p2y=pyF(s.l2);
    const npIP=npIntersection();
    let midX:number,midY:number;
    if(!s.showL2&&!s.showNP){midX=p1x;midY=p1y;}
    else if(s.showL2&&!s.showNP){midX=(p1x+p2x)/2;midY=(p1y+p2y)/2;}
    else if(!s.showL2&&s.showNP){midX=(p1x+npIP.x)/2;midY=(p1y+npIP.y)/2;}
    else{midX=(p1x+p2x)/2;midY=(p1y+p2y)/2;}
    s.panX=Math.max(-W.current*0.5,Math.min(W.current*0.5,W.current/2-midX));
    s.panY=Math.max(-H.current*0.5,Math.min(H.current*0.5,H.current/2-midY));
    draw();
  },[draw,tvXatY,npIntersection]);

  const toggleAngle  = useCallback((l:string)=>{ hiddenAngles.current[l]=!hiddenAngles.current[l]; redrawUI(); draw(); },[draw,redrawUI]);
  const toggleHandles= useCallback(()=>{ S.current.showHandles=!S.current.showHandles; redrawUI(); draw(); },[draw,redrawUI]);
  const toggleL2     = useCallback(()=>{ S.current.showL2=!S.current.showL2; redrawUI(); draw(); },[draw,redrawUI]);
  const toggleNP     = useCallback(()=>{ S.current.showNP=!S.current.showNP; redrawUI(); draw(); },[draw,redrawUI]);
  const stepOffset   = useCallback((d:number)=>{ S.current.npOffset=Math.max(-90,Math.min(90,S.current.npOffset+d)); redrawUI(); draw(); },[draw,redrawUI]);

  const handleSetColorScheme=useCallback((s:string)=>{ colorSchemeRef.current=s; setColorScheme(s); },[]);

  const handleSetLineAngle=useCallback((deg:number)=>{
    lineAngleRef.current=deg;
    setLineAngleDeg(deg);
    draw();
  },[draw]);

  const canvasMenuProps:CanvasMenuProps={
    onClose:()=>setIsCanvasMenuOpen(false),
    showL2:S.current.showL2, showNP:S.current.showNP, npOffset:S.current.npOffset,
    onToggleL2:toggleL2, onToggleNP:toggleNP, onStepOffset:stepOffset,
    hiddenAngles:hiddenAngles.current, onToggleAngle:toggleAngle,
    showHandles:S.current.showHandles, onToggleHandles:toggleHandles,
    lineAngleDeg, onSetLineAngle:handleSetLineAngle,
  };

  const iconBtn=(style:React.CSSProperties,onClick:()=>void,title:string,children:React.ReactNode)=>(
    <button onClick={onClick} title={title} style={{width:32,height:32,borderRadius:8,background:"rgba(0,0,0,0.08)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#374151",flexShrink:0,...style}}>{children}</button>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
      {!isFullscreen&&(
        <div className="bg-blue-900 shadow-lg" style={{flexShrink:0}}>
          <div className="max-w-screen-xl mx-auto px-8 py-4 flex justify-between items-center">
            <button className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"><Home size={24}/><span className="font-semibold text-lg">Home</span></button>
            <div className="relative">
              <button onClick={()=>setIsNavMenuOpen(o=>!o)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">{isNavMenuOpen?<X size={28}/>:<Menu size={28}/>}</button>
              {isNavMenuOpen&&<NavMenuDropdown colorScheme={colorScheme} setColorScheme={handleSetColorScheme} onClose={()=>setIsNavMenuOpen(false)} onOpenInfo={()=>{setIsInfoOpen(true);setIsNavMenuOpen(false);}}/>}
            </div>
          </div>
        </div>
      )}
      {isInfoOpen&&<InfoModal onClose={()=>setIsInfoOpen(false)}/>}
      <div style={{flex:1,minHeight:0,padding:isFullscreen?0:10,backgroundColor:isFullscreen?"#fff":"#f5f3f0",display:"flex"}}>
        <div ref={cardRef} style={{flex:1,position:"relative",background:"#fff",borderRadius:isFullscreen?0:16,boxShadow:isFullscreen?"none":"0 4px 24px rgba(0,0,0,0.12)",overflow:"hidden"}}>
          <canvas ref={canvasRef} style={{display:"block",position:"absolute",top:0,left:0}}/>
          <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6,zIndex:20}}>
            {iconBtn({},recentre,"Recentre",<span style={{fontSize:"1rem",lineHeight:1}}>◎</span>)}
            {iconBtn({},resetTool,"Reset",<RefreshCw size={15}/>)}
            {iconBtn({background:isFullscreen?"#374151":"rgba(0,0,0,0.08)",color:isFullscreen?"#fff":"#374151"},()=>setIsFullscreen(f=>!f),isFullscreen?"Exit Fullscreen":"Fullscreen",isFullscreen?<Minimize2 size={15}/>:<Maximize2 size={15}/>)}
            <div style={{position:"relative"}}>
              {iconBtn({background:isCanvasMenuOpen?"#1e3a5f":"rgba(0,0,0,0.08)",color:isCanvasMenuOpen?"#fff":"#374151"},()=>setIsCanvasMenuOpen(o=>!o),"Settings",<span style={{fontSize:"1.2rem",fontWeight:900,letterSpacing:"-1px",lineHeight:1}}>···</span>)}
              {isCanvasMenuOpen&&<CanvasMenuDropdown {...canvasMenuProps}/>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
