import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, FlaskConical, Info, Search, X } from 'lucide-react';
import { CATEGORIES } from '../registry';
import { useDevMode, setDevMode } from '../devMode';
import { useParkedMode } from '../parkedMode';

// Top-level subjects, in display order. Categories declare their subject in the
// registry (default "Mathematics"); the landing page groups them into bands.
const SUBJECTS = ['Mathematics', 'Computer Science'] as const;

// Strand dot colours are derived from theme.border by name, so list them literally for Tailwind to find:
// bg-amber-500 bg-blue-500 bg-cyan-500 bg-emerald-500 bg-lime-500 bg-pink-500 bg-purple-500 bg-rose-500 bg-slate-500 bg-violet-500
// Tool data lives in src/registry.ts — this file only owns presentation.

interface CategoryTheme {
  border: string;
  hoverBorder: string;
  shadow: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

const DEFAULT_THEME: { gradient: string; theme: CategoryTheme } = {
  gradient: 'from-slate-500 to-slate-700',
  theme: {
    border: 'border-l-slate-500',
    hoverBorder: 'hover:border-l-slate-400',
    shadow: 'hover:shadow-slate-300/40',
    text: 'group-hover:text-slate-700',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200/60'
  },
};

const CATEGORY_THEMES: Record<string, { gradient: string; theme: CategoryTheme }> = {
  'Generators': {
    gradient: 'from-blue-500 to-indigo-600',
    theme: {
      border: 'border-l-blue-500',
      hoverBorder: 'hover:border-l-blue-400',
      shadow: 'hover:shadow-blue-300/40',
      text: 'group-hover:text-blue-700',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200/60'
    },
  },
  'Number': {
    gradient: 'from-cyan-500 to-sky-600',
    theme: {
      border: 'border-l-cyan-500',
      hoverBorder: 'hover:border-l-cyan-400',
      shadow: 'hover:shadow-cyan-300/40',
      text: 'group-hover:text-cyan-700',
      badgeBg: 'bg-cyan-50',
      badgeText: 'text-cyan-700',
      badgeBorder: 'border-cyan-200/60'
    },
  },
  'Algebra': {
    gradient: 'from-purple-500 to-fuchsia-600',
    theme: {
      border: 'border-l-purple-500',
      hoverBorder: 'hover:border-l-purple-400',
      shadow: 'hover:shadow-purple-300/40',
      text: 'group-hover:text-purple-700',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      badgeBorder: 'border-purple-200/60'
    },
  },
  'Ratio & Proportion': {
    gradient: 'from-emerald-500 to-teal-600',
    theme: {
      border: 'border-l-emerald-500',
      hoverBorder: 'hover:border-l-emerald-400',
      shadow: 'hover:shadow-emerald-300/40',
      text: 'group-hover:text-emerald-700',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200/60'
    },
  },
  'Geometry': {
    gradient: 'from-amber-500 to-orange-600',
    theme: {
      border: 'border-l-amber-500',
      hoverBorder: 'hover:border-l-amber-400',
      shadow: 'hover:shadow-amber-300/40',
      text: 'group-hover:text-amber-700',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      badgeBorder: 'border-amber-200/60'
    },
  },
  'Probability & Statistics': {
    gradient: 'from-pink-500 to-rose-600',
    theme: {
      border: 'border-l-pink-500',
      hoverBorder: 'hover:border-l-pink-400',
      shadow: 'hover:shadow-pink-300/40',
      text: 'group-hover:text-pink-700',
      badgeBg: 'bg-pink-50',
      badgeText: 'text-pink-700',
      badgeBorder: 'border-pink-200/60'
    },
  },
  'Teacher Tools': {
    gradient: 'from-violet-500 to-purple-600',
    theme: {
      border: 'border-l-violet-500',
      hoverBorder: 'hover:border-l-violet-400',
      shadow: 'hover:shadow-violet-300/40',
      text: 'group-hover:text-violet-700',
      badgeBg: 'bg-violet-50',
      badgeText: 'text-violet-700',
      badgeBorder: 'border-violet-200/60'
    },
  },
  'Interactive Tools': {
    gradient: 'from-lime-500 to-green-600',
    theme: {
      border: 'border-l-lime-500',
      hoverBorder: 'hover:border-l-lime-400',
      shadow: 'hover:shadow-lime-300/40',
      text: 'group-hover:text-lime-700',
      badgeBg: 'bg-lime-50',
      badgeText: 'text-lime-700',
      badgeBorder: 'border-lime-200/60'
    },
  },
  'Decision Mathematics': {
    gradient: 'from-rose-500 to-red-600',
    theme: {
      border: 'border-l-rose-500',
      hoverBorder: 'hover:border-l-rose-400',
      shadow: 'hover:shadow-rose-300/40',
      text: 'group-hover:text-rose-700',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200/60'
    },
  },
  'Computer Science': {
    gradient: 'from-slate-600 to-slate-800',
    theme: {
      border: 'border-l-slate-600',
      hoverBorder: 'hover:border-l-slate-500',
      shadow: 'hover:shadow-slate-400/40',
      text: 'group-hover:text-slate-800',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700',
      badgeBorder: 'border-slate-300/60'
    },
  },
};

const categories = CATEGORIES.map((category) => ({
  name: category.name,
  subject: category.subject ?? 'Mathematics',
  tools: category.tools,
  ...(CATEGORY_THEMES[category.name] ?? DEFAULT_THEME),
}));

export default function LandingPage(): JSX.Element {
  // The (i) on a card opens its description; one at a time, closed by tapping anywhere else.
  const [infoId, setInfoId] = useState<string | null>(null);
  useEffect(() => {
    if (!infoId) return;
    const close = (e: Event) => { if (!(e.target as HTMLElement).closest('[data-card-info]')) setInfoId(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setInfoId(null); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [infoId]);

  // Tint the phone's status bar to match the navy header so they read as one bar
  // (the rest of the site keeps the light page colour from index.html).
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const prev = meta.getAttribute('content');
    meta.setAttribute('content', '#1e3a8a');
    return () => { if (prev) meta.setAttribute('content', prev); };
  }, []);
  const navigate = useNavigate();
  const devMode = useDevMode();
  const parkedMode = useParkedMode();
  const [subjectFilter, setSubjectFilter] = useState<string>('Mathematics');
  const [query, setQuery] = useState('');
  const openTool = (_id: string, path: string) => navigate(path);
  const q = query.trim().toLowerCase();
  // Match at the start of a word, so "round" finds Rounding but not "around a point".
  const qRe = q ? new RegExp(`(^|[^a-z0-9])${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) : null;

  // In developing mode every in-the-pipeline tool is visible (including
  // enabled: false ones); otherwise they're hidden from general use. Parked
  // tools are a tertiary, stronger gate — dormant, not currently developed,
  // not meant to be casually found — so Developing-tools mode alone does NOT
  // reveal them; only the separate, unadvertised parkedMode does (see
  // src/parkedMode.ts). Developing tools are sorted to the end of their
  // section (sort is stable, so the relative order within each group holds).
  const visibleIn = (tools: typeof categories[number]['tools']) => {
    // `hidden` tools are never listed — not even in developing mode (their route
    // still works by direct URL). Otherwise dev mode reveals enabled:false tools.
    const listable = tools.filter(t => !t.hidden);
    const shown = listable.filter(t => {
      if (t.parked) return parkedMode;
      return t.enabled !== false || devMode;
    }).filter(t => !qRe || qRe.test(`${t.name} ${t.description} ${t.group ?? ''}`.toLowerCase()));
    return [...shown].sort(
      (a, b) => (a.enabled === false ? 1 : 0) - (b.enabled === false ? 1 : 0),
    );
  };

  // Split a category's tools into its named groups, in order of first appearance (tools with no
  // `group` form one unnamed section, so ungrouped categories render exactly as before).
  const groupTools = (tools: typeof categories[number]['tools']) => {
    const sections: { name: string; tools: typeof tools }[] = [];
    for (const t of tools) {
      const name = t.group ?? '';
      const sec = sections.find((x) => x.name === name);
      if (sec) sec.tools.push(t); else sections.push({ name, tools: [t] });
    }
    return sections;
  };

  const totalShown = categories
    .filter((c) => c.subject === subjectFilter)
    .reduce((acc, c) => acc + visibleIn(c.tools).length, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-blue-900 shadow-xl shadow-blue-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-xl flex items-center justify-center shadow-md">
                <Calculator className="text-blue-900" size={20} />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg sm:text-xl tracking-tight">Maths Tools</h1>
                <p className="text-blue-200 text-xs hidden sm:block">Interactive Learning</p>
              </div>
            </div>

            {/* Developing tools toggle — reveals in-progress tools & features */}
            <button
              onClick={() => setDevMode(!devMode)}
              title="Reveal in-progress tools and the step-by-step Worked Example mode"
              className={`flex items-center gap-2.5 pl-3 pr-2.5 py-2 rounded-xl font-semibold text-sm transition-colors border ${
                devMode
                  ? 'bg-amber-400 text-blue-950 border-amber-300'
                  : 'bg-blue-800/60 text-blue-100 border-blue-700 hover:bg-blue-800'
              }`}
            >
              <FlaskConical size={16} />
              <span className="hidden sm:inline">Developing tools</span>
              <span
                className={`relative inline-block w-9 h-5 rounded-full transition-colors ${devMode ? 'bg-blue-950/30' : 'bg-blue-950/40'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${devMode ? 'translate-x-4' : ''}`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="px-4 pt-8 pb-2 sm:pt-14 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Maths Tools</h2>
          <p className="hidden sm:block mt-3 text-slate-500 text-lg">Interactive tools for teaching and practice.</p>

          {/* Search — filters the tool cards below by name, description or group */}
          <div className="flex justify-center mt-6 sm:mt-8">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools…"
                aria-label="Search tools"
                className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-card text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900/30"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Subject — two quiet tabs */}
          <div className="flex justify-center gap-8 mt-6 sm:mt-8 border-b border-slate-200">
            {['Mathematics', 'Computer Science'].map((k) => (
              <button key={k} onClick={() => setSubjectFilter(k)}
                className={`pb-3 -mb-px text-base font-semibold border-b-2 transition-colors ${subjectFilter === k ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content — grouped into subject bands (Mathematics / Computer Science) */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">

        {q && totalShown === 0 && (
          <p className="text-center text-slate-500 py-12">No tools match “{query.trim()}”.</p>
        )}
        {SUBJECTS.filter((s) => subjectFilter === s).map((s) => {
          const subjectCats = categories.filter((c) => c.subject === s);
          if (!subjectCats.length) return null;
          const subjectCount = subjectCats.reduce((acc, c) => acc + visibleIn(c.tools).length, 0);
          if (q && subjectCount === 0) return null;

          return (
            <div key={s} className="mt-8 mb-8">
              {subjectCats.map((category) => {
          const visibleTools = visibleIn(category.tools);
          if (q && visibleTools.length === 0) return null;

          return (
            <section key={category.name} className="mb-10 sm:mb-12">
              {/* Category header — a quiet heading with the strand's colour as a dot */}
              {category.name !== s && (
                <h2 className="flex items-center gap-2.5 mb-4 text-lg sm:text-xl font-bold text-slate-900">
                  <span className={`w-2.5 h-2.5 rounded-full ${category.theme.border.replace('border-l-', 'bg-')}`} />
                  {category.name}
                </h2>
              )}

              {visibleTools.length > 0 ? (
                <div className="space-y-6 sm:space-y-10">
                  {groupTools(visibleTools).map((sec) => (
                  <div key={sec.name || 'ungrouped'}>
                  {sec.name && (
                    <div className="flex items-center gap-3 mb-3 sm:mb-4">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">{sec.name}</h3>
                    </div>
                  )}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                  {sec.tools.map((tool, ti) => {
                    // enabled:false tools only appear in developing mode, where
                    // they're clickable for testing and flagged with a DEV badge.
                    const isDevTool = tool.enabled === false;
                    const open = infoId === tool.id;
                    return (
                    <div
                      key={tool.id}
                      data-card-info
                      className={`group relative bg-white rounded-2xl border shadow-card transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5 ${open ? 'z-30 border-slate-300' : isDevTool ? 'border-amber-300' : 'border-slate-200'}`}
                    >
                      <button onClick={() => openTool(tool.id, tool.path)} className="w-full min-h-[64px] sm:min-h-[64px] flex items-center gap-2 text-left pl-3.5 sm:pl-4 pr-9 sm:pr-12 py-3 cursor-pointer rounded-xl">
                        <span className="font-semibold text-[14px] sm:text-[15px] leading-tight text-slate-800">{tool.name}</span>
                        {isDevTool && (
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-wider uppercase bg-amber-50 text-amber-700 border-amber-200">Dev</span>
                        )}
                      </button>
                      <button
                        onClick={() => setInfoId(open ? null : tool.id)}
                        aria-label={`About ${tool.name}`}
                        aria-expanded={open}
                        className={`absolute top-1/2 -translate-y-1/2 right-0.5 sm:right-1.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors ${open ? 'bg-blue-900 text-white' : 'text-slate-400 hover:text-blue-900 hover:bg-slate-100'}`}
                      >
                        <Info size={18} />
                      </button>
                      {open && (
                        <div role="note" className={`absolute top-full mt-1 z-40 w-[calc(200%+0.625rem)] sm:w-full ${ti % 2 === 0 ? "left-0" : "right-0"} sm:left-0 sm:right-0 rounded-xl bg-slate-900 text-white text-sm leading-snug p-3 shadow-xl`}>
                          {tool.description}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
                  </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 sm:p-8 text-left border border-dashed border-slate-300 shadow-sm transition-all hover:bg-white/60">
                  <p className="text-slate-700 font-bold text-base sm:text-lg mb-1">Coming soon</p>
                  <p className="text-slate-500 text-sm">We're actively developing new resources for the {category.name} library.</p>
                </div>
              )}
            </section>
          );
              })}
            </div>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center shadow-md">
                <Calculator className="text-white" size={20} />
              </div>
              <span className="font-bold text-slate-800 text-lg">Maths Tools</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              Built for teachers. Designed for students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
