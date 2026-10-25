// Where a ToolShell failure is recorded. Every screen of the shell (Whiteboard, Worked Example, Worksheet, phone layout…) and every
// generator call runs behind a guard that reports here, so a failure names the part that broke and the setup it broke under instead of
// white-screening the tool. Read the record in the browser console with `window.__mtFaults`, or listen for the `mt-shell-fault` event.

export interface ShellFaultContext {
  tool?: string;       // the sub-tool key
  level?: string;
  mode?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ShellFault {
  part: string;        // "Whiteboard", "Worksheet generation"…
  message: string;
  stack?: string;
  context: ShellFaultContext;
  at: number;
}

const MAX_KEPT = 20;
export const SHELL_FAULT_EVENT = "mt-shell-fault";
const faults: ShellFault[] = [];

/** Record a failure. Never throws: reporting must not become a second failure. */
export function reportShellFault(part: string, error: unknown, context: ShellFaultContext = {}): ShellFault {
  const err = error instanceof Error ? error : new Error(String(error));
  const fault: ShellFault = { part, message: err.message || "Unknown error", stack: err.stack, context, at: Date.now() };
  faults.push(fault);
  if (faults.length > MAX_KEPT) faults.shift();
  try {
    console.error(`[ToolShell:${part}] ${fault.message}`, context, err);
    if (typeof window !== "undefined") {
      (window as unknown as { __mtFaults?: ShellFault[] }).__mtFaults = faults;
      window.dispatchEvent(new CustomEvent(SHELL_FAULT_EVENT, { detail: fault }));
    }
  } catch { /* nothing more to do */ }
  return fault;
}

/** The recorded failures, oldest first (at most the last 20). */
export const shellFaults = (): readonly ShellFault[] => faults;
export const clearShellFaults = (): void => { faults.length = 0; };

/** Run `fn`; if it throws, record the failure under `part` and return `undefined` instead. */
export function guarded<T>(part: string, context: ShellFaultContext, fn: () => T): T | undefined {
  try { return fn(); } catch (e) { reportShellFault(part, e, context); return undefined; }
}

/** One plain line for a person: what failed and under which setup. */
export function describeFault(f: ShellFault): string {
  const where = [f.context.tool && `sub-tool "${f.context.tool}"`, f.context.level, f.context.mode && `${f.context.mode} mode`].filter(Boolean).join(", ");
  return `${f.part} failed${where ? ` (${where})` : ""}: ${f.message}`;
}
