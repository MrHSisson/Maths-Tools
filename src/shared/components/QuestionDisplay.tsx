import { MathRenderer, InlineMath } from "./MathRenderer";
import type { AnyQuestion } from "../types";
import { ansEq } from "../helpers";

export const QuestionDisplay = ({ q, cls, tight = false }: { q: AnyQuestion; cls: string; tight?: boolean }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyQ = q as any;
  if (anyQ.kind === "frac") {
    const parts = anyQ.latex.split(/\\text\{ of \}/);
    const fracLatex = parts[0].trim();
    const number = parts[1]?.trim() ?? "";
    return (
      <div className={`${cls} font-semibold text-center`} style={{ color: "#000", lineHeight: 1.5 }}>
        <span>Find </span><MathRenderer latex={fracLatex} /><span> of {number}</span>
      </div>
    );
  }
  if (anyQ.kind === "simple") {
    return (
      <div className={`${cls} font-semibold text-center`} style={{ color: "#000", lineHeight: 1.5 }}>
        {anyQ.displayLatex ? <MathRenderer latex={anyQ.displayLatex} /> : anyQ.display}
      </div>
    );
  }
  // worded / asFrac — multi-line
  return (
    <div className={`flex flex-col text-center ${tight ? "gap-1" : "gap-2"}`}>
      {(q as any).lines.map((line: string, i: number) => (
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyQ = q as any;
  if (anyQ.answerLatex) {
    // MathRenderer's default 0.826em/regular-weight sizing is tuned for
    // question text (font-semibold); the answer line is font-bold and
    // noticeably larger (see the wrapper divs in ToolShell.tsx), so at
    // defaults the KaTeX number reads much smaller/thinner than the plain
    // answerSuffix text next to it. Override to match the surrounding
    // bold answer text's size and weight.
    return (
      <>
        <MathRenderer latex={ansEq(anyQ.answerLatex)} style={matchSteps ? { fontWeight: 700 } : { fontWeight: 700, fontSize: "1em" }} />
        {anyQ.answerSuffix && <span> {anyQ.answerSuffix}</span>}
      </>
    );
  }
  return <span>{ansEq(anyQ.answer ?? "")}</span>;
};
