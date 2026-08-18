import { Suspense, lazy } from 'react';
import type { ComponentType } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import { ToolErrorBoundary } from './components/ToolErrorBoundary';
import { ALL_TOOLS } from './registry';
import { useParkedMode } from './parkedMode';

// Routes are generated from the registry. Each tool is lazy-loaded so it
// builds as its own chunk — the landing page stays small and a tool's code
// only downloads when it is opened.
const TOOL_ROUTES = ALL_TOOLS.map((tool) => ({
  path: tool.path,
  Component: lazy(tool.load),
  parked: tool.parked === true,
}));

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

// Parked routes 404 outright without the tertiary parkedMode flag — stronger
// than an ordinary `enabled: false` tool, whose route still works by direct
// URL. See src/parkedMode.ts.
function ParkedRoute({ Component }: { Component: ComponentType }) {
  const parkedMode = useParkedMode();
  return parkedMode ? <Component /> : <NotFound />;
}

function App() {
  return (
    <ToolErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {TOOL_ROUTES.map(({ path, Component, parked }) => (
            <Route key={path} path={path} element={parked ? <ParkedRoute Component={Component} /> : <Component />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ToolErrorBoundary>
  );
}

export default App;
