import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Simple Union Types
type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';
type DifficultyLevel = 'level1' | 'level2' | 'level3';
type Mode = 'whiteboard' | 'single' | 'worksheet';

// Question Types
type WorkingStep = {
  type: string;
  content: string;
};

type Question = {
  display: string;
  answer: string;
  working: WorkingStep[];
  values: { [key: string]: any }; // Index signature for dynamic access
  difficulty: string;
};

// Config Types
interface VariableConfig {
  key: string;
  label: string;
  defaultValue: boolean;
}

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownConfig {
  key: string;
  label: string;
  options: DropdownOption[];
  defaultValue: string;
}

interface DifficultySettings {
  dropdown?: DropdownConfig;
  variables?: VariableConfig[];
}

interface ToolSettings {
  name: string;
  useSubstantialBoxes: boolean;
  variables: VariableConfig[];
  dropdown: DropdownConfig | null;
  difficultySettings: Record<string, DifficultySettings> | null;
}

// ============================================================================
// GENERIC TOOL SHELL - v4.0 TYPESCRIPT WEB-READY
// ============================================================================
// 
// CONVERSION STATUS: ✅ COMPLETE
// - Phase 1-3: Routing, React imports, Type definitions ✅
// - Phase 4-7: Function type annotations ✅
// - Phase 8-11: Callback types, unused variable fixes ✅
// - Phase 12-14: Array literals, routing update, initialization ✅
//
// TYPE SAFETY CHECKLIST:
// ✅ All useState declarations have generic types
// ✅ All function signatures have parameter and return types
// ✅ All .map(), .filter(), .forEach() callbacks typed
// ✅ All Object.entries/fromEntries callbacks typed
// ✅ All event handlers typed (React.ChangeEvent<HTMLInputElement/HTMLSelectElement>)
// ✅ All array literals with strict types use 'as const'
// ✅ Unused 'lvl' parameter removed from getDifficultyButtonClass
// ✅ All variables initialized before use
// ✅ React Router navigate() used instead of window.location.href
// ✅ Index signature added to Question.values for dynamic access
//
// CUSTOMIZATION POINTS:
// 1. TOOL_CONFIG - Define your tools, their names, and settings
// 2. generateQuestion() - Implement your question generation logic
// 3. Add/remove variable checkboxes and dropdowns as needed
// 4. Modify difficulty ranges in your question generation
//
// ============================================================================

// ============================================================================
// CONFIGURATION - RECIPE & PROPORTIONAL REASONING TOOL
// ============================================================================

const TOOL_CONFIG = {
  pageTitle: 'Recipes',
  
  tools: {
    linearScaling: { 
      name: 'Linear Scaling', 
      useSubstantialBoxes: true,
      variables: [],
      dropdown: null,
      difficultySettings: null,
    },
    maxServings: { 
      name: 'Constraints', 
      useSubstantialBoxes: true,
      variables: [
        { key: 'showPlenty', label: 'Plenty', defaultValue: true }
      ],
      dropdown: {
        key: 'questionType',
        label: '',
        options: [
          { value: 'servings', label: 'Servings' },
          { value: 'limit', label: 'Limit' },
          { value: 'mixed', label: 'Mixed' }
        ],
        defaultValue: 'servings'
      },
      difficultySettings: null,
    },
  },
  
  useGraphicalLayout: true,
};

// ============================================================================
// HELPER FUNCTIONS - PHASE 4 TYPED
// ============================================================================

const random = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const gcd = (a: number, b: number): number => {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
};

// Find coprime numbers (for Level 3 unitary method)
const generateCoprimes = (min: number, max: number): [number, number] => {
  let attempts = 0;
  while (attempts < 100) {
    const a = random(min, max);
    const b = random(min, max);
    if (a !== b && gcd(a, b) === 1) {
      return [a, b];
    }
    attempts++;
  }
  // Fallback to known coprimes
  return [7, 9];
};

// Recipe contexts with ingredient categories for realistic proportions
const RECIPE_CONTEXTS = [
  {
    name: 'Chocolate Chip Cookies',
    unit: 'cookies',
    ingredients: [
      { name: 'Flour', category: 'major', unit: 'g' },
      { name: 'Sugar', category: 'major', unit: 'g' },
      { name: 'Butter', category: 'major', unit: 'g' },
      { name: 'Eggs', category: 'discrete', unit: '' }
    ]
  },
  {
    name: 'Pancakes',
    unit: 'pancakes',
    ingredients: [
      { name: 'Flour', category: 'major', unit: 'g' },
      { name: 'Milk', category: 'medium', unit: 'ml' },
      { name: 'Sugar', category: 'major', unit: 'g' },
      { name: 'Eggs', category: 'discrete', unit: '' }
    ]
  },
  {
    name: 'Brownies',
    unit: 'brownies',
    ingredients: [
      { name: 'Flour', category: 'major', unit: 'g' },
      { name: 'Sugar', category: 'major', unit: 'g' },
      { name: 'Cocoa Powder', category: 'major', unit: 'g' },
      { name: 'Eggs', category: 'discrete', unit: '' }
    ]
  },
  {
    name: 'Muffins',
    unit: 'muffins',
    ingredients: [
      { name: 'Flour', category: 'major', unit: 'g' },
      { name: 'Sugar', category: 'major', unit: 'g' },
      { name: 'Butter', category: 'major', unit: 'g' },
      { name: 'Eggs', category: 'discrete', unit: '' }
    ]
  },
  {
    name: 'Scones',
    unit: 'scones',
    ingredients: [
      { name: 'Flour', category: 'major', unit: 'g' },
      { name: 'Butter', category: 'major', unit: 'g' },
      { name: 'Milk', category: 'medium', unit: 'ml' },
      { name: 'Sugar', category: 'major', unit: 'g' }
    ]
  },
  {
    name: 'Victoria Sponge Cake',
    unit: 'servings',
    ingredients: [
      { name: 'Flour', category: 'major', unit: 'g' },
      { name: 'Butter', category: 'major', unit: 'g' },
      { name: 'Sugar', category: 'major', unit: 'g' },
      { name: 'Eggs', category: 'discrete', unit: '' }
    ]
  },
  {
    name: 'Bread Rolls',
    unit: 'rolls',
    ingredients: [
      { name: 'Flour', category: 'major', unit: 'g' },
      { name: 'Water', category: 'medium', unit: 'ml' },
      { name: 'Yeast', category: 'minor', unit: 'g' },
      { name: 'Salt', category: 'minor', unit: 'g' }
    ]
  },
  {
    name: 'Pizza Dough',
    unit: 'pizzas',
    ingredients: [
      { name: 'Flour', category: 'major', unit: 'g' },
      { name: 'Water', category: 'medium', unit: 'ml' },
      { name: 'Olive Oil', category: 'medium', unit: 'ml' },
      { name: 'Yeast', category: 'minor', unit: 'g' }
    ]
  },
  {
    name: 'Shortbread',
    unit: 'biscuits',
    ingredients: [
      { name: 'Flour', category: 'major', unit: 'g' },
      { name: 'Butter', category: 'major', unit: 'g' },
      { name: 'Sugar', category: 'major', unit: 'g' },
      { name: 'Vanilla Extract', category: 'minor', unit: 'ml' }
    ]
  },
  {
    name: 'Flapjacks',
    unit: 'flapjacks',
    ingredients: [
      { name: 'Oats', category: 'major', unit: 'g' },
      { name: 'Butter', category: 'major', unit: 'g' },
      { name: 'Golden Syrup', category: 'medium', unit: 'ml' },
      { name: 'Brown Sugar', category: 'major', unit: 'g' }
    ]
  },
  {
    name: 'Cupcakes',
    unit: 'cupcakes',
    ingredients: [
      { name: 'Flour', category: 'major', unit: 'g' },
      { name: 'Sugar', category: 'major', unit: 'g' },
      { name: 'Butter', category: 'major', unit: 'g' },
      { name: 'Milk', category: 'medium', unit: 'ml' }
    ]
  },
  {
    name: 'Cheese Scones',
    unit: 'scones',
    ingredients: [
      { name: 'Flour', category: 'major', unit: 'g' },
      { name: 'Butter', category: 'major', unit: 'g' },
      { name: 'Cheese', category: 'major', unit: 'g' },
      { name: 'Milk', category: 'medium', unit: 'ml' }
    ]
  }
];

