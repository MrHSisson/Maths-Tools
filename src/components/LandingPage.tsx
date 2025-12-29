import { useNavigate } from 'react-router-dom';
import { ChevronRight, Calculator } from 'lucide-react';

interface Tool {
  id: string;
  path: string;
  name: string;
  icon: string;
  description: string;
  ready: boolean;
}

interface Category {
  name: string;
  icon: string;
  gradient: string;
  iconBg: string;
  tools: Tool[];
}

const categories: Category[] = [
  {
    name: 'Number',
    icon: '🔢',
    gradient: 'from-blue-500 to-indigo-600',
    iconBg: 'from-blue-50 to-indigo-50',
    tools: [
      { id: 'integers', path: '/integers', name: 'Adding & Subtracting Integers', icon: '±', description: 'Practice adding and subtracting positive and negative numbers using number lines', ready: true },
      { id: 'estimation', path: '/estimation', name: 'Estimation', icon: '≈', description: 'Develop estimation skills by rounding numbers to make calculations easier', ready: true },
      { id: 'hcf-lcm', path: '/hcf-lcm', name: 'HCF & LCM', icon: '∩', description: 'Find highest common factors and lowest common multiples using Venn diagrams', ready: false },
      { id: 'significant-figures', path: '/significant-figures', name: 'Significant Figures', icon: 'SF', description: 'Round numbers to a given number of significant figures', ready: false },
    ]
  },
  {
    name: 'Algebra',
    icon: '📐',
    gradient: 'from-purple-500 to-fuchsia-600',
    iconBg: 'from-purple-50 to-fuchsia-50',
    tools: [
      { id: 'like-terms', path: '/like-terms', name: 'Like Terms', icon: 'xy', description: 'Simplify algebraic expressions by collecting like terms', ready: false },
      { id: 'single-brackets', path: '/single-brackets', name: 'Expanding Single Brackets', icon: 'x', description: 'Expand single brackets by multiplying each term', ready: false },
      { id: 'double-brackets', path: '/double-brackets', name: 'Expanding Double Brackets', icon: 'x²', description: 'Expand pairs of brackets using grid or FOIL methods', ready: true },
      { id: 'completing-square', path: '/completing-square', name: 'Completing the Square', icon: '▢', description: 'Rewrite and solve quadratic expressions in completed square form', ready: true },
    ]
  },
  {
    name: 'Ratio & Proportion',
    icon: '⚖️',
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'from-emerald-50 to-teal-50',
    tools: [
      { id: 'ratio', path: '/ratio-sharing', name: 'Dividing Ratios', icon: '💰', description: 'Sharing amounts using the total, a known amount or known difference', ready: true },
      { id: 'simplifying-ratios', path: '/simplifying-ratios', name: 'Simplifying Ratios', icon: '➗', description: 'Simplifying ratios in numerical and algebraic forms', ready: true },
    ]
  },
  {
    name: 'Geometry',
    icon: '📏',
    gradient: 'from-orange-500 to-amber-600',
    iconBg: 'from-orange-50 to-amber-50',
    tools: [
      { id: 'perimeter', path: '/perimeter', name: 'Perimeter', icon: '⬡', description: 'Calculate the perimeter of various 2D shapes', ready: false },
      { id: 'circles', path: '/circle-properties', name: 'Properties of Circles', icon: '⭕', description: 'Find the circumference, area and arc lengths of circles and sectors', ready: true },
    ]
  },
  {
    name: 'Probability & Statistics',
    icon: '📊',
    gradient: 'from-pink-500 to-rose-600',
    iconBg: 'from-pink-50 to-rose-50',
    tools: []
  },
];

export default function LandingPage(): JSX.Element {
  const navigate = useNavigate();

  const totalTools: number = categories.reduce((acc, cat) => acc + cat.tools.length, 0);
  const readyTools: number = categories.reduce((acc, cat) => acc + cat.tools.filter(t => t.ready).length, 0);

  const handleToolClick = (tool: Tool): void => {
    if (tool.ready) {
      navigate(tool.path);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Background with depth */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
        
        {/* Soft colour blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-24 w-80 h-80 bg-purple-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 left-1/3 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl" />
        
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.3) 1px, transparent 0)`,
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
      <div className="relative z-10 pt-16 pb-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-5 tracking-tight drop-shadow-sm">
            Maths Tools
          </h2>
          <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            Interactive tools for classroom teaching and independent practice.
            Supporting the "I Do, We Do, You Do" pedagogy.
          </p>
          
          {/* Tool Counter */}
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/80">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              <span className="text-slate-700 font-semibold">{readyTools} tools available</span>
            </div>
            <div className="w-px h-5 bg-slate-200" />
            <span className="text-slate-400">{totalTools - readyTools} coming soon</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        {categories.map((category) => (
          <section key={category.name} className="mb-14">
            {/* Category Header */}
            <div className="flex items-center gap-4 mb-7">
              <div className={`w-14 h-14 bg-gradient-to-br ${category.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                {category.icon}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{category.name}</h2>
              <div className="hidden sm:block h-px flex-1 max-w-xs bg-gradient-to-r from-slate-300 to-transparent" />
            </div>
            
            {category.tools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {category.tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    disabled={!tool.ready}
                    className={`group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 text-left transition-all duration-300 border ${
                      tool.ready 
                        ? 'border-slate-200 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-300/50 hover:-translate-y-1 hover:bg-white cursor-pointer' 
                        : 'border-slate-200/50 opacity-50 cursor-not-allowed'
                    } shadow-xl shadow-slate-200/50`}
                  >
                    {/* Badge */}
                    <div className="absolute top-5 right-5">
                      {tool.ready ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          Ready
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-1 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mb-5 transition-all duration-300 ${
                      tool.ready 
                        ? `bg-gradient-to-br ${category.iconBg} text-slate-700 group-hover:scale-110 group-hover:shadow-lg` 
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {tool.icon}
                    </div>

                    {/* Content */}
                    <h3 className={`font-bold text-lg leading-tight mb-2 transition-colors duration-300 pr-16 ${
                      tool.ready ? 'text-slate-900 group-hover:text-blue-900' : 'text-slate-400'
                    }`}>
                      {tool.name}
                    </h3>
                    <p className={`text-sm leading-relaxed ${tool.ready ? 'text-slate-600' : 'text-slate-400'}`}>
                      {tool.description}
                    </p>

                    {/* Hover Arrow */}
                    {tool.ready && (
                      <div className="absolute bottom-6 right-6 w-9 h-9 rounded-full bg-blue-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                        <ChevronRight className="text-white" size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 text-center border border-dashed border-slate-300 shadow-lg shadow-slate-200/50">
                <div className={`w-20 h-20 bg-gradient-to-br ${category.gradient} rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5 opacity-30`}>
                  {category.icon}
                </div>
                <p className="text-slate-500 font-medium text-lg">Tools coming soon</p>
                <p className="text-slate-400 text-sm mt-1">We're working on new content for this category</p>
              </div>
            )}
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center shadow-md">
                <Calculator className="text-white" size={20} />
              </div>
              <span className="font-bold text-slate-800 text-lg">Maths Tools</span>
            </div>
            <p className="text-slate-500 text-sm">
              Built for teachers. Designed for students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
