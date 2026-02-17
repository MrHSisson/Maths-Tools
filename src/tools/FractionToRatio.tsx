import { useState, useEffect } from 'react';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// v4.0 TYPESCRIPT-STRICT SHELL
// CUSTOMIZE: TOOL_CONFIG, ToolType, generateQuestion(), getQuestionUniqueKey(), renderDiagram()

const TOOL_CONFIG = {
  pageTitle: 'Fractions ⇔ Ratios',
  tools: {
    formingRatios: { 
      name: 'Forming Ratios', 
      useSubstantialBoxes: true,
      variables: [
        { key: 'threeWay', label: '3-Way Ratio', defaultValue: false },
        { key: 'simplestForm', label: 'Simplest Form', defaultValue: false },
      ],
      dropdown: null,
      difficultySettings: null,
    },
    fractionToRatio: {
      name: 'Fraction to Ratio',
      useSubstantialBoxes: true,
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: {
          variables: [],
          dropdown: undefined,
        },
        level2: {
          variables: [
            { key: 'findCommonDenominators', label: 'Different Denominators', defaultValue: false },
          ],
          dropdown: undefined,
        },
        level3: {
          variables: [],
          dropdown: {
            key: 'given',
            label: 'Given',
            options: [
              { value: 'partA', label: 'Part A' },
              { value: 'partB', label: 'Part B' },
              { value: 'total', label: 'Total' },
              { value: 'mixed', label: 'Mixed' },
            ],
            defaultValue: 'mixed',
          },
        },
      },
    },
    ratioToFraction: {
      name: 'Ratio to Fraction',
      useSubstantialBoxes: true,
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: {
          variables: [],
          dropdown: undefined,
        },
        level2: {
          variables: [
            { key: 'simplestForm', label: 'Simplest Form', defaultValue: true },
          ],
          dropdown: {
            key: 'target',
            label: 'Target',
            options: [
              { value: 'singlePart', label: 'Single' },
              { value: 'composite', label: 'Composite' },
              { value: 'mixed', label: 'Mixed' },
            ],
            defaultValue: 'mixed',
          },
        },
        level3: {
          variables: [],
          dropdown: undefined,
        },
      },
    },
  },
  useGraphicalLayout: false,
};

// TYPE DEFINITIONS
type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';
type DifficultyLevel = 'level1' | 'level2' | 'level3';
type Mode = 'whiteboard' | 'single' | 'worksheet';
type ToolType = 'formingRatios' | 'fractionToRatio' | 'ratioToFraction';

type WorkingStep = {
  type: string;
  content: string;
};

type Question = {
  display: string;
  answer: string;
  working: WorkingStep[];
  values: Record<string, any>;
  difficulty: string;
};

type VariableConfig = {
  key: string;
  label: string;
  defaultValue: boolean;
};

type DropdownOption = {
  value: string;
  label: string;
};

type DropdownConfig = {
  key: string;
  label: string;
  options: DropdownOption[];
  defaultValue: string;
};

type DifficultySettings = {
  dropdown?: DropdownConfig;
  variables?: VariableConfig[];
};

type ToolSettings = {
  name: string;
  useSubstantialBoxes: boolean;
  variables: VariableConfig[];
  dropdown: DropdownConfig | null;
  difficultySettings: Record<string, DifficultySettings> | null;
};

// HELPER FUNCTIONS
const gcd = (a: number, b: number): number => {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
};

const gcdThree = (a: number, b: number, c: number): number => {
  return gcd(gcd(a, b), c);
};

const simplifyRatio = (parts: number[]): number[] => {
  if (parts.length === 2) {
    const d = gcd(parts[0], parts[1]);
    return [parts[0] / d, parts[1] / d];
  } else {
    const d = gcdThree(parts[0], parts[1], parts[2]);
    return [parts[0] / d, parts[1] / d, parts[2] / d];
  }
};

const formatRatio = (parts: number[]): string => {
  return parts.join(' : ');
};

const generateSimplestFraction = (): { num: number; den: number } => {
  let num = 0, den = 0;
  let isValid = false;
  
  while (!isValid) {
    den = Math.floor(Math.random() * 10) + 3; // 3-12
    num = Math.floor(Math.random() * (den - 1)) + 1; // 1 to den-1
    
    const g = gcd(num, den);
    const simplifiedNum = num / g;
    const simplifiedDen = den / g;
    
    // Avoid fractions equal to 1/2
    if (simplifiedNum === 1 && simplifiedDen === 2) continue;
    
    // Use the simplified form
    num = simplifiedNum;
    den = simplifiedDen;
    isValid = true;
  }
  
  return { num, den };
};

const lcm = (a: number, b: number): number => {
  return Math.abs(a * b) / gcd(a, b);
};

const convertToCommonDenominator = (
  frac1: { num: number; den: number },
  frac2: { num: number; den: number }
): { 
  newNum1: number; 
  newNum2: number; 
  lcd: number; 
  steps: string[] 
} => {
  const lcd = lcm(frac1.den, frac2.den);
  const mult1 = lcd / frac1.den;
  const mult2 = lcd / frac2.den;
  const newNum1 = frac1.num * mult1;
  const newNum2 = frac2.num * mult2;
  
  const steps: string[] = [
    `LCD of ${frac1.den} and ${frac2.den} = ${lcd}`,
    `<sup>${frac1.num}</sup>/<sub>${frac1.den}</sub> = <sup>(${frac1.num} × ${mult1})</sup>/<sub>(${frac1.den} × ${mult1})</sub> = <sup>${newNum1}</sup>/<sub>${lcd}</sub>`,
    `<sup>${frac2.num}</sup>/<sub>${frac2.den}</sub> = <sup>(${frac2.num} × ${mult2})</sup>/<sub>(${frac2.den} × ${mult2})</sub> = <sup>${newNum2}</sup>/<sub>${lcd}</sub>`,
  ];
  
  return { newNum1, newNum2, lcd, steps };
};



const getSimplificationSteps = (parts: number[]): string[] => {
  const steps: string[] = [];
  let current = [...parts];
  
  while (true) {
    const primes = [2, 3, 5, 7, 11, 13];
    let foundFactor = false;
    
    for (const prime of primes) {
      const allDivisible = current.every((n: number) => n % prime === 0);
      if (allDivisible) {
        const next = current.map((n: number) => n / prime);
        steps.push(`Divide by ${prime}: ${formatRatio(current)} → ${formatRatio(next)}`);
        current = next;
        foundFactor = true;
        break;
      }
    }
    
    if (!foundFactor) break;
  }
  
  return steps;
};

