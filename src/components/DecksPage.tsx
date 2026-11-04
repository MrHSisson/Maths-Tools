import { Link } from 'react-router-dom';
import { ArrowLeft, Presentation } from 'lucide-react';
import DecksTab from './DecksTab';

/** The published decks on a page of their own (/deck-gallery): decks are whole lessons, not tools, so they are not a tab of the landing page. */
export default function DecksPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-blue-900 shadow-xl shadow-blue-900/10">
        <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4">
          <Link to="/" aria-label="Back to Maths Tools" className="grid h-11 w-11 place-items-center rounded-xl text-white hover:bg-blue-800"><ArrowLeft size={22} /></Link>
          <Presentation className="text-blue-200" size={20} />
          <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">Decks</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24"><DecksTab /></main>
    </div>
  );
}
