// ═══════════════════════════════════════════════════════════════════════════════
// TOOL REGISTRY — the single source of truth for every tool in the app.
//
// Registering a new tool is ONE entry here. App.tsx generates the route
// (lazy-loaded, so each tool is its own chunk) and LandingPage.tsx renders the
// card — neither file needs editing.
//
//   { id: 'my-new-tool', path: '/my-new-tool', name: 'Display Name',
//     description: 'One sentence.',
//     load: () => import('./tools/Category/MyNewTool') }
//
// Add `enabled: false` only if the tool should not be publicly visible yet
// (the route still works for direct URL access).
// ═══════════════════════════════════════════════════════════════════════════════

import type { ComponentType } from 'react';

export interface ToolMeta {
  id: string;
  path: string;
  name: string;
  description: string;
  enabled?: boolean;
  /** When true the tool is never listed on the landing page — not even in
   *  Developing-tools mode. Its route still works by direct URL, and the file
   *  stays in the repo. Use to shelve a tool without deleting it. */
  hidden?: boolean;
  /** Tertiary gate, stronger than `enabled`/Developing-tools mode: for content
   *  that exists but is neither live nor currently being built — dormant, not
   *  a focus, not meant to be casually discoverable. Developing-tools mode does
   *  NOT reveal it; it needs the separate, unadvertised `parkedMode` (see
   *  `src/parkedMode.ts`), and its route itself refuses to render (404s)
   *  without that flag, unlike an ordinary `enabled: false` tool whose route
   *  still works by direct URL. Use for genuinely shelved features, not
   *  in-progress ones — see `CLAUDE.md` → "Dev-mode gating". */
  parked?: boolean;
  load: () => Promise<{ default: ComponentType }>;
}

export interface CategoryMeta {
  name: string;
  /** Top-level subject the landing page groups this category under.
   *  Defaults to "Mathematics" when omitted. Set "Computer Science" for CS strands. */
  subject?: string;
  tools: ToolMeta[];
}