// QUESTION GENERATION
const generateQuestion = (
  tool: ToolType,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string
): Question => {
  let display = '';
  let answer = '';
  let working: WorkingStep[] = [];
  let values: Record<string, any> = {};
  
  // RATIO TO FRACTION TOOL
  if (tool === 'ratioToFraction') {
    // LEVEL 1: BASIC PART-TO-WHOLE
    if (level === 'level1') {
      const contextsL1 = [
        { scenario: 'beads', parts: ['red', 'blue'] },
        { scenario: 'students', parts: ['boys', 'girls'] },
        { scenario: 'games', parts: ['wins', 'losses'] },
        { scenario: 'marbles', parts: ['red', 'blue'] },
        { scenario: 'counters', parts: ['green', 'yellow'] },
      ];
      
      const context = contextsL1[Math.floor(Math.random() * contextsL1.length)];
      const a = Math.floor(Math.random() * 11) + 2; // 2-12
      const b = Math.floor(Math.random() * 11) + 2; // 2-12
      const total = a + b;
      const whichPart = Math.random() < 0.5 ? 0 : 1; // 0 = part A, 1 = part B
      
      const numerator = whichPart === 0 ? a : b;
      const gcdValue = gcd(numerator, total);
      const simplifiedNum = numerator / gcdValue;
      const simplifiedDen = total / gcdValue;
      
      const partName = context.parts[whichPart];
      const questionStyle = Math.floor(Math.random() * 3);
      
      if (questionStyle === 0) {
        display = `The ratio of ${context.parts[0]} to ${context.parts[1]} ${context.scenario} is ${a}:${b}. What fraction of the ${context.scenario} are ${partName}?`;
      } else if (questionStyle === 1) {
        display = `The ratio of ${context.parts[0]} to ${context.parts[1]} is ${a}:${b}. Find the fraction of ${context.scenario} that are ${partName}.`;
      } else {
        display = `${context.parts[0]} to ${context.parts[1]} is ${a}:${b}. Write ${partName} as a fraction of the total.`;
      }
      
      answer = `<sup>${simplifiedNum}</sup>/<sub>${simplifiedDen}</sub>`;
      
      working = [
        { type: 'step', content: `Total parts = ${a} + ${b} = ${total}` },
        { type: 'step', content: `${partName.charAt(0).toUpperCase() + partName.slice(1)} = <sup>${numerator}</sup>/<sub>${total}</sub> of the total` },
        { type: 'step', content: simplifiedNum === numerator ? `Answer: <sup>${simplifiedNum}</sup>/<sub>${simplifiedDen}</sub> (already in simplest form)` : `Simplified: <sup>${numerator}</sup>/<sub>${total}</sub> = <sup>${simplifiedNum}</sup>/<sub>${simplifiedDen}</sub>` },
      ];
      
      values = { a, b, whichPart };
    }
    
    // LEVEL 2: 3-WAY RATIOS & COMPOSITE PARTS
    else if (level === 'level2') {
      const contextsL2 = [
        { 
          scenario: 'people playing sports', 
          parts: ['Football', 'Squash', 'Tennis'],
          compositeLabel: 'racket sports',
          compositeIndices: [1, 2],
        },
        { 
          scenario: 'people playing sports', 
          parts: ['Football', 'Rugby', 'Tennis'],
          compositeLabel: 'team sports',
          compositeIndices: [0, 1],
        },
        { 
          scenario: 'ingredients', 
          parts: ['Flour', 'Milk', 'Eggs'],
          compositeLabel: 'wet ingredients',
          compositeIndices: [1, 2],
        },
        { 
          scenario: 'transport methods', 
          parts: ['Car', 'Bus', 'Bicycle'],
          compositeLabel: 'public transport or cycling',
          compositeIndices: [1, 2],
        },
        { 
          scenario: 'people playing sports', 
          parts: ['Swimming', 'Football', 'Tennis'],
          compositeLabel: 'ball sports',
          compositeIndices: [1, 2],
        },
      ];
      
      const context = contextsL2[Math.floor(Math.random() * contextsL2.length)];
      const a = Math.floor(Math.random() * 10) + 1; // 1-10
      const b = Math.floor(Math.random() * 10) + 1;
      const c = Math.floor(Math.random() * 10) + 1;
      const total = a + b + c;
      
      const simplestFormEnabled = variables.simplestForm !== false; // default true
      
      let actualTarget = dropdownValue;
      if (dropdownValue === 'mixed') {
        actualTarget = Math.random() < 0.5 ? 'singlePart' : 'composite';
      }
      
      let numerator = 0;
      let targetDescription = '';
      const isComposite = actualTarget === 'composite';
      
      if (actualTarget === 'singlePart') {
        const whichPart = Math.floor(Math.random() * 3); // 0, 1, or 2
        numerator = [a, b, c][whichPart];
        const partName = context.parts[whichPart];
        
        const questionStyle = Math.floor(Math.random() * 3);
        if (questionStyle === 0) {
          display = `The ratio of ${context.parts[0]}:${context.parts[1]}:${context.parts[2]} is ${a}:${b}:${c}. What fraction of ${context.scenario} are ${partName}?`;
        } else if (questionStyle === 1) {
          display = `The ratio of ${context.parts[0]}:${context.parts[1]}:${context.parts[2]} is ${a}:${b}:${c}. Find the fraction that are ${partName}.`;
        } else {
          display = `${context.parts[0]}:${context.parts[1]}:${context.parts[2]} is ${a}:${b}:${c}. Write ${partName} as a fraction of the total.`;
        }
        
        targetDescription = partName;
        values = { a, b, c, targetType: actualTarget, isComposite, whichPart };
      } else {
        // Composite
        const indices = context.compositeIndices;
        const val1 = [a, b, c][indices[0]];
        const val2 = [a, b, c][indices[1]];
        numerator = val1 + val2;
        
        const useNatural = Math.random() < 0.5;
        
        if (useNatural) {
          const questionStyle = Math.floor(Math.random() * 2);
          if (questionStyle === 0) {
            display = `The ratio of ${context.parts[0]}:${context.parts[1]}:${context.parts[2]} is ${a}:${b}:${c}. What fraction of ${context.scenario} are ${context.compositeLabel}?`;
          } else {
            display = `The ratio of ${context.parts[0]}:${context.parts[1]}:${context.parts[2]} is ${a}:${b}:${c}. Find the fraction that are ${context.compositeLabel}.`;
          }
          targetDescription = context.compositeLabel;
        } else {
          const questionStyle = Math.floor(Math.random() * 2);
          if (questionStyle === 0) {
            display = `The ratio of ${context.parts[0]}:${context.parts[1]}:${context.parts[2]} is ${a}:${b}:${c}. What fraction are ${context.parts[indices[0]]} or ${context.parts[indices[1]]}?`;
          } else {
            display = `The ratio of ${context.parts[0]}:${context.parts[1]}:${context.parts[2]} is ${a}:${b}:${c}. Find the fraction that are ${context.parts[indices[0]]} or ${context.parts[indices[1]]}.`;
          }
          targetDescription = `${context.parts[indices[0]]} or ${context.parts[indices[1]]}`;
        }
        
        values = { a, b, c, targetType: actualTarget, isComposite, useNatural, compositeIndices: indices };
      }
      
      let simplifiedNum = numerator;
      let simplifiedDen = total;
      
      if (simplestFormEnabled) {
        const gcdValue = gcd(numerator, total);
        simplifiedNum = numerator / gcdValue;
        simplifiedDen = total / gcdValue;
      }
      
      answer = `<sup>${simplifiedNum}</sup>/<sub>${simplifiedDen}</sub>`;
      
      if (isComposite) {
        const indices = context.compositeIndices;
        const val1 = [a, b, c][indices[0]];
        const val2 = [a, b, c][indices[1]];
        
        working = [
          { type: 'step', content: `Total parts = ${a} + ${b} + ${c} = ${total}` },
          { type: 'step', content: `${targetDescription.charAt(0).toUpperCase() + targetDescription.slice(1)} = ${context.parts[indices[0]]} + ${context.parts[indices[1]]} = ${val1} + ${val2} = ${numerator}` },
          { type: 'step', content: `Fraction = <sup>${numerator}</sup>/<sub>${total}</sub>` },
        ];
        
        if (simplestFormEnabled && simplifiedNum !== numerator) {
          working.push({ type: 'step', content: `Simplified: <sup>${simplifiedNum}</sup>/<sub>${simplifiedDen}</sub>` });
        } else if (simplestFormEnabled) {
          working.push({ type: 'step', content: `<sup>${simplifiedNum}</sup>/<sub>${simplifiedDen}</sub> (already in simplest form)` });
        }
      } else {
        working = [
          { type: 'step', content: `Total parts = ${a} + ${b} + ${c} = ${total}` },
          { type: 'step', content: `${targetDescription.charAt(0).toUpperCase() + targetDescription.slice(1)} = <sup>${numerator}</sup>/<sub>${total}</sub> of the total` },
        ];
        
        if (simplestFormEnabled && simplifiedNum !== numerator) {
          working.push({ type: 'step', content: `Simplified: <sup>${simplifiedNum}</sup>/<sub>${simplifiedDen}</sub>` });
        } else if (simplestFormEnabled) {
          working.push({ type: 'step', content: `<sup>${simplifiedNum}</sup>/<sub>${simplifiedDen}</sub> (already in simplest form)` });
        }
      }
    }
    
    // LEVEL 3: PART-TO-PART COMPARISON
    else {
      const contextsL3 = [
        { item1: 'apples', item2: 'oranges' },
        { item1: 'bananas', item2: 'grapes' },
        { item1: 'pound coins', item2: 'fifty pence coins' },
        { item1: 'ten pound notes', item2: 'five pound notes' },
        { item1: 'Year 7s', item2: 'Year 8s' },
        { item1: 'adults', item2: 'children' },
      ];
      
      const context = contextsL3[Math.floor(Math.random() * contextsL3.length)];
      const a = Math.floor(Math.random() * 11) + 2; // 2-12
      const b = Math.floor(Math.random() * 11) + 2;
      const orderReversed = Math.random() < 0.5;
      
      let numerator = 0, denominator = 0;
      let numeratorName = '', denominatorName = '';
      
      if (orderReversed) {
        numerator = b;
        denominator = a;
        numeratorName = context.item2;
        denominatorName = context.item1;
      } else {
        numerator = a;
        denominator = b;
        numeratorName = context.item1;
        denominatorName = context.item2;
      }
      
      const gcdValue = gcd(numerator, denominator);
      const simplifiedNum = numerator / gcdValue;
      const simplifiedDen = denominator / gcdValue;
      
      const questionStyle = Math.floor(Math.random() * 2);
      if (questionStyle === 0) {
        display = `The ratio of ${context.item1} to ${context.item2} is ${a}:${b}. Write the amount of ${numeratorName} as a fraction of the amount of ${denominatorName}.`;
      } else {
        display = `${context.item1} to ${context.item2} is ${a}:${b}. Find ${numeratorName} as a fraction of ${denominatorName}.`;
      }
      
      answer = `<sup>${simplifiedNum}</sup>/<sub>${simplifiedDen}</sub>`;
      
      const item1Cap = context.item1.charAt(0).toUpperCase() + context.item1.slice(1);
      const item2Cap = context.item2.charAt(0).toUpperCase() + context.item2.slice(1);
      
      working = [
        { type: 'step', content: `Identify parts — ${item1Cap} = ${a}, ${item2Cap} = ${b}` },
        { type: 'step', content: `Method — The question asks for ${numeratorName} "as a fraction of" ${denominatorName}, so ${denominatorName} is our denominator` },
        { type: 'step', content: `Calculation — Fraction = <sup>${numerator}</sup>/<sub>${denominator}</sub>` },
        { type: 'step', content: `Watch Out — We don't add ${a} + ${b} = ${a + b} because we're comparing ${context.item1} TO ${context.item2} directly, not finding a fraction of the total` },
      ];
      
      if (simplifiedNum !== numerator) {
        working.push({ type: 'step', content: `Simplified: <sup>${simplifiedNum}</sup>/<sub>${simplifiedDen}</sub>` });
        working.push({ type: 'step', content: `Answer — The number of ${numeratorName} is <sup>${simplifiedNum}</sup>/<sub>${simplifiedDen}</sub> of the number of ${denominatorName}` });
      } else {
        working.push({ type: 'step', content: `Answer — The number of ${numeratorName} is <sup>${simplifiedNum}</sup>/<sub>${simplifiedDen}</sub> of the number of ${denominatorName}` });
      }
      
      values = { a, b, orderReversed };
    }
    
    return {
      display,
      answer,
      working,
      values: { ...values, tool },
      difficulty: level,
    };
  }
  
  // FRACTION TO RATIO TOOL
  if (tool === 'fractionToRatio') {
    // LEVEL 1: PART-WHOLE TO PART-PART
    if (level === 'level1') {
      const contextsL1 = [
        { item: 'beads', colors: ['Red', 'Blue'] },
        { item: 'beads', colors: ['Green', 'Yellow'] },
        { item: 'sweets', colors: ['Purple', 'Orange'] },
        { item: 'marbles', colors: ['Pink', 'White'] },
        { item: 'counters', colors: ['Black', 'Silver'] },
        { item: 'balls', colors: ['Red', 'Blue'] },
        { item: 'buttons', colors: ['Green', 'Yellow'] },
      ];
      
      const context = contextsL1[Math.floor(Math.random() * contextsL1.length)];
      const { num, den } = generateSimplestFraction();
      const partA = num;
      const partB = den - num;
      const orderReversed = Math.random() < 0.5;
      
      const colorA = context.colors[0];
      const colorB = context.colors[1];
      
      const questionStyle = Math.random() < 0.5 ? 'written' : 'colon';
      
      if (orderReversed) {
        if (questionStyle === 'written') {
          display = `In a bag of ${context.item}, <sup>${num}</sup>/<sub>${den}</sub> are ${colorA} and the rest are ${colorB}. Write the ratio of ${colorB} to ${colorA}.`;
        } else {
          display = `In a bag of ${context.item}, <sup>${num}</sup>/<sub>${den}</sub> are ${colorA} and the rest are ${colorB}. Find ${colorB}:${colorA}.`;
        }
        answer = formatRatio([partB, partA]);
        working = [
          { type: 'step', content: `${colorA} = <sup>${num}</sup>/<sub>${den}</sub>` },
          { type: 'step', content: `${colorB} = ${den} − ${num} = ${partB} (as ${den} parts in total)` },
          { type: 'step', content: `${colorB} = <sup>${partB}</sup>/<sub>${den}</sub>` },
          { type: 'step', content: `Ratio ${colorB}:${colorA} = ${partB}:${partA}` },
        ];
      } else {
        if (questionStyle === 'written') {
          display = `In a bag of ${context.item}, <sup>${num}</sup>/<sub>${den}</sub> are ${colorA} and the rest are ${colorB}. Write the ratio of ${colorA} to ${colorB}.`;
        } else {
          display = `In a bag of ${context.item}, <sup>${num}</sup>/<sub>${den}</sub> are ${colorA} and the rest are ${colorB}. Find ${colorA}:${colorB}.`;
        }
        answer = formatRatio([partA, partB]);
        working = [
          { type: 'step', content: `${colorA} = <sup>${num}</sup>/<sub>${den}</sub>` },
          { type: 'step', content: `${colorB} = ${den} − ${num} = ${partB} (as ${den} parts in total)` },
          { type: 'step', content: `${colorB} = <sup>${partB}</sup>/<sub>${den}</sub>` },
          { type: 'step', content: `Ratio ${colorA}:${colorB} = ${partA}:${partB}` },
        ];
      }
      
      values = { num, den, orderReversed };
    }
    
    // LEVEL 2: MULTIPLE PARTS
    else if (level === 'level2') {
      const contextsL2 = [
        { item: 'beads', parts: ['Red', 'Blue', 'Green'] },
        { item: 'sweets', parts: ['Strawberry', 'Lemon', 'Orange'] },
        { item: 'marbles', parts: ['Clear', 'Spotted', 'Striped'] },
        { item: 'flowers', parts: ['Roses', 'Tulips', 'Daisies'] },
      ];
      
      const context = contextsL2[Math.floor(Math.random() * contextsL2.length)];
      const findCommonDenominators = variables.findCommonDenominators || false;
      
      let frac1Num = 0, frac2Num = 0, den = 0, frac3Num = 0;
      let isValid = false;
      let originalFrac1: { num: number; den: number } | null = null;
      let originalFrac2: { num: number; den: number } | null = null;
      
      while (!isValid) {
        if (findCommonDenominators) {
          // Different denominators
          const frac1 = generateSimplestFraction();
          const frac2 = generateSimplestFraction();
          
          if (frac1.den === frac2.den) continue; // Ensure different
          
          const { newNum1, newNum2, lcd } = convertToCommonDenominator(frac1, frac2);
          
          if (newNum1 + newNum2 >= lcd) continue; // Must have remainder
          
          frac1Num = newNum1;
          frac2Num = newNum2;
          den = lcd;
          frac3Num = lcd - newNum1 - newNum2;
          originalFrac1 = frac1;
          originalFrac2 = frac2;
          isValid = true;
        } else {
          // Same denominators
          den = Math.floor(Math.random() * 8) + 5; // 5-12
          frac1Num = Math.floor(Math.random() * (den - 2)) + 1;
          frac2Num = Math.floor(Math.random() * (den - frac1Num - 1)) + 1;
          
          if (frac1Num + frac2Num >= den) continue;
          
          frac3Num = den - frac1Num - frac2Num;
          isValid = true;
        }
      }
      
      const orderChoice = Math.floor(Math.random() * 6);
      const parts = [context.parts[0], context.parts[1], context.parts[2]];
      let requestedOrder = '';
      let answerParts: number[] = [];
      let displayParts = [parts[0], parts[1], parts[2]]; // For display in question
      
      // Store the actual ratio values (always in ABC order)
      const actualA = frac1Num;
      const actualB = frac2Num;
      const actualC = frac3Num;
      
      if (orderChoice === 0) {
        requestedOrder = `${parts[0]}:${parts[1]}:${parts[2]}`;
        answerParts = [actualA, actualB, actualC];
        displayParts = [parts[0], parts[1], parts[2]];
      } else if (orderChoice === 1) {
        requestedOrder = `${parts[0]}:${parts[2]}:${parts[1]}`;
        answerParts = [actualA, actualC, actualB];
        displayParts = [parts[0], parts[2], parts[1]];
      } else if (orderChoice === 2) {
        requestedOrder = `${parts[1]}:${parts[0]}:${parts[2]}`;
        answerParts = [actualB, actualA, actualC];
        displayParts = [parts[1], parts[0], parts[2]];
      } else if (orderChoice === 3) {
        requestedOrder = `${parts[1]}:${parts[2]}:${parts[0]}`;
        answerParts = [actualB, actualC, actualA];
        displayParts = [parts[1], parts[2], parts[0]];
      } else if (orderChoice === 4) {
        requestedOrder = `${parts[2]}:${parts[0]}:${parts[1]}`;
        answerParts = [actualC, actualA, actualB];
        displayParts = [parts[2], parts[0], parts[1]];
      } else {
        requestedOrder = `${parts[2]}:${parts[1]}:${parts[0]}`;
        answerParts = [actualC, actualB, actualA];
        displayParts = [parts[2], parts[1], parts[0]];
      }
      
      const questionStyle = Math.random() < 0.5 ? 'written' : 'colon';
      
      if (findCommonDenominators && originalFrac1 && originalFrac2) {
        if (questionStyle === 'written') {
          display = `In a bag of ${context.item}, <sup>${originalFrac1.num}</sup>/<sub>${originalFrac1.den}</sub> are ${parts[0]} and <sup>${originalFrac2.num}</sup>/<sub>${originalFrac2.den}</sub> are ${parts[1]}. The rest are ${parts[2]}. Write the ratio of ${displayParts[0]} to ${displayParts[1]} to ${displayParts[2]}.`;
        } else {
          display = `In a bag of ${context.item}, <sup>${originalFrac1.num}</sup>/<sub>${originalFrac1.den}</sub> are ${parts[0]} and <sup>${originalFrac2.num}</sup>/<sub>${originalFrac2.den}</sub> are ${parts[1]}. The rest are ${parts[2]}. Find ${requestedOrder}.`;
        }
      } else {
        if (questionStyle === 'written') {
          display = `In a bag of ${context.item}, <sup>${frac1Num}</sup>/<sub>${den}</sub> are ${parts[0]} and <sup>${frac2Num}</sup>/<sub>${den}</sub> are ${parts[1]}. The rest are ${parts[2]}. Write the ratio of ${displayParts[0]} to ${displayParts[1]} to ${displayParts[2]}.`;
        } else {
          display = `In a bag of ${context.item}, <sup>${frac1Num}</sup>/<sub>${den}</sub> are ${parts[0]} and <sup>${frac2Num}</sup>/<sub>${den}</sub> are ${parts[1]}. The rest are ${parts[2]}. Find ${requestedOrder}.`;
        }
      }
      
      answer = formatRatio(answerParts);
      
      if (findCommonDenominators && originalFrac1 && originalFrac2) {
        const { steps } = convertToCommonDenominator(originalFrac1, originalFrac2);
        working = [
          ...steps.map((step: string) => ({ type: 'step', content: step })),
          { type: 'step', content: `${parts[2]} = ${den} − ${actualA} − ${actualB} = ${actualC} parts` },
          { type: 'step', content: `${parts[2]} = <sup>${actualC}</sup>/<sub>${den}</sub>` },
          { type: 'step', content: `Ratio ${parts[0]}:${parts[1]}:${parts[2]} = ${actualA}:${actualB}:${actualC}` },
        ];
      } else {
        working = [
          { type: 'step', content: `${parts[0]} = <sup>${actualA}</sup>/<sub>${den}</sub>` },
          { type: 'step', content: `${parts[1]} = <sup>${actualB}</sup>/<sub>${den}</sub>` },
          { type: 'step', content: `${parts[2]} = ${den} − ${actualA} − ${actualB} = ${actualC} parts` },
          { type: 'step', content: `${parts[2]} = <sup>${actualC}</sup>/<sub>${den}</sub>` },
          { type: 'step', content: `Ratio ${parts[0]}:${parts[1]}:${parts[2]} = ${actualA}:${actualB}:${actualC}` },
        ];
      }
      
      values = { frac1Num, frac2Num, den, frac3Num, orderChoice, originalFrac1, originalFrac2 };
    }
    
    // LEVEL 3: QUANTITY-BASED
    else {
      const contextsL3 = [
        { item: 'beads', colors: ['Red', 'Blue'] },
        { item: 'sweets', colors: ['Strawberry', 'Lemon'] },
        { item: 'marbles', colors: ['Glass', 'Plastic'] },
        { item: 'counters', colors: ['Yellow', 'Green'] },
      ];
      
      const context = contextsL3[Math.floor(Math.random() * contextsL3.length)];
      const { num, den } = generateSimplestFraction();
      
      let actualGivenType = dropdownValue;
      if (dropdownValue === 'mixed') {
        const options = ['partA', 'partB', 'total'];
        actualGivenType = options[Math.floor(Math.random() * options.length)];
      }
      
      // Work backward to ensure integers
      const multiplier = Math.floor(Math.random() * 5) + 2; // 2-6
      const total = den * multiplier;
      const partA = num * multiplier;
      const partB = total - partA;
      
      const orderReversed = Math.random() < 0.5;
      const colorA = context.colors[0];
      const colorB = context.colors[1];
      
      if (actualGivenType === 'partA') givenValue = partA;
      else if (actualGivenType === 'partB') givenValue = partB;
      else givenValue = total;
      
      // Build question
      if (actualGivenType === 'total') {
        if (orderReversed) {
          display = `In a bag of ${context.item}, <sup>${num}</sup>/<sub>${den}</sub> are ${colorA} and the rest are ${colorB}. There are ${total} ${context.item} in total. Write the amount of ${context.item} in the ratio ${colorB}:${colorA}.`;
          answer = formatRatio([partB, partA]);
          working = [
            { type: 'step', content: `Total = ${total} ${context.item} = ${den} parts` },
            { type: 'step', content: `1 part = ${total} ÷ ${den} = ${multiplier} ${context.item}` },
            { type: 'step', content: `${colorA} = ${num} parts = ${num} × ${multiplier} = ${partA} ${context.item}` },
            { type: 'step', content: `${colorB} = ${den - num} parts = ${den - num} × ${multiplier} = ${partB} ${context.item}` },
            { type: 'step', content: `Ratio ${colorB}:${colorA} = ${partB}:${partA}` },
          ];
        } else {
          display = `In a bag of ${context.item}, <sup>${num}</sup>/<sub>${den}</sub> are ${colorA} and the rest are ${colorB}. There are ${total} ${context.item} in total. Write the amount of ${context.item} in the ratio ${colorA}:${colorB}.`;
          answer = formatRatio([partA, partB]);
          working = [
            { type: 'step', content: `Total = ${total} ${context.item} = ${den} parts` },
            { type: 'step', content: `1 part = ${total} ÷ ${den} = ${multiplier} ${context.item}` },
            { type: 'step', content: `${colorA} = ${num} parts = ${num} × ${multiplier} = ${partA} ${context.item}` },
            { type: 'step', content: `${colorB} = ${den - num} parts = ${den - num} × ${multiplier} = ${partB} ${context.item}` },
            { type: 'step', content: `Ratio ${colorA}:${colorB} = ${partA}:${partB}` },
          ];
        }
      } else if (actualGivenType === 'partB') {
        if (orderReversed) {
          display = `In a bag of ${context.item}, <sup>${num}</sup>/<sub>${den}</sub> are ${colorA} and the rest are ${colorB}. There are ${partB} ${colorB} ${context.item}. Write the amount of ${context.item} in the ratio ${colorB}:${colorA}.`;
          answer = formatRatio([partB, partA]);
          working = [
            { type: 'step', content: `${colorA} = <sup>${num}</sup>/<sub>${den}</sub>, so ${colorB} = <sup>${den - num}</sup>/<sub>${den}</sub>` },
            { type: 'step', content: `${den - num} parts = ${partB} ${context.item}` },
            { type: 'step', content: `1 part = ${partB} ÷ ${den - num} = ${multiplier} ${context.item}` },
            { type: 'step', content: `${colorA} = ${num} parts = ${num} × ${multiplier} = ${partA} ${context.item}` },
            { type: 'step', content: `Ratio ${colorB}:${colorA} = ${partB}:${partA}` },
          ];
        } else {
          display = `In a bag of ${context.item}, <sup>${num}</sup>/<sub>${den}</sub> are ${colorA} and the rest are ${colorB}. There are ${partB} ${colorB} ${context.item}. Write the amount of ${context.item} in the ratio ${colorA}:${colorB}.`;
          answer = formatRatio([partA, partB]);
          working = [
            { type: 'step', content: `${colorA} = <sup>${num}</sup>/<sub>${den}</sub>, so ${colorB} = <sup>${den - num}</sup>/<sub>${den}</sub>` },
            { type: 'step', content: `${den - num} parts = ${partB} ${context.item}` },
            { type: 'step', content: `1 part = ${partB} ÷ ${den - num} = ${multiplier} ${context.item}` },
            { type: 'step', content: `${colorA} = ${num} parts = ${num} × ${multiplier} = ${partA} ${context.item}` },
            { type: 'step', content: `Ratio ${colorA}:${colorB} = ${partA}:${partB}` },
          ];
        }
      } else { // partA
        if (orderReversed) {
          display = `In a bag of ${context.item}, <sup>${num}</sup>/<sub>${den}</sub> are ${colorA} and the rest are ${colorB}. There are ${partA} ${colorA} ${context.item}. Write the amount of ${context.item} in the ratio ${colorB}:${colorA}.`;
          answer = formatRatio([partB, partA]);
          working = [
            { type: 'step', content: `${colorA} = <sup>${num}</sup>/<sub>${den}</sub> of total` },
            { type: 'step', content: `${num} parts = ${partA} ${context.item}` },
            { type: 'step', content: `1 part = ${partA} ÷ ${num} = ${multiplier} ${context.item}` },
            { type: 'step', content: `Total = ${den} parts = ${den} × ${multiplier} = ${total} ${context.item}` },
            { type: 'step', content: `${colorB} = ${total} − ${partA} = ${partB} ${context.item}` },
            { type: 'step', content: `Ratio ${colorB}:${colorA} = ${partB}:${partA}` },
          ];
        } else {
          display = `In a bag of ${context.item}, <sup>${num}</sup>/<sub>${den}</sub> are ${colorA} and the rest are ${colorB}. There are ${partA} ${colorA} ${context.item}. Write the amount of ${context.item} in the ratio ${colorA}:${colorB}.`;
          answer = formatRatio([partA, partB]);
          working = [
            { type: 'step', content: `${colorA} = <sup>${num}</sup>/<sub>${den}</sub> of total` },
            { type: 'step', content: `${num} parts = ${partA} ${context.item}` },
            { type: 'step', content: `1 part = ${partA} ÷ ${num} = ${multiplier} ${context.item}` },
            { type: 'step', content: `Total = ${den} parts = ${den} × ${multiplier} = ${total} ${context.item}` },
            { type: 'step', content: `${colorB} = ${total} − ${partA} = ${partB} ${context.item}` },
            { type: 'step', content: `Ratio ${colorA}:${colorB} = ${partA}:${partB}` },
          ];
        }
      }
      
      values = { num, den, total, partA, partB, givenType: actualGivenType, orderReversed };
    }
    
    return {
      display,
      answer,
      working,
      values,
      difficulty: level,
    };
  }
  
  // FORMING RATIOS TOOL (existing code)
  const threeWay = variables.threeWay || false;
  const simplestForm = variables.simplestForm || false;
  
  // LEVEL 1: DIRECT COUNT
  if (level === 'level1') {
    const contexts2Way = [
      { items: ['apples', 'oranges'], container: 'basket' },
      { items: ['cats', 'dogs'], container: 'pet shelter' },
      { items: ['red cars', 'blue cars'], container: 'car park' },
      { items: ['boys', 'girls'], container: 'classroom' },
      { items: ['pencils', 'pens'], container: 'pencil case' },
    ];
    
    const contexts3Way = [
      { items: ['cows', 'sheep', 'pigs'], container: 'farm' },
      { items: ['red sweets', 'blue sweets', 'green sweets'], container: 'jar' },
      { items: ['footballs', 'basketballs', 'tennis balls'], container: 'sports hall' },
      { items: ['roses', 'tulips', 'daisies'], container: 'garden' },
      { items: ['Y7s', 'Y8s', 'Y9s'], container: 'school trip' },
    ];
    
    if (threeWay) {
      const context = contexts3Way[Math.floor(Math.random() * contexts3Way.length)];
      const gcds = [1, 1, 1, 2, 2, 3, 3, 4, 5, 6];
      const gcdChoice = gcds[Math.floor(Math.random() * gcds.length)];
      
      const a = (Math.floor(Math.random() * 15) + 2) * gcdChoice;
      const b = (Math.floor(Math.random() * 15) + 2) * gcdChoice;
      const c = (Math.floor(Math.random() * 15) + 2) * gcdChoice;
      
      const order = Math.floor(Math.random() * 6);
      let requestedOrder: string;
      let answerParts: number[];
      
      if (order === 0) {
        requestedOrder = `${context.items[0]} to ${context.items[1]} to ${context.items[2]}`;
        answerParts = [a, b, c];
      } else if (order === 1) {
        requestedOrder = `${context.items[0]} to ${context.items[2]} to ${context.items[1]}`;
        answerParts = [a, c, b];
      } else if (order === 2) {
        requestedOrder = `${context.items[1]} to ${context.items[0]} to ${context.items[2]}`;
        answerParts = [b, a, c];
      } else if (order === 3) {
        requestedOrder = `${context.items[1]} to ${context.items[2]} to ${context.items[0]}`;
        answerParts = [b, c, a];
      } else if (order === 4) {
        requestedOrder = `${context.items[2]} to ${context.items[0]} to ${context.items[1]}`;
        answerParts = [c, a, b];
      } else {
        requestedOrder = `${context.items[2]} to ${context.items[1]} to ${context.items[0]}`;
        answerParts = [c, b, a];
      }
      
      const simplestFormText = simplestForm ? ' in its simplest form' : '';
      const phrasings = [
        `A ${context.container} has ${a} ${context.items[0]}, ${b} ${context.items[1]}, and ${c} ${context.items[2]}. Write the ratio of ${requestedOrder}${simplestFormText}.`,
        `There are ${a} ${context.items[0]}, ${b} ${context.items[1]}, and ${c} ${context.items[2]} in a ${context.container}. Find the ratio ${requestedOrder.split(' to ').join(':')}${simplestFormText}.`,
      ];
      
      display = phrasings[Math.floor(Math.random() * phrasings.length)];
      
      if (simplestForm) {
        const simplified = simplifyRatio(answerParts);
        answer = formatRatio(simplified);
        const steps = getSimplificationSteps(answerParts);
        working = [
          { type: 'step', content: `Original ratio: ${formatRatio(answerParts)}` },
          ...steps.map((step: string) => ({ type: 'step', content: step })),
        ];
      } else {
        answer = formatRatio(answerParts);
        working = [
          { type: 'step', content: `Ratio: ${answer}` },
        ];
      }
      
      values = { a, b, c, gcdChoice, order };
    } else {
      const context = contexts2Way[Math.floor(Math.random() * contexts2Way.length)];
      const gcds = [1, 1, 1, 2, 2, 3, 3, 4, 5, 6];
      const gcdChoice = gcds[Math.floor(Math.random() * gcds.length)];
      
      const a = (Math.floor(Math.random() * 20) + 2) * gcdChoice;
      const b = (Math.floor(Math.random() * 20) + 2) * gcdChoice;
      
      const reversed = Math.random() < 0.5;
      const requestedOrder = reversed 
        ? `${context.items[1]} to ${context.items[0]}`
        : `${context.items[0]} to ${context.items[1]}`;
      const answerParts = reversed ? [b, a] : [a, b];
      
      const simplestFormText = simplestForm ? ' in its simplest form' : '';
      const phrasings = [
        `A ${context.container} has ${a} ${context.items[0]} and ${b} ${context.items[1]}. Write the ratio of ${requestedOrder}${simplestFormText}.`,
        `There are ${a} ${context.items[0]} and ${b} ${context.items[1]} in a ${context.container}. Find ${requestedOrder.split(' to ').join(':')}${simplestFormText}.`,
      ];
      
      display = phrasings[Math.floor(Math.random() * phrasings.length)];
      
      if (simplestForm) {
        const simplified = simplifyRatio(answerParts);
        answer = formatRatio(simplified);
        const steps = getSimplificationSteps(answerParts);
        working = [
          { type: 'step', content: `Original ratio: ${formatRatio(answerParts)}` },
          ...steps.map((step: string) => ({ type: 'step', content: step })),
        ];
      } else {
        answer = formatRatio(answerParts);
        working = [
          { type: 'step', content: `Ratio: ${answer}` },
        ];
      }
      
      values = { a, b, gcdChoice, reversed };
    }
  }
  
  // LEVEL 2: PART-WHOLE-REMAINDER
  else if (level === 'level2') {
    const contexts2Way = [
      { item: 'sweets', container: 'bag', parts: ['red', 'blue'] },
      { item: 'students', container: 'class', parts: ['boys', 'girls'] },
      { item: 'cars', container: 'car park', parts: ['red', 'blue'] },
      { item: 'books', container: 'library', parts: ['fiction', 'non-fiction'] },
    ];
    
    const contexts3Way = [
      { item: 'sweets', container: 'bag', parts: ['red', 'blue', 'green'] },
      { item: 'marbles', container: 'jar', parts: ['red', 'yellow', 'blue'] },
      { item: 'counters', container: 'box', parts: ['red', 'blue', 'green'] },
      { item: 'flowers', container: 'vase', parts: ['roses', 'tulips', 'daisies'] },
    ];
    
    if (threeWay) {
      const context = contexts3Way[Math.floor(Math.random() * contexts3Way.length)];
      const total = Math.floor(Math.random() * 71) + 10;
      
      // Encourage common factors by sometimes building from simplified ratios
      const useCommonFactor = Math.random() < 0.6; // 60% chance of common factor
      let first = 0, second = 0, third = 0;
      
      if (useCommonFactor) {
        const gcds = [2, 2, 2, 3, 3, 4, 5, 6];
        const commonFactor = gcds[Math.floor(Math.random() * gcds.length)];
        const maxPart = Math.floor(total / (3 * commonFactor));
        
        if (maxPart >= 2) {
          const baseFirst = Math.floor(Math.random() * (maxPart - 1)) + 1;
          const baseSecond = Math.floor(Math.random() * (maxPart - 1)) + 1;
          const baseThird = Math.floor(total / commonFactor) - baseFirst - baseSecond;
          
          if (baseThird > 0 && (baseFirst * commonFactor + baseSecond * commonFactor + baseThird * commonFactor === total)) {
            first = baseFirst * commonFactor;
            second = baseSecond * commonFactor;
            third = baseThird * commonFactor;
          }
        }
      }
      
      // Fallback or non-common-factor generation with realistic constraints
      if (first === 0 || second === 0 || third === 0 || first + second + third !== total) {
        // Ensure each part is at least 10% and at most 70% of total
        const minPart = Math.max(1, Math.floor(total * 0.1));
        const maxPart = Math.floor(total * 0.7);
        
        first = Math.floor(Math.random() * (maxPart - minPart + 1)) + minPart;
        const remaining = total - first;
        const minSecond = Math.max(1, Math.floor(remaining * 0.2));
        const maxSecond = Math.floor(remaining * 0.8);
        second = Math.floor(Math.random() * (maxSecond - minSecond + 1)) + minSecond;
        third = total - first - second;
      }
      
      const order = Math.floor(Math.random() * 3);
      let displayPattern: string;
      let answerParts: number[];
      
      if (order === 0) {
        // A, B, rest C
        displayPattern = `${first} are ${context.parts[0]}, ${second} are ${context.parts[1]}, and the rest are ${context.parts[2]}`;
        answerParts = [first, second, third];
      } else if (order === 1) {
        // A, C, rest B
        displayPattern = `${first} are ${context.parts[0]}, ${third} are ${context.parts[2]}, and the rest are ${context.parts[1]}`;
        answerParts = [first, second, third];
      } else {
        // B, C, rest A
        displayPattern = `${second} are ${context.parts[1]}, ${third} are ${context.parts[2]}, and the rest are ${context.parts[0]}`;
        answerParts = [first, second, third];
      }
      
      const simplestFormText = simplestForm ? ' in its simplest form' : '';
      display = `A ${context.container} contains ${total} ${context.item}. ${displayPattern}. Write the ratio of ${context.parts[0]}:${context.parts[1]}:${context.parts[2]}${simplestFormText}.`;
      
      if (simplestForm) {
        const simplified = simplifyRatio(answerParts);
        answer = formatRatio(simplified);
        const steps = getSimplificationSteps(answerParts);
        working = [
          { type: 'step', content: `Calculate remainder: ${total} − ${first} − ${second} = ${third}` },
          { type: 'step', content: `Original ratio: ${formatRatio(answerParts)}` },
          ...steps.map((step: string) => ({ type: 'step', content: step })),
        ];
      } else {
        answer = formatRatio(answerParts);
        working = [
          { type: 'step', content: `Calculate remainder: ${total} − ${first} − ${second} = ${third}` },
          { type: 'step', content: `Ratio: ${answer}` },
        ];
      }
      
      values = { total, first, second, third, order };
    } else {
      const context = contexts2Way[Math.floor(Math.random() * contexts2Way.length)];
      const total = Math.floor(Math.random() * 71) + 10;
      
      // Encourage common factors by sometimes building from simplified ratios
      const useCommonFactor = Math.random() < 0.6; // 60% chance of common factor
      let first = 0, second = 0;
      
      if (useCommonFactor) {
        const gcds = [2, 2, 2, 3, 3, 4, 5, 6];
        const commonFactor = gcds[Math.floor(Math.random() * gcds.length)];
        const maxBase = Math.floor(total / (2 * commonFactor));
        
        if (maxBase >= 2) {
          const baseFirst = Math.floor(Math.random() * (maxBase - 1)) + 1;
          const baseSecond = Math.floor(total / commonFactor) - baseFirst;
          
          if (baseSecond > 0 && (baseFirst * commonFactor + baseSecond * commonFactor === total)) {
            first = baseFirst * commonFactor;
            second = baseSecond * commonFactor;
          }
        }
      }
      
      // Fallback or non-common-factor generation with realistic constraints
      if (first === 0 || second === 0 || first + second !== total) {
        // Ensure each part is at least 15% and at most 85% of total
        const minPart = Math.max(1, Math.floor(total * 0.15));
        const maxPart = Math.floor(total * 0.85);
        first = Math.floor(Math.random() * (maxPart - minPart + 1)) + minPart;
        second = total - first;
      }
      
      const displayPattern = `${first} are ${context.parts[0]} and the rest are ${context.parts[1]}`;
      
      const simplestFormText = simplestForm ? ' in its simplest form' : '';
      display = `A ${context.container} contains ${total} ${context.item}. ${displayPattern}. Write the ratio of ${context.parts[0]}:${context.parts[1]}${simplestFormText}.`;
      
      const answerParts = [first, second];
      
      if (simplestForm) {
        const simplified = simplifyRatio(answerParts);
        answer = formatRatio(simplified);
        const steps = getSimplificationSteps(answerParts);
        working = [
          { type: 'step', content: `Calculate remainder: ${total} − ${first} = ${second}` },
          { type: 'step', content: `Original ratio: ${formatRatio(answerParts)}` },
          ...steps.map((step: string) => ({ type: 'step', content: step })),
        ];
      } else {
        answer = formatRatio(answerParts);
        working = [
          { type: 'step', content: `Calculate remainder: ${total} − ${first} = ${second}` },
          { type: 'step', content: `Ratio: ${answer}` },
        ];
      }
      
      values = { total, first, second };
    }
  }
  
  // LEVEL 3: CONSTRAINT-BASED
  else {
    const contexts2Way = [
      { item: 'people', parts: ['adults', 'children'], container: 'room' },
      { item: 'animals', parts: ['dogs', 'cats'], container: 'shelter' },
      { item: 'students', parts: ['boys', 'girls'], container: 'school' },
      { item: 'cars', parts: ['electric', 'petrol'], container: 'car park' },
    ];
    
    const contexts3Way = [
      { item: 'people', parts: ['men', 'women', 'children'], container: 'room' },
      { item: 'students', parts: ['Y7', 'Y8', 'Y9'], container: 'trip' },
      { item: 'sweets', parts: ['red', 'blue', 'green'], container: 'bag' },
      { item: 'books', parts: ['fiction', 'non-fiction', 'reference'], container: 'library' },
    ];
    
    const percentages = [10, 20, 25, 30, 40, 50, 60, 70, 75];
    const fractions = [
      { num: 1, den: 2 }, { num: 1, den: 3 }, { num: 2, den: 3 },
      { num: 1, den: 4 }, { num: 3, den: 4 },
      { num: 1, den: 5 }, { num: 2, den: 5 }, { num: 3, den: 5 }, { num: 4, den: 5 },
    ];
    
    let validQuestion = false;
    let total = 0, part1 = 0, part2 = 0, part3 = 0;
    let constraintText = '';
    let calculationSteps: string[] = [];
    
    while (!validQuestion) {
      total = Math.floor(Math.random() * 61) + 40;
      
      const usePercentage = Math.random() < 0.5;
      
      if (threeWay) {
        const context = contexts3Way[Math.floor(Math.random() * contexts3Way.length)];
        const pattern = Math.floor(Math.random() * 2);
        
        if (pattern === 0) {
          // Constraint → Fixed → Remainder
          if (usePercentage) {
            const pct = percentages[Math.floor(Math.random() * percentages.length)];
            part1 = Math.round(total * pct / 100);
            if (part1 !== total * pct / 100) continue;
            
            part2 = Math.floor(Math.random() * (total - part1 - 1)) + 1;
            part3 = total - part1 - part2;
            
            constraintText = `${pct}% are ${context.parts[0]}. ${part2} are ${context.parts[1]}. The rest are ${context.parts[2]}.`;
            calculationSteps = [
              `${context.parts[0]}: ${pct}% of ${total} = ${part1}`,
              `${context.parts[1]}: ${part2}`,
              `${context.parts[2]}: ${total} − ${part1} − ${part2} = ${part3}`,
            ];
          } else {
            const frac = fractions[Math.floor(Math.random() * fractions.length)];
            part1 = Math.round(total * frac.num / frac.den);
            if (part1 !== total * frac.num / frac.den) continue;
            
            part2 = Math.floor(Math.random() * (total - part1 - 1)) + 1;
            part3 = total - part1 - part2;
            
            constraintText = `${frac.num}/${frac.den} are ${context.parts[0]}. ${part2} are ${context.parts[1]}. The rest are ${context.parts[2]}.`;
            calculationSteps = [
              `${context.parts[0]}: ${frac.num}/${frac.den} of ${total} = ${part1}`,
              `${context.parts[1]}: ${part2}`,
              `${context.parts[2]}: ${total} − ${part1} − ${part2} = ${part3}`,
            ];
          }
        } else {
          // Fixed → Constraint → Remainder
          part1 = Math.floor(Math.random() * (total / 3)) + 1;
          const remaining = total - part1;
          
          if (usePercentage) {
            const pct = percentages[Math.floor(Math.random() * percentages.length)];
            part2 = Math.round(remaining * pct / 100);
            if (part2 !== remaining * pct / 100) continue;
            
            part3 = total - part1 - part2;
            
            constraintText = `${part1} are ${context.parts[0]}. ${pct}% of the remainder are ${context.parts[1]}. The rest are ${context.parts[2]}.`;
            calculationSteps = [
              `${context.parts[0]}: ${part1}`,
              `Remainder: ${total} − ${part1} = ${remaining}`,
              `${context.parts[1]}: ${pct}% of ${remaining} = ${part2}`,
              `${context.parts[2]}: ${total} − ${part1} − ${part2} = ${part3}`,
            ];
          } else {
            const frac = fractions[Math.floor(Math.random() * fractions.length)];
            part2 = Math.round(remaining * frac.num / frac.den);
            if (part2 !== remaining * frac.num / frac.den) continue;
            
            part3 = total - part1 - part2;
            
            constraintText = `${part1} are ${context.parts[0]}. ${frac.num}/${frac.den} of the remainder are ${context.parts[1]}. The rest are ${context.parts[2]}.`;
            calculationSteps = [
              `${context.parts[0]}: ${part1}`,
              `Remainder: ${total} − ${part1} = ${remaining}`,
              `${context.parts[1]}: ${frac.num}/${frac.den} of ${remaining} = ${part2}`,
              `${context.parts[2]}: ${total} − ${part1} − ${part2} = ${part3}`,
            ];
          }
        }
        
        if (part1 > 0 && part2 > 0 && part3 > 0) {
          validQuestion = true;
          display = `There are ${total} ${context.item} in a ${context.container}. ${constraintText} Find the ratio of ${context.parts[0]}:${context.parts[1]}:${context.parts[2]}.`;
          
          const answerParts = [part1, part2, part3];
          
          if (simplestForm) {
            const simplified = simplifyRatio(answerParts);
            answer = formatRatio(simplified);
            const steps = getSimplificationSteps(answerParts);
            working = [
              ...calculationSteps.map((step: string) => ({ type: 'step', content: step })),
              { type: 'step', content: `Original ratio: ${formatRatio(answerParts)}` },
              ...steps.map((step: string) => ({ type: 'step', content: step })),
            ];
          } else {
            answer = formatRatio(answerParts);
            working = [
              ...calculationSteps.map((step: string) => ({ type: 'step', content: step })),
              { type: 'step', content: `Ratio: ${answer}` },
            ];
          }
          
          values = { total, part1, part2, part3, usePercentage };
        }
      } else {
        const context = contexts2Way[Math.floor(Math.random() * contexts2Way.length)];
        
        if (usePercentage) {
          const pct = percentages[Math.floor(Math.random() * percentages.length)];
          part1 = Math.round(total * pct / 100);
          if (part1 !== total * pct / 100) continue;
          
          part2 = total - part1;
          
          constraintText = `${pct}% are ${context.parts[0]} and the rest are ${context.parts[1]}`;
          calculationSteps = [
            `${context.parts[0]}: ${pct}% of ${total} = ${part1}`,
            `${context.parts[1]}: ${total} − ${part1} = ${part2}`,
          ];
        } else {
          const frac = fractions[Math.floor(Math.random() * fractions.length)];
          part1 = Math.round(total * frac.num / frac.den);
          if (part1 !== total * frac.num / frac.den) continue;
          
          part2 = total - part1;
          
          constraintText = `${frac.num}/${frac.den} are ${context.parts[0]} and the rest are ${context.parts[1]}`;
          calculationSteps = [
            `${context.parts[0]}: ${frac.num}/${frac.den} of ${total} = ${part1}`,
            `${context.parts[1]}: ${total} − ${part1} = ${part2}`,
          ];
        }
        
        if (part1 > 0 && part2 > 0) {
          validQuestion = true;
          display = `There are ${total} ${context.item} in a ${context.container}. ${constraintText}. Write this as a ratio.`;
          
          const answerParts = [part1, part2];
          
          if (simplestForm) {
            const simplified = simplifyRatio(answerParts);
            answer = formatRatio(simplified);
            const steps = getSimplificationSteps(answerParts);
            working = [
              ...calculationSteps.map((step: string) => ({ type: 'step', content: step })),
              { type: 'step', content: `Original ratio: ${formatRatio(answerParts)}` },
              ...steps.map((step: string) => ({ type: 'step', content: step })),
            ];
          } else {
            answer = formatRatio(answerParts);
            working = [
              ...calculationSteps.map((step: string) => ({ type: 'step', content: step })),
              { type: 'step', content: `Ratio: ${answer}` },
            ];
          }
          
          values = { total, part1, part2, usePercentage };
        }
      }
    }
  }
  
  return {
    display,
    answer,
    working,
    values: { ...values, tool },
    difficulty: level,
  };
};

