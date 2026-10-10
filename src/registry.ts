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
  /** Optional sub-group within its category (e.g. 'Place value & decimals'). The landing page draws a
   *  sub-heading per group, in order of first appearance in the category; tools without one stay ungrouped. */
  group?: string;
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
      { group: 'Number sense', id: 'comparing-ordering-numbers', path: '/comparing-ordering-numbers', name: 'Ordering Numbers', description: 'Compare and order decimals and negative numbers, with teacher-tailorable misconception traps and a step-by-step place-value table.', load: () => import('./tools/Number/ComparingOrderingNumbers') },
      { group: 'Number sense', id: 'powers-of-ten', path: '/powers-of-ten', name: 'Powers of 10', description: 'Use a place value table to scale by powers of 10', load: () => import('./tools/Number/PowersOfTen') },
      { group: 'Number sense', id: 'rounding', path: '/rounding', name: 'Rounding', description: 'Round to the nearest 10, 100, 1000, decimal places and significant figures, using labelled and blank number lines.', load: () => import('./tools/Number/Rounding') },
      { group: 'Number sense', id: 'estimation', path: '/estimation', name: 'Estimation', description: 'Develop estimation skills by rounding numbers to make calculations easier', load: () => import('./tools/Number/Estimation') },
      { group: 'Calculation', id: 'integers', path: '/integer-add-and-subtract', name: 'Integers +/−', description: 'Practice adding and subtracting positive and negative numbers using number lines', load: () => import('./tools/Number/IntegerAddSub') },
      { group: 'Calculation', id: 'decimal-add-sub', path: '/decimal-addition-subtraction', name: 'Decimals +/−', description: 'Add and subtract decimals using a place value table, from lining up the point to placeholder zeros and exchanging across a zero.', load: () => import('./tools/Number/DecimalAddSub') },
      { group: 'Calculation', id: 'order-of-operations', path: '/order-of-operations', name: 'Order of Operations', description: 'Work out expressions with brackets, indices, roots, fraction bars, negatives and decimals, and spot or fix BIDMAS mistakes, with working that boxes each step in order.', load: () => import('./tools/Number/OrderOfOperations') },
      { group: 'Fractions, decimals & percentages', id: 'fractions-add-sub', path: '/add-subtract-fractions', name: 'Fractions +/−', description: 'Add and subtract fractions and mixed numbers, with common denominators, scaling and LCM methods', load: () => import('./tools/Number/FractionsAddSub') },
      { group: 'Fractions, decimals & percentages', id: 'fractions-mult-div', path: '/multiply-divide-fractions', name: 'Fractions ×/÷', description: 'Multiply and divide fractions and mixed numbers using Keep, Flip, Change', load: () => import('./tools/Number/FractionMultDiv') },
      { group: 'Fractions, decimals & percentages', id: 'percentages', path: '/percentages', name: 'Percentages', description: 'Find percentages of amounts, calculate percentage increase/decrease, and work backwards with reverse percentages', load: () => import('./tools/Number/Percentages') },
    ],
  },
  {
    name: 'Algebra',
    tools: [
      { group: 'Expressions', id: 'collecting-like-terms', path: '/collecting-like-terms', name: "Collecting Like Terms", description: "Practise identifying and collecting like terms across single and multiple variable expressions, from basic addition to multi-variable simplification.", load: () => import('./tools/Algebra/CollectingLikeTerms') },
      { group: 'Expressions', id: 'expanding-brackets', path: '/expanding-brackets', name: 'Expanding Brackets', description: 'Expand single and double brackets with step-by-step working', load: () => import('./tools/Algebra/ExpandingBrackets') },
      { group: 'Expressions', id: 'surds', path: '/surds', name: "Surds", description: "Simplify, combine, expand and rationalise surds across five interlocking skills.", load: () => import('./tools/Number/Surds') },
      { group: 'Solving equations', id: 'solving-linear-equations', path: '/solving-linear-equations', name: 'Linear Equations', description: 'Solve equations where the unknown occurs more than once', load: () => import('./tools/Algebra/SolvingLinearEquations') },
      { group: 'Solving equations', id: 'simultaneous-equations-elimination', path: '/simultaneous-equations-elimination', name: 'Simultaneous: Elimination', description: 'Solve simultaneous equations, including rearranging', load: () => import('./tools/Algebra/SimultaneousEquations') },
      { group: 'Solving equations', id: 'simultaneous-equations-substitution', path: '/simultaneous-equations-substitution', name: 'Simultaneous: Substitution', description: 'Solve Simultaneous Equations (including Non-Linear) by Substitution', load: () => import('./tools/Algebra/NonLinearSimEq') },
      { group: 'Solving equations', id: 'completing-square', path: '/completing-the-square', name: 'Completing the Square', description: 'Rewrite and solve quadratic expressions in completed square form', load: () => import('./tools/Algebra/CompletingTheSquare') },
      { group: 'Solving equations', id: 'iterations', path: '/iterations', name: 'Iteration', description: 'Find roots to equations using iterative methods', load: () => import('./tools/Algebra/Iterations') },
      { group: 'Graphs', id: 'equations-of-lines', path: '/equations-of-lines', name: 'Equations of Lines', description: 'Use co-ordinates and line equations to find properties of lines', load: () => import('./tools/Geometry/EquationsOfLines') },
    ],
  },
  {
    name: 'Ratio & Proportion',
    tools: [
      { group: 'Ratio', id: 'fractions-of-amounts', path: '/fractions-of-amounts', name: 'Fractions of Amounts', description: 'To find a fraction of an amount', load: () => import('./tools/Proportion/FractionsOfAmounts') },
      { group: 'Ratio', id: 'simplifying-ratios', path: '/simplifying-ratios', name: 'Simplifying Ratios', description: 'Simplifying ratios in numerical and algebraic forms', enabled: false, load: () => import('./tools/Proportion/SimplifyingRatiosTool') },
      { group: 'Ratio', id: 'fraction-to-ratio', path: '/fraction-to-ratio', name: 'Fractions ↔ Ratios', description: 'To convert fractions and ratios interchangeably', load: () => import('./tools/Proportion/FractionToRatio') },
      { group: 'Ratio', id: 'ratio', path: '/ratio-sharing', name: 'Ratio Sharing', description: 'Sharing amounts using the total, a known amount or known difference', load: () => import('./tools/Proportion/RatioSharingTool') },
      { group: 'Proportion & rates', id: 'Recipes', path: '/recipes', name: 'Recipes', description: 'Find amounts of ingredients by scaling recipes and understanding limiting factors', load: () => import('./tools/Proportion/RecipesTool') },
      { group: 'Proportion & rates', id: 'best-buys', path: '/best-buys', name: 'Best Buys', description: 'To find the best value from two prices', load: () => import('./tools/Proportion/BestBuys') },
      { group: 'Proportion & rates', id: 'speed-distance-time', path: '/speed-distance-time', name: "Speed, Distance & Time", description: "Find speed, distance or time from the other two, using ratio-table scaling.", enabled: true, load: () => import('./tools/Proportion/SpeedDistanceTime') },
    ],
  },
  {
    name: 'Geometry',
    tools: [
      { group: 'Angles', id: 'basic-angle-facts', path: '/basic-angle-facts', name: 'Angles: Facts', description: 'Find missing angles from right angles, on straight lines and around a point', load: () => import('./tools/Geometry/BasicAngleFacts') },
      { group: 'Angles', id: 'angles-in-triangles', path: '/angles-in-triangles', name: 'Angles: Triangles', description: 'Find missing angles using triangle properties - including split triangles and exterior angles', load: () => import('./tools/Geometry/AnglesInTriangles') },
      { group: 'Angles', id: 'angles-in-quadrilaterals', path: '/angles-in-quadrilaterals', name: 'Angles: Quadrilaterals', description: 'Find missing angles using quadrilateral properties - including kites and arrowheads', load: () => import('./tools/Geometry/AnglesInQuadrilaterals') },
      { group: 'Angles', id: 'angles-in-parallel-lines', path: '/angles-in-parallel-lines', name: 'Angles: Parallel Lines', description: 'Explore corresponding, alternate and co-interior angles formed by a transversal cutting parallel lines', load: () => import('./tools/Geometry/AnglesInParallelLines') },
      { group: 'Angles', id: 'bearings', path: '/bearings', name: 'Bearings', description: 'Identify bearings from diagrams with North lines - two-point and three-point routes', load: () => import('./tools/Geometry/Bearings') },
      { group: 'Shapes & measures', id: 'perimeter', path: '/perimeter', name: 'Perimeter', description: 'Calculate the perimeter of various 2D shapes', enabled: false, load: () => import('./tools/Geometry/PerimeterTool') },
      { group: 'Shapes & measures', id: 'circles', path: '/circle-properties', name: 'Circle Properties', description: 'Find the circumference, area and arc lengths of circles and sectors', load: () => import('./tools/Geometry/CircleProperties') },
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
      { id: 'skill-library', path: '/skills', name: 'Skill Library', description: 'Browse every core skill taught through short slide sequences — the drill-downs linked from worked-example steps', enabled: false, parked: true, load: () => import('./tools/TeacherTools/SkillLibrary') },
      { id: 'technique-library', path: '/techniques', name: 'Technique Library', description: 'Browse the reusable pedagogical working-step blocks (the engine behind natural worked examples), rendered on sample inputs', enabled: false, load: () => import('./tools/TeacherTools/TechniqueLibrary') },
      { id: 'technique-preview-quadratic-formula', path: '/techniques/quadratic-formula', name: 'Technique Preview — Quadratic Formula', description: 'A real tool page built around the quadraticFormulaSteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/QuadraticFormulaPreview') },
      { id: 'technique-preview-solving-a-linear-equation', path: '/techniques/solving-a-linear-equation', name: 'Technique Preview — Solving a Linear Equation', description: 'A real tool page built around the solveLinearEquationSteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/SolveLinearEquationPreview') },
      { id: 'technique-preview-reading-roots-from-factors', path: '/techniques/reading-roots-from-factors', name: 'Technique Preview — Reading Roots from Factors', description: 'A real tool page built around the solveFactorsSteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/SolveFactorsPreview') },
      { id: 'technique-preview-substituting-back', path: '/techniques/substituting-back', name: 'Technique Preview — Substituting Back', description: 'A real tool page built around the substituteBackSteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/SubstituteBackPreview') },
      { id: 'technique-preview-making-the-subject', path: '/techniques/making-the-subject', name: 'Technique Preview — Making the Subject', description: 'A real tool page built around the makeSubjectSteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/MakeSubjectPreview') },
      { id: 'technique-preview-solving-a-linear-chain', path: '/techniques/solving-a-linear-chain', name: 'Technique Preview — Solving a Linear Chain', description: 'A real tool page built around the solveLinearlySteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/SolveLinearlyPreview') },
      { id: 'technique-preview-full-worked-example', path: '/techniques/full-worked-example', name: 'Technique Preview — Full Worked Example', description: 'A real tool page composing several technique blocks into one full solution — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/FullExamplePreview') },
      { id: 'technique-preview-simplifying-a-surd', path: '/techniques/simplifying-a-surd', name: 'Technique Preview — Simplify a Surd', description: 'A real tool page built around the simplifySurdSteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/SimplifySurdPreview') },
      { id: 'technique-preview-collecting-like-surds', path: '/techniques/collecting-like-surds', name: 'Technique Preview — Collect Like Surds', description: 'A real tool page built around the collectLikeSurdsSteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/CollectLikeSurdsPreview') },
      { id: 'technique-preview-expanding-surd-brackets', path: '/techniques/expanding-surd-brackets', name: 'Technique Preview — Expand Surd Brackets', description: 'A real tool page built around the expandSurdBracketsSteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/ExpandSurdBracketsPreview') },
      { id: 'technique-preview-rationalising-the-denominator', path: '/techniques/rationalising-the-denominator', name: 'Technique Preview — Rationalise the Denominator', description: 'A real tool page built around the rationaliseDenominatorSteps technique — an accurate, non-popup preview', enabled: false, hidden: true, load: () => import('./tools/TeacherTools/RationaliseDenominatorPreview') },
    ],
  },
  {
    name: 'Interactive Tools',
    tools: [
      { id: 'algebra-tiles', path: '/algebra-tiles', name: 'Algebra Tiles', description: 'Interactive sandbox for dragging and manipulating algebra tiles', load: () => import('./tools/Interactive/AlgebraTiles') },
      { id: 'negative-counters', path: '/negative-counters', name: 'Negative Counters', description: 'Interactive sandbox for positive and negative counters — build numbers, make zero pairs, add and subtract directed numbers', load: () => import('./tools/Interactive/NegativeCounters') },
      { id: 'parallel-lines-explorer', path: '/parallel-lines-explorer', name: 'Parallel Lines Explorer', description: 'Interactive canvas for exploring angles formed when a transversal crosses parallel lines — drag, reveal, and explore', load: () => import('./tools/Interactive/ParallelLinesInteractive') },
      { id: 'p-value', path: '/p-value', name: 'P-Value Grapher', description: 'A tool to generate P-Values from Binomial Distributions', load: () => import('./tools/Interactive/p-value') },
      { id: 'grapher-lab', path: '/grapher', name: 'Grapher Lab', description: 'Test bench for the embeddable SmartGrapher — try every curve type and custom conditions live', enabled: false, load: () => import('./tools/Interactive/GrapherLab') },
    ],
  },
  {
    name: 'Decision Mathematics',
    tools: [
      { id: 'network-sandbox', path: '/network-sandbox', name: 'Network Sandbox', description: 'Free workspace for Decision Maths: load any graph from the shared bank, change weights, drag vertices, show the table — the same board that opens from every Decision question', enabled: false, load: () => import('./tools/Decision/NetworkSandbox') },
      { id: 'minimum-spanning-tree', path: '/minimum-spanning-tree', name: 'Minimum Spanning Tree', description: 'Kruskal\'s and Prim\'s algorithms (on a network or a table of distances) for the minimum spanning tree, at three network sizes, walked through step by step', load: () => import('./tools/Decision/MinimumSpanningTree') },
      { id: 'travelling-salesperson', path: '/travelling-salesperson', name: 'Travelling Salesperson', description: 'Upper bound (nearest neighbour), lower bound (deleted vertex) and the interval for the optimal tour of the travelling salesperson problem — completing a practical network into a table of least distances first', load: () => import('./tools/Decision/TravellingSalesperson') },
      { id: 'route-inspection', path: '/route-inspection', name: 'Route Inspection', description: 'The Chinese postman problem: degrees and odd vertices, the shortest closed route that uses every edge, and the shortest route between two chosen odd vertices — walked through step by step', load: () => import('./tools/Decision/RouteInspection') },
      { id: 'network-flows', path: '/network-flows', name: 'Network Flows', description: 'Potentials, cut values and flow augmentation on capacity and minimum/maximum networks — walked through step by step, up to maximum flow and minimum cut', load: () => import('./tools/Decision/NetworkFlows') },
      { id: 'mixed-strategies', path: '/mixed-strategies', name: 'Mixed Strategies', description: 'Find optimal mixed strategies and the value of a zero-sum game from its payoff matrix.', enabled: false, load: () => import('./tools/Decision/MixedStrategies') },
    ],
  },
  {
    name: 'Computer Science',
    subject: 'Computer Science',
    tools: [
      { id: 'system architecture', path: '/system-architecture', name: '1.1 - System Architectures', description: 'A tool for learning the 1.1 content for system architectures', load: () => import('./tools/ComputerScience/SystemArchitecture') },
      { id: 'cpu-architecture', path: '/cpu-architecture', name: '1.1.1 - CPU Architecture', description: 'Spec-tagged, exam-realistic, mobile-first revision for OCR J277 1.1.1 CPU architecture', load: () => import('./tools/ComputerScience/CpuArchitecture') },
      { id: 'cpu-performance', path: '/cpu-performance', name: '1.1.2 - CPU Performance', description: 'Clock speed, cache size and cores — and why the CPU with the biggest single number isn\'t always the fastest', load: () => import('./tools/ComputerScience/CpuPerformance') },
    ],
  },
  {
    name: 'Binary & Number Bases',
    subject: 'Computer Science',
    tools: [
      { id: 'binary-addition', path: '/binary-addition', name: 'Binary Arithmetic', description: 'Add 8-bit binary integers and perform binary shifts, identifying overflow and underflow, following the OCR J277 approach', load: () => import('./tools/Binary/BinaryAddition') },
      { id: 'number-bases', path: '/number-bases', name: 'Number Bases', description: 'Convert between denary, binary and hexadecimal up to 8 bits, with place-value working, following OCR J277 1.2.4', load: () => import('./tools/Binary/NumberBases') },
      { id: 'data-units', path: '/data-units', name: 'Data Units', description: 'Convert between bits, nibbles, bytes, KB, MB, GB, TB and PB along the OCR J277 ×1000 scale (×1024 shown in brackets), from one step to several', load: () => import('./tools/Binary/DataUnits') },
      { id: 'binary-counting', path: '/binary-counting', name: 'Binary Counting', description: 'Count in binary beside denary (and hex) with full place value tables — see that every n-bit pattern is the (n−1)-bit pattern with a 0 or a 1 in front', load: () => import('./tools/Binary/BinaryCounting') },
    ],
  },
];

export const ALL_TOOLS: ToolMeta[] = CATEGORIES.flatMap((c) => c.tools);
