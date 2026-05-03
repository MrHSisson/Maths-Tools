import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  ChevronRight, 
  FileText, 
  Hash, 
  Scale, 
  Shapes, 
  BarChart, 
  Briefcase, 
  Monitor, 
  Coins, 
  Divide, 
  ArrowRightLeft, 
  PieChart, 
  Circle, 
  Triangle, 
  Hexagon, 
  Camera, 
  Wrench, 
  PhoneCall, 
  Minus, 
  RefreshCcw, 
  X
} from 'lucide-react';

interface Tool {
  id: string;
  path: string;
  name: string;
  icon: React.ReactNode; // Changed from string to ReactNode
  description: string;
  ready: string;
  enabled?: boolean;
}

interface Category {
  name: string;
  icon: React.ReactNode; // Changed from string to ReactNode
  gradient: string;
  accentClass: string;
  iconBg: string;
  tools: Tool[];
}

const categories: Category[] = [
  {
    name: 'Generators',
    icon: <FileText size={28} strokeWidth={2.5} />,
    gradient: 'from-blue-500 to-indigo-600',
    accentClass: 'blue',
    iconBg: 'from-blue-50 to-indigo-50',
    tools: [
      { id: 'Times Tables', path: '/timestables', name: 'Times Tables', icon: <span className="font-serif italic">x</span>, description: 'Generate PDFs designed to test and improve TimesTable fluency', ready: 'v1.0' },
      { id: 'Negative Operations', path: '/negative-operations', name: 'Negative Operations', icon: <Minus size={24} />, description: 'Generate PDFs designed to test and improve operations with negative numbers', ready: 'v1.0' },
      { id: 'Multiplication Methods', path: '/multiplication-methods', name: 'Multiplication Methods', icon: <span>3<span className="text-sm mx-0.5">x</span>2</span>, description: 'Generate PDFs designed to test and improve use of multiplication methods', ready: 'v1.0' },
    ]
  },
  {
    name: 'Number',
    icon: <Hash size={28} strokeWidth={2.5} />,
    gradient: 'from-cyan-500 to-sky-600',
    accentClass: 'cyan',
    iconBg: 'from-cyan-50 to-sky-50',
    tools: [
      { id: 'integers', path: '/integers', name: 'Adding & Subtracting Integers', icon: <span>±</span>, description: 'Practice adding and subtracting positive and negative numbers using number lines', ready: 'v1.4' },
      { id: 'estimation', path: '/estimation', name: 'Estimation', icon: <span>≈</span>, description: 'Develop estimation skills by rounding numbers to make calculations easier', ready: 'v1.7.1' },
      { id: 'powers-of-ten', path: '/powers-of-ten', name: 'Multiplying & Dividing by 10ⁿ', icon: <span>10<sup className="text-sm">n</sup></span>, description: 'Use a place value table to scale by powers of 10', ready: 'v1.4' },
    ]
  },
  {
    name: 'Algebra',
    icon: <span className="font-serif italic text-3xl">x</span>,
    gradient: 'from-purple-500 to-fuchsia-600',
    accentClass: 'purple',
    iconBg: 'from-purple-50 to-fuchsia-50',
    tools: [
      { id: 'solving-linear-equations', path: '/solving-linear-equations', name: 'Unknowns on Both Sides', icon: <span>=</span>, description: 'Solve equations where the unknown occurs more than once', ready: 'v2.1.2' },
      { id: 'completing-square', path: '/completing-the-square', name: 'Completing the Square', icon: <span>(x+a)²</span>, description: 'Rewrite and solve quadratic expressions in completed square form', ready: 'v2.0' },
      { id: 'iteration', path: '/iteration', name: 'Iteration', icon: <RefreshCcw size={24} />, description: 'Find roots to eqautions using iterative methods', ready: 'v2.1.1' },
      { id: 'simultaneous-equations-elimination', path: '/simultaneous-equations-elimination', name: 'Simultaneous Equations (Elimination)', icon: <X size={24} />, description: 'Solve simultaneous equations, including rearranging', ready: 'v2.1.1' },
      { id: 'simultaneous-equations-substitution', path: '/simultaneous-equations-substitution', name: 'Simultaneous Equations (Substitution)', icon: <ArrowRightLeft size={24} />, description: 'Solve Simultaneous Equations (including Non-Linear) by Substitution', ready: 'v2.1.1' },
      { id: 'single-brackets-foil', path: '/expanding-single-brackets-FOIL', name: 'Expanding Single Brackets (FOIL)', icon: <span className="font-serif italic">x</span>, description: 'Expand single brackets by using arrows for each term', ready: 'v1.4', enabled: false },
      { id: 'expanding-double-brackets-foil', path: '/expanding-double-brackets-foil', name: 'Expanding Double Brackets (FOIL)', icon: <span>x<sup className="text-sm">2</sup></span>, description: 'Expand pairs of brackets using the FOIL method', ready: 'v1.4', enabled: false },
      { id: 'single-brackets-grid', path: '/expanding-single-brackets-GRID', name: 'Expanding Single Brackets (GRID)', icon: <span className="font-serif italic">x</span>, description: 'Expand single brackets by using the grid method', ready: 'v1.4', enabled: false },
      { id: 'expanding-double-brackets-grid', path: '/expanding-double-brackets-grid', name: 'Expanding Double Brackets (GRID)', icon: <span>x<sup className="text-sm">2</sup></span>, description: 'Expand pairs of brackets using the grid method', ready: 'v1.4', enabled: false },
    ]
  },
  {
    name: 'Ratio & Proportion',
    icon: <Scale size={28} strokeWidth={2.5} />,
    gradient: 'from-emerald-500 to-teal-600',
    accentClass: 'emerald',
    iconBg: 'from-emerald-50 to-teal-50',
    tools: [
      { id: 'ratio', path: '/ratio-sharing', name: 'Dividing Ratios', icon: <Coins size={24} />, description: 'Sharing amounts using the total, a known amount or known difference', ready: 'v1.4' },
      { id: 'simplifying-ratios', path: '/simplifying-ratios', name: 'Simplifying Ratios', icon: <Divide size={24} />, description: 'Simplifying ratios in numerical and algebraic forms', ready: 'v1.4' },
      { id: 'Recipes', path: '/recipes', name: 'Recipes', icon: <PieChart size={24} />, description: 'Find amounts of ingredients by scaling recipes and understanding limiting factors', ready: 'v1.4' },
      { id: 'fraction-to-ratio', path: '/fraction-to-ratio', name: 'Converting Fractions and Ratios', icon: <ArrowRightLeft size={24} />, description: 'To convert fractions and ratios interchangably', ready: 'v2.0' },
      { id: 'fractions-of-amounts', path: '/fractions-of-amounts', name: 'Fractions of Amounts', icon: <span>⅔</span>, description: 'To find a fraction of an amount', ready: 'v2.0' },
    ]
  },
  {
    name: 'Geometry',
    icon: <Shapes size={28} strokeWidth={2.5} />,
    gradient: 'from-amber-500 to-orange-600',
    accentClass: 'amber',
    iconBg: 'from-amber-50 to-orange-50',
    tools: [
      { id: 'circles', path: '/circle-properties', name: 'Properties of Circles', icon: <Circle size={24} />, description: 'Find the circumference, area and arc lengths of circles and sectors', ready: 'v1.4' },
      { id: 'basic-angle-facts', path: '/basic-angle-facts', name: 'Basic Angle Facts', icon: <span>90°</span>, description: 'Find missing angles from right angles, on striaght lines and around a point', ready: 'v1.6' },
      { id: 'angles-in-triangles', path: '/angles-in-triangles', name: 'Angles In Triangles', icon: <Triangle size={24} />, description: 'Find missing angles using triangle properties - including split trangles and exterior angles', ready: 'v2.1' },
      { id: 'equations-of-lines', path: '/equations-of-lines', name: 'Properties of Line Equations', icon: <span className="text-xl">(x,y)</span>, description: 'Use co-ordinates and line equations to find properties of lines', ready: 'v2.1' },
      { id: 'perimeter', path: '/perimeter', name: 'Perimeter (BETA)', icon: <Hexagon size={24} />, description: 'Calculate the perimeter of various 2D shapes', ready: 'v2.1', enabled: false},
    ]
  },
  {
    name: 'Probability & Statistics',
    icon: <BarChart size={28} strokeWidth={2.5} />,
    gradient: 'from-pink-500 to-rose-600',
    accentClass: 'pink',
    iconBg: 'from-pink-50 to-rose-50',
    tools: []
  },
  {
    name: 'Teacher Tools',
    icon: <Briefcase size={28} strokeWidth={2.5} />,
    gradient: 'from-violet-500 to-purple-600',
    accentClass: 'violet',
    iconBg: 'from-violet-50 to-purple-50',
    tools: [
      { id: 'visualiser', path: '/visualiser', name: 'Visualiser', icon: <Camera size={24} />, description: 'A tool for displaying your visualiser', ready: 'v1.0' },
      { id: 'tool-shell', path: '/tool-shell', name: 'Tool Shell', icon: <Wrench size={24} />, description: 'A tool shell for developing new tools', ready: 'v2.1.1' },
      { id: 'call-selector', path: '/call-selector', name: 'Friday Phonecalls', icon: <PhoneCall size={24} />, description: 'A tool to randomly select students for phonecalls', ready: 'v1.0', enabled: false },
    ]
  },
  {
    name: 'Computer Science',
    icon: <Monitor size={28} strokeWidth={2.5} />,
    gradient: 'from-slate-600 to-slate-800',
    accentClass: 'slate',
    iconBg: 'from-slate-100 to-slate-200',
    tools: []
  },
];

