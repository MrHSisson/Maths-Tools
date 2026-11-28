import { lazy, Suspense, useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

const ProjectPlanPanel = lazy(() => import("./ProjectPlanPanel"));
const OPEN_KEY = "mt-project-plan-open";
const DOCK_MIN_WIDTH = 860;
const FRAME_GUTTER = 16;

function subscribeToResize(notify: () => void) {
  window.addEventListener("resize", notify);
  return () => window.removeEventListener("resize", notify);
}

const ignoreResize = () => () => {};
const viewportWidth = () => window.innerWidth;

export default function ProjectWorkspace({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(() => {
    try { return sessionStorage.getItem(OPEN_KEY) === "1"; } catch { return false; }
  });
  const [wide, setWide] = useState(false);
  const visible = enabled && open;
  const width = useSyncExternalStore(visible ? subscribeToResize : ignoreResize, viewportWidth);
  const docked = visible && width >= DOCK_MIN_WIDTH;
  const panelWidth = docked ? Math.min(wide ? 540 : 384, Math.round(width * (wide ? 0.38 : 0.27))) : 0;
  const scale = docked ? (width - panelWidth - 2 * FRAME_GUTTER) / width : 1;
  const site = useRef<HTMLDivElement>(null);
  const scroll = useRef(0);
  const wasDocked = useRef(false);

  useLayoutEffect(() => {
    const frame = site.current;
    if (docked) {
      if (frame) frame.scrollTop = scroll.current;
    } else if (wasDocked.current) {
      window.scrollTo(0, scroll.current);
    }
    wasDocked.current = docked;

    const rememberWindowScroll = () => { scroll.current = window.scrollY; };
    if (!docked) {
      rememberWindowScroll();
      window.addEventListener("scroll", rememberWindowScroll, { passive: true });
      return () => window.removeEventListener("scroll", rememberWindowScroll);
    }
  }, [docked]);

  const changeOpen = useCallback((next: boolean) => {
    if (docked && site.current) scroll.current = site.current.scrollTop;
    else scroll.current = window.scrollY;
    try { sessionStorage.setItem(OPEN_KEY, next ? "1" : "0"); } catch { /* Storage is unavailable. */ }
    setOpen(next);
  }, [docked]);

  return <>
    {enabled && <Suspense fallback={null}>
      <ProjectPlanPanel open={open} setOpen={changeOpen} panelWidth={panelWidth} wide={wide} toggleWidth={() => setWide(value => !value)} />
    </Suspense>}
    <div
      className={docked ? "fixed inset-0 overflow-hidden bg-slate-100 print:!static print:!overflow-visible" : undefined}
    >
      <div
        className={docked ? "absolute overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-300 print:!static print:!h-auto print:!transform-none print:!overflow-visible print:!shadow-none print:!ring-0" : undefined}
        style={docked ? { inset: FRAME_GUTTER, left: panelWidth + FRAME_GUTTER } : undefined}
      >
        <div
          ref={site}
          data-project-workspace={docked ? "docked" : "full"}
          onScroll={docked ? event => { scroll.current = event.currentTarget.scrollTop; } : undefined}
          className={docked ? "absolute left-0 top-0 origin-top-left overflow-x-hidden overflow-y-auto print:!static print:!h-auto print:!w-auto print:!transform-none print:!overflow-visible" : undefined}
          style={docked ? { width, height: `calc((100dvh - ${2 * FRAME_GUTTER}px) * ${1 / scale})`, transform: `scale(${scale})` } : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  </>;
}
