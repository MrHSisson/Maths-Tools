import { asDepthItem, isDepthQuestion } from "./questions";
import { SLIDE_BUTTON_PX, slideButton } from "./slideButton";
import { DepthSlide } from "../shared/components/DepthSlide";
import type { DepthItem } from "../shared/depth";
import { DepthClaims, DepthFeathers } from "./DepthArtwork";
import type { QuestionDisplaySettings } from "../../api/_questionDisplay";
import { QuestionFrame } from "./QuestionFrame";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { InlineMath, MathRenderer } from "../shared/components/MathRenderer";
import { SolutionStepper, useSolutionStepper } from "../shared/components/SolutionStepper";
import { BidmasPyramid } from "../shared/components/BidmasPyramid";
import type { DepthVisual } from "../shared/depth";
import { loadDepthItems } from "./generators";
import { WorkedPicture, parsePictureLine } from "./WorkedPicture";
import type { CuratedQuestion } from "./types";

const PURPOSE = { practice: "Deliberate practice", diagnose: "Diagnose", explain: "Explain", extend: "Extend" };
const button: CSSProperties = { padding: "10px 20px", borderRadius: 14, border: "1px solid #cbd5e1", background: "white", fontWeight: 600, color: "#334155", minHeight: 48 };
export function QuestionText({ lines }: { lines: string[] }) {
  // a ratio given on its own line ("red : blue = $3 : 5$") stands out from the question beneath it
  const ratio = (line: string) => /^[^$]+ : [^$]+ = \$[^$]+\$$/.test(line);
  return <>{lines.map((line, i) => {
    const picture = parsePictureLine(line);                       // a ratio table or bar model in a fixed question's working
    if (picture) return <WorkedPicture key={i} type={picture.type} data={picture.data} caption={picture.caption} />;
    return <div key={i} style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.4, ...(ratio(line) ? { fontSize: "1.2em", fontWeight: 600, marginBottom: "0.25em" } : {}) }}><InlineMath text={line} /></div>;
  })}</>;
}
function Visual({ reference }: { reference: NonNullable<CuratedQuestion["visual"]> }) {
  const [visual, setVisual] = useState<DepthVisual | null | undefined>();
  useEffect(() => { let on = true; void loadDepthItems(reference.tool).then((items) => { if (on) setVisual(items.find((i) => i.id === reference.item)?.visual ?? null); }); return () => { on = false; }; }, [reference.tool, reference.item]);
  if (visual === undefined) return <div>Loading diagram…</div>;
  if (!visual) return <div role="alert" style={{ color: "#b91c1c", fontSize: "0.7em" }}>Diagram {reference.item} is unavailable. Replace it in Questions; the question content is preserved.</div>;
  return <div style={{ maxWidth: 650, margin: "12px auto" }}>{visual.type === "custom" ? visual.render(true, true) : <BidmasPyramid strong={visual.strong} soft={visual.soft} maxWidth={420} />}</div>;
}

