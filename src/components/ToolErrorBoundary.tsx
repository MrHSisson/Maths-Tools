import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

// Catches a crash inside a single tool so the whole app doesn't white-screen
// mid-lesson — the teacher gets a way back home and a retry.
export class ToolErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-8 max-w-lg text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="text-xl font-bold text-slate-800 mb-2">This tool hit a problem</h1>
          <p className="text-slate-500 text-sm mb-6">
            Something went wrong while generating or displaying a question. Reloading usually fixes it.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg bg-blue-900 text-white font-semibold text-sm hover:bg-blue-800 transition-colors"
            >
              Reload tool
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Back to home
            </button>
          </div>
          <p className="text-slate-400 text-xs mt-6 font-mono break-all">{this.state.error.message}</p>
        </div>
      </div>
    );
  }
}
