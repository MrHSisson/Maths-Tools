// Asks the Critical Path worker for a new question. The generator can take a second or more, and while it runs on the page nothing on the page can move,
// so the work is done in a Web Worker. A failure of the worker itself (no Worker, a script that will not load, a result that cannot be sent back) is
// reported as `WorkerUnavailable`, and the shell then makes the question on the page as before; a failure of the generator is an ordinary error.
import type { DecisionProblem, GenerateContext } from "../../shared/decision/types";

export class WorkerUnavailable extends Error { name = "WorkerUnavailable"; }

type Pending = { resolve: (p: DecisionProblem) => void; reject: (e: Error) => void };
let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, Pending>();

function failAll(e: Error) {
  pending.forEach((p) => p.reject(e));
  pending.clear();
  worker?.terminate();
  worker = null;
}

export function generateInWorker(level: number, ctx?: GenerateContext): Promise<DecisionProblem> {
  if (typeof Worker === "undefined") return Promise.reject(new WorkerUnavailable("no Worker"));
  try {
    if (!worker) {
      worker = new Worker(new URL("./criticalPath.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent<{ id: number; problem?: DecisionProblem; error?: string }>) => {
        const p = pending.get(e.data.id);
        if (!p) return;
        pending.delete(e.data.id);
        if (e.data.problem) p.resolve(e.data.problem); else p.reject(new Error(e.data.error ?? "generate failed"));
      };
      worker.onerror = () => failAll(new WorkerUnavailable("worker failed"));
      worker.onmessageerror = () => failAll(new WorkerUnavailable("worker message failed"));
    }
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      try { worker!.postMessage({ id, level, ctx }); } catch (e) { pending.delete(id); failAll(new WorkerUnavailable(String(e))); reject(new WorkerUnavailable(String(e))); }
    });
  } catch (e) {
    worker = null;
    return Promise.reject(new WorkerUnavailable(String(e)));
  }
}
