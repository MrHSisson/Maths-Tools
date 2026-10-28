import { useState, useRef, useEffect, useCallback } from "react";

/**
 * The Whiteboard's Visualiser mode: the working area shows a live camera feed (a document camera or webcam). A long press on the
 * button picks between cameras; an external camera is preferred over a built-in one. `relayoutKey` changes whenever the video element
 * is remounted (fullscreen, the working panel collapsing), so the stream is attached again.
 */
export function useVisualiser(relayoutKey: unknown) {
  const [presenterMode, setPresenterMode] = useState(false);
  const [camDevices, setCamDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCamId, setCurrentCamId] = useState<string | null>(null);
  const [camLoading, setCamLoading] = useState(false);
  const requestRef = useRef(0);
  const [camError, setCamError] = useState<string | null>(null);
  const [camDropdownOpen, setCamDropdownOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const camDropdownRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const stopStream = useCallback(() => {
    requestRef.current++;
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCam = useCallback(async (deviceId?: string) => {
    stopStream(); setCamError(null); setCamLoading(true);
    const request = requestRef.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access needs a secure connection and a browser that supports cameras.");
      let targetDeviceId = deviceId;
      if (!targetDeviceId) {
        const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tmp.getTracks().forEach(t => t.stop());
        if (request !== requestRef.current) return;
        const all = await navigator.mediaDevices.enumerateDevices();
        if (request !== requestRef.current) return;
        const builtInPattern = /facetime|built.?in|integrated|internal|front|rear/i;
        const ext = all.filter(d => d.kind === "videoinput").find(d => d.label && !builtInPattern.test(d.label));
        if (ext) targetDeviceId = ext.deviceId;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: targetDeviceId ? { deviceId: { exact: targetDeviceId } } : true, audio: false });
      if (request !== requestRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId ?? null);
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (request === requestRef.current) setCamDevices(devices.filter(d => d.kind === "videoinput"));
    } catch (e: unknown) {
      if (request !== requestRef.current) return;
      const name = e instanceof Error ? e.name : "";
      setCamError(name === "NotAllowedError" ? "Camera permission was denied. Allow camera access in your browser, then retry." : name === "NotFoundError" ? "No camera was found. Connect a document camera or webcam, then retry." : (e instanceof Error ? e.message : null) ?? "Camera unavailable");
    } finally { if (request === requestRef.current) setCamLoading(false); }
  }, [stopStream]);

  useEffect(() => { if (presenterMode) void startCam(); else stopStream(); return stopStream; }, [presenterMode, startCam, stopStream]);
  useEffect(() => () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }, []);
  // the video element is remounted when the layout changes: attach the running stream to it again
  useEffect(() => { if (presenterMode && streamRef.current && videoRef.current) videoRef.current.srcObject = streamRef.current; }, [relayoutKey]); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: only when the layout changes, not when presenterMode does
  useEffect(() => {
    if (!camDropdownOpen) return;
    const h = (e: MouseEvent) => { if (camDropdownRef.current && !camDropdownRef.current.contains(e.target as Node)) setCamDropdownOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [camDropdownOpen]);
  return { presenterMode, setPresenterMode, camDevices, currentCamId, camError, camLoading, camDropdownOpen, setCamDropdownOpen, videoRef, camDropdownRef, longPressTimer, didLongPress, startCam };
}
