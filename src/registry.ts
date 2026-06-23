// ═══════════════════════════════════════════════════════════════════════════════
// TOOL REGISTRY — the single source of truth for every tool in the app.
//
// Registering a new tool is ONE entry here. App.tsx generates the route
// (lazy-loaded, so each tool is its own chunk) and LandingPage.tsx renders the
// card — neither file needs editing.
//
//   { id: 'my-new-tool', path: '/my-new-tool', name: 'Display Name',
//     description: 'One sentence.', ready: 'v2.3',
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
  ready: string;
  enabled?: boolean;
  load: () => Promise<{ default: ComponentType }>;
}

export interface CategoryMeta {
  name: string;
  tools: ToolMeta[];
}

export const CATEGORIES: CategoryMeta[] = [
  {
    name: 'Generators',
    tools: [
      { id: 'Times Tables', path: '/timestables', name: 'Times Tables', description: 'Generate PDFs designed to test and improve TimesTable fluency', ready: 'v1.0', load: () => import('./tools/Generators/TimesTablesGenerator') },
      { id: 'Negative Operations', path: '/negative-operations', name: 'Negative Operations', description: 'Generate PDFs designed to test and improve operations with negative numbers', ready: 'v2.0', load: () => import('./tools/Generators/NegativeOperationsGenerator') },
      { id: 'Multiplication Methods', path: '/multiplication-methods', name: 'Multiplication Methods', description: 'Generate PDFs designed to test and improve use of multiplication methods', ready: 'v1.0', load: () => import('./tools/Generators/MultiplicationGenerator') },
      { id: 'Functional Skills', path: '/functional-skills', name: 'Functional Skills', description: 'Generate PDFs designed to test functional skills such as number bonds, addition, subtraction and more', ready: 'v1.0', load: () => import('./tools/Generators/FunctionalSkillsGenerator') },
    ],
  },
  {
    name: 'Number',
    tools: [
      { id: 'integers', path: '/integer-add-and-subtract', name: 'Adding & Subtracting Integers', description: 'Practice adding and subtracting positive and negative numbers using number lines', ready: 'v1.4', enabled: false, load: () => import('./tools/Number/IntegerAddSub') },
      { id: 'estimation', path: '/estimation', name: 'Estimation', description: 'Develop estimation skills by rounding numbers to make calculations easier', ready: 'v2.3', load: () => import('./tools/Number/Estimation') },
      { id: 'powers-of-ten', path: '/powers-of-ten', name: 'Multiplying & Dividing by 10ⁿ', description: 'Use a place value table to scale by powers of 10', ready: 'v1.4', enabled: false, load: () => import('./tools/Number/PowersOfTen') },
    ],
  },
  {
    name: 'Algebra',
    tools: [
      { id: 'collecting-like-terms', path: '/collecting-like-terms', name: "Collecting Like Terms", description: "Practise identifying and collecting like terms across single and multiple variable expressions, from basic addition to multi-variable simplification.", ready: 'v2.3', load: () => import('./tools/Algebra/CollectingLikeTerms') },
      { id: 'solving-linear-equations', path: '/solving-linear-equations', name: 'Unknowns on Both Sides', description: 'Solve equations where the unknown occurs more than once', ready: 'v2.3', load: () => import('./tools/Algebra/SolvingLinearEquations') },
      { id: 'completing-square', path: '/completing-the-square', name: 'Completing the Square', description: 'Rewrite and solve quadratic expressions in completed square form', ready: 'v2.3', load: () => import('./tools/Algebra/CompletingTheSquare') },
      { id: 'iterations', path: '/iterations', name: 'Iteration', description: 'Find roots to equations using iterative methods', ready: 'v2.1.1', load: () => import('./tools/Algebra/Iterations') },
      { id: 'simultaneous-equations-elimination', path: '/simultaneous-equations-elimination', name: 'Simultaneous Equations (Elimination)', description: 'Solve simultaneous equations, including rearranging', ready: 'v2.1.1', load: () => import('./tools/Algebra/SimultaneousEquations') },
      { id: 'simultaneous-equations-substitution', path: '/simultaneous-equations-substitution', name: 'Simultaneous Equations (Substitution)', description: 'Solve Simultaneous Equations (including Non-Linear) by Substitution', ready: 'v2.1.2', load: () => import('./tools/Algebra/NonLinearSimEq') },
      { id: 'expanding-brackets', path: '/expanding-brackets', name: 'Expanding Brackets', description: 'Expand single and double brackets with step-by-step working', ready: 'v2.3', load: () => import('./tools/Algebra/ExpandingBrackets') },
    ],
  },
  {
    name: 'Ratio & Proportion',
    tools: [
      { id: 'ratio', path: '/ratio-sharing', name: 'Dividing Ratios', description: 'Sharing amounts using the total, a known amount or known difference', ready: 'v2.3', load: () => import('./tools/Proportion/RatioSharingTool') },
      { id: 'simplifying-ratios', path: '/simplifying-ratios', name: 'Simplifying Ratios', description: 'Simplifying ratios in numerical and algebraic forms', ready: 'v1.4', enabled: false, load: () => import('./tools/Proportion/SimplifyingRatiosTool') },
      { id: 'Recipes', path: '/recipes', name: 'Recipes', description: 'Find amounts of ingredients by scaling recipes and understanding limiting factors', ready: 'v2.1.2', load: () => import('./tools/Proportion/RecipesTool') },
      { id: 'fraction-to-ratio', path: '/fraction-to-ratio', name: 'Converting Fractions and Ratios', description: 'To convert fractions and ratios interchangeably', ready: 'v2.0', load: () => import('./tools/Proportion/FractionToRatio') },
      { id: 'fractions-of-amounts', path: '/fractions-of-amounts', name: 'Fractions of Amounts', description: 'To find a fraction of an amount', ready: 'v2.0', load: () => import('./tools/Proportion/FractionsOfAmounts') },
      { id: 'best-buys', path: '/best-buys', name: 'Best Buys', description: 'To find the best value from two prices', ready: 'v2.3', load: () => import('./tools/Proportion/BestBuys') },
    ],
  },
  {
    name: 'Geometry',
    tools: [
      { id: 'circles', path: '/circle-properties', name: 'Properties of Circles', description: 'Find the circumference, area and arc lengths of circles and sectors', ready: 'v2.3', load: () => import('./tools/Geometry/CircleProperties') },
      { id: 'basic-angle-facts', path: '/basic-angle-facts', name: 'Basic Angle Facts', description: 'Find missing angles from right angles, on straight lines and around a point', ready: 'v2.3', load: () => import('./tools/Geometry/BasicAngleFacts') },
      { id: 'angles-in-triangles', path: '/angles-in-triangles', name: 'Angles In Triangles', description: 'Find missing angles using triangle properties - including split triangles and exterior angles', ready: 'v2.1', load: () => import('./tools/Geometry/AnglesInTriangles') },
      { id: 'angles-in-parallel-lines', path: '/angles-in-parallel-lines', name: 'Angles in Parallel Lines', description: 'Explore corresponding, alternate and co-interior angles formed by a transversal cutting parallel lines', ready: 'v2.3', load: () => import('./tools/Geometry/AnglesInParallelLines') },
      { id: 'angles-in-quadrilaterals', path: '/angles-in-quadrilaterals', name: 'Angles In Quadrilaterals', description: 'Find missing angles using quadrilateral properties - including kites and arrowheads', ready: 'v2.3', load: () => import('./tools/Geometry/AnglesInQuadrilaterals') },
      { id: 'equations-of-lines', path: '/equations-of-lines', name: 'Properties of Line Equations', description: 'Use co-ordinates and line equations to find properties of lines', ready: 'v2.1', load: () => import('./tools/Geometry/EquationsOfLines') },
      { id: 'perimeter', path: '/perimeter', name: 'Perimeter (BETA)', description: 'Calculate the perimeter of various 2D shapes', ready: 'v2.1', enabled: false, load: () => import('./tools/Geometry/PerimeterTool') },
    ],
  },
  {
    name: 'Probability & Statistics',
    tools: [],
  },
  {
    name: 'Teacher Tools',
    tools: [
      { id: 'visualiser', path: '/visualiser', name: 'Visualiser', description: 'A tool for displaying your visualiser', ready: 'Ready', load: () => import('./tools/TeacherTools/Visualiser') },
      { id: 'tool-shell', path: '/tool-shell', name: 'Tool Shell', description: 'A tool shell for developing new tools', ready: 'v2.3', load: () => import('./tools/TeacherTools/ToolShell') },
      { id: 'call-selector', path: '/call-selector', name: 'Friday Phonecalls', description: 'A tool to randomly select students for phonecalls', ready: 'v1.0', enabled: false, load: () => import('./tools/TeacherTools/CallSelector') },
      { id: 'p-value', path: '/p-value', name: 'P-Value Grapher', description: 'A tool to generate P-Values from Binomial Distributions', ready: 'v1.0', load: () => import('./tools/TeacherTools/p-value') },
    ],
  },
  {
    name: 'Computer Science',
    tools: [
      { id: 'system architecture', path: '/system-architecture', name: '1.1 - System Architectures', description: 'A tool for learning the 1.1 content for system architectures', ready: 'v1.0', load: () => import('./tools/ComputerScience/SystemArchitecture') },
    ],
  },
];

export const ALL_TOOLS: ToolMeta[] = CATEGORIES.flatMap((c) => c.tools);
