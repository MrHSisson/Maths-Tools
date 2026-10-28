import { useEffect, useId, useRef } from "react";
import { MoreHorizontal, Video, VideoOff } from "lucide-react";
import { useVisualiser } from "../shared/useVisualiser";

/** Camera controls are a single quiet menu; previews never request camera access. */
export function WhiteboardWorkspace({ live, visualiser }: { live: boolean; visualiser: boolean }) {
  const camera = useVisualiser(live);
  const cameraId = useId();
  const menu = useRef<HTMLDetailsElement>(null);
  const { setPresenterMode } = camera;
  useEffect(() => { if (!live || !visualiser) setPresenterMode(false); }, [live, visualiser, setPresenterMode]);
  const active = live && camera.presenterMode;
  return <section className="whiteboard-workspace" aria-label="Writing space" data-camera-active={active}>
    <div className="whiteboard-workspace-body">
      {active && <><video ref={camera.videoRef} aria-label="Live document camera" autoPlay muted playsInline />
        {camera.camLoading ? <div className="whiteboard-camera-message" role="status">Connecting camera…</div> : camera.camError && <div className="whiteboard-camera-message" role="alert"><p>{camera.camError}</p><button onClick={() => void camera.startCam()}>Retry camera</button></div>}
      </>}
    </div>
    {live && visualiser && <details ref={menu} className="workspace-options" onKeyDown={(e) => { if (e.key === "Escape") { e.currentTarget.open = false; e.currentTarget.querySelector("summary")?.focus(); e.stopPropagation(); } }} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) e.currentTarget.open = false; }}>
      <summary role="button" aria-label="Workspace options" title="Workspace options"><MoreHorizontal size={26} /></summary>
      <div className="workspace-options-panel"><button onClick={() => { setPresenterMode((v) => !v); if (menu.current) menu.current.open = false; }}>{active ? <VideoOff size={22} /> : <Video size={22} />}{active ? "Stop visualiser" : "Start visualiser"}</button>
        {active && camera.camDevices.length > 0 && <label htmlFor={cameraId}>Camera<select id={cameraId} value={camera.currentCamId ?? ""} onChange={(e) => void camera.startCam(e.target.value)}>{camera.camDevices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}</select></label>}
      </div>
    </details>}
  </section>;
}
