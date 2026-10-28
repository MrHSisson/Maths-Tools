import { useEffect, useId } from "react";
import { Video, VideoOff } from "lucide-react";
import { useVisualiser } from "../shared/useVisualiser";

/** Live-only camera control: editor thumbnails and configuration previews never request camera access. */
export function WhiteboardWorkspace({ live, visualiser }: { live: boolean; visualiser: boolean }) {
  const camera = useVisualiser(live);
  const cameraId = useId();
  const { setPresenterMode } = camera;
  useEffect(() => { if (!live || !visualiser) setPresenterMode(false); }, [live, visualiser, setPresenterMode]);
  const active = live && camera.presenterMode;
  return <section className="whiteboard-workspace" aria-label="Writing space" data-camera-active={active}>
    <header className="whiteboard-workspace-header"><span>{active ? "Visualiser" : "Working space"}</span>{visualiser && (live ? <button onClick={() => camera.setPresenterMode((v) => !v)} aria-pressed={active}>{active ? <VideoOff size={24} /> : <Video size={24} />}{active ? "Stop visualiser" : "Start visualiser"}</button> : <span style={{ marginLeft: "auto", fontSize: 22 }}>Visualiser available</span>)}</header>
    <div className="whiteboard-workspace-body">
      {active && <><video ref={camera.videoRef} aria-label="Live document camera" autoPlay muted playsInline />
        {camera.camLoading ? <div className="whiteboard-camera-message" role="status">Connecting camera…</div> : camera.camError ? <div className="whiteboard-camera-message" role="alert"><p>{camera.camError}</p><button onClick={() => void camera.startCam()}>Retry camera</button></div> : camera.camDevices.length > 0 && <div className="whiteboard-camera-controls"><label htmlFor={cameraId}>Camera</label><select id={cameraId} value={camera.currentCamId ?? ""} onChange={(e) => void camera.startCam(e.target.value)}>{camera.camDevices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}</select></div>}
      </>}
    </div>
  </section>;
}
