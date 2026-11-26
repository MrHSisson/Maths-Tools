import { useCallback, useEffect, useRef, useState } from "react";
import { withCatalogue } from "./catalogue";
import { isProjectPlan, type ProjectPlan } from "../../api/_projectPlan";

const accessKey = "mt-project-plan-access";

class AccessDenied extends Error {}

async function request(key: string, init: RequestInit = {}): Promise<ProjectPlan> {
  const response = await fetch("/api/project-plan", { ...init, headers: { "x-project-plan-key": key, "content-type": "application/json" } });
  if (response.status === 401) throw new AccessDenied("The access key was not accepted.");
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok || !isProjectPlan(result)) {
    const error = result as { error?: string } | null;
    throw new Error(error?.error ?? "Could not reach the shared project plan.");
  }
  return withCatalogue(result);
}

export function useProjectPlan(open: boolean) {
  const [key, setKey] = useState(() => {
    try { return localStorage.getItem(accessKey) ?? ""; } catch { return ""; }
  });
  const [plan, setPlan] = useState<ProjectPlan>();
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const writing = useRef(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (writing.current || !key) return;
    try {
      const next = await request(key, { signal });
      if (signal?.aborted) return;
      setPlan(current => !current || next.revision > current.revision ? next : current);
      setLoadError("");
    } catch (error) {
      if (signal?.aborted) return;
      if (error instanceof AccessDenied) {
        setKey("");
        setPlan(undefined);
        try { localStorage.removeItem(accessKey); } catch { /* Storage is unavailable. */ }
      }
      setLoadError(error instanceof Error ? error.message : "Could not load the shared project plan.");
    }
  }, [key]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const reload = () => void refresh(controller.signal);
    reload();
    const timer = window.setInterval(reload, 15000);
    window.addEventListener("focus", reload);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", reload);
    };
  }, [open, refresh]);

  async function save(next: ProjectPlan) {
    if (writing.current || !key) return false;
    if (!isProjectPlan(next)) {
      setSaveError("Check for a circular dependency or a branch moved inside itself.");
      return false;
    }
    writing.current = true;
    setSaving(true);
    setSaveError("");
    let saved = false;
    try {
      const result = await request(key, { method: "POST", body: JSON.stringify(next) });
      setPlan(result);
      saved = true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save the plan.");
    } finally {
      writing.current = false;
      setSaving(false);
    }
    if (!saved) void refresh();
    return saved;
  }

  function unlock(value: string) {
    const next = value.trim();
    if (!next) return;
    setSaveError("");
    setLoadError("");
    setKey(next);
    try { localStorage.setItem(accessKey, next); } catch { /* Keep the key for this page only. */ }
  }

  return { plan, error: loadError || saveError, saving, loadFailed: !!loadError, save, locked: !key, unlock, reload: () => { setSaveError(""); void refresh(); } };
}
