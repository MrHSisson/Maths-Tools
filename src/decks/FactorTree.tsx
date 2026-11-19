import { layoutTree, primeColour, productText, splitCount, tallyOf, type PlacedNode, type TreeNode } from "../shared/factorTree";
import type { DeckElement, FillMode } from "./types";

type El = Extract<DeckElement, { kind: "factorTree" }>;
const INK = "#1e293b", QUIET = "#64748b", EDGE = "#94a3b8";
const NODE_R = 46, FONT = 58;
const PRIMES_TO_19 = [2, 3, 5, 7, 11, 13, 17, 19];

/** `2^3 × 5` as maths-looking text: a raised number for each power, a prime that appears once written alone. */
function IndexForm({ tree }: { tree: TreeNode }) {
  const parts = tallyOf(tree);
  return <>{parts.map(({ p, count }, i) => <span key={p}>{i > 0 && " × "}{p}{count > 1 && <sup style={{ fontSize: "0.62em", lineHeight: 0 }}>{count}</sup>}</span>)}</>;
}

/** The factor tree as a slide piece. The whole tree is laid out at its full size from the first click (so nothing moves), and each
 *  split appears on its own click when staged. Primes are circled in their own colour the moment they appear and the branch stops.
 *  Filled in is the finished tree; Structure only is the root, the numbers the author gave and "?" where the next numbers go; Blank is
 *  the root alone. The tally and the product are shown only in Filled in, one click each. */
export function FactorTreeEl({ el, fill, stage }: { el: El; fill: FillMode; stage: number }) {
  const lay = layoutTree(el.tree);
  const reveal = el.reveal ?? [];
  const splits = splitCount(el.tree);
  const staged = !!el.staged && fill === "filled";
  const at = (i: number) => (staged ? stage >= splits + i + 1 : fill === "filled");   // has the i-th reveal click happened
  const productOn = reveal.includes("product") && at(reveal.indexOf("product"));
  const countsOn = reveal.includes("counts") && at(reveal.indexOf("counts"));
  const indexOn = reveal.includes("index") && at(reveal.indexOf("index"));
  const tally = tallyOf(el.tree);
  const showTally = fill === "filled" && reveal.includes("counts");
  const root = el.tree.n;

  const visible = (n: PlacedNode): boolean => fill === "filled" ? (!staged || n.stage <= stage) : fill === "structure" ? n.shown : n.parent === null;
  const placeholder = (n: PlacedNode, byId: Map<string, PlacedNode>): boolean => fill === "structure" && !n.shown && !!n.parent && !!byId.get(n.parent)?.shown;
  const byId = new Map(lay.nodes.map((n) => [n.id, n]));
  const pad = NODE_R + 16;
  const vw = lay.width - lay.slot + pad * 2, vh = lay.height - lay.level + pad * 2;
  const px = (n: PlacedNode) => n.x + pad, py = (n: PlacedNode) => n.y + pad;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 24 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", maxWidth: vw * 2.1, maxHeight: vh * 2.1, display: "block" }} role="img" aria-label={`Factor tree for ${root}`}>
            {lay.nodes.filter((n) => n.parent).map((n) => {
              const p = byId.get(n.parent!)!;
              if (!(visible(n) || placeholder(n, byId))) return null;
              // the line stops at the edge of each number, so it never runs through a circle
              const dx = px(n) - px(p), dy = py(n) - py(p), len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
              return <line key={`e${n.id}`} x1={px(p) + ux * (NODE_R - 4)} y1={py(p) + uy * (NODE_R - 4)} x2={px(n) - ux * (NODE_R - 4)} y2={py(n) - uy * (NODE_R - 4)} stroke={EDGE} strokeWidth={4} strokeLinecap="round" data-edge={n.id} />;
            })}
            {lay.nodes.map((n) => {
              if (placeholder(n, byId)) return (
                <g key={n.id} data-node={n.id} data-placeholder="1">
                  <circle cx={px(n)} cy={py(n)} r={NODE_R - 6} fill="none" stroke={EDGE} strokeWidth={4} strokeDasharray="10 9" />
                  <text x={px(n)} y={py(n) + FONT * 0.35} textAnchor="middle" fontSize={FONT} fontWeight={600} fill={EDGE} fontFamily="'Segoe UI',Arial,sans-serif">?</text>
                </g>
              );
              if (!visible(n)) return null;
              const colour = n.prime ? primeColour(n.n) : INK;
              return (
                <g key={n.id} data-node={n.id} data-prime={n.prime ? n.n : undefined}>
                  {n.prime && <circle cx={px(n)} cy={py(n)} r={NODE_R} fill="white" stroke={colour} strokeWidth={7} />}
                  <text x={px(n)} y={py(n) + FONT * 0.35} textAnchor="middle" fontSize={FONT} fontWeight={600} fill={colour} fontFamily="'Segoe UI',Arial,sans-serif">{n.n}</text>
                </g>
              );
            })}
          </svg>
        </div>
        {showTally && (
          <table style={{ alignSelf: "center", borderCollapse: "collapse", fontSize: 46, fontWeight: 600, color: INK, flexShrink: 0, opacity: countsOn ? 1 : 0 }} aria-label="Tally of the primes" data-tally>
            <thead><tr style={{ fontSize: 28, color: QUIET }}>
              <th style={{ padding: "6px 22px", textAlign: "center" }}>Prime</th>
              <th style={{ padding: "6px 22px", textAlign: "center", opacity: countsOn ? 1 : 0 }}>How many</th>
              <th style={{ padding: "6px 22px", textAlign: "center", opacity: indexOn ? 1 : 0 }}>Index form</th>
            </tr></thead>
            <tbody>{tally.map(({ p, count }) => (
              <tr key={p} style={{ borderTop: "2px solid #cbd5e1" }}>
                <td style={{ padding: "8px 22px", textAlign: "center", color: primeColour(p) }}>{p}</td>
                <td style={{ padding: "8px 22px", textAlign: "center", opacity: countsOn ? 1 : 0 }} data-count={p}>{count}</td>
                <td style={{ padding: "8px 22px", textAlign: "center", opacity: indexOn ? 1 : 0 }} data-index={p}>{p}{count > 1 && <sup style={{ fontSize: "0.62em", lineHeight: 0 }}>{count}</sup>}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {fill === "filled" && (reveal.includes("product") || reveal.includes("index")) && (
        <div style={{ flexShrink: 0, textAlign: "center", fontSize: 52, fontWeight: 600, color: INK, lineHeight: 1.25 }} data-lines>
          <div style={{ opacity: productOn ? 1 : 0 }} data-product>{root} = {productText(el.tree)}</div>
          {reveal.includes("index") && <div style={{ opacity: indexOn ? 1 : 0 }} data-indexform>{root} = <IndexForm tree={el.tree} /></div>}
        </div>
      )}
      {(el.strip || el.rules) && (
        <div style={{ flexShrink: 0, textAlign: "center", fontSize: 28, color: QUIET, lineHeight: 1.35 }} data-help>
          {el.strip && <div>Primes to 20: {PRIMES_TO_19.join("  ")}</div>}
          {el.rules && <div>Even: 2 goes in · Ends in 0 or 5: 5 goes in · Digits add to a 3 table number: 3 goes in</div>}
        </div>
      )}
    </div>
  );
}
