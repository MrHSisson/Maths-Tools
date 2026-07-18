// ─────────────────────────────────────────────────────────────────────────────
// usePanZoom.ts — native pan / zoom with zero React re-renders.
//
// The whole point: dragging and zooming a canvas 60fps must NOT go through
// React's render cycle. So this hook holds the viewport in a caller-owned ref,
// attaches native DOM listeners directly to the canvas, mutates the ref in
// place, and asks the caller to repaint via an imperative requestDraw() (which
// the caller wires to an rAF loop). No setState, no re-render, no lag.
//
// Handles mouse (drag + wheel-zoom about the cursor) and touch (one-finger pan,
// two-finger pinch-zoom about the pinch midpoint). Optionally clamps the centre
// to a domain box so a locked graph (e.g. p ∈ [0,1]) can't be scrolled away.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import type { RefObject, MutableRefObject } from "react";
import { type Viewport, screenToMathX, screenToMathY } from "./mathEngine";

export interface PanZoomOptions {
  /** When false the listeners are not attached (inline static thumbnails). */
  enabled: boolean;
  /** Optional clamp so the viewport centre stays within this math box. */
  clamp?: { xMin?: number; xMax?: number; yMin?: number; yMax?: number };
  /** Zoom limits (math units per pixel). */
  minUnitsPerPixel?: number;
  maxUnitsPerPixel?: number;
}

const clampNum = (v: number, lo: number | undefined, hi: number | undefined): number => {
  if (lo !== undefined && v < lo) v = lo;
  if (hi !== undefined && v > hi) v = hi;
  return v;
};

export function usePanZoom(
  canvasRef: RefObject<HTMLCanvasElement>,
  viewportRef: MutableRefObject<Viewport>,
  requestDraw: () => void,
  opts: PanZoomOptions,
): void {
  const { enabled, clamp, minUnitsPerPixel = 1e-4, maxUnitsPerPixel = 1e6 } = opts;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const size = () => {
      const rect = canvas.getBoundingClientRect();
      return { w: rect.width, h: rect.height, left: rect.left, top: rect.top };
    };

    const applyClamp = () => {
      const vp = viewportRef.current;
      const zClamped = clampNum(vp.unitsPerPixel, minUnitsPerPixel, maxUnitsPerPixel);
      vp.unitsPerPixel = zClamped;
      if (clamp) {
        vp.centreX = clampNum(vp.centreX, clamp.xMin, clamp.xMax);
        vp.centreY = clampNum(vp.centreY, clamp.yMin, clamp.yMax);
      }
    };

    // ── Mouse drag panning ──
    let dragging = false;
    let lastX = 0, lastY = 0;

    const onMouseDown = (e: MouseEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = "grabbing";
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const vp = viewportRef.current;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      vp.centreX -= dx * vp.unitsPerPixel;
      vp.centreY += dy * vp.unitsPerPixel;
      applyClamp();
      requestDraw();
    };
    const endDrag = () => {
      dragging = false;
      canvas.style.cursor = "grab";
    };

    // ── Wheel zoom about the cursor ──
    const zoomAbout = (screenX: number, screenY: number, factor: number) => {
      const vp = viewportRef.current;
      const { w, h } = size();
      // Math point under the cursor before zoom.
      const mx = screenToMathX(screenX, vp, w);
      const my = screenToMathY(screenY, vp, h);
      vp.unitsPerPixel = clampNum(vp.unitsPerPixel * factor, minUnitsPerPixel, maxUnitsPerPixel);
      // Re-centre so the same math point stays under the cursor.
      vp.centreX = mx - (screenX - w / 2) * vp.unitsPerPixel;
      vp.centreY = my + (screenY - h / 2) * vp.unitsPerPixel;
      applyClamp();
      requestDraw();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { left, top } = size();
      const factor = Math.exp(e.deltaY * 0.0015); // scroll down → zoom out
      zoomAbout(e.clientX - left, e.clientY - top, factor);
    };

    // ── Touch: one-finger pan, two-finger pinch ──
    let touchMode: "none" | "pan" | "pinch" = "none";
    let tLastX = 0, tLastY = 0, pinchDist = 0, pinchCx = 0, pinchCy = 0;

    const dist = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchMode = "pan";
        tLastX = e.touches[0].clientX;
        tLastY = e.touches[0].clientY;
      } else if (e.touches.length >= 2) {
        touchMode = "pinch";
        pinchDist = dist(e.touches[0], e.touches[1]);
        const { left, top } = size();
        pinchCx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - left;
        pinchCy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - top;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const vp = viewportRef.current;
      if (touchMode === "pan" && e.touches.length === 1) {
        const dx = e.touches[0].clientX - tLastX;
        const dy = e.touches[0].clientY - tLastY;
        tLastX = e.touches[0].clientX;
        tLastY = e.touches[0].clientY;
        vp.centreX -= dx * vp.unitsPerPixel;
        vp.centreY += dy * vp.unitsPerPixel;
        applyClamp();
        requestDraw();
      } else if (touchMode === "pinch" && e.touches.length >= 2) {
        const d = dist(e.touches[0], e.touches[1]);
        if (pinchDist > 0) zoomAbout(pinchCx, pinchCy, pinchDist / d);
        pinchDist = d;
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      touchMode = e.touches.length === 1 ? "pan" : "none";
      if (e.touches.length === 1) {
        tLastX = e.touches[0].clientX;
        tLastY = e.touches[0].clientY;
      }
    };

    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endDrag);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", endDrag);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.style.cursor = "";
      canvas.style.touchAction = "";
    };
  }, [canvasRef, viewportRef, requestDraw, enabled, clamp, minUnitsPerPixel, maxUnitsPerPixel]);
}
