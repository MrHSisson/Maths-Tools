import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import { ToolErrorBoundary } from './components/ToolErrorBoundary';
import { ALL_TOOLS, PAGES } from './registry';
import { setLivePaths } from './shared/about';
import { InkOverlay } from './shared/components/InkOverlay';

// Routes are generated from the registry. Each tool is lazy-loaded so it
// builds as its own chunk — the landing page stays small and a tool's code
// only downloads when it is opened.
const TOOL_ROUTES = [...ALL_TOOLS, ...PAGES].map((tool) => ({
  path: tool.path,
  Component: lazy(tool.load),
}));

const DeckPage = lazy(() => import('./decks/DeckPage'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-500 font-medium">Loading…</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-md p-8 max-w-lg text-center">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Page not found</h1>
        <p className="text-slate-500 text-sm mb-6">There's no tool at this address.</p>
        <button
          onClick={() => { window.location.href = '/'; }}
          className="px-5 py-2.5 rounded-lg bg-blue-900 text-white font-semibold text-sm hover:bg-blue-800 transition-colors"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}

// The ink overlay (write anywhere on a tool page) is live on every tool page — not the landing page, and not the two
// sandboxes (they have their own board and hotbar). It is keyed by route so ink never carries from one tool to another.
const NO_INK = new Set(['/', '/algebra-tiles', '/negative-counters', '/admin']);
setLivePaths(ALL_TOOLS.filter((t) => t.enabled !== false).map((t) => t.path));   // only live tools open "About this tool" by themselves
const TOOL_PATHS = new Set([...ALL_TOOLS, ...PAGES].map((t) => t.path));
function InkLayer() {
  const { pathname } = useLocation();
  const onDeck = pathname.startsWith('/decks/');   // a deck is a board: ink stays on across its slides (the deck clears it on a slide change)
  return (TOOL_PATHS.has(pathname) || onDeck) && !NO_INK.has(pathname) ? <InkOverlay key={pathname} /> : null;   // not on the 404 page either
}

// An old address that still works: sends the visitor, query string and all, to the tool's current route.
const ALIASES = [...ALL_TOOLS, ...PAGES].flatMap((t) => (t.aliases ?? []).map((from) => ({ from, to: t.path })));
function AliasRedirect({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate to={{ pathname: to, search }} replace />;
}

function App() {
  return (
    <ToolErrorBoundary>
      <InkLayer />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {TOOL_ROUTES.map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
          <Route path="/decks" element={<DeckPage />} />
          <Route path="/decks/:id" element={<DeckPage />} />
          {ALIASES.map(({ from, to }) => (
            <Route key={from} path={from} element={<AliasRedirect to={to} />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ToolErrorBoundary>
  );
}

export default App;