const getQuestionUniqueKey = (q: Question): string => {
  const tool = q.values.tool || 'formingRatios';
  
  if (tool === 'ratioToFraction') {
    if (q.difficulty === 'level1') {
      return `rtf-l1-${q.values.a}-${q.values.b}-${q.values.whichPart}`;
    } else if (q.difficulty === 'level2') {
      return `rtf-l2-${q.values.a}-${q.values.b}-${q.values.c}-${q.values.targetType}-${q.values.isComposite}`;
    } else {
      return `rtf-l3-${q.values.a}-${q.values.b}-${q.values.orderReversed}`;
    }
  }
  
  if (tool === 'fractionToRatio') {
    if (q.difficulty === 'level1') {
      return `ftr-l1-${q.values.num}-${q.values.den}-${q.values.orderReversed}`;
    } else if (q.difficulty === 'level2') {
      return `ftr-l2-${q.values.frac1Num}-${q.values.frac2Num}-${q.values.den}-${q.values.orderChoice}`;
    } else {
      return `ftr-l3-${q.values.num}-${q.values.den}-${q.values.total}-${q.values.givenType}-${q.values.orderReversed}`;
    }
  }
  
  if (q.difficulty === 'level1') {
    return `${q.values.a}-${q.values.b}-${q.values.c || 0}-${q.values.order || 0}`;
  } else if (q.difficulty === 'level2') {
    return `${q.values.total}-${q.values.first}-${q.values.second}-${q.values.third || 0}`;
  } else {
    return `${q.values.total}-${q.values.part1}-${q.values.part2}-${q.values.part3 || 0}`;
  }
};

