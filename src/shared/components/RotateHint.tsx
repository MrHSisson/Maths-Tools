import { useState } from "react";
import { X } from "lucide-react";

/** A slim, dismissible note shown to a tablet held in portrait: the tools are laid out for landscape. */
export function RotateHint({ show }: { show: boolean }) {
  const [gone, setGone] = useState(false);
  if (!show || gone) return null;
  return (
    <div className="flex items-center justify-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm font-semibold text-amber-900">
      <span>Works best with the tablet turned sideways (landscape).</span>
      <button onClick={() => setGone(true)} aria-label="Dismiss" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-amber-100"><X size={16} /></button>
    </div>
  );
}
