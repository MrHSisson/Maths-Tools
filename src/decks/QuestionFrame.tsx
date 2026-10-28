import type { ReactNode } from "react";
import type { QuestionDisplaySettings } from "../../api/_questionDisplay";
import { WhiteboardWorkspace } from "./WhiteboardWorkspace";

/** Keep this outside the per-question key so a camera stays connected throughout an authored set. */
export function QuestionFrame({ display, live, children }: { display: QuestionDisplaySettings; live: boolean; children: ReactNode }) {
  const presentation = display.presentation ?? "full";
  if (presentation === "full") return <div className="question-frame-full">{children}</div>;
  return <div className="question-frame" data-presentation={presentation}><div className="question-frame-question">{children}</div><WhiteboardWorkspace live={live} visualiser={display.visualiser !== false} /></div>;
}
