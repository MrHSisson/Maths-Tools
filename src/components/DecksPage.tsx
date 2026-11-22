import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Presentation } from 'lucide-react';
import { checkDevPassword } from '../devAccess';
import { setDevMode, useDevMode } from '../devMode';
import DecksTab from './DecksTab';

/** The one Decks page (/deck-gallery): decks are whole lessons, not tools, so they are not a tab of the landing page. Signed out it shows
 *  the published decks; signed in it also lists every other deck and the editing controls. The sign-in is the Developing tools password
 *  and switch, so one sign-in opens everything. A phone can sign in too, to see every deck (the unpublished ones included), but it only previews them: no editing controls. */
export default function DecksPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-blue-900 shadow-xl shadow-blue-900/10">
        <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4">
          <Link to="/" aria-label="Back to Maths Tools" className="grid h-11 w-11 place-items-center rounded-xl text-white hover:bg-blue-800"><ArrowLeft size={22} /></Link>
          <Presentation className="text-blue-200" size={20} />
          <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">Decks</h1>
          <SignIn />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24"><DecksTab /></main>
    </div>
  );
}

/** A quiet link at the right of the header: Sign in (asks for the password) when signed out, Sign out when signed in. */
function SignIn() {
  const signedIn = useDevMode();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [wrong, setWrong] = useState(false);
  const link = 'rounded-lg px-2 py-1.5 text-sm font-medium text-blue-200 hover:bg-blue-800 hover:text-white';
  if (signedIn) return <button type="button" onClick={() => setDevMode(false)} className={`ml-auto ${link}`}>Sign out</button>;
  return (
    <div className="relative ml-auto">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={link}>Sign in</button>
      {open && (
        <form className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-300 bg-white p-4 shadow-lift"
          onSubmit={(e) => { e.preventDefault(); if (checkDevPassword(password)) { setDevMode(true); setOpen(false); setPassword(''); } else setWrong(true); }}>
          <label htmlFor="decks-sign-in" className="block text-sm font-semibold text-slate-800">Password</label>
          <input id="decks-sign-in" type="password" autoFocus autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setWrong(false); }}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {wrong && <p role="alert" className="mt-2 text-sm font-semibold text-red-600">That password isn't right.</p>}
          <button type="submit" className="mt-3 rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Sign in</button>
        </form>
      )}
    </div>
  );
}
