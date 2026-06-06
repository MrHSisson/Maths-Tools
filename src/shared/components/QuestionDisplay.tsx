import { MathRenderer, InlineMath } from "./MathRenderer";
import type { AnyQuestion } from "../types";
import { ansEq } from "../helpers";

export const QuestionDisplay = ({ q, cls }: { q: AnyQuestion; cls: string }) => {
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
    <div className="flex flex-col gap-2 text-center">
      {(q as any).lines.map((line: string, i: number) => (
        <div key={i} className={`${cls} font-semibold`} style={{ color: "#000", lineHeight: 2.2 }}>
          <InlineMath text={line} />
        </div>
      ))}
    </div>
  );
};

export const AnswerDisplay = ({ q }: { q: AnyQuestion }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyQ = q as any;
  if (anyQ.answerLatex) {
    return (
      <>
        <MathRenderer latex={ansEq(anyQ.answerLatex)} />
        {anyQ.answerSuffix && <span> {anyQ.answerSuffix}</span>}
      </>
    );
  }
  return <span>{ansEq(anyQ.answer ?? "")}</span>;
};
