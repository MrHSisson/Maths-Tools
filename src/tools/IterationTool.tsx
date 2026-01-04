import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';
type DifficultyLevel = 'level1' | 'level2' | 'level3';
type Mode = 'whiteboard' | 'single' | 'worksheet';
type ToolType = 'numerical' | 'rearranging' | 'verification';
type FormulaType = 'quadratic' | 'cubic' | 'fractional' | 'mixed';
type AnswerType = 'first3' | 'root';

type WorkingStep = {
  type: 'setup' | 'substitution' | 'calculation' | 'observation' | 'conclusion' | 'tip';
  content: string;
};

type IterationQuestion = {
  display: string;
  answer: string;
  working: WorkingStep[];
  values: {
    formula: string;
    formulaDisplay: string;
    x0: number;
    iterations: number[];
    accuracyTarget?: number;
    convergedValue?: number;
  };
  difficulty: string;
};

type RearrangingQuestion = {
  display: string;
  answer: string;
  working: WorkingStep[];
  values: {
    originalEquation: string;
    targetFormula: string;
    x0: number;
    iterations: number[];
    root: number;
    a: number;
    b: number;
    c?: number;
  };
  difficulty: string;
};

type VerificationQuestion = {
  display: string;
  answer: string;
  working: WorkingStep[];
  values: {
    equation: string;
    equationFunc: string;
    equationType: string;
    root: number;
    lowerBound: number;
    upperBound: number;
    fLower: number;
    fUpper: number;
    a: number;
    b: number;
  };
  difficulty: string;
};

type QuestionType = IterationQuestion | RearrangingQuestion | VerificationQuestion;

// ============================================================================
// CONSTANTS
// ============================================================================

