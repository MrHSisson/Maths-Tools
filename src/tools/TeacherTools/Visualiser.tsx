import { useState, useRef, useEffect, useCallback } from "react";
import { Home, Menu, X, FlipHorizontal, ChevronDown, Maximize2, Minimize2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CameraDevice {
  deviceId: string;
  label: string;
}

type DisplayMode = "fit" | "fill";

// ── Colour scheme helpers (matching ToolShell v2.1.1) ─────────────────────────

const getQuestionBg = (cs: string) =>
  ({ blue: "#D1E7F8", pink: "#F8D1E7", yellow: "#F8F4D1" }[cs] ?? "#ffffff");
const getStepBg = (cs: string) =>
  ({ blue: "#B3D9F2", pink: "#F2B3D9", yellow: "#F2EBB3" }[cs] ?? "#f3f4f6");

// ── MenuDropdown — matches ToolShell v2.1.1 exactly ──────────────────────────

const MenuDropdown = ({
  colorScheme,
  setColorScheme,
  onClose,
  onOpenInfo,
}: {
  colorScheme: string;
  setColorScheme: (s: string) => void;
  onClose: () => void;
  onOpenInfo: () => void;
}) => {
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
      style={{ minWidth: "200px" }}
    >
      <div className="py-1">
        <button
          onClick={() => setColorOpen(!colorOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              className={`text-gray-400 transition-transform duration-200 ${colorOpen ? "rotate-90" : ""}`}
            >
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Colour Scheme</span>
          </div>
          <span className="text-xs text-gray-400 font-normal capitalize">{colorScheme}</span>
        </button>
        {colorOpen && (
          <div className="border-t border-gray-100">
            {["default", "blue", "pink", "yellow"].map((s) => (
              <button
                key={s}
                onClick={() => { setColorScheme(s); onClose(); }}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold transition-colors capitalize ${colorScheme === s ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {s}
                {colorScheme === s && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1" />
        <button
          onClick={() => { onOpenInfo(); onClose(); }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};

// ── InfoModal — matches ToolShell v2.1.1 exactly ──────────────────────────────

const INFO_SECTIONS = [
  {
    title: "Visualiser", icon: "📷", content: [
      { label: "Overview",        detail: "A full-screen camera viewer designed for use with a USB document camera (visualiser). Connect your visualiser before opening this tool — it will appear in the camera selector." },
      { label: "Camera selector", detail: "Choose from all available cameras. USB visualisers are listed alongside your device camera. The active camera is highlighted." },
      { label: "Fit mode",        detail: "The entire camera feed is visible. Black bars fill any remaining space around the feed. Use this to ensure nothing is cropped." },
      { label: "Fill mode",       detail: "The feed fills the full height of the viewer. The sides may be cropped. Ideal when split-screening alongside another application." },
      { label: "Flip",            detail: "Mirrors the image horizontally. Use this if your visualiser feed appears reversed." },
    ],
  },
];

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center"
    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col"
      style={{ height: "80vh" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tool Information</h2>
          <p className="text-sm text-gray-400 mt-0.5">A guide to all features and options</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100">
          <X size={20} />
        </button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {INFO_SECTIONS.map((s) => (
          <div key={s.title}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{s.icon}</span>
              <h3 className="text-lg font-bold text-blue-900">{s.title}</h3>
            </div>
            <div className="flex flex-col gap-2">
              {s.content.map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-7 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
        <button onClick={onClose} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800">
          Close
        </button>
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

export default function Visualiser() {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const videoFsRef    = useRef<HTMLVideoElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const camDropdownRef = useRef<HTMLDivElement>(null);

  const [colorScheme, setColorScheme] = useState("default");
  const [isMenuOpen,  setIsMenuOpen]  = useState(false);
  const [isInfoOpen,  setIsInfoOpen]  = useState(false);

  const [cameras,        setCameras]        = useState<CameraDevice[]>([]);
  const [activeCamId,    setActiveCamId]    = useState<string>("");
  const [camDropdownOpen,setCamDropdownOpen] = useState(false);
  const [camError,       setCamError]       = useState<string>("");

  const [displayMode, setDisplayMode] = useState<DisplayMode>("fit");
  const [flipped,     setFlipped]     = useState(false);
  const [flippedV,    setFlippedV]    = useState(false);
  const [fullscreen,  setFullscreen]  = useState(false);

  const qBg    = getQuestionBg(colorScheme);
  const stepBg = getStepBg(colorScheme);

  // ── Camera helpers ──────────────────────────────────────────────────────────

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    stopStream();
    setCamError("");
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Enumerate after permission granted so labels are populated
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }));
      setCameras(videoDevices);

      const activeId = stream.getVideoTracks()[0]?.getSettings().deviceId ?? "";
      setActiveCamId(activeId);
    } catch (err) {
      setCamError("Camera access denied or unavailable.");
      console.error(err);
    }
  }, [stopStream]);

  const handleCameraSelect = (deviceId: string) => {
    setCamDropdownOpen(false);
    startCamera(deviceId);
  };

  // Close camera dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (camDropdownRef.current && !camDropdownRef.current.contains(e.target as Node))
        setCamDropdownOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, [startCamera, stopStream]);

  // Sync stream to fullscreen video element when it mounts
  useEffect(() => {
    if (fullscreen && videoFsRef.current && streamRef.current) {
      videoFsRef.current.srcObject = streamRef.current;
    }
  }, [fullscreen]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const activeCamLabel = cameras.find((c) => c.deviceId === activeCamId)?.label ?? "Select camera";

  const flipTransform = [flipped ? "scaleX(-1)" : "", flippedV ? "scaleY(-1)" : ""].filter(Boolean).join(" ") || "none";

  const videoStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: displayMode === "fit" ? "contain" : "cover",
    transform: flipTransform,
    background: "#000",
    display: "block",
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Header bar ── */}
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
          >
            <Home size={24} />
            <span className="font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {isMenuOpen && (
              <MenuDropdown
                colorScheme={colorScheme}
                setColorScheme={setColorScheme}
                onClose={() => setIsMenuOpen(false)}
                onOpenInfo={() => setIsInfoOpen(true)}
              />
            )}
          </div>
        </div>
      </div>

      {isInfoOpen && <InfoModal onClose={() => setIsInfoOpen(false)} />}

      {/* ── Page — #f5f3f0 background, max-w-6xl, p-8 ── */}
      <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-6xl mx-auto">

          {/* Page title */}
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: "#000" }}>
            Visualiser
          </h1>

          {/* Divider */}
          <div className="flex justify-center mb-8">
            <div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} />
          </div>

          {/* Controls bar — styled like whiteboard control bar (qBg background, rounded-xl) */}
          {/* Note: no overflow-hidden so the camera dropdown can escape downward */}
          <div className="px-5 py-4 rounded-xl mb-6" style={{ backgroundColor: qBg }}>
            <div className="flex items-center justify-center gap-4 flex-wrap">

              {/* Camera selector — matches QO popover trigger style */}
              <div className="relative" ref={camDropdownRef}>
                <button
                  onClick={() => setCamDropdownOpen((o) => !o)}
                  className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${camDropdownOpen ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}
                >
                  <span className="max-w-[200px] truncate">{activeCamLabel}</span>
                  <ChevronDown
                    size={18}
                    style={{ transition: "transform 0.2s", transform: camDropdownOpen ? "rotate(180deg)" : "rotate(0)" }}
                  />
                </button>
                {camDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 overflow-hidden">
                    {cameras.length === 0 && (
                      <p className="px-5 py-4 text-sm text-gray-400">No cameras found</p>
                    )}
                    {cameras.map((cam) => (
                      <button
                        key={cam.deviceId}
                        onClick={() => handleCameraSelect(cam.deviceId)}
                        className={`w-full text-left px-5 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center justify-between ${cam.deviceId === activeCamId ? "text-blue-900" : "text-gray-700"}`}
                      >
                        {cam.label}
                        {cam.deviceId === activeCamId && (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fit / Fill — difficulty-toggle style segment buttons */}
              <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
                {(["fit", "fill"] as DisplayMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setDisplayMode(m)}
                    className={`px-5 py-2 font-bold text-base transition-colors capitalize ${displayMode === m ? "bg-blue-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Flip horizontal */}
              <button
                onClick={() => setFlipped((f) => !f)}
                className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm flex items-center gap-2 transition-colors ${flipped ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}
              >
                <FlipHorizontal size={18} />
                Flip H
              </button>

              {/* Flip vertical */}
              <button
                onClick={() => setFlippedV((f) => !f)}
                className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm flex items-center gap-2 transition-colors ${flippedV ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}
              >
                <FlipHorizontal size={18} style={{ transform: "rotate(90deg)" }} />
                Flip V
              </button>

              {/* Fullscreen */}
              <button
                onClick={() => setFullscreen((f) => !f)}
                className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2 transition-colors"
              >
                <Maximize2 size={18} />
                Fullscreen
              </button>

            </div>
          </div>

          {/* Camera feed — rounded-xl shadow-lg, stepBg background, 16:9 aspect ratio */}
          <div
            className="rounded-xl shadow-lg overflow-hidden"
            style={{ backgroundColor: stepBg, aspectRatio: "16/9" }}
          >
            {camError ? (
              <div
                className="w-full h-full flex items-center justify-center text-sm font-semibold"
                style={{ backgroundColor: "#000", color: "rgba(255,255,255,0.4)" }}
              >
                {camError}
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={videoStyle}
              />
            )}
          </div>

        </div>
      </div>

      {/* ── Fullscreen overlay ── */}
      {fullscreen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "#000", display: "flex", alignItems: "stretch" }}>
          <video
            ref={videoFsRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: displayMode === "fit" ? "contain" : "cover",
              transform: flipTransform,
              display: "block",
            }}
          />
          {/* Controls — top-right, matches shell presenter style */}
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
            {/* Fit / Fill toggle */}
            <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)" }}>
              {(["fit", "fill"] as DisplayMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setDisplayMode(m)}
                  title={m === "fit" ? "Fit — full feed visible" : "Fill — maximise height"}
                  style={{
                    background: displayMode === m ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.55)",
                    border: "none", cursor: "pointer",
                    padding: "0 12px", height: 36,
                    color: displayMode === m ? "#fff" : "rgba(255,255,255,0.65)",
                    fontWeight: 700, fontSize: "0.8rem",
                    backdropFilter: "blur(6px)",
                    textTransform: "capitalize",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
            {/* Flip H */}
            <button
              onClick={() => setFlipped((f) => !f)}
              title="Flip horizontally"
              style={{
                background: flipped ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.55)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8, cursor: "pointer", width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(6px)",
              }}
            >
              <FlipHorizontal size={18} color="rgba(255,255,255,0.85)" />
            </button>
            {/* Flip V */}
            <button
              onClick={() => setFlippedV((f) => !f)}
              title="Flip vertically"
              style={{
                background: flippedV ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.55)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8, cursor: "pointer", width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(6px)",
              }}
            >
              <FlipHorizontal size={18} color="rgba(255,255,255,0.85)" style={{ transform: "rotate(90deg)" }} />
            </button>
            {/* Exit */}
            <button
              onClick={() => setFullscreen(false)}
              title="Exit fullscreen"
              style={{
                background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8, cursor: "pointer", width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(6px)",
              }}
            >
              <Minimize2 size={18} color="rgba(255,255,255,0.85)" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
