import { useNavigate } from 'react-router-dom';

interface Tool {
  id: string;
  path: string;
  name: string;
  description: string;
  ready: string;
  enabled?: boolean;
}

interface Category {
  name: string;
  gradient: string;
  accentClass: string;
  tools: Tool[];
}

const categories: Category[] = [
  {
    name: 'Generators',
    gradient: 'from-blue-500 to-indigo-600',
    accentClass: 'blue',
    tools: [
      { id: 'Times Tables', path: '/timestables', name: 'Times Tables', description: 'Generate PDFs designed to test and improve TimesTable fluency', ready: 'v1.0' },
      { id: 'Negative Operations', path: '/negative-operations', name: 'Negative Operations', description: 'Generate PDFs designed to test and improve operations with negative numbers', ready: 'v1.0' },
      { id: 'Multiplication Methods', path: '/multiplication-methods', name: 'Multiplication Methods', description: 'Generate PDFs designed to test and improve use of multiplication methods', ready: 'v1.0' },
    ]
  },
  {
    name: 'Number',
    gradient: 'from-cyan-500 to-sky-600',
    accentClass: 'cyan',
    tools: [
      { id: 'integers', path: '/integers', name: 'Adding & Subtracting Integers', description: 'Practice adding and subtracting positive and negative numbers using number lines', ready: 'v1.4' },
      { id: 'estimation', path: '/estimation', name: 'Estimation', description: 'Develop estimation skills by rounding numbers to make calculations easier', ready: 'v1.7.1' },
      { id: 'powers-of-ten', path: '/powers-of-ten', name: 'Multiplying & Dividing by 10ⁿ', description: 'Use a place value table to scale by powers of 10', ready: 'v1.4' },
    ]
  },
  {
    name: 'Algebra',
    gradient: 'from-purple-500 to-fuchsia-600',
    accentClass: 'purple',
    tools: [
      { id: 'solving-linear-equations', path: '/solving-linear-equations', name: 'Unknowns on Both Sides', description: 'Solve equations where the unknown occurs more than once', ready: 'v2.1.2' },
      { id: 'completing-square', path: '/completing-the-square', name: 'Completing the Square', description: 'Rewrite and solve quadratic expressions in completed square form', ready: 'v2.0' },
      { id: 'iteration', path: '/iteration', name: 'Iteration', description: 'Find roots to eqautions using iterative methods', ready: 'v2.1.1' },
      { id: 'simultaneous-equations-elimination', path: '/simultaneous-equations-elimination', name: 'Simultaneous Equations (Elimination)', description: 'Solve simultaneous equations, including rearranging', ready: 'v2.1.1' },
      { id: 'simultaneous-equations-substitution', path: '/simultaneous-equations-substitution', name: 'Simultaneous Equations (Substitution)', description: 'Solve Simultaneous Equations (including Non-Linear) by Substitution', ready: 'v2.1.1' },
      { id: 'single-brackets-foil', path: '/expanding-single-brackets-FOIL', name: 'Expanding Single Brackets (FOIL)', description: 'Expand single brackets by using arrows for each term', ready: 'v1.4', enabled: false },
      { id: 'expanding-double-brackets-foil', path: '/expanding-double-brackets-foil', name: 'Expanding Double Brackets (FOIL)', description: 'Expand pairs of brackets using the FOIL method', ready: 'v1.4', enabled: false },
      { id: 'single-brackets-grid', path: '/expanding-single-brackets-GRID', name: 'Expanding Single Brackets (GRID)', description: 'Expand single brackets by using the grid method', ready: 'v1.4', enabled: false },
      { id: 'expanding-double-brackets-grid', path: '/expanding-double-brackets-grid', name: 'Expanding Double Brackets (GRID)', description: 'Expand pairs of brackets using the grid method', ready: 'v1.4', enabled: false },
    ]
  },
  {
    name: 'Ratio & Proportion',
    gradient: 'from-emerald-500 to-teal-600',
    accentClass: 'emerald',
    tools: [
      { id: 'ratio', path: '/ratio-sharing', name: 'Dividing Ratios', description: 'Sharing amounts using the total, a known amount or known difference', ready: 'v1.4' },
      { id: 'simplifying-ratios', path: '/simplifying-ratios', name: 'Simplifying Ratios', description: 'Simplifying ratios in numerical and algebraic forms', ready: 'v1.4' },
      { id: 'Recipes', path: '/recipes', name: 'Recipes', description: 'Find amounts of ingredients by scaling recipes and understanding limiting factors', ready: 'v1.4' },
      { id: 'fraction-to-ratio', path: '/fraction-to-ratio', name: 'Converting Fractions and Ratios', description: 'To convert fractions and ratios interchangably', ready: 'v2.0' },
      { id: 'fractions-of-amounts', path: '/fractions-of-amounts', name: 'Fractions of Amounts', description: 'To find a fraction of an amount', ready: 'v2.0' },
    ]
  },
  {
    name: 'Geometry',
    gradient: 'from-amber-500 to-orange-600',
    accentClass: 'amber',
    tools: [
      { id: 'circles', path: '/circle-properties', name: 'Properties of Circles', description: 'Find the circumference, area and arc lengths of circles and sectors', ready: 'v1.4' },
      { id: 'basic-angle-facts', path: '/basic-angle-facts', name: 'Basic Angle Facts', description: 'Find missing angles from right angles, on striaght lines and around a point', ready: 'v1.6' },
      { id: 'angles-in-triangles', path: '/angles-in-triangles', name: 'Angles In Triangles', description: 'Find missing angles using triangle properties - including split trangles and exterior angles', ready: 'v2.1' },
      { id: 'equations-of-lines', path: '/equations-of-lines', name: 'Properties of Line Equations', description: 'Use co-ordinates and line equations to find properties of lines', ready: 'v2.1' },
      { id: 'perimeter', path: '/perimeter', name: 'Perimeter (BETA)', description: 'Calculate the perimeter of various 2D shapes', ready: 'v2.1', enabled: false},
    ]
  },
  {
    name: 'Probability & Statistics',
    gradient: 'from-pink-500 to-rose-600',
    accentClass: 'pink',
    tools: []
  },
  {
    name: 'Teacher Tools',
    gradient: 'from-violet-500 to-purple-600',
    accentClass: 'violet',
    tools: [
      { id: 'visualiser', path: '/visualiser', name: 'Visualiser', description: 'A tool for displaying your visualiser', ready: 'v1.0' },
      { id: 'tool-shell', path: '/tool-shell', name: 'Tool Shell', description: 'A tool shell for developing new tools', ready: 'v2.1.1' },
      { id: 'call-selector', path: '/call-selector', name: 'Friday Phonecalls', description: 'A tool to randomly select students for phonecalls', ready: 'v1.0', enabled: false },
    ]
  },
  {
    name: 'Computer Science',
    gradient: 'from-slate-600 to-slate-800',
    accentClass: 'slate',
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
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.4) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-slate-900 shadow-xl shadow-slate-900/10 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-serif italic font-bold text-xl leading-none">fx</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">Maths Tools</h1>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Interactive Learning</p>
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
          const borderColorClass = `border-${category.accentClass}-500`;
          const hoverBorderClass = `hover:border-${category.accentClass}-400`;
          const shadowColorClass = `hover:shadow-${category.accentClass}-300/40`;
          const textColorClass = `group-hover:text-${category.accentClass}-700`;
          const badgeAccentClass = `border-${category.accentClass}-200/60 bg-${category.accentClass}-50 text-${category.accentClass}-700`;

          return (
            <section key={category.name} className="mb-16">
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-8">
                <h2 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${category.gradient} drop-shadow-sm`}>
                  {category.name}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
              </div>

              {category.tools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => tool.enabled !== false && navigate(tool.path)}
                      disabled={tool.enabled === false}
                      className={`group relative bg-white p-7 text-left transition-all duration-300 border-l-4 shadow-sm shadow-slate-200/50 rounded-r-xl rounded-l-sm
                        ${tool.enabled === false
                          ? 'opacity-50 cursor-not-allowed border-slate-300 grayscale-[20%]'
                          : `${borderColorClass} ${hoverBorderClass} hover:shadow-xl ${shadowColorClass} hover:-translate-y-1 cursor-pointer`
                        }`}
                    >
                      {/* Top Header Row within Card */}
                      <div className="flex justify-between items-start mb-4">
                        <h3 className={`font-bold text-xl leading-tight pr-4 text-slate-800 transition-colors duration-300 ${tool.enabled !== false && textColorClass}`}>
                          {tool.name}
                        </h3>
                        
                        {/* Badge */}
                        <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm tracking-wider uppercase ${tool.enabled === false ? 'bg-slate-50 text-slate-500 border-slate-200' : badgeAccentClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tool.enabled === false ? 'bg-slate-300' : 'bg-current'}`} />
                          {tool.ready}
                        </span>
                      </div>

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
              <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
                <span className="text-white font-serif italic font-bold text-sm leading-none">fx</span>
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