const toolNames: Record<string, string> = {
  numerical: 'Numerical Processing',
  rearranging: 'Rearranging & Solving',
  verification: 'Root Verification'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Format decimal to specified places
const formatDecimal = (value: number, dp: number): string => {
  return value.toFixed(dp);
};

// Format subscript numbers
const formatSubscript = (n: number): string => {
  const subscripts = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
  if (n < 10) return subscripts[n];
  return String(n).split('').map(d => subscripts[parseInt(d)]).join('');
};

// Round to specified decimal places
const roundTo = (value: number, dp: number): number => {
  const factor = Math.pow(10, dp);
  return Math.round(value * factor) / factor;
};

// ============================================================================
// QUESTION GENERATORS
// ============================================================================

const generateNumericalQuestion = (
  level: DifficultyLevel,
  showCalculatorSteps: boolean,
  formulaType: FormulaType
): IterationQuestion => {
  let x0: number;
  let a: number;
  let b: number;
  let iterations: number[] = [];
  let formula: string;
  let formulaDisplay: string;
  let numIterations: number;
  let targetDP: number = 2; // Always 2 d.p.
  let convergedValue: number | undefined;
  
  // Determine which formula type to use
  let selectedType: string;
  if (formulaType === 'mixed') {
    const types = ['quadratic', 'cubic', 'fractional'];
    selectedType = types[Math.floor(Math.random() * types.length)];
  } else {
    selectedType = formulaType;
  }

  // Helper function to generate iterations
  const generateIterations = (
    startValue: number, 
    iterFunc: (x: number) => number, 
    count: number
  ): number[] => {
    const iters: number[] = [];
    let current = startValue;
    for (let i = 0; i < count; i++) {
      current = iterFunc(current);
      iters.push(current);
    }
    return iters;
  };

  // Helper for convergence iterations
  const generateConvergenceIterations = (
    startValue: number,
    iterFunc: (x: number) => number,
    dp: number
  ): { iterations: number[]; converged: number } => {
    const iters: number[] = [];
    let current = startValue;
    let prev = startValue;
    const maxIter = 20;
    let converged: number | undefined;
    
    for (let i = 0; i < maxIter; i++) {
      current = iterFunc(current);
      iters.push(current);
      
      if (i > 0 && roundTo(current, dp) === roundTo(prev, dp)) {
        converged = roundTo(current, dp);
        break;
      }
      prev = current;
    }
    
    return { 
      iterations: iters, 
      converged: converged ?? roundTo(iters[iters.length - 1], dp) 
    };
  };

  if (level === 'level1') {
    x0 = Math.floor(Math.random() * 5) + 1; // 1-5
    numIterations = 3;
    
    if (selectedType === 'quadratic') {
      a = Math.floor(Math.random() * 5) + 2;  // 2-6
      b = Math.floor(Math.random() * 5) + 1;  // 1-5
      formula = `sqrt(${a}*x + ${b})`;
      formulaDisplay = `√(${a}xₙ + ${b})`;
      iterations = generateIterations(x0, (x) => Math.sqrt(a * x + b), numIterations);
    } else if (selectedType === 'cubic') {
      a = Math.floor(Math.random() * 8) + 5;  // 5-12
      b = Math.floor(Math.random() * 10) + 1; // 1-10
      formula = `cbrt(${a}*x + ${b})`;
      formulaDisplay = `∛(${a}xₙ + ${b})`;
      iterations = generateIterations(x0, (x) => Math.cbrt(a * x + b), numIterations);
    } else {
      // Fractional: x = a/x + b (Level 1: simpler values)
      a = Math.floor(Math.random() * 6) + 2;  // 2-7
      b = Math.floor(Math.random() * 4) + 1;  // 1-4
      x0 = Math.floor(Math.random() * 3) + 2; // 2-4 (avoid division issues)
      formula = `${a}/x + ${b}`;
      formulaDisplay = `${a}/xₙ + ${b}`;
      iterations = generateIterations(x0, (x) => a / x + b, numIterations);
    }
  } else if (level === 'level2') {
    x0 = Math.floor(Math.random() * 30 + 10) / 10; // 1.0-3.9
    numIterations = 5;
    
    if (selectedType === 'quadratic') {
      a = Math.floor(Math.random() * 4) + 2;  // 2-5
      b = Math.floor(Math.random() * 6) + 1;  // 1-6
      formula = `sqrt(${a}*x + ${b})`;
      formulaDisplay = `√(${a}xₙ + ${b})`;
      iterations = generateIterations(x0, (x) => Math.sqrt(a * x + b), numIterations);
    } else if (selectedType === 'cubic') {
      a = Math.floor(Math.random() * 8) + 5;  // 5-12
      b = Math.floor(Math.random() * 10) + 1; // 1-10
      formula = `cbrt(${a}*x + ${b})`;
      formulaDisplay = `∛(${a}xₙ + ${b})`;
      iterations = generateIterations(x0, (x) => Math.cbrt(a * x + b), numIterations);
    } else {
      // Fractional: x = a/x + b (Level 2: wider range)
      a = Math.floor(Math.random() * 8) + 3;  // 3-10
      b = Math.floor(Math.random() * 5) + 1;  // 1-5
      x0 = Math.floor(Math.random() * 20 + 15) / 10; // 1.5-3.4
      formula = `${a}/x + ${b}`;
      formulaDisplay = `${a}/xₙ + ${b}`;
      iterations = generateIterations(x0, (x) => a / x + b, numIterations);
    }
  } else {
    // Level 3: Iterate until convergence (always 2 d.p.)
    
    if (selectedType === 'quadratic') {
      a = Math.floor(Math.random() * 4) + 2;
      b = Math.floor(Math.random() * 6) + 1;
      x0 = Math.floor(Math.random() * 30 + 10) / 10;
      formula = `sqrt(${a}*x + ${b})`;
      formulaDisplay = `√(${a}xₙ + ${b})`;
      const result = generateConvergenceIterations(x0, (x) => Math.sqrt(a * x + b), targetDP);
      iterations = result.iterations;
      convergedValue = result.converged;
    } else if (selectedType === 'cubic') {
      a = Math.floor(Math.random() * 8) + 5;
      b = Math.floor(Math.random() * 10) + 1;
      x0 = Math.floor(Math.random() * 30 + 10) / 10;
      formula = `cbrt(${a}*x + ${b})`;
      formulaDisplay = `∛(${a}xₙ + ${b})`;
      const result = generateConvergenceIterations(x0, (x) => Math.cbrt(a * x + b), targetDP);
      iterations = result.iterations;
      convergedValue = result.converged;
    } else {
      // Fractional: x = a/x + b (Level 3: full range)
      a = Math.floor(Math.random() * 10) + 2;  // 2-11
      b = Math.floor(Math.random() * 6) + 1;   // 1-6
      x0 = Math.floor(Math.random() * 20 + 15) / 10;
      formula = `${a}/x + ${b}`;
      formulaDisplay = `${a}/xₙ + ${b}`;
      const result = generateConvergenceIterations(x0, (x) => a / x + b, targetDP);
      iterations = result.iterations;
      convergedValue = result.converged;
    }
  }

  // Build display string
  let display: string;
  if (level === 'level1') {
    display = `Using x${formatSubscript(0)} = ${x0} and the formula xₙ₊₁ = ${formulaDisplay}, find x${formatSubscript(1)}, x${formatSubscript(2)}, x${formatSubscript(3)}`;
  } else if (level === 'level2') {
    display = `Using x${formatSubscript(0)} = ${x0} and the formula xₙ₊₁ = ${formulaDisplay}, find x${formatSubscript(1)}, x${formatSubscript(2)}, x${formatSubscript(3)}, x${formatSubscript(4)}, x${formatSubscript(5)}`;
  } else {
    display = `Using x${formatSubscript(0)} = ${x0} and the formula xₙ₊₁ = ${formulaDisplay}, find the root to ${targetDP} decimal places`;
  }

  // Build answer string
  let answer: string;
  if (level === 'level1') {
    answer = `x${formatSubscript(1)} = ${formatDecimal(iterations[0], 3)}, x${formatSubscript(2)} = ${formatDecimal(iterations[1], 3)}, x${formatSubscript(3)} = ${formatDecimal(iterations[2], 3)}`;
  } else if (level === 'level2') {
    answer = `x${formatSubscript(5)} = ${formatDecimal(iterations[4], 4)}`;
  } else {
    answer = `x = ${formatDecimal(convergedValue!, targetDP)}`;
  }

  // Build working steps
  const working: WorkingStep[] = [];
  
  working.push({
    type: 'setup',
    content: `Start with x${formatSubscript(0)} = ${x0}`
  });

  const displayIterations = level === 'level1' ? 3 : level === 'level2' ? 5 : iterations.length;
  
  for (let i = 0; i < displayIterations; i++) {
    const prevValue = i === 0 ? x0 : iterations[i - 1];
    let stepContent: string;
    
    if (selectedType === 'quadratic') {
      const calcValue = a * prevValue + b;
      stepContent = `x${formatSubscript(i + 1)} = √(${a} × ${formatDecimal(prevValue, 4)} + ${b}) = √${formatDecimal(calcValue, 4)} = ${formatDecimal(iterations[i], 4)}`;
    } else if (selectedType === 'cubic') {
      const calcValue = a * prevValue + b;
      stepContent = `x${formatSubscript(i + 1)} = ∛(${a} × ${formatDecimal(prevValue, 4)} + ${b}) = ∛${formatDecimal(calcValue, 4)} = ${formatDecimal(iterations[i], 4)}`;
    } else {
      // Fractional
      stepContent = `x${formatSubscript(i + 1)} = ${a} ÷ ${formatDecimal(prevValue, 4)} + ${b} = ${formatDecimal(a / prevValue, 4)} + ${b} = ${formatDecimal(iterations[i], 4)}`;
    }
    
    working.push({
      type: 'substitution',
      content: stepContent
    });
  }

  if (level === 'level3' && convergedValue !== undefined) {
    const lastTwo = iterations.slice(-2);
    working.push({
      type: 'observation',
      content: `x${formatSubscript(iterations.length - 1)} = ${formatDecimal(lastTwo[0], 4)} rounds to ${formatDecimal(roundTo(lastTwo[0], targetDP), targetDP)}`
    });
    working.push({
      type: 'observation',
      content: `x${formatSubscript(iterations.length)} = ${formatDecimal(lastTwo[1], 4)} rounds to ${formatDecimal(roundTo(lastTwo[1], targetDP), targetDP)}`
    });
    working.push({
      type: 'conclusion',
      content: `Both values round to ${formatDecimal(convergedValue, targetDP)}, so the root is ${formatDecimal(convergedValue, targetDP)} to ${targetDP} d.p.`
    });
  }

  if (showCalculatorSteps) {
    let calcTip: string;
    if (selectedType === 'quadratic') {
      calcTip = `Calculator: Enter ${x0}, press =. Then enter √(${a} × ANS + ${b}), press = repeatedly.`;
    } else if (selectedType === 'cubic') {
      calcTip = `Calculator: Enter ${x0}, press =. Then enter ∛(${a} × ANS + ${b}), press = repeatedly.`;
    } else {
      calcTip = `Calculator: Enter ${x0}, press =. Then enter ${a} ÷ ANS + ${b}, press = repeatedly.`;
    }
    working.push({
      type: 'tip',
      content: calcTip
    });
  }

  return {
    display,
    answer,
    working,
    values: {
      formula,
      formulaDisplay,
      x0,
      iterations,
      accuracyTarget: targetDP,
      convergedValue
    },
    difficulty: level
  };
};

// ============================================================================
// SUB-TOOL 2: REARRANGING & SOLVING
// ============================================================================

const generateRearrangingQuestion = (
  level: DifficultyLevel,
  targetFormulaVisible: boolean,
  answerType: AnswerType
): RearrangingQuestion => {
  let a: number;
  let b: number;
  let c: number = 0;
  let x0: number;
  let originalEquation: string;
  let targetFormula: string;
  let iterations: number[] = [];
  let root: number;
  const working: WorkingStep[] = [];
  
  // Helper to generate iterations until convergence to 2dp
  const iterateUntilConvergence = (
    startValue: number,
    iterFunc: (x: number) => number
  ): number[] => {
    const iters: number[] = [];
    let current = startValue;
    let prev = startValue;
    const maxIter = 20;
    
    for (let i = 0; i < maxIter; i++) {
      current = iterFunc(current);
      iters.push(current);
      
      if (i > 0 && roundTo(current, 2) === roundTo(prev, 2)) {
        break;
      }
      prev = current;
    }
    return iters;
  };

  // Determine iteration function and equation based on level
  let iterFunc: (x: number) => number;
  
  if (level === 'level1') {
    // Quadratic: x² − ax − b = 0 → x = √(ax + b)
    a = Math.floor(Math.random() * 4) + 2;  // 2-5
    b = Math.floor(Math.random() * 5) + 1;  // 1-5
    x0 = Math.floor(Math.random() * 3) + 1; // 1-3
    
    originalEquation = `x² − ${a}x − ${b} = 0`;
    targetFormula = `√(${a}x + ${b})`;
    iterFunc = (x) => Math.sqrt(a * x + b);
    
    // Build algebraic proof
    working.push({ type: 'setup', content: `Start with ${originalEquation}` });
    working.push({ type: 'calculation', content: `Add ${a}x + ${b} to both sides: x² = ${a}x + ${b}` });
    working.push({ type: 'calculation', content: `Take the square root: x = √(${a}x + ${b}) ✓` });

  } else if (level === 'level2') {
    // Cubic: x³ − ax − b = 0 → x = ∛(ax + b)
    a = Math.floor(Math.random() * 4) + 2;  // 2-5
    b = Math.floor(Math.random() * 6) + 1;  // 1-6
    x0 = Math.floor(Math.random() * 2) + 1; // 1-2
    
    originalEquation = `x³ − ${a}x − ${b} = 0`;
    targetFormula = `∛(${a}x + ${b})`;
    iterFunc = (x) => Math.cbrt(a * x + b);
    
    // Build algebraic proof
    working.push({ type: 'setup', content: `Start with ${originalEquation}` });
    working.push({ type: 'calculation', content: `Add ${a}x + ${b} to both sides: x³ = ${a}x + ${b}` });
    working.push({ type: 'calculation', content: `Take the cube root: x = ∛(${a}x + ${b}) ✓` });

  } else {
    // Level 3: Fractional - x² − bx − a = 0 → x = a/x + b
    a = Math.floor(Math.random() * 6) + 2;  // 2-7
    b = Math.floor(Math.random() * 3) + 1;  // 1-3
    x0 = Math.floor(Math.random() * 2) + 2; // 2-3
    
    originalEquation = `x² − ${b}x − ${a} = 0`;
    targetFormula = `${a}/x + ${b}`;
    iterFunc = (x) => a / x + b;
    
    // Build algebraic proof
    working.push({ type: 'setup', content: `Start with ${originalEquation}` });
    working.push({ type: 'calculation', content: `Add ${b}x + ${a} to both sides: x² = ${b}x + ${a}` });
    working.push({ type: 'calculation', content: `Divide both sides by x: x = ${b} + ${a}/x` });
    working.push({ type: 'calculation', content: `Rearrange: x = ${a}/x + ${b} ✓` });
  }
  
  // Calculate iterations based on answer type
  if (answerType === 'first3') {
    // Just need 3 iterations
    let current = x0;
    for (let i = 0; i < 3; i++) {
      current = iterFunc(current);
      iterations.push(current);
    }
  } else {
    // Iterate until convergence to 2dp
    iterations = iterateUntilConvergence(x0, iterFunc);
  }
  
  root = roundTo(iterations[iterations.length - 1], 2);
  
  // Build numerical working steps
  working.push({ type: 'setup', content: `Using x${formatSubscript(0)} = ${x0}` });
  
  // Number of iterations to show in working
  const numToShow = answerType === 'first3' ? 3 : iterations.length;
  
  for (let i = 0; i < numToShow; i++) {
    const prevValue = i === 0 ? x0 : iterations[i - 1];
    let stepContent: string;
    
    if (level === 'level1') {
      const calcValue = a * prevValue + b;
      if (i === 0) {
        stepContent = `x${formatSubscript(i + 1)} = √(${a} × ${prevValue} + ${b}) = √${formatDecimal(calcValue, 4)} = ${formatDecimal(iterations[i], 4)}`;
      } else {
        stepContent = `x${formatSubscript(i + 1)} = √(${a} × ${formatDecimal(prevValue, 4)} + ${b}) = ${formatDecimal(iterations[i], 4)}`;
      }
    } else if (level === 'level2') {
      const calcValue = a * prevValue + b;
      if (i === 0) {
        stepContent = `x${formatSubscript(i + 1)} = ∛(${a} × ${prevValue} + ${b}) = ∛${formatDecimal(calcValue, 4)} = ${formatDecimal(iterations[i], 4)}`;
      } else {
        stepContent = `x${formatSubscript(i + 1)} = ∛(${a} × ${formatDecimal(prevValue, 4)} + ${b}) = ${formatDecimal(iterations[i], 4)}`;
      }
    } else {
      // Fractional
      if (i === 0) {
        stepContent = `x${formatSubscript(i + 1)} = ${a}/${prevValue} + ${b} = ${formatDecimal(a/prevValue, 4)} + ${b} = ${formatDecimal(iterations[i], 4)}`;
      } else {
        stepContent = `x${formatSubscript(i + 1)} = ${a}/${formatDecimal(prevValue, 4)} + ${b} = ${formatDecimal(iterations[i], 4)}`;
      }
    }
    
    working.push({ type: 'substitution', content: stepContent });
  }
  
  // Add convergence observation for root type
  if (answerType === 'root' && iterations.length >= 2) {
    const lastTwo = iterations.slice(-2);
    working.push({
      type: 'observation',
      content: `x${formatSubscript(iterations.length - 1)} = ${formatDecimal(lastTwo[0], 4)} rounds to ${formatDecimal(roundTo(lastTwo[0], 2), 2)}`
    });
    working.push({
      type: 'observation',
      content: `x${formatSubscript(iterations.length)} = ${formatDecimal(lastTwo[1], 4)} rounds to ${formatDecimal(roundTo(lastTwo[1], 2), 2)}`
    });
    working.push({
      type: 'conclusion',
      content: `Both values round to ${formatDecimal(root, 2)}, so the root is ${formatDecimal(root, 2)} to 2 d.p.`
    });
  }

  // Build display string
  let display: string;
  let answer: string;
  
  const taskDescription = answerType === 'first3' 
    ? `find x${formatSubscript(1)}, x${formatSubscript(2)}, x${formatSubscript(3)}`
    : `find the root to 2 decimal places`;
  
  if (targetFormulaVisible) {
    display = `Show that ${originalEquation} can be rearranged to give x = ${targetFormula}. Using x${formatSubscript(0)} = ${x0}, ${taskDescription}.`;
  } else {
    display = `Rearrange ${originalEquation} into an iterative formula. Using x${formatSubscript(0)} = ${x0}, ${taskDescription}.`;
  }
  
  if (answerType === 'first3') {
    answer = `x${formatSubscript(1)} = ${formatDecimal(iterations[0], 4)}, x${formatSubscript(2)} = ${formatDecimal(iterations[1], 4)}, x${formatSubscript(3)} = ${formatDecimal(iterations[2], 4)}`;
  } else {
    answer = `x = ${formatDecimal(root, 2)}`;
  }

  return {
    display,
    answer,
    working,
    values: {
      originalEquation,
      targetFormula,
      x0,
      iterations,
      root,
      a,
      b,
      c
    },
    difficulty: level
  };
};

// Duplicate prevention for worksheets - Numerical
const generateUniqueNumericalQuestion = (
  level: DifficultyLevel,
  usedKeys: Set<string>,
  showCalculatorSteps: boolean,
  formulaType: FormulaType
): IterationQuestion => {
  let attempts = 0;
  let q: IterationQuestion;
  let uniqueKey: string;
  
  do {
    q = generateNumericalQuestion(level, showCalculatorSteps, formulaType);
    uniqueKey = `num-${q.values.formula}-${q.values.x0}`;
    if (++attempts > 100) break;
  } while (usedKeys.has(uniqueKey));
  
  usedKeys.add(uniqueKey);
  return q;
};

// Duplicate prevention for worksheets - Rearranging
const generateUniqueRearrangingQuestion = (
  level: DifficultyLevel,
  usedKeys: Set<string>,
  targetFormulaVisible: boolean,
  answerType: AnswerType
): RearrangingQuestion => {
  let attempts = 0;
  let q: RearrangingQuestion;
  let uniqueKey: string;
  
  do {
    q = generateRearrangingQuestion(level, targetFormulaVisible, answerType);
    uniqueKey = `rear-${q.values.a}-${q.values.b}-${q.values.x0}`;
    if (++attempts > 100) break;
  } while (usedKeys.has(uniqueKey));
  
  usedKeys.add(uniqueKey);
  return q;
};

// ============================================================================
// SUB-TOOL 3: ROOT VERIFICATION (CHANGE OF SIGN)
// ============================================================================

const generateVerificationQuestion = (
  level: DifficultyLevel
): VerificationQuestion => {
  let a: number;
  let b: number;
  let root: number;
  let lowerBound: number;
  let upperBound: number;
  let equation: string;
  let equationFunc: string;
  let fLower: number;
  let fUpper: number;
  const working: WorkingStep[] = [];
  
  // Randomly choose between quadratic and cubic
  const useCubic = Math.random() < 0.5;
  const equationType = useCubic ? 'cubic' : 'quadratic';
  
  if (useCubic) {
    // Cubic: x³ - ax - b = 0
    // Real root can be found numerically
    a = Math.floor(Math.random() * 4) + 2;  // 2-5
    b = Math.floor(Math.random() * 8) + 2;  // 2-9
    
    // Find the real root using Newton-Raphson or bisection approximation
    // For x³ - ax - b = 0, there's always one real root
    // Approximate: start with x = 2 and iterate
    let x = 2;
    for (let i = 0; i < 20; i++) {
      const fx = x * x * x - a * x - b;
      const fpx = 3 * x * x - a;
      if (Math.abs(fpx) > 0.0001) {
        x = x - fx / fpx;
      }
    }
    const exactRoot = x;
    
    if (level === 'level1') {
      root = exactRoot;
      lowerBound = Math.floor(root);
      upperBound = Math.ceil(root);
      if (lowerBound === upperBound) upperBound = lowerBound + 1;
    } else if (level === 'level2') {
      root = roundTo(exactRoot, 1);
      lowerBound = roundTo(root - 0.05, 2);
      upperBound = roundTo(root + 0.05, 2);
    } else {
      root = roundTo(exactRoot, 2);
      lowerBound = roundTo(root - 0.005, 3);
      upperBound = roundTo(root + 0.005, 3);
    }
    
    equation = `x³ − ${a}x − ${b} = 0`;
    equationFunc = `x³ − ${a}x − ${b}`;
    
    // Calculate f(L) and f(U) for cubic
    fLower = lowerBound * lowerBound * lowerBound - a * lowerBound - b;
    fUpper = upperBound * upperBound * upperBound - a * upperBound - b;
    
  } else {
    // Quadratic: x² - ax - b = 0
    a = Math.floor(Math.random() * 4) + 2;  // 2-5
    b = Math.floor(Math.random() * 8) + 2;  // 2-9
    
    // Positive root = (a + √(a² + 4b)) / 2
    const discriminant = a * a + 4 * b;
    const exactRoot = (a + Math.sqrt(discriminant)) / 2;
    
    if (level === 'level1') {
      root = exactRoot;
      lowerBound = Math.floor(root);
      upperBound = Math.ceil(root);
      if (lowerBound === upperBound) upperBound = lowerBound + 1;
    } else if (level === 'level2') {
      root = roundTo(exactRoot, 1);
      lowerBound = roundTo(root - 0.05, 2);
      upperBound = roundTo(root + 0.05, 2);
    } else {
      root = roundTo(exactRoot, 2);
      lowerBound = roundTo(root - 0.005, 3);
      upperBound = roundTo(root + 0.005, 3);
    }
    
    equation = `x² − ${a}x − ${b} = 0`;
    equationFunc = `x² − ${a}x − ${b}`;
    
    // Calculate f(L) and f(U) for quadratic
    fLower = lowerBound * lowerBound - a * lowerBound - b;
    fUpper = upperBound * upperBound - a * upperBound - b;
  }
  
  // Determine decimal places for display
  const boundDP = level === 'level3' ? 3 : level === 'level2' ? 2 : 0;
  
  // Build display string
  let display: string;
  let dpText: string;
  
  if (level === 'level1') {
    dpText = 'between two consecutive integers';
    display = `The equation ${equation} has a root between ${lowerBound} and ${upperBound}. Use the change of sign method to verify this.`;
  } else if (level === 'level2') {
    dpText = 'correct to 1 decimal place';
    display = `Show that ${equation} has a root equal to ${formatDecimal(root, 1)} correct to 1 decimal place.`;
  } else {
    dpText = 'correct to 2 decimal places';
    display = `Show that ${equation} has a root equal to ${formatDecimal(root, 2)} correct to 2 decimal places.`;
  }
  
  // Build working steps
  working.push({
    type: 'setup',
    content: `Let f(x) = ${equationFunc}`
  });
  
  working.push({
    type: 'setup',
    content: level === 'level1' 
      ? `Test the bounds x = ${lowerBound} and x = ${upperBound}`
      : `For a root of ${level === 'level2' ? formatDecimal(root, 1) : formatDecimal(root, 2)}, test bounds ${formatDecimal(lowerBound, boundDP)} and ${formatDecimal(upperBound, boundDP)}`
  });
  
  // Calculate f(lower) - show working
  let lowerCalc: string;
  if (useCubic) {
    lowerCalc = `${formatDecimal(lowerBound, boundDP)}³ − ${a} × ${formatDecimal(lowerBound, boundDP)} − ${b}`;
  } else {
    lowerCalc = `${formatDecimal(lowerBound, boundDP)}² − ${a} × ${formatDecimal(lowerBound, boundDP)} − ${b}`;
  }
  working.push({
    type: 'substitution',
    content: `f(${formatDecimal(lowerBound, boundDP)}) = ${lowerCalc} = ${formatDecimal(fLower, 4)}`
  });
  
  // Calculate f(upper) - show working
  let upperCalc: string;
  if (useCubic) {
    upperCalc = `${formatDecimal(upperBound, boundDP)}³ − ${a} × ${formatDecimal(upperBound, boundDP)} − ${b}`;
  } else {
    upperCalc = `${formatDecimal(upperBound, boundDP)}² − ${a} × ${formatDecimal(upperBound, boundDP)} − ${b}`;
  }
  working.push({
    type: 'substitution',
    content: `f(${formatDecimal(upperBound, boundDP)}) = ${upperCalc} = ${formatDecimal(fUpper, 4)}`
  });
  
  // Sign change observation
  const lowerSign = fLower < 0 ? 'negative' : 'positive';
  const upperSign = fUpper < 0 ? 'negative' : 'positive';
  
  working.push({
    type: 'observation',
    content: `f(${formatDecimal(lowerBound, boundDP)}) is ${lowerSign} and f(${formatDecimal(upperBound, boundDP)}) is ${upperSign}`
  });
  
  working.push({
    type: 'conclusion',
    content: `There is a change of sign, so a root exists in the interval [${formatDecimal(lowerBound, boundDP)}, ${formatDecimal(upperBound, boundDP)}]`
  });
  
  if (level !== 'level1') {
    working.push({
      type: 'conclusion',
      content: `Therefore, the root is ${level === 'level2' ? formatDecimal(root, 1) : formatDecimal(root, 2)} ${dpText} ✓`
    });
  }
  
  // Build answer
  let answer: string;
  if (level === 'level1') {
    answer = `f(${lowerBound}) = ${formatDecimal(fLower, 2)} (${lowerSign}), f(${upperBound}) = ${formatDecimal(fUpper, 2)} (${upperSign}). Change of sign ∴ root exists between ${lowerBound} and ${upperBound}.`;
  } else {
    answer = `Change of sign between ${formatDecimal(lowerBound, boundDP)} and ${formatDecimal(upperBound, boundDP)} ∴ root = ${level === 'level2' ? formatDecimal(root, 1) : formatDecimal(root, 2)} (${dpText})`;
  }

  return {
    display,
    answer,
    working,
    values: {
      equation,
      equationFunc,
      equationType,
      root,
      lowerBound,
      upperBound,
      fLower,
      fUpper,
      a,
      b
    },
    difficulty: level
  };
};

// Duplicate prevention for worksheets - Verification
const generateUniqueVerificationQuestion = (
  level: DifficultyLevel,
  usedKeys: Set<string>
): VerificationQuestion => {
  let attempts = 0;
  let q: VerificationQuestion;
  let uniqueKey: string;
  
  do {
    q = generateVerificationQuestion(level);
    uniqueKey = `ver-${q.values.equationType}-${q.values.a}-${q.values.b}`;
    if (++attempts > 100) break;
  } while (usedKeys.has(uniqueKey));
  
  usedKeys.add(uniqueKey);
  return q;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function IterationTool() {
  const navigate = useNavigate();
  
  // Tool & Mode State
  const [currentTool, setCurrentTool] = useState<ToolType>('numerical');
  const [mode, setMode] = useState<Mode>('whiteboard');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('level1');

  // Tool-specific options - Numerical
  const [showCalculatorSteps, setShowCalculatorSteps] = useState<boolean>(false);
  const [formulaType, setFormulaType] = useState<FormulaType>('mixed');
  
  // Tool-specific options - Rearranging
  const [targetFormulaVisible, setTargetFormulaVisible] = useState<boolean>(true);
  const [rearrangingAnswerType, setRearrangingAnswerType] = useState<AnswerType>('root');

  // Questions (shared between Whiteboard & Worked Example)
  const [currentQuestion, setCurrentQuestion] = useState<QuestionType | null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);

  // Worksheet State
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [worksheet, setWorksheet] = useState<QuestionType[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState<boolean>(false);
  const [isDifferentiated, setIsDifferentiated] = useState<boolean>(false);
  const [numColumns, setNumColumns] = useState<number>(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState<number>(1);

  // UI State
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Font sizes for worksheet
  const fontSizes: string[] = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];

  // ============================================================================
  // COLOR SCHEME HELPERS
  // ============================================================================

  const getQuestionBg = (): string => {
    if (colorScheme === 'blue') return '#D1E7F8';
    if (colorScheme === 'pink') return '#F8D1E7';
    if (colorScheme === 'yellow') return '#F8F4D1';
    return '#ffffff';
  };

  const getStepBg = (): string => {
    if (colorScheme === 'blue') return '#B3D9F2';
    if (colorScheme === 'pink') return '#F2B3D9';
    if (colorScheme === 'yellow') return '#F2EBB3';
    return '#f3f4f6';
  };

  const getWhiteboardWorkingBg = (): string => getStepBg();
  const getFinalAnswerBg = (): string => getStepBg();

  // ============================================================================
  // DIFFICULTY BUTTON STYLING
  // ============================================================================

  const getDifficultyButtonClass = (idx: number, isActive: boolean): string => {
    if (isActive) {
      return idx === 0 ? 'bg-green-600 text-white' 
           : idx === 1 ? 'bg-yellow-600 text-white' 
           : 'bg-red-600 text-white';
    }
    return idx === 0 ? 'bg-white text-green-600 border-2 border-green-600' 
         : idx === 1 ? 'bg-white text-yellow-600 border-2 border-yellow-600' 
         : 'bg-white text-red-600 border-2 border-red-600';
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleNewQuestion = (): void => {
    if (currentTool === 'numerical') {
      const q = generateNumericalQuestion(difficulty, showCalculatorSteps, formulaType);
      setCurrentQuestion(q);
    } else if (currentTool === 'rearranging') {
      const q = generateRearrangingQuestion(difficulty, targetFormulaVisible, rearrangingAnswerType);
      setCurrentQuestion(q);
    } else if (currentTool === 'verification') {
      const q = generateVerificationQuestion(difficulty);
      setCurrentQuestion(q);
    }
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = (): void => {
    const usedKeys = new Set<string>();
    const questions: QuestionType[] = [];

    if (currentTool === 'numerical') {
      if (isDifferentiated) {
        const levels: DifficultyLevel[] = ['level1', 'level2', 'level3'];
        levels.forEach((lvl: DifficultyLevel) => {
          for (let i = 0; i < numQuestions; i++) {
            questions.push(generateUniqueNumericalQuestion(lvl, usedKeys, showCalculatorSteps, formulaType));
          }
        });
      } else {
        for (let i = 0; i < numQuestions; i++) {
          questions.push(generateUniqueNumericalQuestion(difficulty, usedKeys, showCalculatorSteps, formulaType));
        }
      }
    } else if (currentTool === 'rearranging') {
      if (isDifferentiated) {
        const levels: DifficultyLevel[] = ['level1', 'level2', 'level3'];
        levels.forEach((lvl: DifficultyLevel) => {
          for (let i = 0; i < numQuestions; i++) {
            questions.push(generateUniqueRearrangingQuestion(lvl, usedKeys, targetFormulaVisible, rearrangingAnswerType));
          }
        });
      } else {
        for (let i = 0; i < numQuestions; i++) {
          questions.push(generateUniqueRearrangingQuestion(difficulty, usedKeys, targetFormulaVisible, rearrangingAnswerType));
        }
      }
    } else if (currentTool === 'verification') {
      if (isDifferentiated) {
        const levels: DifficultyLevel[] = ['level1', 'level2', 'level3'];
        levels.forEach((lvl: DifficultyLevel) => {
          for (let i = 0; i < numQuestions; i++) {
            questions.push(generateUniqueVerificationQuestion(lvl, usedKeys));
          }
        });
      } else {
        for (let i = 0; i < numQuestions; i++) {
          questions.push(generateUniqueVerificationQuestion(difficulty, usedKeys));
        }
      }
    }

    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  // Generate initial question on mount and when difficulty/tool changes
  useEffect(() => {
    if (mode !== 'worksheet') {
      handleNewQuestion();
    }
    // Clear worksheet when switching tools
    setWorksheet([]);
  }, [difficulty, currentTool]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderControlBar = (): JSX.Element => {
    if (mode === 'worksheet') {
      return renderWorksheetControlBar();
    }
    return renderStandardControlBar();
  };

  const renderStandardControlBar = (): JSX.Element => (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Difficulty Buttons */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: '#000000' }}>Difficulty:</span>
            <div className="flex gap-2">
              {(['level1', 'level2', 'level3'] as const).map((lvl: DifficultyLevel, idx: number) => (
                <button
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                    getDifficultyButtonClass(idx, difficulty === lvl)}
                >
                  Level {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* NUMERICAL TOOL OPTIONS */}
          {currentTool === 'numerical' && (
            <>
              {/* Formula Type Dropdown */}
              <select
                value={formulaType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormulaType(e.target.value as FormulaType)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold bg-white"
              >
                <option value="mixed">Mixed</option>
                <option value="quadratic">Quadratic (√)</option>
                <option value="cubic">Cubic (∛)</option>
                <option value="fractional">Fractional</option>
              </select>

              {/* Calculator Steps Checkbox - Only show in Worked Example mode */}
              {mode === 'single' && (
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCalculatorSteps}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowCalculatorSteps(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-semibold" style={{ color: '#000000' }}>Show Calculator Steps</span>
                  </label>
                </div>
              )}
            </>
          )}

          {/* REARRANGING TOOL OPTIONS */}
          {currentTool === 'rearranging' && (
            <>
              <div className="flex flex-col gap-0">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetFormulaVisible}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetFormulaVisible(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-semibold leading-tight text-center" style={{ color: '#000000' }}>
                    Target<br/>Formula
                  </span>
                </label>
              </div>
              <select
                value={rearrangingAnswerType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRearrangingAnswerType(e.target.value as AnswerType)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold bg-white"
              >
                <option value="first3">First 3 terms</option>
                <option value="root">Root to 2 d.p.</option>
              </select>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleNewQuestion}
            className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52"
          >
            <RefreshCw size={18} /> New Question
          </button>
          <button
            onClick={() => mode === 'whiteboard' ? setShowWhiteboardAnswer(true) : setShowAnswer(true)}
            className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52"
          >
            <Eye size={18} /> Show Answer
          </button>
        </div>
      </div>
    </div>
  );

  const renderWorksheetControlBar = (): JSX.Element => (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 space-y-4">
      {/* Line 1: Questions + Differentiated */}
      <div className="flex justify-center items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-lg font-semibold" style={{ color: '#000000' }}>Questions per level:</label>
          <input
            type="number"
            min="1"
            max="20"
            value={numQuestions}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
            className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="diff"
            checked={isDifferentiated}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsDifferentiated(e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="diff" className="text-lg font-semibold" style={{ color: '#000000' }}>Differentiated</label>
        </div>
      </div>

      {/* Line 2: Difficulty + Columns (hidden if differentiated) */}
      {!isDifferentiated && (
        <div className="flex justify-center items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: '#000000' }}>Difficulty:</span>
            <div className="flex gap-2">
              {(['level1', 'level2', 'level3'] as const).map((lvl: DifficultyLevel, idx: number) => (
                <button
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                    getDifficultyButtonClass(idx, difficulty === lvl)}
                >
                  Level {idx + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold" style={{ color: '#000000' }}>Columns:</label>
            <input
              type="number"
              min="1"
              max="4"
              value={numColumns}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold"
            />
          </div>
        </div>
      )}

      {/* Line 3: Tool-specific options */}
      {currentTool === 'numerical' && (
        <div className="flex justify-center items-center gap-6">
          <select
            value={formulaType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormulaType(e.target.value as FormulaType)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold bg-white"
          >
            <option value="mixed">Mixed</option>
            <option value="quadratic">Quadratic (√)</option>
            <option value="cubic">Cubic (∛)</option>
            <option value="fractional">Fractional</option>
          </select>
        </div>
      )}

      {currentTool === 'rearranging' && (
        <div className="flex justify-center items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={targetFormulaVisible}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetFormulaVisible(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-semibold leading-tight text-center" style={{ color: '#000000' }}>
              Target<br/>Formula
            </span>
          </label>
          <select
            value={rearrangingAnswerType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRearrangingAnswerType(e.target.value as AnswerType)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold bg-white"
          >
            <option value="first3">First 3 terms</option>
            <option value="root">Root to 2 d.p.</option>
          </select>
        </div>
      )}

      {/* Line 4: Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleGenerateWorksheet}
          className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-800"
        >
          <RefreshCw size={20} /> Generate Worksheet
        </button>
        {worksheet.length > 0 && (
          <button
            onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)}
            className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-800"
          >
            <Eye size={20} /> {showWorksheetAnswers ? 'Hide Answers' : 'Show Answers'}
          </button>
        )}
      </div>
    </div>
  );

  const renderWhiteboardMode = (): JSX.Element | null => {
    if (!currentQuestion) return null;

    return (
      <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
        <div className="text-center">
          <span className="text-4xl font-bold" style={{ color: '#000000' }}>
            {currentQuestion.display}
          </span>
          {showWhiteboardAnswer && (
            <div className="mt-4">
              <span className="text-4xl font-bold" style={{ color: '#166534' }}>
                {currentQuestion.answer}
              </span>
            </div>
          )}
        </div>
        <div 
          className="rounded-xl mt-8" 
          style={{ height: '500px', backgroundColor: getWhiteboardWorkingBg() }}
        />
      </div>
    );
  };

  const renderWorkedExampleMode = (): JSX.Element | null => {
    if (!currentQuestion) return null;

    return (
      <div className="overflow-y-auto" style={{ height: '120vh' }}>
        <div className="rounded-xl shadow-lg p-8 w-full" style={{ backgroundColor: getQuestionBg() }}>
          {/* Question */}
          <div className="text-center">
            <span className="text-4xl font-bold" style={{ color: '#000000' }}>
              {currentQuestion.display}
            </span>
          </div>

          {showAnswer && (
            <>
              {/* Working Steps */}
              <div className="space-y-4 mt-8">
                {currentQuestion.working.map((step: WorkingStep, i: number) => (
                  <div key={i} className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                    <h4 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>
                      {step.type === 'tip' ? 'Calculator Tip' : `Step ${i + 1}`}
                    </h4>
                    <p className="text-3xl" style={{ color: '#000000' }}>{step.content}</p>
                  </div>
                ))}
              </div>

              {/* Final Answer */}
              <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: getFinalAnswerBg() }}>
                <span className="text-5xl font-bold" style={{ color: '#166534' }}>
                  {currentQuestion.answer}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderWorksheetMode = (): JSX.Element => {
    if (worksheet.length === 0) {
      return (
        <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: getQuestionBg() }}>
          <p className="text-2xl" style={{ color: '#000000' }}>
            Click "Generate Worksheet" to create questions
          </p>
        </div>
      );
    }

    const colorConfig: Record<string, { bg: string; border: string; text: string; questionBg: string }> = {
      level1: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', questionBg: 'bg-green-100' },
      level2: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', questionBg: 'bg-yellow-100' },
      level3: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', questionBg: 'bg-red-100' }
    };

    const currentFontSize = fontSizes[worksheetFontSize];

    if (isDifferentiated) {
      // Differentiated layout - 3 columns, one for each level
      const levels = ['level1', 'level2', 'level3'];
      const levelNames = ['Level 1', 'Level 2', 'Level 3'];

      return (
        <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQuestionBg() }}>
          {/* Font Size Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-1">
            <button
              onClick={() => setWorksheetFontSize(Math.max(0, worksheetFontSize - 1))}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                worksheetFontSize > 0 
                  ? 'bg-blue-900 text-white hover:bg-blue-800' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={worksheetFontSize === 0}
            >
              <ChevronDown size={20} />
            </button>
            <button
              onClick={() => setWorksheetFontSize(Math.min(fontSizes.length - 1, worksheetFontSize + 1))}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                worksheetFontSize < fontSizes.length - 1 
                  ? 'bg-blue-900 text-white hover:bg-blue-800' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={worksheetFontSize === fontSizes.length - 1}
            >
              <ChevronUp size={20} />
            </button>
          </div>

          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>
            {toolNames[currentTool]} - Worksheet
          </h2>

          {/* 3 Column Grid - One column per level */}
          <div className="grid grid-cols-3 gap-4">
            {levels.map((level: string, levelIdx: number) => {
              const levelQuestions = worksheet.filter((q: QuestionType) => q.difficulty === level);
              const config = colorConfig[level];

              return (
                <div key={level} className={`p-4 rounded-xl border-2 ${config.bg} ${config.border}`}>
                  <h3 className={`text-xl font-bold mb-4 text-center ${config.text}`}>{levelNames[levelIdx]}</h3>
                  <div className="space-y-3">
                    {levelQuestions.map((q: QuestionType, idx: number) => (
                      <div key={idx} className={`${config.questionBg} rounded-lg p-3`}>
                        <p className={`${currentFontSize} font-semibold`} style={{ color: '#000000' }}>
                          {idx + 1}. {q.display}
                        </p>
                        {showWorksheetAnswers && (
                          <p className={`${currentFontSize} mt-2`} style={{ color: '#059669' }}>
                            {q.answer}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Standard layout with columns
    return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQuestionBg() }}>
        {/* Font Size Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <button
            onClick={() => setWorksheetFontSize(Math.max(0, worksheetFontSize - 1))}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              worksheetFontSize > 0 
                ? 'bg-blue-900 text-white hover:bg-blue-800' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={worksheetFontSize === 0}
          >
            <ChevronDown size={20} />
          </button>
          <button
            onClick={() => setWorksheetFontSize(Math.min(fontSizes.length - 1, worksheetFontSize + 1))}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              worksheetFontSize < fontSizes.length - 1 
                ? 'bg-blue-900 text-white hover:bg-blue-800' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={worksheetFontSize === fontSizes.length - 1}
          >
            <ChevronUp size={20} />
          </button>
        </div>

        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>
          {toolNames[currentTool]} - Worksheet
        </h2>

        <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}>
          {worksheet.map((q: QuestionType, idx: number) => (
            <div key={idx} className="bg-white rounded-lg p-4" style={{ backgroundColor: getStepBg() }}>
              <p className={`${currentFontSize} font-semibold`} style={{ color: '#000000' }}>
                {idx + 1}. {q.display}
              </p>
              {showWorksheetAnswers && (
                <p className={`${currentFontSize} mt-2`} style={{ color: '#059669' }}>
                  {q.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <>
      {/* Header Bar */}
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          {/* Home Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
          >
            <Home size={24} />
            <span className="font-semibold text-lg">Home</span>
          </button>

          {/* Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border-2 border-gray-200 overflow-hidden z-50">
                <div className="py-2">
                  <div className="px-6 py-2 font-bold text-gray-700 text-sm uppercase tracking-wide">Color Schemes</div>
                  {(['default', 'blue', 'pink', 'yellow'] as const).map((scheme: ColorScheme) => (
                    <button
                      key={scheme}
                      onClick={() => { setColorScheme(scheme); setIsMenuOpen(false); }}
                      className={'w-full text-left px-6 py-3 font-semibold transition-colors ' +
                        (colorScheme === scheme ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}
                    >
                      {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f3f0' }}>
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>
            Iteration
          </h1>

          {/* Divider */}
          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }}></div>
          </div>

          {/* Tool Selectors */}
          <div className="flex justify-center gap-4 mb-6">
            {(['numerical', 'rearranging', 'verification'] as const).map((tool: ToolType) => (
              <button
                key={tool}
                onClick={() => setCurrentTool(tool)}
                className={'px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ' +
                  (currentTool === tool
                    ? 'bg-blue-900 text-white'
                    : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900')}
              >
                {toolNames[tool]}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }}></div>
          </div>

          {/* Mode Selectors */}
          <div className="flex justify-center gap-4 mb-8">
            {(['whiteboard', 'single', 'worksheet'] as const).map((m: Mode) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={'px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ' +
                  (mode === m
                    ? 'bg-blue-900 text-white'
                    : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900')}
              >
                {m === 'whiteboard' ? 'Whiteboard' : m === 'single' ? 'Worked Example' : 'Worksheet'}
              </button>
            ))}
          </div>

          {/* Control Bar */}
          {renderControlBar()}

          {/* Mode Content */}
          {mode === 'whiteboard' && renderWhiteboardMode()}
          {mode === 'single' && renderWorkedExampleMode()}
          {mode === 'worksheet' && renderWorksheetMode()}
        </div>
      </div>
    </>
  );
}