export const CATEGORIES: CategoryMeta[] = [
  {
    name: 'Generators',
    tools: [
      { id: 'Times Tables', path: '/timestables', name: 'Times Tables', description: 'Generate PDFs designed to test and improve TimesTable fluency', load: () => import('./tools/Generators/TimesTablesGenerator') },
      { id: 'Negative Operations', path: '/negative-operations', name: 'Negative Operations', description: 'Generate PDFs designed to test and improve operations with negative numbers', load: () => import('./tools/Generators/NegativeOperationsGenerator') },
      { id: 'Multiplication Methods', path: '/multiplication-methods', name: 'Multiplication Methods', description: 'Generate PDFs designed to test and improve use of multiplication methods', load: () => import('./tools/Generators/MultiplicationGenerator') },
      { id: 'Functional Skills', path: '/functional-skills', name: 'Functional Skills', description: 'Generate PDFs designed to test functional skills such as number bonds, addition, subtraction and more', load: () => import('./tools/Generators/FunctionalSkillsGenerator') },
    ],
  },
  {
    name: 'Number',
    tools: [
      { id: 'integers', path: '/integer-add-and-subtract', name: 'Adding & Subtracting Integers', description: 'Practice adding and subtracting positive and negative numbers using number lines', load: () => import('./tools/Number/IntegerAddSub') },
      { id: 'estimation', path: '/estimation', name: 'Estimation', description: 'Develop estimation skills by rounding numbers to make calculations easier', load: () => import('./tools/Number/Estimation') },
      { id: 'powers-of-ten', path: '/powers-of-ten', name: 'Multiplying & Dividing by 10ⁿ', description: 'Use a place value table to scale by powers of 10', load: () => import('./tools/Number/PowersOfTen') },
      { id: 'fractions-add-sub', path: '/add-subtract-fractions', name: 'Adding & Subtracting Fractions', description: 'Add and subtract fractions and mixed numbers, with common denominators, scaling and LCM methods', load: () => import('./tools/Number/FractionsAddSub') },
      { id: 'fractions-mult-div', path: '/multiply-divide-fractions', name: 'Multiplying & Dividing Fractions', description: 'Multiply and divide fractions and mixed numbers using Keep, Flip, Change', load: () => import('./tools/Number/FractionMultDiv') },
      { id: 'percentages', path: '/percentages', name: 'Percentages', description: 'Find percentages of amounts, calculate percentage increase/decrease, and work backwards with reverse percentages', load: () => import('./tools/Number/Percentages') },
    ],
  },
  {
    name: 'Algebra',
    tools: [
      { id: 'collecting-like-terms', path: '/collecting-like-terms', name: "Collecting Like Terms", description: "Practise identifying and collecting like terms across single and multiple variable expressions, from basic addition to multi-variable simplification.", load: () => import('./tools/Algebra/CollectingLikeTerms') },
      { id: 'solving-linear-equations', path: '/solving-linear-equations', name: 'Unknowns on Both Sides', description: 'Solve equations where the unknown occurs more than once', load: () => import('./tools/Algebra/SolvingLinearEquations') },
      { id: 'completing-square', path: '/completing-the-square', name: 'Completing the Square', description: 'Rewrite and solve quadratic expressions in completed square form', load: () => import('./tools/Algebra/CompletingTheSquare') },
      { id: 'iterations', path: '/iterations', name: 'Iteration', description: 'Find roots to equations using iterative methods', load: () => import('./tools/Algebra/Iterations') },
      { id: 'simultaneous-equations-elimination', path: '/simultaneous-equations-elimination', name: 'Simultaneous Equations (Elimination)', description: 'Solve simultaneous equations, including rearranging', load: () => import('./tools/Algebra/SimultaneousEquations') },
      { id: 'simultaneous-equations-substitution', path: '/simultaneous-equations-substitution', name: 'Simultaneous Equations (Substitution)', description: 'Solve Simultaneous Equations (including Non-Linear) by Substitution', load: () => import('./tools/Algebra/NonLinearSimEq') },
      { id: 'expanding-brackets', path: '/expanding-brackets', name: 'Expanding Brackets', description: 'Expand single and double brackets with step-by-step working', load: () => import('./tools/Algebra/ExpandingBrackets') },
    ],
  },
  {
    name: 'Ratio & Proportion',
    tools: [
      { id: 'ratio', path: '/ratio-sharing', name: 'Dividing Ratios', description: 'Sharing amounts using the total, a known amount or known difference', load: () => import('./tools/Proportion/RatioSharingTool') },
      { id: 'simplifying-ratios', path: '/simplifying-ratios', name: 'Simplifying Ratios', description: 'Simplifying ratios in numerical and algebraic forms', enabled: false, load: () => import('./tools/Proportion/SimplifyingRatiosTool') },
      { id: 'Recipes', path: '/recipes', name: 'Recipes', description: 'Find amounts of ingredients by scaling recipes and understanding limiting factors', load: () => import('./tools/Proportion/RecipesTool') },
      { id: 'fraction-to-ratio', path: '/fraction-to-ratio', name: 'Converting Fractions and Ratios', description: 'To convert fractions and ratios interchangeably', load: () => import('./tools/Proportion/FractionToRatio') },
      { id: 'fractions-of-amounts', path: '/fractions-of-amounts', name: 'Fractions of Amounts', description: 'To find a fraction of an amount', load: () => import('./tools/Proportion/FractionsOfAmounts') },
      { id: 'best-buys', path: '/best-buys', name: 'Best Buys', description: 'To find the best value from two prices', load: () => import('./tools/Proportion/BestBuys') },
    ],
  },
  {
    name: 'Geometry',
    tools: [
      { id: 'circles', path: '/circle-properties', name: 'Properties of Circles', description: 'Find the circumference, area and arc lengths of circles and sectors', load: () => import('./tools/Geometry/CircleProperties') },
      { id: 'basic-angle-facts', path: '/basic-angle-facts', name: 'Basic Angle Facts', description: 'Find missing angles from right angles, on straight lines and around a point', load: () => import('./tools/Geometry/BasicAngleFacts') },
      { id: 'angles-in-triangles', path: '/angles-in-triangles', name: 'Angles In Triangles', description: 'Find missing angles using triangle properties - including split triangles and exterior angles', load: () => import('./tools/Geometry/AnglesInTriangles') },
      { id: 'angles-in-parallel-lines', path: '/angles-in-parallel-lines', name: 'Angles in Parallel Lines', description: 'Explore corresponding, alternate and co-interior angles formed by a transversal cutting parallel lines', load: () => import('./tools/Geometry/AnglesInParallelLines') },
      { id: 'angles-in-quadrilaterals', path: '/angles-in-quadrilaterals', name: 'Angles In Quadrilaterals', description: 'Find missing angles using quadrilateral properties - including kites and arrowheads', load: () => import('./tools/Geometry/AnglesInQuadrilaterals') },
      { id: 'bearings', path: '/bearings', name: 'Bearings', description: 'Identify bearings from diagrams with North lines - two-point and three-point routes', load: () => import('./tools/Geometry/Bearings') },
      { id: 'equations-of-lines', path: '/equations-of-lines', name: 'Properties of Line Equations', description: 'Use co-ordinates and line equations to find properties of lines', load: () => import('./tools/Geometry/EquationsOfLines') },
      { id: 'perimeter', path: '/perimeter', name: 'Perimeter (BETA)', description: 'Calculate the perimeter of various 2D shapes', load: () => import('./tools/Geometry/PerimeterTool') },
    ],
  },
  {
    name: 'Probability & Statistics',
    tools: [],
  },
  {
    name: 'Teacher Tools',
    tools: [
      { id: 'visualiser', path: '/visualiser', name: 'Visualiser', description: 'A tool for displaying your visualiser', load: () => import('./tools/TeacherTools/Visualiser') },
      { id: 'tool-shell', path: '/tool-shell', name: 'Tool Shell', description: 'A tool shell for developing new tools', load: () => import('./tools/TeacherTools/ToolShell') },
      { id: 'call-selector', path: '/call-selector', name: 'Friday Phonecalls', description: 'A tool to randomly select students for phonecalls', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/CallSelector') },
      { id: 'skill-library', path: '/skills', name: 'Skill Library', description: 'Browse every core skill taught through short slide sequences — the drill-downs linked from worked-example steps', enabled: false, parked: true, load: () => import('./tools/TeacherTools/SkillLibrary') },
      { id: 'technique-library', path: '/techniques', name: 'Technique Library', description: 'Browse the reusable pedagogical working-step blocks (the engine behind natural worked examples), rendered on sample inputs', enabled: false, load: () => import('./tools/TeacherTools/TechniqueLibrary') },
      { id: 'technique-preview-quadratic-formula', path: '/techniques/quadratic-formula', name: 'Technique Preview — Quadratic Formula', description: 'A real tool page built around the quadraticFormulaSteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/QuadraticFormulaPreview') },
      { id: 'technique-preview-solving-a-linear-equation', path: '/techniques/solving-a-linear-equation', name: 'Technique Preview — Solving a Linear Equation', description: 'A real tool page built around the solveLinearEquationSteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/SolveLinearEquationPreview') },
      { id: 'technique-preview-reading-roots-from-factors', path: '/techniques/reading-roots-from-factors', name: 'Technique Preview — Reading Roots from Factors', description: 'A real tool page built around the solveFactorsSteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/SolveFactorsPreview') },
      { id: 'technique-preview-substituting-back', path: '/techniques/substituting-back', name: 'Technique Preview — Substituting Back', description: 'A real tool page built around the substituteBackSteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/SubstituteBackPreview') },
      { id: 'technique-preview-making-the-subject', path: '/techniques/making-the-subject', name: 'Technique Preview — Making the Subject', description: 'A real tool page built around the makeSubjectSteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/MakeSubjectPreview') },
      { id: 'technique-preview-solving-a-linear-chain', path: '/techniques/solving-a-linear-chain', name: 'Technique Preview — Solving a Linear Chain', description: 'A real tool page built around the solveLinearlySteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/SolveLinearlyPreview') },
      { id: 'technique-preview-full-worked-example', path: '/techniques/full-worked-example', name: 'Technique Preview — Full Worked Example', description: 'A real tool page composing several technique blocks into one full solution — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/FullExamplePreview') },
    ],
  },
  {
    name: 'Interactive Tools',
    tools: [
      { id: 'algebra-tiles', path: '/algebra-tiles', name: 'Algebra Tiles', description: 'Interactive sandbox for dragging and manipulating algebra tiles', load: () => import('./tools/Interactive/AlgebraTiles') },
      { id: 'parallel-lines-explorer', path: '/parallel-lines-explorer', name: 'Parallel Lines Explorer', description: 'Interactive canvas for exploring angles formed when a transversal crosses parallel lines — drag, reveal, and explore', load: () => import('./tools/Interactive/ParallelLinesInteractive') },
      { id: 'p-value', path: '/p-value', name: 'P-Value Grapher', description: 'A tool to generate P-Values from Binomial Distributions', load: () => import('./tools/Interactive/p-value') },
      { id: 'grapher-lab', path: '/grapher', name: 'Grapher Lab', description: 'Test bench for the embeddable SmartGrapher — try every curve type and custom conditions live', enabled: false, load: () => import('./tools/Interactive/GrapherLab') },
    ],
  },
  {
    name: 'Decision Mathematics',
    tools: [
      { id: 'network-sandbox', path: '/network-sandbox', name: 'Network Sandbox', description: 'Exploratory workspace for rendering weighted networks — the spike ahead of a Decision Maths shell', enabled: false, load: () => import('./tools/Decision/NetworkSandbox') },
      { id: 'minimum-spanning-tree', path: '/minimum-spanning-tree', name: 'Minimum Spanning Tree', description: 'Find the minimum spanning tree of a weighted network with Kruskal\'s algorithm, walked through step by step', enabled: false, load: () => import('./tools/Decision/MinimumSpanningTree') },
      { id: 'mixed-strategies', path: '/mixed-strategies', name: 'Mixed Strategies', description: 'Find optimal mixed strategies and the value of a zero-sum game from its payoff matrix.', enabled: false, load: () => import('./tools/Decision/MixedStrategies') },
    ],
  },
  {
    name: 'Computer Science',
    subject: 'Computer Science',
    tools: [
      { id: 'system architecture', path: '/system-architecture', name: '1.1 - System Architectures', description: 'A tool for learning the 1.1 content for system architectures', load: () => import('./tools/ComputerScience/SystemArchitecture') },
      { id: 'cpu-architecture', path: '/cpu-architecture', name: '1.1.1 - CPU Architecture', description: 'Spec-tagged, exam-realistic, mobile-first revision for OCR J277 1.1.1 CPU architecture', load: () => import('./tools/ComputerScience/CpuArchitecture') },
      { id: 'cpu-performance', path: '/cpu-performance', name: '1.1.2 - CPU Performance', description: 'Clock speed, cache size and cores — and why the CPU with the biggest single number isn\'t always the fastest', enabled: false, load: () => import('./tools/ComputerScience/CpuPerformance') },
    ],
  },
];

export const ALL_TOOLS: ToolMeta[] = CATEGORIES.flatMap((c) => c.tools);