/** A single source for the classroom and workspace preview. State is reset by the sequence's per-question key. */
function ClassroomQuestion({ question: q, live = false, base = 46, stacked = false, standaloneDepth = false }: { question: CuratedQuestion; live?: boolean; base?: number; stacked?: boolean; standaloneDepth?: boolean }) {
  const solution = useSolutionStepper(q.explanation.length, q.answer.some((line) => line.trim().length > 0));
  const depth = standaloneDepth || isDepthQuestion(q);
  const [depthAnswer, setDepthAnswer] = useState(false);
  const toggleDepthAnswer = useCallback(() => setDepthAnswer((v) => !v), []);
  const answer = depth ? depthAnswer : solution.answer;
  const toggleAnswer = depth ? toggleDepthAnswer : solution.toggleAnswer;
  const next = solution.next;
  const [feathersOn, setFeathersOn] = useState(() => { try { return localStorage.getItem("mt-depth-feathers") !== "off"; } catch { return true; } });
  const toggleFeathers = useCallback(() => { setFeathersOn((was) => { const on = !was; try { localStorage.setItem("mt-depth-feathers", on ? "on" : "off"); } catch { /* session only */ } return on; }); }, []);
  const [pick, setPick] = useState<number | null>(null);
  const [size, setSize] = useState(base);
  const body = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { setSize(base); }, [base, answer, solution.at, solution.all, q, stacked, feathersOn]);
  useLayoutEffect(() => {
    const el = body.current;
    const question = el?.querySelector<HTMLElement>(".solution-question"), content = el?.querySelector<HTMLElement>(".solution-question-content");
    const card = el?.querySelector<HTMLElement>(".depth-slide-body");
    const artOverflows = depth && ((card && card.scrollHeight > card.clientHeight + 2) || (question && content && content.scrollHeight > question.clientHeight + 2));
    if (el && (artOverflows || el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) && size > Math.min(base, 30)) setSize(Math.max(Math.min(base, 30), Math.floor(size * 0.94)));
  }, [size, base, answer, solution.at, solution.all, q, stacked, feathersOn, depth]);
  useEffect(() => {
    if (!live) return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select,[contenteditable],dialog")) return;
      if (e.key === "a") toggleAnswer();
      if (e.key === "w" && !depth) next();
      if (e.key === "f" && depth) toggleFeathers();
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [live, toggleAnswer, next, depth, toggleFeathers]);
  const B = live ? "button" : "span";
  const controlButton = slideButton;
  const options = q.format === "choice" || q.format === "claims" ? q.options : [];
  const questionContent = <div style={{ display: "flex", flexDirection: "column", gap: "0.55em", textAlign: q.format === "open" && q.question.join("").length < 170 ? "center" : "left" }}>
      {q.missing && <div role="alert" style={{ color: "#b91c1c" }}>Missing source: {q.missing}. Replace this item in Questions.</div>}
        {depth && !answer && q.format === "claims" && <DepthClaims claims={q.claims} />}
        {(!depth || !answer) && <div style={{ fontSize: "1em", fontWeight: 500 }}><QuestionText lines={q.question} /></div>}
        {q.format === "claims" && !depth && <div style={{ display: "grid", gap: "0.35em" }}>{q.claims.map((c, i) => <div key={i} style={{ borderLeft: "4px solid #7c3aed", paddingLeft: "0.5em" }}><b>{c.name}: </b><QuestionText lines={c.text.split("\n")} /></div>)}</div>}
        {q.format === "error" && <div>{q.lines.map((line, i) => <B key={i} onClick={() => !answer && setPick(i)} style={{ ...button, display: "flex", width: "100%", alignItems: "center", gap: 20, margin: "6px 0", textAlign: "left", borderColor: answer && i === q.wrongLine ? "#dc2626" : pick === i ? "#2563eb" : "#e2e8f0", background: answer && i === q.wrongLine ? "#fef2f2" : "white" }}><span style={{ fontSize: "0.6em", color: "#64748b" }}>{i + 1}</span><MathRenderer latex={line} />{answer && i === q.wrongLine && <span style={{ marginLeft: "auto", fontSize: "0.55em", color: "#b91c1c" }}>FIRST ERROR</span>}{!answer && pick === i && <span style={{ marginLeft: "auto", fontSize: "0.55em" }}>OUR PICK</span>}</B>)}</div>}
        {!!options.length && <div style={{ display: "grid", gridTemplateColumns: `repeat(${options.length <= 3 ? options.length : 2},minmax(0,1fr))`, gap: "0.35em" }}>{options.map((o, i) => <B key={i} onClick={() => !answer && setPick(i)} aria-pressed={pick === i} style={{ ...button, textAlign: "left", borderColor: answer && o.correct ? "#16a34a" : pick === i ? "#2563eb" : "#cbd5e1", background: answer && o.correct ? "#f0fdf4" : "white", fontSize: "1em" }}><b>{String.fromCharCode(65 + i)}. </b><InlineMath text={o.text} />{answer && <div style={{ fontSize: "0.75em", marginTop: 8 }}>{o.correct ? "Correct" : <InlineMath text={o.reasoning} />}</div>}</B>)}</div>}
      {answer && q.visual && <Visual reference={q.visual} />}
    </div>;
  return <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 20, color: "#0f172a" }} data-question-id={q.id}>
    <div style={{ fontSize: base * 0.55, color: "#64748b", fontWeight: 600 }}>{`${PURPOSE[q.purpose]} · Level ${q.level.slice(-1)}`}{q.status === "draft" && " · Draft"}</div>
    <div ref={body} style={{ flex: 1, minHeight: 0, overflow: "hidden", fontSize: size, position: "relative" }}>
      {depth ? <section className="depth-slide-body" aria-label={answer ? "Depth answer" : "Depth question"} data-depth-face={answer ? "answer" : "question"}><div className="depth-slide-content">
        {answer && <div className="depth-answer-heading">Answer</div>}
        {questionContent}
        {answer && <div className="depth-answer-reasoning" data-answer=""><QuestionText lines={q.answer} />{q.explanation.map((line, i) => <div key={i} data-explanation=""><QuestionText lines={[line]} /></div>)}</div>}
      </div></section> : <SolutionStepper layout={stacked ? "stacked" : "split"} question={questionContent} steps={q.explanation.map((line, i) => <QuestionText key={i} lines={[line]} />)} answer={<QuestionText lines={q.answer} />} state={solution} live={live} fontSize={size} largeQuestion={q.format === "open" && q.question.join("").length < 100} />}

    </div>
    {depth && feathersOn && <DepthFeathers question={q} answer={answer} base={base} />}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {depth && <B style={controlButton} onClick={toggleAnswer}>{answer ? "Back to question" : "Show answer"}</B>}
      {!depth && !solution.open && q.explanation.length > 0 && <B style={controlButton} onClick={solution.next}>Show working</B>}
    </div>
  </div>;
}
export function QuestionSequence({ items, live, size, display = {}, depthSlide = false }: { items: CuratedQuestion[]; live: boolean; size?: number; display?: QuestionDisplaySettings; depthSlide?: boolean }) {
  const [at, setAt] = useState(0);
  const index = Math.min(at, Math.max(0, items.length - 1));
  const B = live ? "button" : "span";
  const go = (i: number) => { setAt(i); window.dispatchEvent(new Event("mt-ink-clear")); };
  const standaloneDepth = depthSlide || items.some(isDepthQuestion);
  if (!items.length) return <div style={{ fontSize: 40, color: "#64748b" }}>Open Questions to add or create a question.</div>;
  return <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
    <div style={{ flex: 1, minHeight: 0 }}><QuestionFrame display={standaloneDepth ? { presentation: "full", visualiser: false } : display} live={live}><QuestionPresentation key={`${index}-${JSON.stringify(items[index])}`} question={items[index]} live={live} standaloneDepth={standaloneDepth} base={Math.max(30, Math.min(depthSlide || standaloneDepth ? 84 : 64, size ?? 46))} stacked={!!display.presentation && display.presentation !== "full"} /></QuestionFrame></div>
    {!(standaloneDepth && items.length === 1) && <nav aria-label="Question sequence" style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 26, borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
      <B style={slideButton} disabled={index === 0} onClick={() => go(Math.max(0, index - 1))}>Previous question</B>
      <span style={{ flex: 1, color: "#64748b", textAlign: "center" }}>Question {index + 1} of {items.length}{index === items.length - 1 ? " · End of sequence" : ""}</span>
      <B style={slideButton} disabled={index === items.length - 1} onClick={() => go(Math.min(items.length - 1, index + 1))}>Next question</B>
    </nav>}
  </div>;
}

/** A Depth-shaped question drawn by the Depth slide (the bank's own picture is kept when the question came from the bank). */
function DepthQuestion({ question: q, live }: { question: CuratedQuestion; live: boolean }) {
  const [picture, setPicture] = useState<DepthItem["visual"]>();
  const [answer, setAnswer] = useState(false);
  const source = q.source?.kind === "depth" ? q.source : null;
  useEffect(() => { let on = true; if (source) void loadDepthItems(source.tool).then((items) => { if (on) setPicture(items.find((i) => i.id === source.id)?.visual); }).catch(() => undefined); return () => { on = false; }; }, [source?.tool, source?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: the source's two fields are the dependency
  const item = { ...asDepthItem(q), ...(picture ? { visual: picture } : {}) };
  return <DepthSlide item={item} answer={answer} onAnswerChange={setAnswer} live={live} controls base="40px" buttonSize={`${SLIDE_BUTTON_PX}px`} />;
}

export function QuestionPresentation(props: { question: CuratedQuestion; live?: boolean; base?: number; stacked?: boolean; standaloneDepth?: boolean }) {
  return props.standaloneDepth || isDepthQuestion(props.question) ? <DepthQuestion question={props.question} live={!!props.live} /> : <ClassroomQuestion {...props} />;
}
