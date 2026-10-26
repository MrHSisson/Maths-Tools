import { extras } from "../questionExtras";
import { MathRenderer, InlineMath } from "./MathRenderer";
import type { AnyQuestion } from "../types";
import { ansEq } from "../helpers";
import { promptOf } from "../prompts";

export const QuestionDisplay = ({ q, cls, tight = false }: { q: AnyQuestion; cls: string; tight?: boolean }) => {
  if (q.kind === "simple") {
    return (
      <div className={`${cls} font-semibold text-center`} style={{ color: "#000", lineHeight: 1.5 }}>
        {q.displayLatex ? <MathRenderer latex={q.displayLatex} /> : q.display}
      </div>
    );
  }
  // a tagged question (condensed wording): the first line is the question, the lines after it are a small tag — "123.45" over "(3 d.p.)"
  if (extras(q)._tagged) {
    return (
      <div className={`flex flex-col text-center gap-1 ${cls} font-semibold`} style={{ color: "#000", lineHeight: 1.4 }}>
        <div><InlineMath text={q.lines[0]} /></div>
        {q.lines.slice(1).map((line, i) => (
          <div key={i} className="font-medium" style={{ color: "#475569", fontSize: "0.5em", lineHeight: 1.3 }}><InlineMath text={line} /></div>
        ))}
      </div>
    );
  }
  // a "prompt + maths" question on the board: the prompt is a quiet instruction line and the maths is the emphasis
  const prompt = tight ? null : promptOf(q);
  if (prompt !== null) {
    const lines = q.lines;
    return (
      <div className={`flex flex-col text-center gap-2 ${cls}`}>
        <div className="font-medium" style={{ color: "#475569", fontSize: "0.5em", lineHeight: 1.3 }}><InlineMath text={lines[0]} /></div>
        <div className="font-semibold" style={{ color: "#000", lineHeight: 1.5 }}><InlineMath text={lines[1]} /></div>
      </div>
    );
  }
  // worded / asFrac — multi-line
  return (
    <div className={`flex flex-col text-center ${tight ? "gap-1" : "gap-2"}`}>
      {q.lines.map((line, i) => (
        <div key={i} className={`${cls} font-semibold`} style={{ color: "#000", lineHeight: tight ? 1.4 : 2.2 }}>
          <InlineMath text={line} />
        </div>
      ))}
    </div>
  );
};

/** `matchSteps`: inside a worked example, draw the answer's maths at exactly the size of the working above it
 *  (MathRenderer's own sizing) instead of the larger whiteboard/worksheet sizing below. */
export const AnswerDisplay = ({ q, matchSteps = false }: { q: AnyQuestion; matchSteps?: boolean }) => {
  if (q.answerLatex) {
    // MathRenderer's default 0.826em/regular-weight sizing is tuned for
    // question text (font-semibold); the answer line is font-bold and
    // noticeably larger (see the wrapper divs in ToolShell.tsx), so at
    // defaults the KaTeX number reads much smaller/thinner than the plain
    // answerSuffix text next to it. Override to match the surrounding
    // bold answer text's size and weight.
    return (
      <>
        <MathRenderer latex={ansEq(q.answerLatex)} style={matchSteps ? { fontWeight: 700 } : { fontWeight: 700, fontSize: "1em" }} />
        {q.answerSuffix && <span> {q.answerSuffix}</span>}
      </>
    );
  }
  return <span>{ansEq(q.answer ?? "")}</span>;
};