export default function LandingPage(): JSX.Element {
  const navigate = useNavigate();

  const totalTools: number = categories.reduce((acc, cat) => acc + cat.tools.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Background with depth */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-24 w-80 h-80 bg-purple-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 left-1/3 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl" />
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
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-5 tracking-tight drop-shadow-sm">
            Maths Tools
          </h2>
          <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            Interactive tools for classroom teaching and independent practice.
            Supporting the "I Do, We Do, You Do" pedagogy.
          </p>

          {/* Tool Counter */}
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
            <div className="relative w-3 h-3">
              <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-emerald-500 rounded-full" />
            </div>
            <span className="text-slate-700 font-semibold">{totalTools} tools available</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        {categories.map((category) => {
          const ringColorClass = `hover:ring-${category.accentClass}-400`;
          const ringOffsetClass = `hover:ring-offset-2 hover:ring-offset-white`;
          const shadowColorClass = `hover:shadow-${category.accentClass}-300/60 hover:shadow-2xl`;
          const textColorClass = `group-hover:text-${category.accentClass}-900`;
          const badgeAccentClass = `border-${category.accentClass}-200/60 bg-${category.accentClass}-50 text-${category.accentClass}-700`;

          return (
            <section key={category.name} className="mb-16">
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-7 group">
                <div className={`w-14 h-14 bg-gradient-to-br ${category.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${category.accentClass}-500/20`}>
                  {category.icon}
                </div>
                <h2 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${category.gradient} drop-shadow-sm`}>
                  {category.name}
                </h2>
                <div className="hidden sm:block h-px flex-1 max-w-xs bg-gradient-to-r from-slate-200 to-transparent ml-2" />
              </div>

              {category.tools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
                  {category.tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => tool.enabled !== false && navigate(tool.path)}
                      disabled={tool.enabled === false}
                      className={`group relative bg-white rounded-2xl p-6 text-left transition-all duration-300 border border-slate-100 shadow-md shadow-slate-200/40
                        ${tool.enabled === false
                          ? 'opacity-40 cursor-not-allowed grayscale-[40%]'
                          : `hover:border-transparent hover:ring-2 ${ringColorClass} ${ringOffsetClass} ${shadowColorClass} hover:-translate-y-1.5 hover:bg-white cursor-pointer`
                        }`}
                    >
                      {/* Badge */}
                      <div className="absolute top-5 right-5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${tool.enabled === false ? 'bg-slate-50 text-slate-600 border-slate-100' : badgeAccentClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tool.enabled === false ? 'bg-slate-400' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                          {tool.ready}
                        </span>
                      </div>

                      {/* Icon Container */}
                      <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mb-5 transition-all duration-300 bg-gradient-to-br ${category.iconBg} text-slate-700 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-${category.accentClass}-100`}>
                        <span className='z-10 flex items-center justify-center'>{tool.icon}</span>
                        <div className={`absolute inset-0 bg-gradient-to-r ${category.gradient} rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
                      </div>

                      {/* Content */}
                      <h3 className={`font-semibold text-lg leading-tight mb-2 transition-colors duration-300 pr-16 text-slate-800 ${textColorClass}`}>
                        {tool.name}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-500 group-hover:text-slate-600 line-clamp-3">
                        {tool.description}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-10 text-center border border-dashed border-slate-200 shadow-sm transition-all hover:bg-white/80 hover:border-transparent hover:ring-1 hover:ring-slate-100">
                  <div className={`w-16 h-16 bg-gradient-to-br ${category.iconBg} rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4 grayscale`}>
                    <span className="opacity-50">{category.icon}</span>
                  </div>
                  <p className="text-slate-600 font-semibold text-lg">Tools coming soon</p>
                  <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">We're working on expanding the {category.name.toLowerCase()} library. Check back soon!</p>
                </div>
              )}
            </section>
          );
        })}
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
