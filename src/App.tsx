import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import { ALL_TOOLS } from './registry';

// Routes are generated from the registry. Each tool is lazy-loaded so it
// builds as its own chunk — the landing page stays small and a tool's code
// only downloads when it is opened.
const TOOL_ROUTES = ALL_TOOLS.map((tool) => ({
  path: tool.path,
  Component: lazy(tool.load),
}));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-500 font-medium">Loading…</p>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {TOOL_ROUTES.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Routes>
    </Suspense>
  );
}

export default App;
