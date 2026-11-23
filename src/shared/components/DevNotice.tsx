import { useState } from "react";
import { Construction, X } from "lucide-react";

// A quiet banner for a tool that is open to everyone but not in its final form. It shows on opening and can be closed; closing is remembered for the rest of the visit
// (this tab only), so it comes back next time. `id` names what it is for (a tool's path), so closing one does not close another.
const KEY = (id: string): string => `mt-dev-notice:${id}`;
const wasClosed = (id: string): boolean => { try { return sessionStorage.getItem(KEY(id)) === "1"; } catch { return false; } };
const remember = (id: string): void => { try { sessionStorage.setItem(KEY(id), "1"); } catch { /* the banner just comes back next time */ } };

export default function DevNotice({ id, text }: { id: string; text: string }) {
  const [closed, setClosed] = useState(() => wasClosed(id));
  if (closed) return null;
  return (
    <div role="status" className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-[1500px] items-start gap-2 px-3 py-2 sm:px-8 sm:py-2.5 text-sm text-amber-900">
        <Construction size={18} className="mt-0.5 shrink-0" aria-hidden />
        <p className="flex-1 leading-snug"><span className="font-semibold">Still in development.</span> {text}</p>
        <button type="button" onClick={() => { remember(id); setClosed(true); }} aria-label="Close this notice" className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-amber-800 hover:bg-amber-100"><X size={16} /></button>
      </div>
    </div>
  );
}