// Utility function for future use - rounds values to realistic recipe amounts
// const roundToRecipeAmount = (value: number): number => {
//   if (value < 50) return Math.round(value / 10) * 10;
//   if (value < 100) return Math.round(value / 25) * 25;
//   if (value < 500) return Math.round(value / 50) * 50;
//   return Math.round(value / 100) * 100;
// };

// ============================================================================
// QUESTION GENERATION - LINEAR SCALING
// ============================================================================

const generateLinearScalingQuestion = (
  level: DifficultyLevel,
  variables: Record<string, boolean>
): Question => {
  let baseServings: number = 0;
  let targetServings: number = 0;
  let scaleFactor: number = 0;
  
  // Select random recipe context
  const recipeContext = RECIPE_CONTEXTS[random(0, RECIPE_CONTEXTS.length - 1)];
  
  if (level === 'level1') {
    // Direct scaling: T = B × k where k ∈ {0.25, 0.5, 2, 3, 4}
    const scaleOptions = [
      { k: 0.25, divisor: 4 },  // B must be divisible by 4
      { k: 0.5, divisor: 2 },   // B must be divisible by 2
      { k: 2, divisor: 1 },     // No restriction
      { k: 3, divisor: 1 },     // No restriction
      { k: 4, divisor: 1 }      // No restriction
    ];
    
    const selected = scaleOptions[random(0, scaleOptions.length - 1)];
    scaleFactor = selected.k;
    
    // Generate B ensuring it meets divisibility requirement
    let attempts = 0;
    do {
      baseServings = random(2, 20);
      targetServings = baseServings * scaleFactor;
      attempts++;
    } while ((baseServings % selected.divisor !== 0 || targetServings > 50) && attempts < 100);
    
  } else if (level === 'level2') {
    // Common Factor (non-integer scaling): gcd(B,T) = f > 1, but T/B is not an integer
    let attempts = 0;
    do {
      const f = random(2, 5); // Common factor
      const m1 = random(2, 4); // First coprime multiplier
      let m2;
      
      // Find m2 that is coprime to m1 AND m2/m1 is not an integer
      do {
        m2 = random(2, 6);
      } while (gcd(m1, m2) !== 1 || m2 % m1 === 0 || m1 % m2 === 0);
      
      baseServings = f * m1;
      targetServings = f * m2;
      scaleFactor = targetServings / baseServings;
      
      attempts++;
    } while ((baseServings > 20 || targetServings > 50) && attempts < 100);
    
  } else {
    // Level 3: Unitary method - coprime numbers
    [baseServings, targetServings] = generateCoprimes(2, 20);
    // Ensure targetServings ≤ 50
    while (targetServings > 50) {
      [baseServings, targetServings] = generateCoprimes(2, 20);
    }
    scaleFactor = targetServings / baseServings;
  }
  
  // STEP 1: Generate unitary values (u) for each ingredient FIRST
  const ingredientsWithUnitary = recipeContext.ingredients.map((ing: any) => {
    let u: number;
    
    if (ing.category === 'discrete') {
      // Discrete ingredient (Eggs): u is multiple of 0.25, range [0.25, 1]
      const multiplier = random(1, 4); // Gives 1, 2, 3, or 4
      u = multiplier * 0.25; // Gives 0.25, 0.5, 0.75, or 1
    } else if (ing.category === 'major') {
      // Major ingredients (Flour, Sugar, Butter, Oats, Cocoa Powder, Cheese): u is multiple of 5, range [15, 50]
      const multiplier = random(3, 10); // Gives 3 to 10
      u = multiplier * 5; // Gives 15, 20, 25, 30, 35, 40, 45, 50
    } else if (ing.category === 'medium') {
      // Medium ingredients (Milk, Water, Olive Oil, Golden Syrup): u is multiple of 5, range [10, 30]
      const multiplier = random(2, 6); // Gives 2 to 6
      u = multiplier * 5; // Gives 10, 15, 20, 25, 30
    } else {
      // Minor ingredients (Yeast, Salt, Vanilla Extract): u is multiple of 5, range [5, 15]
      const multiplier = random(1, 3); // Gives 1 to 3
      u = multiplier * 5; // Gives 5, 10, 15
    }
    
    return {
      name: ing.name,
      unit: ing.unit,
      category: ing.category,
      u: u
    };
  });
  
  // STEP 2: Calculate base recipe values: R = u × B
  const scaledIngredients = ingredientsWithUnitary.map((ing: any) => {
    const baseValue = ing.u * baseServings;
    const scaledValue = ing.u * targetServings;
    
    return {
      name: ing.name,
      unit: ing.unit,
      u: ing.u,
      base: baseValue,
      scaled: scaledValue
    };
  });
  
  // Check if unit conversion needed
  const needsConversion = variables.includeConversion && 
    scaledIngredients.some((ing: any) => ing.unit === 'g' && ing.scaled > 1500);
  
  // Build display showing base recipe values (R = u × B)
  let display = `A recipe for ${baseServings} ${recipeContext.unit} uses:\n\n`;
  
  scaledIngredients.forEach((ing: any) => {
    const value = ing.base % 1 === 0 ? ing.base : parseFloat(ing.base.toFixed(2));
    display += `• ${value}${ing.unit} ${ing.name}\n`;
  });
  
  display += `\nScale this recipe for ${targetServings} ${recipeContext.unit}.`;
  
  // Build answer
  const formatScaledValue = (value: number, unit: string): string => {
    if (needsConversion && unit === 'g' && value >= 1000) {
      return (value / 1000).toFixed(2) + 'kg';
    }
    // Always show the exact value (no rounding)
    if (value % 1 === 0) {
      return value + unit;
    }
    // For decimals, show up to 2 decimal places but remove trailing zeros
    return parseFloat(value.toFixed(2)) + unit;
  };
  
  const answerParts = scaledIngredients.map((ing: any) => 
    `${formatScaledValue(ing.scaled, ing.unit)} ${ing.name}`
  );
  const answer = answerParts.join(', ');
  
  // Build working steps showing the scaling process
  const working: { type: string; content: string }[] = [];
  
  if (level === 'level1') {
    // Level 1: Direct scaling
    working.push({
      type: 'step',
      content: `Calculate scale factor: ${targetServings} ÷ ${baseServings} = ${scaleFactor % 1 === 0 ? scaleFactor : scaleFactor.toFixed(2)}`
    });
    
    scaledIngredients.forEach((ing: any) => {
      const baseValue = ing.base % 1 === 0 ? ing.base : parseFloat(ing.base.toFixed(2));
      const scaledValue = ing.scaled % 1 === 0 ? ing.scaled : parseFloat(ing.scaled.toFixed(2));
      const factorDisplay = scaleFactor % 1 === 0 ? scaleFactor : scaleFactor.toFixed(2);
      
      working.push({
        type: 'step',
        content: `${ing.name}: ${baseValue}${ing.unit} × ${factorDisplay} = ${scaledValue}${ing.unit}`
      });
    });
    
  } else if (level === 'level2') {
    // Level 2: Find common factor, scale to it, then scale to target
    const commonFactor = gcd(baseServings, targetServings);
    const intermediateServings = commonFactor;
    
    working.push({
      type: 'step',
      content: `Find common factor: HCF(${baseServings}, ${targetServings}) = ${commonFactor}`
    });
    
    working.push({
      type: 'step',
      content: `First scale from ${baseServings} to ${intermediateServings} (÷${baseServings / intermediateServings})`
    });
    
    scaledIngredients.forEach((ing: any) => {
      const baseValue = ing.base % 1 === 0 ? ing.base : parseFloat(ing.base.toFixed(2));
      const intermediateValue = ing.u * intermediateServings;
      const intermediateDisplay = intermediateValue % 1 === 0 ? intermediateValue : parseFloat(intermediateValue.toFixed(2));
      
      working.push({
        type: 'step',
        content: `${ing.name}: ${baseValue}${ing.unit} ÷ ${baseServings / intermediateServings} = ${intermediateDisplay}${ing.unit}`
      });
    });
    
    working.push({
      type: 'step',
      content: `Now scale from ${intermediateServings} to ${targetServings} (×${targetServings / intermediateServings})`
    });
    
    scaledIngredients.forEach((ing: any) => {
      const intermediateValue = ing.u * intermediateServings;
      const intermediateDisplay = intermediateValue % 1 === 0 ? intermediateValue : parseFloat(intermediateValue.toFixed(2));
      const scaledValue = ing.scaled % 1 === 0 ? ing.scaled : parseFloat(ing.scaled.toFixed(2));
      
      working.push({
        type: 'step',
        content: `${ing.name}: ${intermediateDisplay}${ing.unit} × ${targetServings / intermediateServings} = ${scaledValue}${ing.unit}`
      });
    });
    
  } else {
    // Level 3: Unitary method - find for 1, then scale
    working.push({
      type: 'step',
      content: `Find ingredients for 1 ${recipeContext.unit.replace(/s$/, '')} (÷${baseServings})`
    });
    
    scaledIngredients.forEach((ing: any) => {
      const baseValue = ing.base % 1 === 0 ? ing.base : parseFloat(ing.base.toFixed(2));
      const unitaryValue = ing.u; // u is already the value for 1 serving
      const unitaryDisplay = unitaryValue % 1 === 0 ? unitaryValue : parseFloat(unitaryValue.toFixed(2));
      
      working.push({
        type: 'step',
        content: `${ing.name}: ${baseValue}${ing.unit} ÷ ${baseServings} = ${unitaryDisplay}${ing.unit}`
      });
    });
    
    working.push({
      type: 'step',
      content: `Now scale to ${targetServings} ${recipeContext.unit} (×${targetServings})`
    });
    
    scaledIngredients.forEach((ing: any) => {
      const unitaryValue = ing.u;
      const unitaryDisplay = unitaryValue % 1 === 0 ? unitaryValue : parseFloat(unitaryValue.toFixed(2));
      const scaledValue = ing.scaled % 1 === 0 ? ing.scaled : parseFloat(ing.scaled.toFixed(2));
      
      working.push({
        type: 'step',
        content: `${ing.name}: ${unitaryDisplay}${ing.unit} × ${targetServings} = ${scaledValue}${ing.unit}`
      });
    });
  }
  
  return {
    display,
    answer,
    working,
    values: { 
      baseServings, 
      targetServings, 
      scaleFactor,
      recipe: recipeContext.name,
              ...Object.fromEntries(scaledIngredients.map((ing: any) => [ing.name, ing.scaled]))
    },
    difficulty: level
  };
};

