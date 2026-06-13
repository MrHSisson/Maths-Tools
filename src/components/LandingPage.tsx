import { useNavigate } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import { CATEGORIES } from '../registry';

// ==========================================
// DEVELOPER SETTINGS
// ==========================================
// Set to 'true' to completely hide tools where enabled: false
// Set to 'false' to show them as grayed-out "Coming Soon" cards
const CONFIG_HIDE_DISABLED = true;
// ==========================================

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
  tools: category.tools,
  ...(CATEGORY_THEMES[category.name] ?? DEFAULT_THEME),
}));

export default function LandingPage(): JSX.Element {
  const navigate = useNavigate();

  // Calculate total tools, respecting the CONFIG_HIDE_DISABLED setting
  const totalTools: number = categories.reduce((acc, cat) => {
    const visibleTools = CONFIG_HIDE_DISABLED 
      ? cat.tools.filter(t => t.enabled !== false) 
      : cat.tools;
    return acc + visibleTools.length;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Background with depth */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-24 w-80 h-80 bg-purple-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 left-1/3 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.4) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-blue-900 shadow-xl shadow-blue-900/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-md">
              <Calculator className="text-blue-900" size={24} />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">Maths Tools</h1>
              <p className="text-blue-200 text-xs">Interactive Learning</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 pt-20 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight drop-shadow-sm">
            Maths Tools
          </h2>
          <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Interactive tools for classroom teaching and independent practice.
            Supporting the "I Do, We Do, You Do" pedagogy.
          </p>

          {/* Tool Counter */}
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-md shadow-slate-200/50 border border-slate-200">
            <div className="relative w-2.5 h-2.5">
              <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
              <div className="absolute inset-0 bg-emerald-500 rounded-full" />
            </div>
            <span className="text-slate-700 font-semibold text-sm tracking-wide uppercase">{totalTools} tools available</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        {categories.map((category) => {
          // Filter tools based on our developer config
          const visibleTools = CONFIG_HIDE_DISABLED 
            ? category.tools.filter(t => t.enabled !== false) 
            : category.tools;

          return (
            <section key={category.name} className="mb-16">
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-8">
                <h2 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${category.gradient} drop-shadow-sm`}>
                  {category.name}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
              </div>

              {visibleTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {visibleTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => tool.enabled !== false && navigate(tool.path)}
                      disabled={tool.enabled === false}
                      // Added: flex flex-col, h-full, and min-h-[170px] to enforce uniform sizing
                      className={`group relative flex flex-col justify-start h-full min-h-[170px] bg-white p-6 text-left transition-all duration-300 rounded-xl
                        border border-slate-200 border-l-4
                        ${tool.enabled === false
                          ? 'opacity-60 cursor-not-allowed border-l-slate-300 grayscale-[20%]'
                          : `${category.theme.border} ${category.theme.hoverBorder} hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-1 cursor-pointer`
                        }`}
                    >
                      {/* Badge - Absolutely positioned so it never moves */}
                      <div className="absolute top-6 right-6">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-md border tracking-wider uppercase
                          ${tool.enabled === false
                            ? 'bg-slate-50 text-slate-400 border-slate-200'
                            : 'bg-white text-slate-500 border-slate-200 shadow-sm'
                          }`}
                        >
                          {tool.ready}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-lg leading-tight text-slate-800 mb-3 pr-16 group-hover:text-slate-900 transition-colors">
                        {tool.name}
                      </h3>

                      {/* Content */}
                      <p className="text-sm leading-relaxed text-slate-500 group-hover:text-slate-600 line-clamp-3">
                        {tool.description}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-8 text-left border border-dashed border-slate-300 shadow-sm transition-all hover:bg-white/60">
                  <p className="text-slate-700 font-bold text-lg mb-1">Coming soon</p>
                  <p className="text-slate-500 text-sm">We're actively developing new resources for the {category.name} library.</p>
                </div>
              )}
            </section>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
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
