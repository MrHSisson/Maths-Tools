import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { checkDevPassword } from "../devAccess";
import { setDevMode, useDevMode } from "../devMode";
import { DECK_PAGE } from "./theme";

/** Shows its children once the admin password has been entered (the same password and switch as Developing tools,
 *  so one unlock opens the deck editor, the deck list and the slide library). Otherwise it asks for the password. */
export function AdminGate({ what, children }: { what: string; children: ReactNode }) {
  const unlocked = useDevMode();
  const [password, setPassword] = useState("");
  const [wrong, setWrong] = useState(false);
  if (unlocked) return <>{children}</>;
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: DECK_PAGE }}>
      <form className="w-full max-w-sm rounded-2xl border border-slate-300 bg-white p-6 shadow-card"
        onSubmit={(e) => { e.preventDefault(); if (checkDevPassword(password)) setDevMode(true); else setWrong(true); }}>
        <div className="flex items-center gap-2 text-slate-500"><Lock size={18} /><span className="text-sm font-semibold">Password needed</span></div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Open the {what}</h1>
        <p className="mt-1 text-sm text-slate-500">Published decks can be played by anyone. Changing them needs the admin password.</p>
        <label htmlFor="deck-admin-password" className="mt-4 block text-sm font-semibold text-slate-800">Password</label>
        <input id="deck-admin-password" type="password" autoFocus value={password} onChange={(e) => { setPassword(e.target.value); setWrong(false); }} autoComplete="current-password"
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {wrong && <p role="alert" className="mt-2 text-sm font-semibold text-red-600">That password isn't right.</p>}
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Open</button>
          <Link to="/?tab=decks" className="text-sm font-semibold text-slate-500 hover:text-slate-800">Back to decks</Link>
        </div>
      </form>
    </div>
  );
}