// ============================================================================
// QUESTION GENERATION - MAX SERVINGS (CONSTRAINTS)
// ============================================================================

const generateMaxServingsQuestion = (
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string
): Question => {
  console.log('=== START generateMaxServingsQuestion ===');
  console.log('level:', level);
  console.log('variables:', variables);
  console.log('dropdownValue:', dropdownValue);
  
  // Determine actual question type
  let actualQuestionType: 'servings' | 'limit';
  if (dropdownValue === 'mixed') {
    actualQuestionType = Math.random() < 0.5 ? 'servings' : 'limit';
  } else {
    actualQuestionType = dropdownValue as 'servings' | 'limit';
  }
  
  console.log('actualQuestionType:', actualQuestionType);
  
  try {
    // Select random recipe context
    const recipeContext = RECIPE_CONTEXTS[random(0, RECIPE_CONTEXTS.length - 1)];
    console.log('Selected recipe:', recipeContext.name);
    
    let baseServings: number;
    let numIngredients: number;
    let numLimiting: number;
    
    // Determine base servings and ingredient counts based on level
    if (level === 'level1') {
      baseServings = 1;
      numIngredients = 3;
      numLimiting = 1;
    } else {
      baseServings = random(2, 12);
      numIngredients = 4;
      numLimiting = level === 'level2' ? 2 : 4;
    }
    
    console.log('baseServings:', baseServings, 'numIngredients:', numIngredients, 'numLimiting:', numLimiting);
    
    // Select ingredients from recipe context
    const selectedIngredients = recipeContext.ingredients.slice(0, numIngredients);
    
    // STEP 1: Generate unitary values (u) for each ingredient
    const ingredientsWithUnitary = selectedIngredients.map(ing => {
      let u: number;
      
      if (ing.category === 'discrete') {
        const multiplier = random(1, 4);
        u = multiplier * 0.25;
      } else if (ing.category === 'major') {
        const multiplier = random(3, 10);
        u = multiplier * 5;
      } else if (ing.category === 'medium') {
        const multiplier = random(2, 6);
        u = multiplier * 5;
      } else {
        const multiplier = random(1, 3);
        u = multiplier * 5;
      }
      
      return {
        name: ing.name,
        unit: ing.unit,
        category: ing.category,
        u: u
      };
    });
    
    // STEP 2: Calculate recipe amounts (R = u × B)
    const recipeAmounts = ingredientsWithUnitary.map(ing => ({
      ...ing,
      needed: ing.u * baseServings
    }));
  
  // STEP 3: Generate target values (T) for limiting ingredients
  // Ensure all limiting ingredients have DIFFERENT T values (by at least 1 after flooring)
  const targetValues: number[] = [];
  
  // Generate base target range
  const baseTarget = level === 'level1' ? random(8, 15) : random(5, 12);
  
  // Shuffle ingredient indices to randomly select which are limiting
  const ingredientIndices = recipeAmounts.map((_, idx) => idx);
  for (let i = ingredientIndices.length - 1; i > 0; i--) {
    const j = random(0, i);
    [ingredientIndices[i], ingredientIndices[j]] = [ingredientIndices[j], ingredientIndices[i]];
  }
  const limitingIndices = ingredientIndices.slice(0, numLimiting);
  
  // Generate unique T values for limiting ingredients with distinct floored values
  const flooredTargets = new Set<number>();
  
  for (let i = 0; i < numLimiting; i++) {
    let t: number;
    let flooredT: number;
    let attempts = 0;
    
    do {
      const integerPart = baseTarget + random(-2, 2);
      
      // Level 1: Always whole numbers
      if (level === 'level1') {
        t = integerPart;
        flooredT = t;
      } else {
        // Levels 2 & 3: Random chance of decimal
        const useDecimal = Math.random() < 0.7; // 70% chance of decimal
        if (useDecimal) {
          const offset = random(1, 9) / 10; // 0.1 to 0.9
          t = integerPart + offset;
          flooredT = Math.floor(t);
        } else {
          t = integerPart;
          flooredT = t;
        }
      }
      
      attempts++;
    } while ((targetValues.includes(t) || flooredTargets.has(flooredT)) && attempts < 50); // Ensure both uniqueness and distinct floored values
    
    targetValues.push(t);
    flooredTargets.add(flooredT);
  }
  
  // Sort to find the minimum (the answer)
  const minTarget = Math.min(...targetValues);
  const answer = Math.floor(minTarget);
  
  // STEP 4: Calculate available amounts (I = T × u) and round to realistic values
  const showPlenty = variables.showPlenty ?? true;
  const stockAmounts = recipeAmounts.map((ing: any, idx: number) => {
    const limitingIndex = limitingIndices.indexOf(idx);
    
    if (limitingIndex !== -1) {
      // This is a limiting ingredient
      const t = targetValues[limitingIndex];
      let stock = t * ing.u;
      
      // Round to realistic amounts
      if (ing.category === 'discrete') {
        // Eggs: round to nearest whole number
        stock = Math.round(stock);
      } else {
        // All other ingredients: round to nearest 10
        stock = Math.round(stock / 10) * 10;
      }
      
      // Recalculate actual target servings based on rounded stock
      const actualTarget = stock / ing.u;
      
      return {
        ...ing,
        stock: stock,
        isPlenty: false,
        targetServings: actualTarget
      };
    } else {
      // This is a "Plenty" or abundance ingredient
      if (showPlenty) {
        return {
          ...ing,
          stock: null, // Will display "Plenty"
          isPlenty: true,
          targetServings: null
        };
      } else {
        // Generate abundance (2-3× the minimum)
        const abundanceFactor = random(2, 3);
        const t = minTarget * abundanceFactor;
        let stock = t * ing.u;
        
        // Round to realistic amounts
        if (ing.category === 'discrete') {
          stock = Math.round(stock);
        } else {
          stock = Math.round(stock / 10) * 10;
        }
        
        // Recalculate actual target servings based on rounded stock
        const actualTarget = stock / ing.u;
        
        return {
          ...ing,
          stock: stock,
          isPlenty: false,
          targetServings: actualTarget
        };
      }
    }
  });
  
  // Recalculate the actual answer based on rounded stock values
  const recalculatedTargets = stockAmounts
    .filter((ing: any) => !ing.isPlenty)
    .map((ing: any) => ing.targetServings!);
  const recalculatedMinTarget = Math.min(...recalculatedTargets);
  const finalAnswer = Math.floor(recalculatedMinTarget);
  
  // STEP 5: Build display with table format
  // Handle singular form for baseServings === 1
  const servingsDisplay = baseServings === 1 
    ? recipeContext.unit.replace(/s$/, '') 
    : recipeContext.unit;
  
  let display = `A recipe for ${baseServings} ${servingsDisplay}:\n\n`;
  
  // Add question text to display based on type
  if (actualQuestionType === 'servings') {
    // Use plural form for the question even when baseServings is 1
    display += `\nHow many ${recipeContext.unit} can you make?`;
  } else {
    display += `\nWhich ingredient limits the production?`;
  }
  
  // Build answer based on question type
  let answerText: string;
  if (actualQuestionType === 'servings') {
    answerText = finalAnswer.toString();
  } else {
    // Find the limiting ingredient
    const limitingIng = stockAmounts.find((ing: any) => !ing.isPlenty && Math.floor(ing.targetServings!) === finalAnswer);
    answerText = limitingIng ? limitingIng.name : 'Unknown';
  }
  
  // Build working steps
  const working: { type: string; content: string }[] = [];
  
  stockAmounts.forEach((ing: any) => {
    if (ing.isPlenty) {
      working.push({
        type: 'step',
        content: `${ing.name}: Plenty available`
      });
    } else {
      const unitaryValue = ing.u % 1 === 0 ? ing.u : parseFloat(ing.u.toFixed(2));
      const stockValue = ing.stock! % 1 === 0 ? ing.stock! : parseFloat(ing.stock!.toFixed(2));
      const targetValue = ing.targetServings!.toFixed(1);
      const flooredTarget = Math.floor(ing.targetServings!);
      
      working.push({
        type: 'step',
        content: `${ing.name}: ${stockValue}${ing.unit} ÷ ${unitaryValue}${ing.unit} = ${targetValue} → ${flooredTarget} ${recipeContext.unit}`
      });
    }
  });
  
  // Identify limiting ingredient (the one with the minimum target servings)
  const limitingIngredient = stockAmounts.find((ing: any) => !ing.isPlenty && Math.floor(ing.targetServings!) === finalAnswer);
  if (limitingIngredient) {
    working.push({
      type: 'step',
      content: `The limiting ingredient is ${limitingIngredient.name} at ${finalAnswer} ${recipeContext.unit}`
    });
  }
  
    return {
      display,
      answer: answerText,
      working,
      values: {
        baseServings,
        recipe: recipeContext.name,
        showPlenty,
        actualQuestionType,
        ...Object.fromEntries(stockAmounts.map((ing: any, idx: number) => [`ingredient${idx}Name`, ing.name])),
        ...Object.fromEntries(stockAmounts.map((ing: any, idx: number) => [`ingredient${idx}Needed`, ing.needed])),
        ...Object.fromEntries(stockAmounts.map((ing: any, idx: number) => [`ingredient${idx}Stock`, ing.stock])),
        ...Object.fromEntries(stockAmounts.map((ing: any, idx: number) => [`ingredient${idx}Unit`, ing.unit])),
        ...Object.fromEntries(stockAmounts.map((ing: any, idx: number) => [`ingredient${idx}IsPlenty`, ing.isPlenty])),
      },
      difficulty: level
    };
  } catch (error) {
    console.error('Error in generateMaxServingsQuestion:', error);
    // Return a fallback question
    return {
      display: 'Error generating question. Please try again.',
      answer: '0',
      working: [],
      values: { error: true },
      difficulty: level
    };
  }
};

