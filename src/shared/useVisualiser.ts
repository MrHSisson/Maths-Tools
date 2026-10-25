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
  const [camError, setCamError] = useState<string | null>(null);
  const [camDropdownOpen, setCamDropdownOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const camDropdownRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCam = useCallback(async (deviceId?: string) => {
    stopStream(); setCamError(null);
    try {
      let targetDeviceId = deviceId;
      if (!targetDeviceId) {
        const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tmp.getTracks().forEach(t => t.stop());
        const all = await navigator.mediaDevices.enumerateDevices();
        const builtInPattern = /facetime|built.?in|integrated|internal|front|rear/i;
        const ext = all.filter(d => d.kind === "videoinput").find(d => d.label && !builtInPattern.test(d.label));
        if (ext) targetDeviceId = ext.deviceId;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: targetDeviceId ? { deviceId: { exact: targetDeviceId } } : true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCurrentCamId(stream.getVideoTracks()[0].getSettings().deviceId ?? null);
      setCamDevices((await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "videoinput"));
    } catch (e: unknown) { setCamError((e instanceof Error ? e.message : null) ?? "Camera unavailable"); }
  }, [stopStream]);

  useEffect(() => { if (presenterMode) startCam(); else stopStream(); }, [presenterMode, startCam, stopStream]);
  // the video element is remounted when the layout changes: attach the running stream to it again
  useEffect(() => { if (presenterMode && streamRef.current && videoRef.current) videoRef.current.srcObject = streamRef.current; }, [relayoutKey]); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: only when the layout changes, not when presenterMode does
  useEffect(() => {
    if (!camDropdownOpen) return;
    const h = (e: MouseEvent) => { if (camDropdownRef.current && !camDropdownRef.current.contains(e.target as Node)) setCamDropdownOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [camDropdownOpen]);
  return { presenterMode, setPresenterMode, camDevices, currentCamId, camError, camDropdownOpen, setCamDropdownOpen, videoRef, camDropdownRef, longPressTimer, didLongPress, startCam };
}
