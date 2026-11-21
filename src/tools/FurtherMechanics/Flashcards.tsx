import { useState } from "react";
import { ChevronLeft, Home, Info } from "lucide-react";
import { PAGE_BG } from "../../shared/colors";
import { useLayoutMode } from "../../shared/layoutMode";
import { FlashcardDeck } from "../../shared/flashcards";
import { MECHANICS_MC } from "../../flashcards/mechanicsMC";

// Further Maths flashcards, opened from the Further Mechanics hub. The cards for each chapter are data (src/flashcards/), the study screen is the shared FlashcardDeck
// (src/shared/flashcards/), and what a student has rated is kept on their own device. Today there is one set, Mechanics MC (work, energy and power); a chooser appears when
// a second set is added. Design and card list: specs/flashcards/further-mechanics-mc.md.

const ABOUT =
  "Short cards for the key definitions, formulas, properties, units, methods and common mistakes in Work, Energy and Power (AQA 7367, MC1 to MC7). Each card has a header that says what is asked. " +
  "Essential cards are the results to know; derivation cards ask you to work something out from them, which is good practice but not for memorising. Turn a card over, then say whether you got it: " +
  "the ones you did not get come back sooner. Formula and definition cards also come round back to front, and some cards show a diagram. Your ratings stay on this device only.";

export default function App() {
  const { phone } = useLayoutMode();
  const [aboutOpen, setAboutOpen] = useState(false);
  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <div className={`mx-auto max-w-3xl ${phone ? "px-4 py-4" : "px-6 py-8"}`}>
        <div className="mb-3 flex items-center gap-4">
          <button onClick={() => { window.location.href = "/"; }} className="inline-flex items-center gap-2 rounded-xl py-1 pr-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            <Home size={18} /> Home
          </button>
          <button onClick={() => { window.location.href = "/further-mechanics"; }} className="inline-flex items-center gap-1 rounded-xl py-1 pr-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            <ChevronLeft size={18} /> Further Mechanics
          </button>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Flashcards</h1>
            <p className="mt-1 text-slate-500">Further Mechanics: {MECHANICS_MC.title}</p>
          </div>
          <button type="button" onClick={() => setAboutOpen((o) => !o)} aria-expanded={aboutOpen} aria-label="About these flashcards"
            className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${aboutOpen ? "bg-blue-900 text-white" : "text-slate-400 hover:bg-slate-100 hover:text-blue-900"}`}>
            <Info size={20} />
          </button>
        </div>
        {aboutOpen && <p role="note" className="mt-3 rounded-xl bg-slate-900 p-3 text-sm leading-snug text-white">{ABOUT}</p>}
        <div className="mt-5"><FlashcardDeck set={MECHANICS_MC} /></div>
      </div>
    </div>
  );
}