// ============================================================================
// MAIN QUESTION GENERATOR - PHASE 5 TYPED
// ============================================================================

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string
): Question => {
  if (tool === 'linearScaling') {
    return generateLinearScalingQuestion(level, variables);
  } else if (tool === 'maxServings') {
    return generateMaxServingsQuestion(level, variables, dropdownValue);
  }
  
  // Fallback (should never reach here)
  return {
    display: 'Error generating question',
    answer: '',
    working: [],
    values: {},
    difficulty: level
  };
};

// Unique key generator for duplicate prevention
const getQuestionUniqueKey = (q: Question): string => {
  if (q.values.scaleFactor !== undefined) {
    // Linear scaling
    return `linear-${q.values.recipe}-${q.values.baseServings}-${q.values.targetServings}`;
  } else {
    // Max servings
    return `max-${q.values.recipe}-${q.values.baseServings}-${Object.values(q.values).filter(v => typeof v === 'number').join('-')}`;
  }
};

// Generate unique question with duplicate prevention
const generateUniqueQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  usedKeys: Set<string>
): Question => {
  let attempts = 0;
  let q: Question;
  let uniqueKey: string;
  
  do {
    q = generateQuestion(tool, level, variables, dropdownValue);
    uniqueKey = getQuestionUniqueKey(q);
    if (++attempts > 100) break;
  } while (usedKeys.has(uniqueKey));
  
  usedKeys.add(uniqueKey);
  return q;
};

