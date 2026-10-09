import { useEffect, useMemo, useState } from "react";
import { Dices, FlipHorizontal, Home, Shuffle } from "lucide-react";
import {
  GRAPH_BANK,
  SandboxBoard,
  bankGraph,
  distinctWeights,
  mirrored,
  problemFromNetwork,
  sampleBankGraph,
  type BankGraph,
  type Network,
} from "../../shared/decision";

// ═══════════════════════════════════════════════════════════════════════════
// Network Sandbox — the free workspace for Decision Mathematics (not a question tool).
//
// It draws bank graphs (shared/decision/graphBank.ts — the same hand-authored, display-optimised drawings the questions use)
// through the same renderer as the questions (NetworkView, via SandboxBoard), so a graph looks identical here and in a tool.
// Pick a graph, give it new random weights, mirror it, click a weight to change it, drag vertices to explore, show the table.
// The same board opens as an overlay from any Decision question ("Sandbox" on the picture), at the step the class is on.
// ═══════════════════════════════════════════════════════════════════════════

const withWeights = (g: BankGraph, include: (e: BankGraph["edges"][number]) => boolean = () => true): Network => {
  const edges = g.edges.filter(include);
  const ws = distinctWeights(edges.length, 2, 40);
  return { nodes: g.nodes.map((n) => ({ ...n })), edges: edges.map((e, i) => ({ id: e.id, from: e.a, to: e.b, weight: ws[i], labelAt: e.at })) };
};

export default function App() {
  const [graphId, setGraphId] = useState("wheel5");
  const [flip, setFlip] = useState<[boolean, boolean]>([false, false]);
  const [network, setNetwork] = useState<Network>(() => withWeights(bankGraph("wheel5")));
  const problem = useMemo(() => problemFromNetwork(network), [network]);
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const load = (id: string, f: [boolean, boolean] = [false, false], optional = true) => {
    setGraphId(id);
    setFlip(f);
    setNetwork(withWeights(mirrored(bankGraph(id), f[0], f[1]), (e) => !e.optional || optional));
  };

  const select = (
    <div style={{ display: "flex", flexDirection: narrow ? "row" : "column", flexWrap: "wrap", alignItems: narrow ? "center" : undefined, gap: 8, minWidth: 0, width: narrow ? "100%" : undefined }}>
      {!narrow && <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Graph</div>}
      <select
        value={graphId}
        onChange={(e) => load(e.target.value)}
        style={{ width: narrow ? "100%" : "100%", padding: "8px 8px", borderRadius: 8, border: "2px solid #d1d5db", background: "#fff", fontWeight: 600, fontSize: 13, color: "#334155" }}
      >
        {[4, 5, 6, 7, 8, 9, 10, 11, 12].filter((n) => GRAPH_BANK.some((g) => g.size === n)).map((n) => (
          <optgroup key={n} label={`${n} vertices`}>
            {GRAPH_BANK.filter((g) => g.size === n).map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <Btn onClick={() => { const s = sampleBankGraph({ use: "sandbox", size: [4, 12], kinds: ["planar"] }); load(s.bankId); }} icon={<Dices size={15} />}>A random graph</Btn>
      <Btn onClick={() => load(graphId, flip)} icon={<Shuffle size={15} />}>New weights</Btn>
      <Btn onClick={() => { const f: [boolean, boolean] = [!flip[0], flip[1]]; load(graphId, f); }} icon={<FlipHorizontal size={15} />}>Mirror</Btn>
      {!narrow && <div style={{ fontSize: 11.5, color: "#6b7280", lineHeight: 1.5 }}>Click a weight to change it.</div>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="bg-blue-900 shadow-lg flex-shrink-0">
        <div className="px-4 sm:px-8 py-3 flex justify-between items-center">
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-3 sm:px-4 py-2 rounded-lg transition-colors" style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, fontWeight: 600 }}>
            <Home size={22} color="#fff" /><span className="text-white font-semibold text-lg">Home</span>
          </button>
          <div className="text-white font-bold text-base sm:text-lg tracking-wide whitespace-nowrap">Network Sandbox</div>
          <div className="hidden sm:block" style={{ width: 90 }} />
        </div>
      </div>
      <SandboxBoard problem={problem} panelTop={select} matrixMissing="–" onWeightChange={(id, w) => setNetwork((n) => ({ ...n, edges: n.edges.map((e) => (e.id === id ? { ...e, weight: w } : e)) }))} />
    </div>
  );
}

function Btn({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: "7px 10px", borderRadius: 8, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8, border: "2px solid #d1d5db", background: "#fff", color: "#475569", cursor: "pointer", textAlign: "left" }}>
      {icon}{children}
    </button>
  );
}
