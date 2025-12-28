import { useNavigate } from 'react-router-dom'

const categories = [
  {
    name: 'Number',
    tools: [
      { id: 'integers', path: '/integers', name: 'Adding & Subtracting Integers', icon: '±', description: 'Practice adding and subtracting positive and negative numbers using number lines', ready: true },
      { id: 'estimation', path: '/estimation', name: 'Estimation', icon: '≈', description: 'Develop estimation skills by rounding numbers to make calculations easier', ready: false },
      { id: 'hcf-lcm', path: '/hcf-lcm', name: 'HCF & LCM', icon: '∩', description: 'Find highest common factors and lowest common multiples using Venn diagrams', ready: false },
      { id: 'significant-figures', path: '/significant-figures', name: 'Significant Figures', icon: 'SF', description: 'Round numbers to a given number of significant figures', ready: false },
    ]
  },
  {
    name: 'Algebra',
    tools: [
      { id: 'like-terms', path: '/like-terms', name: 'Like Terms', icon: 'xy', description: 'Simplify algebraic expressions by collecting like terms', ready: false },
      { id: 'single-brackets', path: '/single-brackets', name: 'Single Brackets', icon: 'x', description: 'Expand single brackets by multiplying each term', ready: false },
      { id: 'double-brackets', path: '/double-brackets', name: 'Double Brackets', icon: 'x²', description: 'Expand pairs of brackets using grid or FOIL methods', ready: true },
      { id: 'completing-square', path: '/completing-square', name: 'Completing the Square', icon: '▢', description: 'Rewrite quadratic expressions in completed square form', ready: false },
    ]
  },
  {
    name: 'Ratio & Proportion',
    tools: [
      { id: 'ratio', path: '/ratio-sharing', name: 'Dividing Ratios', icon: '💰', description: 'Sharing amounts using the total, a known amount or known difference', ready: true },
      { id: 'simplifying-ratios', path: '/simplifying-ratios', name: 'Simplifying Ratios', icon: '➗', description: 'Simplifying ratios in numerical and algebraic forms', ready: true },
    ]
  },
  {
    name: 'Geometry',
    tools: [
      { id: 'perimeter', path: '/perimeter', name: 'Perimeter', icon: '⬡', description: 'Calculate the perimeter of various 2D shapes', ready: false },
      { id: 'circles', path: '/circle-properties', name: 'Properties of Circles', icon: '⭕', description: 'Find the circumference, area and arc lengths of circles and sectors', ready: true },
    ]
  },
  {
    name: 'Probability & Statistics',
    tools: []
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Maths Tools</h1>
          <p className="text-gray-500 text-lg">Interactive tools for classroom learning</p>
        </header>
        
        {categories.map((category) => (
          <div key={category.name} className="mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 underline">
              {category.name}
            </h2>
            
            {category.tools.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {category.tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => tool.ready ? navigate(tool.path) : null}
                    className={`group bg-gray-50 rounded-xl p-6 text-left transition-all duration-200 border-2 border-blue-900 ${
                      tool.ready ? 'hover:bg-gray-100 hover:scale-105 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-12 h-12 bg-gray-200 ${tool.ready ? 'group-hover:bg-blue-900' : ''} rounded-lg flex items-center justify-center text-gray-700 ${tool.ready ? 'group-hover:text-white' : ''} text-xl font-bold mb-3 transition-colors duration-200`}>
                      {tool.icon}
                    </div>
                    <h3 className={`text-gray-800 ${tool.ready ? 'group-hover:text-blue-900' : ''} font-semibold text-lg leading-tight mb-2 transition-colors duration-200`}>
                      {tool.name}
                    </h3>
                    <p className="text-gray-500 text-sm leading-snug">
                      {tool.ready ? tool.description : 'Coming soon'}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">Coming soon</p>
            )}
          </div>
        ))}
        
        <footer className="text-center mt-12 text-gray-400 text-sm">
          <p>Select a tool to begin</p>
        </footer>
      </div>
    </div>
  )
}