// ============================================================================
// HELPER FUNCTION TO RENDER CONSTRAINTS TABLE - PHASE 6 TYPED
// ============================================================================

const renderConstraintsTable = (question: Question, colorScheme: ColorScheme): JSX.Element => {
  const getStepBg = (): string => {
    if (colorScheme === 'blue') return '#B3D9F2';
    if (colorScheme === 'pink') return '#F2B3D9';
    if (colorScheme === 'yellow') return '#F2EBB3';
    return '#f3f4f6';
  };
  
  const baseServings = question.values.baseServings;
  const ingredients: Array<{name: string, needed: string, have: string}> = [];
  
  // Extract ingredients from question values
  let idx = 0;
  while (question.values[`ingredient${idx}Name`] !== undefined) {
    const name = question.values[`ingredient${idx}Name`];
    const needed = question.values[`ingredient${idx}Needed`];
    const stock = question.values[`ingredient${idx}Stock`];
    const unit = question.values[`ingredient${idx}Unit`];
    const isPlenty = question.values[`ingredient${idx}IsPlenty`];
    
    const neededValue = needed % 1 === 0 ? needed : parseFloat(needed.toFixed(2));
    const neededDisplay = `${neededValue}${unit}`;
    
    let haveDisplay: string;
    if (isPlenty) {
      haveDisplay = 'Plenty';
    } else {
      const stockValue = stock % 1 === 0 ? stock : parseFloat(stock.toFixed(2));
      haveDisplay = `${stockValue}${unit}`;
    }
    
    ingredients.push({
      name: name,
      needed: neededDisplay,
      have: haveDisplay
    });
    
    idx++;
  }
  
  const unit = question.display.match(/(\w+) can you make\?$/)?.[1] || 'servings';
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl font-semibold mb-6" style={{ color: '#000000' }}>
        A recipe for {baseServings} {unit}:
      </div>
      
      <table className="border-collapse text-2xl mb-6" style={{ color: '#000000' }}>
        <thead>
          <tr style={{ backgroundColor: getStepBg() }}>
            <th className="border-2 border-gray-600 px-6 py-3 font-bold text-left">Ingredient</th>
            <th className="border-2 border-gray-600 px-6 py-3 font-bold text-center">Needed</th>
            <th className="border-2 border-gray-600 px-6 py-3 font-bold text-center">You Have</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing: any, idx: number) => (
            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : getStepBg() }}>
              <td className="border-2 border-gray-600 px-6 py-3">{ing.name}</td>
              <td className="border-2 border-gray-600 px-6 py-3 text-center">{ing.needed}</td>
              <td className="border-2 border-gray-600 px-6 py-3 text-center">{ing.have}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="text-3xl font-semibold" style={{ color: '#000000' }}>
        How many {unit} can you make?
      </div>
    </div>
  );
};

