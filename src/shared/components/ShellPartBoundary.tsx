import { Component, type ReactNode } from "react";
import { reportShellFault, describeFault, type ShellFault, type ShellFaultContext } from "../shellDiagnostics";

interface Props {
  /** The part of the shell this wraps ("Whiteboard", "Worksheet"…); named in the message and the console report. */
  part: string;
  /** The setup being shown, recorded with the failure. */
  context?: ShellFaultContext;
  /** When this changes the part tries again (a new question, another mode). */
  resetKey?: unknown;
  children: ReactNode;
}
interface State { failed: boolean; fault: ShellFault | null }

/**
 * Isolates one screen of the shell. If it throws while rendering, only that screen is replaced by a short message naming it (with a
 * Try again button), the failure is recorded (`reportShellFault`), and the rest of the page, including the menu and the way home, keeps working.
 */
export class ShellPartBoundary extends Component<Props, State> {
  state: State = { failed: false, fault: null };

  static getDerivedStateFromError(): Partial<State> { return { failed: true }; }

  componentDidCatch(error: Error): void {
    this.setState({ fault: reportShellFault(this.props.part, error, this.props.context) });
  }

  componentDidUpdate(prev: Props): void {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false, fault: null });
  }

  render() {
    const { failed, fault } = this.state;
    if (!failed) return this.props.children;
    return (
      <div role="alert" data-shell-fault={this.props.part} className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-slate-800">
        <div className="font-semibold">The {this.props.part} hit a problem</div>
        <p className="mt-1 text-slate-600">The rest of the page still works. You can try again, or switch mode or question.</p>
        <p className="mt-2 break-words font-mono text-xs text-slate-500">{fault ? describeFault(fault) : ""}</p>
        <button onClick={() => this.setState({ failed: false, fault: null })} className="mt-3 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Try again</button>
      </div>
    );
  }
}
