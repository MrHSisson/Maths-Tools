import { Fragment, type ReactNode } from "react";
import { InlineMath } from "../components/MathRenderer";

// A question's words laid out as a page rather than one block: the context in short paragraphs (one limit or one fact each), the task in a paragraph of its own, and an
// "optimise … subject to …" statement as a small grid with the constraints one to a line and their ≤ and ≥ signs lined up. It works from the prompt text alone (maths between
// $…$), so any tool can use it; a prompt it does not recognise simply becomes paragraphs. Used by the question stage (DecisionShell `config.questionStage`).

/** split a prompt into sentences, never inside $…$ */
export function sentences(text: string): string[] {
  const maths: string[] = [];
  const masked = text.replace(/\$[^$]+\$/g, (m) => { maths.push(m); return `\u0000${maths.length - 1}\u0000`; });
  return masked.split(/(?<=[.?!])\s+/).map((s) => s.replace(/\u0000(\d+)\u0000/g, (_, i) => maths[Number(i)]).trim()).filter(Boolean);
}

const TASK = /^(Formulate|Use|State|Write|Find|Choose|Explain|Show|Is |Say|Read|Carry|Give|Solve|Determine|Work|Complete|Describe|Then)\b/;
/** a sentence after which a new paragraph starts: a limit, a fact about the whole problem, the profit, a definition of a letter */
const ENDS_PARAGRAPH = /^(There (is|are)|The total|The mix|The number|Only |Let |A simplex tableau|The tableau|The initial)|profit of|sells for|must be integers|can be made/;
const STARTS_PARAGRAPH = /^The simplex algorithm gives/;

interface QuestionParts {
  /** an optimise-subject-to statement, when the prompt opens with one */
  lp?: { sense: string; objective: string; constraints: string[] };
  /** the context, as paragraphs of sentences */
  paragraphs: string[][];
  /** the task: the trailing instructions */
  task: string[];
}

const SUBJECT_TO = /^(Maximise|Minimise)\s+(\$[^$]+\$)\s+subject to\s+((?:\$[^$]+\$(?:,\s*|\s+and\s+)?)+)\.\s*/;

export function splitQuestion(prompt: string): QuestionParts {
  let rest = prompt.trim();
  let lp: QuestionParts["lp"];
  const m = SUBJECT_TO.exec(rest);
  if (m) {
    lp = { sense: m[1], objective: m[2].slice(1, -1), constraints: (m[3].match(/\$[^$]+\$/g) ?? []).map((c) => c.slice(1, -1)) };
    rest = rest.slice(m[0].length);
  }
  const ss = sentences(rest);
  let cut = ss.length;
  while (cut > 0 && TASK.test(ss[cut - 1])) cut--;
  const task = ss.slice(cut), body = ss.slice(0, cut);
  const paragraphs: string[][] = [];
  let cur: string[] = [];
  body.forEach((s, i) => {
    if (cur.length && STARTS_PARAGRAPH.test(s)) { paragraphs.push(cur); cur = []; }
    cur.push(s);
    // the first sentence of a story (what is being made) stands alone, then each limit or fact closes a paragraph
    if ((i === 0 && !lp && body.length > 2) || ENDS_PARAGRAPH.test(s)) { paragraphs.push(cur); cur = []; }
  });
  if (cur.length) paragraphs.push(cur);
  return { lp, paragraphs, task };
}

const REL = /^(.*?)(\\leq|\\geq|\\le|\\ge|<|>|=)(.*)$/;
const sym = (op: string): string => (op === "\\leq" ? "\\le" : op === "\\geq" ? "\\ge" : op);
const tex = (t: string) => `$${t.trim()}$`;

/** the constraints as a grid: left side, sign, right side, so the signs line up */
function Constraints({ lines, size }: { lines: string[]; size: string }) {
  return (
    <div className={`grid items-baseline gap-x-3 gap-y-1 ${size}`} style={{ gridTemplateColumns: "auto auto auto" }}>
      {lines.map((c, i) => {
        const r = REL.exec(c);
        const last = i === lines.length - 1 && /^\s*[a-z](\s*,\s*[a-z])*\s*\\ge/.test(c);   // x, y ≥ 0
        const colour = last ? "text-slate-500" : "text-slate-900";
        return r ? (
          <Fragment key={i}>
            <span className={`text-right ${colour}`}><InlineMath text={tex(r[1])} /></span>
            <span className={colour}><InlineMath text={tex(sym(r[2]))} /></span>
            <span className={`text-left ${colour}`}><InlineMath text={tex(r[3])} /></span>
          </Fragment>
        ) : <span key={i} className={`col-span-3 ${colour}`}><InlineMath text={tex(c)} /></span>;
      })}
    </div>
  );
}

export default function QuestionText({ prompt, size = "text-xl xl:text-2xl" }: { prompt: string; size?: string }): ReactNode {
  const q = splitQuestion(prompt);
  return (
    <div className={`flex flex-col gap-3 text-slate-900 leading-snug ${size}`}>
      {q.lp && (
        <div className="flex flex-col gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <div className="flex items-baseline gap-3 font-semibold"><span className="w-24 shrink-0 text-slate-500 text-[0.8em]">{q.lp.sense}</span><InlineMath text={tex(q.lp.objective)} /></div>
          <div className="flex items-start gap-3"><span className="w-24 shrink-0 pt-0.5 text-slate-500 font-semibold text-[0.8em]">subject to</span><Constraints lines={q.lp.constraints} size="" /></div>
        </div>
      )}
      {q.paragraphs.map((p, i) => <p key={i} className="font-medium text-slate-800"><InlineMath text={p.join(" ")} /></p>)}
      {q.task.length > 0 && <p className="font-semibold text-slate-900"><InlineMath text={q.task.join(" ")} /></p>}
    </div>
  );
}