// Worksheet version with responsive font sizes
const renderConstraintsTableWorksheet = (question: Question, fontSizeIndex: number): JSX.Element => {
  const baseServings = question.values.baseServings;
  const ingredients: Array<{name: string, needed: string, have: string}> = [];
  
  // Extract ingredients from question values
  let idx = 0;
  while (question.values[`ingredient${idx}Name`] !== undefined) {
    const name = question.values[`ingredient${idx}Name`];
    const needed = question.values[`ingredient${idx}Needed`];
    const stock = question.values[`ingredient${idx}Stock`];
    const unit = question.values[`ingredient${idx}Unit`];
    const isPlenty = question.values[`ingredient${idx}IsPlenty`];
    
    const neededValue = needed % 1 === 0 ? needed : parseFloat(needed.toFixed(2));
    const neededDisplay = `${neededValue}${unit}`;
    
    let haveDisplay: string;
    if (isPlenty) {
      haveDisplay = 'Plenty';
    } else {
      const stockValue = stock % 1 === 0 ? stock : parseFloat(stock.toFixed(2));
      haveDisplay = `${stockValue}${unit}`;
    }
    
    ingredients.push({
      name: name,
      needed: neededDisplay,
      have: haveDisplay
    });
    
    idx++;
  }
  
  // Limit font sizes for worksheet to keep tables compact
  const fontSizes = ['text-sm', 'text-base', 'text-lg', 'text-xl'];
  const limitedFontSizeIndex = Math.min(fontSizeIndex, 3); // Cap at text-xl
  const fontSize = fontSizes[limitedFontSizeIndex];
  
  // Handle singular form
  const unit = baseServings === 1 
    ? question.display.match(/A recipe for \d+ (\w+):/)?.[1] || 'serving'
    : question.display.match(/A recipe for \d+ (\w+):/)?.[1] || 'servings';
  
  // Extract question text from display
  const questionText = question.display.split('\n').pop() || '';
  
  return (
    <div className="flex flex-col">
      <div className={`${fontSize} font-semibold mb-2`} style={{ color: '#000000' }}>
        A recipe for {baseServings} {unit}:
      </div>
      
      <table className={`border-collapse text-lg mb-2 w-full`} style={{ color: '#000000' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th className="border-2 border-gray-600 px-2 py-1 font-bold text-left text-base">Ingredient</th>
            <th className="border-2 border-gray-600 px-2 py-1 font-bold text-center text-base">Needed</th>
            <th className="border-2 border-gray-600 px-2 py-1 font-bold text-center text-base">You Have</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing: any, idx: number) => (
            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
              <td className="border-2 border-gray-600 px-2 py-1 text-base">{ing.name}</td>
              <td className="border-2 border-gray-600 px-2 py-1 text-center text-base">{ing.needed}</td>
              <td className="border-2 border-gray-600 px-2 py-1 text-center text-base">{ing.have}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className={`${fontSize} font-semibold`} style={{ color: '#000000' }}>
        {questionText}
      </div>
    </div>
  );
};

// ============================================================================
// DIAGRAM RENDERER - FOR GRAPHICAL LAYOUT (QUESTION DISPLAY) - PHASE 6 TYPED
// ============================================================================

const renderDiagram = (question: Question | null, _size: number, colorScheme: ColorScheme): JSX.Element => {
  // Helper function for step background color
  const getStepBg = (): string => {
    if (colorScheme === 'blue') return '#B3D9F2';
    if (colorScheme === 'pink') return '#F2B3D9';
    if (colorScheme === 'yellow') return '#F2EBB3';
    return '#f3f4f6';
  };
  
  if (!question) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-2xl">
        Generate a question to see the recipe
      </div>
    );
  }
  
  // Check if this is a constraints question (has stock values)
  const isConstraints = question.values.ingredient0Name !== undefined;
  
  if (isConstraints) {
    // Extract recipe info
    const baseServings = question.values.baseServings;
    const ingredients: Array<{name: string, needed: string, have: string}> = [];
    
    // Extract ingredients from question values
    let idx = 0;
    while (question.values[`ingredient${idx}Name`] !== undefined) {
      const name = question.values[`ingredient${idx}Name`];
      const needed = question.values[`ingredient${idx}Needed`];
      const stock = question.values[`ingredient${idx}Stock`];
      const unit = question.values[`ingredient${idx}Unit`];
      const isPlenty = question.values[`ingredient${idx}IsPlenty`];
      
      const neededValue = needed % 1 === 0 ? needed : parseFloat(needed.toFixed(2));
      const neededDisplay = `${neededValue}${unit}`;
      
      let haveDisplay: string;
      if (isPlenty) {
        haveDisplay = 'Plenty';
      } else {
        const stockValue = stock % 1 === 0 ? stock : parseFloat(stock.toFixed(2));
        haveDisplay = `${stockValue}${unit}`;
      }
      
      ingredients.push({
        name: name,
        needed: neededDisplay,
        have: haveDisplay
      });
      
      idx++;
    }
    
    // Handle singular form
    const unit = baseServings === 1 
      ? question.display.match(/A recipe for \d+ (\w+):/)?.[1] || 'serving'
      : question.display.match(/A recipe for \d+ (\w+):/)?.[1] || 'servings';
    
    // Extract question text from display
    const questionText = question.display.split('\n').pop() || '';
    
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-3xl font-semibold mb-6" style={{ color: '#000000' }}>
          A recipe for {baseServings} {unit}:
        </div>
        
        <table className="border-collapse text-2xl" style={{ color: '#000000' }}>
          <thead>
            <tr style={{ backgroundColor: getStepBg() }}>
              <th className="border-2 border-gray-600 px-6 py-3 font-bold text-left">Ingredient</th>
              <th className="border-2 border-gray-600 px-6 py-3 font-bold text-center">Needed</th>
              <th className="border-2 border-gray-600 px-6 py-3 font-bold text-center">You Have</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing, idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : getStepBg() }}>
                <td className="border-2 border-gray-600 px-6 py-3">{ing.name}</td>
                <td className="border-2 border-gray-600 px-6 py-3 text-center">{ing.needed}</td>
                <td className="border-2 border-gray-600 px-6 py-3 text-center">{ing.have}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="text-3xl font-semibold mt-6" style={{ color: '#000000' }}>
          {questionText}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-left w-full">
        <div className="text-3xl font-semibold whitespace-pre-line leading-relaxed" style={{ color: '#000000' }}>
          {question.display}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function GenericToolShell() {
  // React Router Navigation
  const navigate = useNavigate();
  
  // Tool & Mode State
  const [currentTool, setCurrentTool] = useState<string>('linearScaling');
  const [mode, setMode] = useState<Mode>('whiteboard');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('level1');
  
  // Per-tool variable and dropdown states (keyed by tool)
  const [toolVariables, setToolVariables] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    Object.entries(TOOL_CONFIG.tools).forEach(([toolKey, tool]: [string, any]) => {
      initial[toolKey] = {};
      (tool.variables || []).forEach((v: VariableConfig) => {
        initial[toolKey][v.key] = v.defaultValue;
      });
    });
    return initial;
  });
  
  const [toolDropdowns, setToolDropdowns] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    Object.entries(TOOL_CONFIG.tools).forEach(([toolKey, tool]: [string, any]) => {
      if (tool.dropdown) {
        initial[toolKey] = tool.dropdown.defaultValue;
      }
    });
    return initial;
  });
  
  // Questions (SHARED between Whiteboard & Worked Example)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  
  // Worksheet State
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [worksheet, setWorksheet] = useState<Question[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState<boolean>(false);
  const [isDifferentiated, setIsDifferentiated] = useState<boolean>(false);
  const [numColumns, setNumColumns] = useState<number>(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState<number>(2); // Start at text-xl (index 2)
  
  // UI State
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  
  // ============================================================================
  // COLOR SCHEME HELPERS - PHASE 4 TYPED
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
  
  // Get background for substantial question boxes (uses darker shade from color scheme)
  const getQuestionBoxBg = (): string => getStepBg();
  
  // ============================================================================
  // DIFFICULTY BUTTON STYLING - PHASE 4 TYPED (CRITICAL - REMOVE UNUSED lvl)
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
  // QUESTION HANDLERS - PHASE 7 TYPED
  // ============================================================================
  
  const handleNewQuestion = (): void => {
    try {
      const variables = toolVariables[currentTool] || {};
      const dropdownValue = toolDropdowns[currentTool] || '';
      const q = generateQuestion(currentTool, difficulty, variables, dropdownValue);
      setCurrentQuestion(q);
      setShowWhiteboardAnswer(false);
      setShowAnswer(false);
    } catch (error) {
      console.error('Error generating question:', error);
    }
  };
  
  // Generate initial question on mount or when switching tools (but NOT when switching between whiteboard/worked example)
  useEffect(() => {
    if (mode !== 'worksheet') {
      handleNewQuestion();
    }
  }, [currentTool]);
  
  const handleShowAnswer = (): void => {
    if (mode === 'whiteboard') {
      setShowWhiteboardAnswer(!showWhiteboardAnswer);
    } else {
      setShowAnswer(!showAnswer);
    }
  };
  
  // ============================================================================
  // WORKSHEET HANDLERS - PHASE 7 TYPED
  // ============================================================================
  
  const handleGenerateWorksheet = (): void => {
    const usedKeys = new Set<string>();
    const questions: Question[] = [];
    const variables = toolVariables[currentTool] || {};
    const dropdownValue = toolDropdowns[currentTool] || '';
    
    if (isDifferentiated) {
      // Generate questions for each level
      const levels: readonly DifficultyLevel[] = ['level1', 'level2', 'level3'] as const;
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
  
  // ============================================================================
  // FONT SIZE HELPERS - PHASE 7 TYPED
  // ============================================================================
  
  const fontSizes: string[] = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  
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
  
  // ============================================================================
  // TOOL CONFIG HELPER - PHASE 7 TYPED
  // ============================================================================
  
  const getCurrentToolSettings = (): ToolSettings => {
    return TOOL_CONFIG.tools[currentTool as keyof typeof TOOL_CONFIG.tools];
  };
  
  const toolNames: Record<string, string> = Object.fromEntries(
    Object.entries(TOOL_CONFIG.tools).map(([key, value]: [string, any]) => [key, value.name])
  );
  
  // Get the current dropdown config (accounting for difficulty-specific settings)
  const getCurrentDropdownConfig = (): DropdownConfig | null => {
    const toolSettings = getCurrentToolSettings();
    if (toolSettings?.difficultySettings?.[difficulty]?.dropdown) {
      return toolSettings.difficultySettings[difficulty].dropdown!;
    }
    return toolSettings?.dropdown || null;
  };
  
  // Get the current variables config (accounting for difficulty-specific settings)
  const getCurrentVariablesConfig = (): VariableConfig[] => {
    const toolSettings = getCurrentToolSettings();
    if (toolSettings?.difficultySettings?.[difficulty]?.variables) {
      return toolSettings.difficultySettings[difficulty].variables!;
    }
    return toolSettings?.variables || [];
  };
  
  // Get current variable value
  const getVariableValue = (key: string): boolean => {
    return toolVariables[currentTool]?.[key] ?? false;
  };
  
  // Set variable value
  const setVariableValue = (key: string, value: boolean): void => {
    setToolVariables(prev => ({
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
    setToolDropdowns(prev => ({
      ...prev,
      [currentTool]: value,
    }));
  };
  
  // ============================================================================
  // DIFFERENTIATED WORKSHEET COLORS - PHASE 4 TYPED
  // ============================================================================
  
  const colorConfig: Record<string, { bg: string; border: string; text: string }> = {
    level1: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700' },
    level2: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700' },
    level3: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700' },
  };
  
  // ============================================================================
  // RENDER CONTROL BAR - PHASE 6 TYPED
  // ============================================================================
  
  const renderControlBar = (): JSX.Element => {
    const currentVariables = getCurrentVariablesConfig();
    const currentDropdown = getCurrentDropdownConfig();
    
    if (mode === 'worksheet') {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Line 1: Questions + Differentiated */}
          <div className="flex justify-center items-center gap-6 mb-4">
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
          
                      {/* Difficulty + Columns (hidden if differentiated) */}
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
                  max="3" 
                  value={numColumns}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumColumns(Math.max(1, Math.min(3, parseInt(e.target.value) || 2)))}
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
                  {currentVariables.map(variable => (
                    <label key={variable.key} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={getVariableValue(variable.key)} 
                        onChange={(e) => setVariableValue(variable.key, e.target.checked)} 
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-semibold" style={{ color: '#000000' }}>{variable.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {currentDropdown && (
                <div className="flex items-center gap-3">
                  {currentDropdown.label && (
                    <span className="text-sm font-semibold" style={{ color: '#000000' }}>{currentDropdown.label}:</span>
                  )}
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
                {currentDropdown.label && (
                  <span className="text-sm font-semibold" style={{ color: '#000000' }}>{currentDropdown.label}:</span>
                )}
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
              onClick={() => {
                console.log('New Question clicked for tool:', currentTool);
                handleNewQuestion();
              }}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52"
            >
              <RefreshCw size={18} /> New Question
            </button>
            <button 
              onClick={() => {
                console.log('Show Answer clicked');
                handleShowAnswer();
              }}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52"
            >
              <Eye size={18} /> {(mode === 'whiteboard' ? showWhiteboardAnswer : showAnswer) ? 'Hide Answer' : 'Show Answer'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // ============================================================================
  // RENDER WHITEBOARD MODE - PHASE 6 TYPED
  // ============================================================================
  
  const renderWhiteboardMode = (): JSX.Element => {
    if (TOOL_CONFIG.useGraphicalLayout) {
      return (
        <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
          <div className="flex gap-6">
            {/* Question Area */}
            <div 
              className="rounded-xl flex items-center justify-center"
              style={{ width: '550px', minHeight: '500px', backgroundColor: getStepBg() }}
            >
              {renderDiagram(currentQuestion, 400, colorScheme)}
            </div>
            {/* Working Area */}
            <div 
              className="flex-1 rounded-xl p-6" 
              style={{ minHeight: '500px', backgroundColor: getWhiteboardWorkingBg() }}
            >
              {showWhiteboardAnswer && currentQuestion && (
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: '#166534' }}>
                    {currentQuestion.answer}
                  </div>
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
              <div className="text-2xl font-semibold mb-6 whitespace-pre-line text-left max-w-4xl mx-auto" style={{ color: '#000000' }}>
                {currentQuestion.display}
              </div>
              {showWhiteboardAnswer && (
                <div className="text-4xl font-bold mt-6" style={{ color: '#166534' }}>
                  {currentQuestion.answer}
                </div>
              )}
            </>
          ) : (
            <span className="text-4xl text-gray-400">Click "New Question" to start</span>
          )}
        </div>
        <div 
          className="rounded-xl mt-8" 
          style={{ height: '400px', backgroundColor: getWhiteboardWorkingBg() }}
        ></div>
      </div>
    );
  };
  
  // ============================================================================
  // RENDER WORKED EXAMPLE MODE - PHASE 6 TYPED
  // ============================================================================
  
  const renderWorkedExampleMode = (): JSX.Element => {
    // Check if this is a constraints question
    const isConstraints = currentQuestion && currentQuestion.values.ingredient0Name !== undefined;
    
    return (
      <div className="overflow-y-auto" style={{ maxHeight: '120vh' }}>
        <div className="rounded-xl shadow-lg p-8 w-full" style={{ backgroundColor: getQuestionBg() }}>
          {currentQuestion ? (
            <>
              {/* Question */}
              {isConstraints ? (
                <div className="mb-8">
                  {renderConstraintsTable(currentQuestion, colorScheme)}
                </div>
              ) : (
                <div className="mb-8">
                  <div className="text-3xl font-semibold whitespace-pre-line max-w-5xl mx-auto text-left leading-relaxed" style={{ color: '#000000' }}>
                    {currentQuestion.display}
                  </div>
                </div>
              )}
              
              {showAnswer && (
                <>
                  {/* Working Steps */}
                  <div className="space-y-4 mt-8 max-w-5xl mx-auto">
                    {currentQuestion.working.map((step: { type: string; content: string }, i: number) => (
                      <div key={i} className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                        <h4 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>Step {i + 1}</h4>
                        <p className="text-2xl" style={{ color: '#000000' }}>{step.content}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Final Answer */}
                  <div className="rounded-xl p-6 text-center mt-4 max-w-5xl mx-auto" style={{ backgroundColor: getFinalAnswerBg() }}>
                    <span className="text-4xl font-bold" style={{ color: '#166534' }}>{currentQuestion.answer}</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center text-gray-400 text-4xl py-16">
              Click "New Question" to start
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // ============================================================================
  // RENDER WORKSHEET MODE - PHASE 6 TYPED
  // ============================================================================
  
  const renderWorksheetMode = (): JSX.Element => {
    if (worksheet.length === 0) {
      return (
        <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: getQuestionBg() }}>
          <span className="text-2xl text-gray-400">Click "Generate Worksheet" to create questions</span>
        </div>
      );
    }
    
    if (isDifferentiated) {
      // Differentiated layout - 3 columns, one per level
      const levels: readonly DifficultyLevel[] = ['level1', 'level2', 'level3'] as const;
      const levelNames = ['Level 1', 'Level 2', 'Level 3'];
      
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
            {levels.map((level: DifficultyLevel, levelIdx: number) => {
              const levelQuestions = worksheet.filter((q: Question) => q.difficulty === level);
              const config = colorConfig[level];
              
              return (
                <div key={level} className={`${config.bg} border-2 ${config.border} rounded-xl p-4`}>
                  <h3 className={`text-xl font-bold mb-4 text-center ${config.text}`}>{levelNames[levelIdx]}</h3>
                  <div className="space-y-4">
                    {levelQuestions.map((q: Question, idx: number) => {
                      const isConstraints = q.values.ingredient0Name !== undefined;
                      
                      return (
                        <div key={idx} className="rounded-lg p-4" style={{ backgroundColor: getLevelQuestionBoxBg(level) }}>
                          {isConstraints ? (
                            <div>
                              <div className={`${fontSizes[worksheetFontSize]} font-bold mb-2`} style={{ color: '#000000' }}>
                                {idx + 1}.
                              </div>
                              {renderConstraintsTableWorksheet(q, worksheetFontSize)}
                            </div>
                          ) : (
                            <div className={`${fontSizes[worksheetFontSize]} font-semibold mb-2 whitespace-pre-line leading-snug`} style={{ color: '#000000' }}>
                              {idx + 1}. {q.display}
                            </div>
                          )}
                          {showWorksheetAnswers && (
                            <div className={`${fontSizes[worksheetFontSize]} font-semibold mt-2`} style={{ color: '#059669' }}>
                              Answer: {q.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
        
        {/* Determine effective columns: max 3 for constraints, otherwise user-set */}
        {(() => {
          const hasConstraints = worksheet.some(q => q.values.ingredient0Name !== undefined);
          const effectiveColumns = hasConstraints ? Math.min(numColumns, 3) : numColumns;
          
          return (
            <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)` }}>
              {worksheet.map((q: Question, idx: number) => {
                const isConstraints = q.values.ingredient0Name !== undefined;
            
            return (
              <div key={idx} className="rounded-lg p-5 shadow-md" style={{ backgroundColor: getQuestionBoxBg() }}>
                {isConstraints ? (
                  <div>
                    <div className={`${fontSizes[worksheetFontSize]} font-bold mb-2`} style={{ color: '#000000' }}>
                      {idx + 1}.
                    </div>
                    {renderConstraintsTableWorksheet(q, worksheetFontSize)}
                  </div>
                ) : (
                  <div className={`${fontSizes[worksheetFontSize]} font-semibold mb-3 whitespace-pre-line leading-snug`} style={{ color: '#000000' }}>
                    {idx + 1}. {q.display}
                  </div>
                )}
                {showWorksheetAnswers && (
                  <div className={`${fontSizes[worksheetFontSize]} font-semibold mt-3 pt-3 border-t-2 border-gray-300`} style={{ color: '#059669' }}>
                    Answer: {q.answer}
                  </div>
                )}
              </div>
            );
              })}
            </div>
          );
        })()}
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
            {TOOL_CONFIG.pageTitle}
          </h1>
          
          {/* Divider */}
          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }}></div>
          </div>
          
          {/* Tool Selectors */}
          <div className="flex justify-center gap-4 mb-6">
            {Object.keys(TOOL_CONFIG.tools).map((tool: string) => (
              <button 
                key={tool} 
                onClick={() => setCurrentTool(tool)}
                className={'px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl w-64 ' +
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