const generateUniqueQuestion = (
  tool: ToolType,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  usedKeys: Set<string>
): Question => {
  let attempts = 0;
  let q: Question;
  let uniqueKey = '';
  
  do {
    q = generateQuestion(tool, level, variables, dropdownValue);
    uniqueKey = getQuestionUniqueKey(q);
    if (++attempts > 100) break;
  } while (usedKeys.has(uniqueKey));
  
  usedKeys.add(uniqueKey);
  return q;
};

// DIAGRAM RENDERER (for useGraphicalLayout: true)
const renderDiagram = (question: Question | null, size: number): JSX.Element => {
  if (!question) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-xl">
        Generate question
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-gray-500 text-lg mb-2">Diagram</p>
        <p className="text-gray-400 text-sm">{size}px</p>
      </div>
    </div>
  );
};

export default function GenericToolShell() {
  const [currentTool, setCurrentTool] = useState<ToolType>('ratioToFraction');
  const [mode, setMode] = useState<Mode>('whiteboard');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('level1');
  
  // Per-tool variable and dropdown states (keyed by tool)
  const [toolVariables, setToolVariables] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    Object.entries(TOOL_CONFIG.tools).forEach(([toolKey, tool]: [string, ToolSettings]) => {
      initial[toolKey] = {};
      tool.variables.forEach((v: VariableConfig) => {
        initial[toolKey][v.key] = v.defaultValue;
      });
    });
    return initial;
  });
  
  const [toolDropdowns, setToolDropdowns] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    Object.entries(TOOL_CONFIG.tools).forEach(([toolKey, tool]: [string, ToolSettings]) => {
      if (tool.dropdown) {
        initial[toolKey] = tool.dropdown.defaultValue;
      }
    });
    return initial;
  });
  

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  

  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [worksheet, setWorksheet] = useState<Question[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState<boolean>(false);
  const [isDifferentiated, setIsDifferentiated] = useState<boolean>(false);
  const [numColumns, setNumColumns] = useState<number>(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState<number>(1);
  
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  
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
  
  // Get background for substantial question boxes (uses darker shade from color scheme)
  const getQuestionBoxBg = (): string => getStepBg();
  

  
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
  

  
  const handleNewQuestion = (): void => {
    const variables = toolVariables[currentTool] || {};
    const dropdownValue = toolDropdowns[currentTool] || '';
    const q = generateQuestion(currentTool, difficulty, variables, dropdownValue);
    setCurrentQuestion(q);
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };
  
  const handleShowAnswer = (): void => {
    if (mode === 'whiteboard') {
      setShowWhiteboardAnswer(!showWhiteboardAnswer);
    } else {
      setShowAnswer(!showAnswer);
    }
  };
  

  
  const handleGenerateWorksheet = (): void => {
    const usedKeys = new Set<string>();
    const questions: Question[] = [];
    const variables = toolVariables[currentTool] || {};
    const dropdownValue = toolDropdowns[currentTool] || '';
    
    if (isDifferentiated) {
      // Generate questions for each level
      const levels: DifficultyLevel[] = ['level1', 'level2', 'level3'];
      levels.forEach((level: DifficultyLevel) => {
        for (let i = 0; i < numQuestions; i++) {
          const q = generateUniqueQuestion(currentTool, level, variables, dropdownValue, usedKeys);
          questions.push(q);
        }
      });
    } else {
      // Generate questions for current difficulty only
      for (let i = 0; i < numQuestions; i++) {
        const q = generateUniqueQuestion(currentTool, difficulty, variables, dropdownValue, usedKeys);
        questions.push(q);
      }
    }
    
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };
  

  
  const fontSizes: string[] = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  
  const canIncreaseFontSize = (): boolean => worksheetFontSize < fontSizes.length - 1;
  const canDecreaseFontSize = (): boolean => worksheetFontSize > 0;
  
  const increaseFontSize = (): void => {
    if (canIncreaseFontSize()) {
      setWorksheetFontSize(worksheetFontSize + 1);
    }
  };
  
  const decreaseFontSize = (): void => {
    if (canDecreaseFontSize()) {
      setWorksheetFontSize(worksheetFontSize - 1);
    }
  };
  

  
  const getCurrentToolSettings = (): ToolSettings => {
    return TOOL_CONFIG.tools[currentTool];
  };
  
  const toolNames: Record<string, string> = Object.fromEntries(
    Object.entries(TOOL_CONFIG.tools).map(([key, value]: [string, ToolSettings]) => [key, value.name])
  );
  
  // Get the current dropdown config (accounting for difficulty-specific settings)
  const getCurrentDropdownConfig = (): DropdownConfig | null => {
    const toolSettings = getCurrentToolSettings();
    if (toolSettings.difficultySettings?.[difficulty]?.dropdown) {
      return toolSettings.difficultySettings[difficulty].dropdown!;
    }
    return toolSettings.dropdown;
  };
  
  // Get the current variables config (accounting for difficulty-specific settings)
  const getCurrentVariablesConfig = (): VariableConfig[] => {
    const toolSettings = getCurrentToolSettings();
    if (toolSettings.difficultySettings?.[difficulty]?.variables) {
      return toolSettings.difficultySettings[difficulty].variables!;
    }
    return toolSettings.variables;
  };
  
  // Get current variable value
  const getVariableValue = (key: string): boolean => {
    return toolVariables[currentTool]?.[key] ?? false;
  };
  
  // Set variable value
  const setVariableValue = (key: string, value: boolean): void => {
    setToolVariables((prev: Record<string, Record<string, boolean>>) => ({
      ...prev,
      [currentTool]: {
        ...prev[currentTool],
        [key]: value,
      },
    }));
  };
  
  // Get current dropdown value
  const getDropdownValue = (): string => {
    return toolDropdowns[currentTool] ?? '';
  };
  
  // Set dropdown value
  const setDropdownValue = (value: string): void => {
    setToolDropdowns((prev: Record<string, string>) => ({
      ...prev,
      [currentTool]: value,
    }));
  };
  

  
  const colorConfig: Record<string, { bg: string; border: string; text: string }> = {
    level1: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700' },
    level2: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700' },
    level3: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700' },
  };
  

  
  const renderControlBar = (): JSX.Element => {
    const toolSettings = getCurrentToolSettings();
    const currentVariables = getCurrentVariablesConfig();
    const currentDropdown = getCurrentDropdownConfig();
    
    if (mode === 'worksheet') {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Line 1: Questions + Differentiated */}
          <div className="flex justify-center items-center gap-6 mb-4">
            <div className="flex items-center gap-3">
              <label className="text-lg font-semibold" style={{ color: '#000000' }}>Questions:</label>
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
            <div className="flex justify-center items-center gap-6 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: '#000000' }}>Difficulty:</span>
                <div className="flex gap-2">
                  {(['level1', 'level2', 'level3'] as const).map((lvl: DifficultyLevel, idx: number) => (
                    <button 
                      key={lvl} 
                      onClick={() => setDifficulty(lvl)}
                      className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + getDifficultyButtonClass(idx, difficulty === lvl)}
                    >
                      Level {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-lg font-semibold" style={{ color: '#000000' }}>Columns:</label>
                <input 
                  type="number" 
                  min="1" 
                  max="4" 
                  value={numColumns}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))}
                  className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg"
                />
              </div>
            </div>
          )}
          
          {/* Line 3: Variables + Dropdown (conditional per tool and difficulty) */}
          {(currentVariables.length > 0 || currentDropdown) && (
            <div className="flex justify-center items-center gap-6 mb-4">
              {currentVariables.length > 0 && (
                <div className="flex flex-col gap-1">
                  {currentVariables.map((variable: VariableConfig) => (
                    <label key={variable.key} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={getVariableValue(variable.key)} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVariableValue(variable.key, e.target.checked)} 
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-semibold" style={{ color: '#000000' }}>{variable.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {currentDropdown && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{ color: '#000000' }}>{currentDropdown.label}:</span>
                  <select 
                    value={getDropdownValue()} 
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDropdownValue(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold bg-white"
                  >
                    {currentDropdown.options.map((opt: DropdownOption) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
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
    }
    
    // Whiteboard / Worked Example Control Bar
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Difficulty */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold" style={{ color: '#000000' }}>Difficulty:</span>
              <div className="flex gap-2">
                {(['level1', 'level2', 'level3'] as const).map((lvl: DifficultyLevel, idx: number) => (
                  <button 
                    key={lvl} 
                    onClick={() => setDifficulty(lvl)}
                    className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + getDifficultyButtonClass(idx, difficulty === lvl)}
                  >
                    Level {idx + 1}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Variables (per tool and difficulty) */}
            {currentVariables.length > 0 && (
              <div className="flex flex-col gap-1">
                {currentVariables.map((variable: VariableConfig) => (
                  <label key={variable.key} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={getVariableValue(variable.key)} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVariableValue(variable.key, e.target.checked)} 
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-semibold" style={{ color: '#000000' }}>{variable.label}</span>
                  </label>
                ))}
              </div>
            )}
            
            {/* Dropdown (per tool and difficulty) */}
            {currentDropdown && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: '#000000' }}>{currentDropdown.label}:</span>
                <select 
                  value={getDropdownValue()} 
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDropdownValue(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold bg-white"
                >
                  {currentDropdown.options.map((opt: DropdownOption) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
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
              onClick={handleShowAnswer}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52"
            >
              <Eye size={18} /> {(mode === 'whiteboard' ? showWhiteboardAnswer : showAnswer) ? 'Hide Answer' : 'Show Answer'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  

  
  const renderWhiteboardMode = (): JSX.Element => {
    if (TOOL_CONFIG.useGraphicalLayout) {
      return (
        <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
          <div className="flex gap-6">
            {/* Diagram Area */}
            <div 
              className="rounded-xl flex items-center justify-center"
              style={{ width: '450px', height: '500px', backgroundColor: getStepBg() }}
            >
              {renderDiagram(currentQuestion, 400)}
            </div>
            {/* Working Area */}
            <div 
              className="flex-1 rounded-xl p-6" 
              style={{ minHeight: '500px', backgroundColor: getStepBg() }}
            >
              {currentQuestion && (
                <div className="text-center mb-4">
                  <span className="text-4xl font-bold" style={{ color: '#000000' }}>
                    {currentQuestion.display}
                  </span>
                  {showWhiteboardAnswer && (
                    <span className="text-4xl font-bold ml-4" style={{ color: '#166534' }}>
                      = {currentQuestion.answer}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
        <div className="text-center">
          {currentQuestion ? (
            <>
              <span className="text-6xl font-bold" style={{ color: '#000000' }} dangerouslySetInnerHTML={{ __html: currentQuestion.display }}></span>
              {showWhiteboardAnswer && (
                <span className="text-6xl font-bold ml-4" style={{ color: '#166534' }} dangerouslySetInnerHTML={{ __html: `= ${currentQuestion.answer}` }}></span>
              )}
            </>
          ) : (
            <span className="text-4xl text-gray-400">Generate question</span>
          )}
        </div>
        <div 
          className="rounded-xl mt-8" 
          style={{ height: '500px', backgroundColor: getWhiteboardWorkingBg() }}
        ></div>
      </div>
    );
  };
  

  
  const renderWorkedExampleMode = (): JSX.Element => {
    if (TOOL_CONFIG.useGraphicalLayout) {
      return (
        <div className="overflow-y-auto" style={{ height: '120vh' }}>
          <div className="rounded-xl shadow-lg p-8 w-full" style={{ backgroundColor: getQuestionBg() }}>
            <div className="flex gap-6">
              {/* Diagram Area */}
              <div 
                className="rounded-xl flex items-center justify-center"
                style={{ width: '450px', height: '500px', backgroundColor: getStepBg() }}
              >
                {renderDiagram(currentQuestion, 400)}
              </div>
              {/* Working Area */}
              <div className="flex-1">
                {currentQuestion ? (
                  <>
                    {/* Question */}
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold" style={{ color: '#000000' }} dangerouslySetInnerHTML={{ __html: currentQuestion.display }}></span>
                    </div>
                    
                    {showAnswer && (
                      <>
                        {/* Working Steps */}
                        <div className="space-y-4">
                          {currentQuestion.working.map((step: WorkingStep, i: number) => (
                            <div key={i} className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                              <h4 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>Step {i + 1}</h4>
                              <p className="text-3xl" style={{ color: '#000000' }}>{step.content}</p>
                            </div>
                          ))}
                        </div>
                        
                        {/* Final Answer */}
                        <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: getFinalAnswerBg() }}>
                          <span className="text-5xl font-bold" style={{ color: '#166534' }} dangerouslySetInnerHTML={{ __html: `= ${currentQuestion.answer}` }}></span>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center text-gray-400 text-2xl">
                    Generate question
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="overflow-y-auto" style={{ height: '120vh' }}>
        <div className="rounded-xl shadow-lg p-8 w-full" style={{ backgroundColor: getQuestionBg() }}>
          {currentQuestion ? (
            <>
              {/* Question */}
              <div className="text-center">
                <span className="text-6xl font-bold" style={{ color: '#000000' }} dangerouslySetInnerHTML={{ __html: currentQuestion.display }}></span>
              </div>
              
              {showAnswer && (
                <>
                  {/* Working Steps */}
                  <div className="space-y-4 mt-8">
                    {currentQuestion.working.map((step: WorkingStep, i: number) => (
                      <div key={i} className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                        <h4 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>Step {i + 1}</h4>
                        <p className="text-3xl" style={{ color: '#000000' }} dangerouslySetInnerHTML={{ __html: step.content }}></p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Final Answer */}
                  <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: getFinalAnswerBg() }}>
                    <span className="text-5xl font-bold" style={{ color: '#166534' }} dangerouslySetInnerHTML={{ __html: `= ${currentQuestion.answer}` }}></span>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center text-gray-400 text-4xl py-16">
              Generate question
            </div>
          )}
        </div>
      </div>
    );
  };
  

  
  const renderWorksheetMode = (): JSX.Element => {
    if (worksheet.length === 0) {
      return (
        <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: getQuestionBg() }}>
          <span className="text-2xl text-gray-400">Generate worksheet</span>
        </div>
      );
    }
    
    if (isDifferentiated) {
      // Differentiated layout - 3 columns, one per level
      const levels = ['level1', 'level2', 'level3'];
      const levelNames = ['Level 1', 'Level 2', 'Level 3'];
      const toolSettings = getCurrentToolSettings();
      
      // Get level-specific background colors for question boxes
      const getLevelQuestionBoxBg = (level: string): string => {
        const levelColors: Record<string, string> = {
          level1: '#dcfce7', // green-100
          level2: '#fef9c3', // yellow-100
          level3: '#fee2e2', // red-100
        };
        return levelColors[level] || '#f3f4f6';
      };
      
      return (
        <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQuestionBg() }}>
          {/* Font Size Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-1">
            <button 
              onClick={decreaseFontSize}
              disabled={!canDecreaseFontSize()}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                canDecreaseFontSize() 
                  ? 'bg-blue-900 text-white hover:bg-blue-800' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronDown size={20} />
            </button>
            <button 
              onClick={increaseFontSize}
              disabled={!canIncreaseFontSize()}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                canIncreaseFontSize() 
                  ? 'bg-blue-900 text-white hover:bg-blue-800' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronUp size={20} />
            </button>
          </div>
          
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>
            {toolNames[currentTool]} - Worksheet
          </h2>
          
          {/* 3 columns - one per level */}
          <div className="grid grid-cols-3 gap-4">
            {levels.map((level: string, levelIdx: number) => {
              const levelQuestions = worksheet.filter((q: Question) => q.difficulty === level);
              const config = colorConfig[level];
              
              return (
                <div key={level} className={`${config.bg} border-2 ${config.border} rounded-xl p-4`}>
                  <h3 className={`text-xl font-bold mb-4 text-center ${config.text}`}>{levelNames[levelIdx]}</h3>
                  <div className="space-y-3">
                    {levelQuestions.map((q: Question, idx: number) => (
                      toolSettings.useSubstantialBoxes ? (
                        <div key={idx} className="rounded-lg p-3" style={{ backgroundColor: getLevelQuestionBoxBg(level) }}>
                          <span className={`${fontSizes[worksheetFontSize]} font-semibold`} style={{ color: '#000000' }} dangerouslySetInnerHTML={{ __html: `${idx + 1}. ${q.display}` }}></span>
                          {showWorksheetAnswers && (
                            <span className={`${fontSizes[worksheetFontSize]} font-semibold ml-2`} style={{ color: '#059669' }} dangerouslySetInnerHTML={{ __html: `= ${q.answer}` }}></span>
                          )}
                        </div>
                      ) : (
                        <div key={idx} className="p-2">
                          <span className={`${fontSizes[worksheetFontSize]} font-semibold`} style={{ color: '#000000' }} dangerouslySetInnerHTML={{ __html: `${idx + 1}. ${q.display}` }}></span>
                          {showWorksheetAnswers && (
                            <span className={`${fontSizes[worksheetFontSize]} font-semibold ml-2`} style={{ color: '#059669' }} dangerouslySetInnerHTML={{ __html: `= ${q.answer}` }}></span>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    // Non-differentiated layout
    return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQuestionBg() }}>
        {/* Font Size Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <button 
            onClick={decreaseFontSize}
            disabled={!canDecreaseFontSize()}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              canDecreaseFontSize() 
                ? 'bg-blue-900 text-white hover:bg-blue-800' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronDown size={20} />
          </button>
          <button 
            onClick={increaseFontSize}
            disabled={!canIncreaseFontSize()}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              canIncreaseFontSize() 
                ? 'bg-blue-900 text-white hover:bg-blue-800' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronUp size={20} />
          </button>
        </div>
        
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>
          {toolNames[currentTool]} - Worksheet
        </h2>
        
        <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}>
          {worksheet.map((q: Question, idx: number) => (
            toolSettings.useSubstantialBoxes ? (
              <div key={idx} className="rounded-lg p-4 shadow" style={{ backgroundColor: getQuestionBoxBg() }}>
                <span className={`${fontSizes[worksheetFontSize]} font-semibold`} style={{ color: '#000000' }} dangerouslySetInnerHTML={{ __html: `${idx + 1}. ${q.display}` }}></span>
                {showWorksheetAnswers && (
                  <span className={`${fontSizes[worksheetFontSize]} font-semibold ml-2`} style={{ color: '#059669' }} dangerouslySetInnerHTML={{ __html: `= ${q.answer}` }}></span>
                )}
              </div>
            ) : (
              <div key={idx} className="p-3">
                <span className={`${fontSizes[worksheetFontSize]} font-semibold`} style={{ color: '#000000' }} dangerouslySetInnerHTML={{ __html: `${idx + 1}. ${q.display}` }}></span>
                {showWorksheetAnswers && (
                  <span className={`${fontSizes[worksheetFontSize]} font-semibold ml-2`} style={{ color: '#059669' }} dangerouslySetInnerHTML={{ __html: `= ${q.answer}` }}></span>
                )}
              </div>
            )
          ))}
        </div>
      </div>
    );
  };
  

  
  useEffect(() => {
    if (mode !== 'worksheet') {
      handleNewQuestion();
    }
  }, [difficulty, currentTool]);
  

  
  return (
    <>
      {/* Header Bar */}
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          {/* Home Button */}
          <button 
            onClick={() => window.location.href = '/'}
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
            {TOOL_CONFIG.pageTitle}
          </h1>
          
          {/* Divider */}
          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }}></div>
          </div>
          
          {/* Tool Selectors */}
          <div className="flex justify-center gap-4 mb-6">
            {(Object.keys(TOOL_CONFIG.tools) as ToolType[]).map((tool: ToolType) => (
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

// WEB INTEGRATION: Add routing (3 lines at end)
// 1. Top: import routing library hook
// 2. After state: initialize navigation
// 3. Home button: use navigation function
