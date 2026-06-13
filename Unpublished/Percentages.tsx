import { useState, useEffect } from 'react';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// v4.0 TYPESCRIPT-STRICT SHELL - PERCENTAGES TOOL
// Implements Finding Percentages, Percentage Change, and Reverse Percentages

const TOOL_CONFIG = {
  pageTitle: 'Percentages',
  tools: {
    findingPercentages: { 
      name: 'Finding Percentages',
      useSubstantialBoxes: true,
      variables: [
        { key: 'useIntegers', label: 'Integers', defaultValue: false },
        { key: 'useDecimals', label: 'Decimals', defaultValue: false },
      ],
      dropdown: {
        key: 'methodFocus',
        label: '',
        options: [
          { value: 'calculator', label: 'Multiplier' },
          { value: 'nonCalculator', label: 'Chunking' },
        ],
        defaultValue: 'calculator',
      },
      difficultySettings: null,
    },
    percentageChange: { 
      name: 'Percentage Change',
      useSubstantialBoxes: true,
      variables: [
        { key: 'showMultiplier', label: 'Show Multiplier', defaultValue: false },
      ],
      dropdown: {
        key: 'direction',
        label: 'Direction',
        options: [
          { value: 'increase', label: 'Increase' },
          { value: 'decrease', label: 'Decrease' },
          { value: 'mixed', label: 'Mixed' },
        ],
        defaultValue: 'mixed',
      },
      difficultySettings: null,
    },
    reversePercentages: { 
      name: 'Reverse Percentages',
      useSubstantialBoxes: true,
      variables: [
        { key: 'unitaryMethod', label: 'Unitary Method', defaultValue: false },
      ],
      dropdown: {
        key: 'context',
        label: 'Context',
        options: [
          { value: 'sales', label: 'Sales/Discounts' },
          { value: 'vat', label: 'VAT/Tax Increase' },
          { value: 'general', label: 'General' },
        ],
        defaultValue: 'sales',
      },
      difficultySettings: null,
    },
  },
  useGraphicalLayout: false,
};

// TYPE DEFINITIONS
type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';
type DifficultyLevel = 'level1' | 'level2' | 'level3';
type Mode = 'whiteboard' | 'single' | 'worksheet';
type ToolType = 'findingPercentages' | 'percentageChange' | 'reversePercentages';

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
const round2dp = (value: number): number => Math.round(value * 100) / 100;
const formatCurrency = (value: number): string => `£${value.toFixed(2)}`;
const formatPercent = (value: number): string => `${value}%`;
const getMultiplier = (percent: number, isIncrease: boolean): number => {
  return isIncrease ? 1 + (percent / 100) : 1 - (percent / 100);
};
const randomFrom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Context arrays
const itemContexts = ['shirt', 'laptop', 'phone', 'TV', 'watch', 'bag', 'book', 'desk', 'bicycle', 'camera'];
const vatContexts = ['meal', 'service charge', 'hotel bill', 'car hire', 'taxi fare'];
const measurementContexts = [
  { name: 'distance', unit: 'km' },
  { name: 'weight', unit: 'kg' },
  { name: 'height', unit: 'm' },
  { name: 'volume', unit: 'L' }
];

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

  if (tool === 'findingPercentages') {
    // Sub-tool 1: Finding Percentages
    let percent = 0;
    let vOrig = 0;
    let result = 0;
    const useIntegers = variables.useIntegers || false;
    const useDecimals = variables.useDecimals || false;
    const methodFocus = dropdownValue || 'calculator';
    const useNonCalc = methodFocus === 'nonCalculator';

    // Generate base amount based on checkboxes (applies to all levels)
    if (useIntegers && !useDecimals) {
      // Integer mode: any integer between 10 and 250
      vOrig = Math.floor(Math.random() * 241) + 10; // 10 to 250
    } else if (useDecimals && !useIntegers) {
      // Decimal mode: any decimal to 1 d.p. between 10 and 150
      vOrig = round2dp((Math.floor(Math.random() * 1401) + 100) / 10); // 10.0 to 150.0 with 1 d.p.
    } else {
      // Default: multiple of 10 between 10 and 1000
      const baseMultiplier = Math.floor(Math.random() * 100) + 1; // 1 to 100
      vOrig = baseMultiplier * 10; // 10 to 1000
    }

    // Level determines the percentage type only
    if (level === 'level1') {
      // Multiples of 10% or 25%
      const percentOptions = [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];
      percent = randomFrom(percentOptions);
    } else if (level === 'level2') {
      // Any integer percentage
      percent = Math.floor(Math.random() * 90) + 5; // 5-94%
    } else {
      // Level 3: Percentages > 100% or fractional
      if (Math.random() < 0.5) {
        // Greater than 100%
        percent = Math.floor(Math.random() * 150) + 105; // 105-254%
      } else {
        // Fractional percentages
        const fractionalOptions = [0.1, 0.2, 0.4, 0.5, 12.5, 37.5, 62.5, 87.5];
        percent = randomFrom(fractionalOptions);
      }
    }

    result = round2dp((percent / 100) * vOrig);
    const multiplier = percent / 100;

    display = `Find ${formatPercent(percent)} of ${vOrig}`;
    answer = String(result);

    if (useNonCalc) {
      // Non-calculator method: chunking/partitioning
      working = [];
      working.push({ type: 'step', content: `Finding ${formatPercent(percent)} of ${vOrig} using chunking` });
      
      // Calculate key percentages
      const one = round2dp(vOrig * 0.01);
      const ten = round2dp(vOrig * 0.1);
      
      // Always show 10% and 1%
      working.push({ type: 'step', content: `10% = ${vOrig} ÷ 10 = ${ten}` });
      working.push({ type: 'step', content: `1% = ${vOrig} ÷ 100 = ${one}` });
      
      // For Level 1, show additional helpful percentages
      if (level === 'level1') {
        if (percent === 25 || percent === 75) {
          const twentyFive = round2dp(vOrig * 0.25);
          working.push({ type: 'step', content: `25% = ${vOrig} ÷ 4 = ${twentyFive}` });
        }
        if (percent === 50) {
          const fifty = round2dp(vOrig * 0.5);
          working.push({ type: 'step', content: `50% = ${vOrig} ÷ 2 = ${fifty}` });
        }
      }
      
      // Build up to target percentage intelligently
      const buildUpComponents: { percentLabel: string; calculation: string; value: number }[] = [];
      let remainingPercent = percent;
      
      // Use 50% if applicable
      if (remainingPercent >= 50 && level === 'level1' && percent >= 50) {
        const numFifties = Math.floor(remainingPercent / 50);
        if (numFifties > 0) {
          const fifty = round2dp(vOrig * 0.5);
          const totalValue = round2dp(fifty * numFifties);
          buildUpComponents.push({
            percentLabel: `${numFifties * 50}%`,
            calculation: numFifties > 1 ? `${numFifties} × 50% = ${numFifties} × ${fifty}` : `${fifty}`,
            value: totalValue
          });
          remainingPercent -= numFifties * 50;
        }
      }
      
      // Use 25% if applicable
      if (remainingPercent >= 25 && level === 'level1' && (percent === 25 || percent === 75)) {
        const numTwentyFives = Math.floor(remainingPercent / 25);
        if (numTwentyFives > 0) {
          const twentyFive = round2dp(vOrig * 0.25);
          const totalValue = round2dp(twentyFive * numTwentyFives);
          buildUpComponents.push({
            percentLabel: `${numTwentyFives * 25}%`,
            calculation: numTwentyFives > 1 ? `${numTwentyFives} × 25% = ${numTwentyFives} × ${twentyFive}` : `${twentyFive}`,
            value: totalValue
          });
          remainingPercent -= numTwentyFives * 25;
        }
      }
      
      // Use 10% for tens
      if (remainingPercent >= 10) {
        const numTens = Math.floor(remainingPercent / 10);
        const totalValue = round2dp(ten * numTens);
        buildUpComponents.push({
          percentLabel: `${numTens * 10}%`,
          calculation: `${numTens} × 10% = ${numTens} × ${ten}`,
          value: totalValue
        });
        remainingPercent -= numTens * 10;
      }
      
      // Use 1% for remainder
      if (remainingPercent > 0) {
        const totalValue = round2dp(one * remainingPercent);
        buildUpComponents.push({
          percentLabel: `${remainingPercent}%`,
          calculation: `${remainingPercent} × 1% = ${remainingPercent} × ${one}`,
          value: totalValue
        });
      }
      
      // Show the breakdown with calculations
      if (buildUpComponents.length > 0) {
        // Show each component calculation
        buildUpComponents.forEach(comp => {
          working.push({ type: 'step', content: `${comp.calculation} = ${comp.value}` });
        });
        
        // Show the final addition
        const percentLabels = buildUpComponents.map(c => c.percentLabel).join(' + ');
        const values = buildUpComponents.map(c => c.value).join(' + ');
        working.push({ type: 'step', content: `${formatPercent(percent)} = ${percentLabels} = ${values} = ${result}` });
      } else {
        working.push({ type: 'step', content: `${formatPercent(percent)} of ${vOrig} = ${result}` });
      }
    } else {
      // Calculator method: multiplier
      working = [
        { type: 'step', content: `Convert ${formatPercent(percent)} to decimal: ${percent} ÷ 100 = ${multiplier}` },
        { type: 'step', content: `Multiply by the value: ${multiplier} × ${vOrig}` },
        { type: 'step', content: `${formatPercent(percent)} of ${vOrig} = ${result}` }
      ];
    }

    values = { percent, vOrig, result, useIntegers, useDecimals };

  } else if (tool === 'percentageChange') {
    // Sub-tool 2: Percentage Increase/Decrease
    let percent = 0;
    let vOrig = 0;
    let vNew = 0;
    let isIncrease = true;
    const showMultiplier = variables.showMultiplier || false;
    const direction = dropdownValue || 'mixed';

    if (direction === 'increase') {
      isIncrease = true;
    } else if (direction === 'decrease') {
      isIncrease = false;
    } else {
      isIncrease = Math.random() < 0.5;
    }

    if (level === 'level1') {
      // Simple integer increases/decreases
      const percentOptions = [10, 15, 20, 25, 30, 40, 50];
      percent = randomFrom(percentOptions);
      vOrig = Math.floor(Math.random() * 90) + 10; // 10-99
    } else if (level === 'level2') {
      // Standard percentage changes
      percent = isIncrease ? 
        Math.floor(Math.random() * 16) + 5 : // 5-20% for increases (VAT/tips)
        Math.floor(Math.random() * 61) + 10; // 10-70% for decreases (sales)
      vOrig = round2dp((Math.floor(Math.random() * 1900) + 100) / 10); // £10-£200
    } else {
      // Level 3: Compound-style or extreme changes
      if (Math.random() < 0.3) {
        // Compound: two-step change
        const percent1 = Math.floor(Math.random() * 20) + 10;
        const percent2 = Math.floor(Math.random() * 20) + 10;
        vOrig = Math.floor(Math.random() * 150) + 50;
        
        const mult1 = getMultiplier(percent1, true);
        const mult2 = getMultiplier(percent2, false);
        const intermediate = round2dp(vOrig * mult1);
        vNew = round2dp(intermediate * mult2);

        display = `A value starts at £${vOrig}. It increases by ${formatPercent(percent1)}, then decreases by ${formatPercent(percent2)}. Find the final value.`;
        answer = formatCurrency(vNew);

        working = [
          { type: 'step', content: `Initial value: £${vOrig}` },
          { type: 'step', content: `After ${formatPercent(percent1)} increase: £${vOrig} × ${mult1} = £${intermediate}` },
          { type: 'step', content: `After ${formatPercent(percent2)} decrease: £${intermediate} × ${mult2} = ${answer}` }
        ];

        values = { vOrig, vNew, percent1, percent2, compound: true };
        return { display, answer, working, values, difficulty: level };
      } else {
        // Single large change
        percent = isIncrease ? 
          Math.floor(Math.random() * 100) + 50 : // 50-149% increase
          Math.floor(Math.random() * 30) + 60; // 60-89% decrease
        vOrig = Math.floor(Math.random() * 100) + 50;
      }
    }

    const multiplier = getMultiplier(percent, isIncrease);
    vNew = round2dp(vOrig * multiplier);

    const context = randomFrom(itemContexts);
    const changeWord = isIncrease ? 'increased' : 'decreased';
    
    display = `A ${context} costs £${vOrig}. The price ${changeWord} by ${formatPercent(percent)}. Find the new price.`;
    answer = formatCurrency(vNew);

    working = [
      { type: 'step', content: `Original price: £${vOrig}` },
      { type: 'step', content: `Percentage change: ${formatPercent(percent)} ${isIncrease ? 'increase' : 'decrease'}` }
    ];

    if (showMultiplier) {
      const percentCalc = isIncrease ? `100% + ${percent}% = ${100 + percent}%` : `100% − ${percent}% = ${100 - percent}%`;
      working.push({ type: 'step', content: `Multiplier: ${percentCalc} = ${multiplier}` });
    } else {
      working.push({ type: 'step', content: `Multiplier = ${multiplier}` });
    }

    working.push({ type: 'step', content: `New price = £${vOrig} × ${multiplier} = ${answer}` });

    values = { percent, vOrig, vNew, isIncrease, multiplier };

  } else {
    // Sub-tool 3: Reverse Percentages
    let percent = 0;
    let vOrig = 0;
    let vNew = 0;
    let isIncrease = true;
    const unitaryMethod = variables.unitaryMethod || false;
    const context = dropdownValue || 'sales';

    // Determine if increase or decrease based on context
    if (context === 'sales') {
      isIncrease = false;
    } else if (context === 'vat') {
      isIncrease = true;
    } else {
      isIncrease = Math.random() < 0.5;
    }

    if (level === 'level1') {
      // Simple reverse: finding 100% from a known percentage
      const percentOptions = [25, 50, 75, 20, 40, 60, 80];
      percent = randomFrom(percentOptions);
      // Work backwards to ensure clean original
      vOrig = (Math.floor(Math.random() * 19) + 1) * 10; // 10, 20, 30, ... 190
      vNew = round2dp((percent / 100) * vOrig);
      
      display = `${formatPercent(percent)} of a value is £${vNew}. Find the original value (100%).`;
      answer = formatCurrency(vOrig);

      if (unitaryMethod) {
        const onePc = round2dp(vNew / percent);
        working = [
          { type: 'step', content: `${formatPercent(percent)} = £${vNew}` },
          { type: 'step', content: `1% = £${vNew} ÷ ${percent} = £${onePc}` },
          { type: 'step', content: `100% = £${onePc} × 100 = ${answer}` }
        ];
      } else {
        const multiplier = percent / 100;
        working = [
          { type: 'step', content: `${formatPercent(percent)} of original = £${vNew}` },
          { type: 'step', content: `Original × ${multiplier} = £${vNew}` },
          { type: 'step', content: `Original = £${vNew} ÷ ${multiplier} = ${answer}` }
        ];
      }

      values = { percent, vOrig, vNew, isIncrease: false };

    } else if (level === 'level2') {
      // Standard sales/VAT context
      if (context === 'sales') {
        percent = Math.floor(Math.random() * 41) + 15; // 15-55% discount
        // Work backwards for clean original
        vOrig = (Math.floor(Math.random() * 40) + 10) * (Math.random() < 0.5 ? 1 : 2.5); // £10-£100, often ending in .00 or .50
        const multiplier = getMultiplier(percent, false);
        vNew = round2dp(vOrig * multiplier);
      } else {
        // VAT context
        percent = randomFrom([5, 10, 15, 20]); // Common VAT/tax rates
        vOrig = (Math.floor(Math.random() * 40) + 10) * (Math.random() < 0.5 ? 1 : 2.5);
        const multiplier = getMultiplier(percent, true);
        vNew = round2dp(vOrig * multiplier);
      }

      const itemName = randomFrom(itemContexts);
      const changeDesc = isIncrease ? `including ${formatPercent(percent)} VAT` : `after a ${formatPercent(percent)} discount`;
      
      display = `A ${itemName} costs £${vNew} ${changeDesc}. Find the original price.`;
      answer = formatCurrency(vOrig);

      const multiplier = getMultiplier(percent, isIncrease);
      const percentageLabel = isIncrease ? `${100 + percent}%` : `${100 - percent}%`;

      if (unitaryMethod) {
        const totalPercent = isIncrease ? 100 + percent : 100 - percent;
        const onePc = round2dp(vNew / totalPercent);
        working = [
          { type: 'step', content: `New price (${percentageLabel}) = £${vNew}` },
          { type: 'step', content: `1% = £${vNew} ÷ ${totalPercent} = £${onePc}` },
          { type: 'step', content: `Original price (100%) = £${onePc} × 100 = ${answer}` }
        ];
      } else {
        working = [
          { type: 'step', content: `New price represents ${percentageLabel} of original` },
          { type: 'step', content: `Original × ${multiplier} = £${vNew}` },
          { type: 'step', content: `Original = £${vNew} ÷ ${multiplier} = ${answer}` }
        ];
      }

      values = { percent, vOrig, vNew, isIncrease, multiplier };

    } else {
      // Level 3: Large or very small percentage changes
      if (Math.random() < 0.5) {
        // Large change (e.g., 150% increase)
        percent = Math.floor(Math.random() * 100) + 100; // 100-199%
        isIncrease = true;
        vOrig = Math.floor(Math.random() * 50) + 20;
        const multiplier = getMultiplier(percent, true);
        vNew = round2dp(vOrig * multiplier);
        
        display = `A cryptocurrency increased in value by ${formatPercent(percent)} to £${vNew}. Find the original value.`;
      } else {
        // Very small change
        const smallPercents = [0.1, 0.2, 0.5, 1.5, 2.5];
        percent = randomFrom(smallPercents);
        isIncrease = Math.random() < 0.5;
        vOrig = Math.floor(Math.random() * 900) + 100; // £100-£999 for precision
        const multiplier = getMultiplier(percent, isIncrease);
        vNew = round2dp(vOrig * multiplier);
        
        const changeWord = isIncrease ? 'increased' : 'decreased';
        display = `A population ${changeWord} by ${formatPercent(percent)} to ${vNew} thousand. Find the original population.`;
      }

      answer = percent >= 1 ? formatCurrency(vOrig) : `${vOrig} thousand`;
      const multiplier = getMultiplier(percent, isIncrease);

      working = [
        { type: 'step', content: `Final value = ${percent >= 1 ? '£' : ''}${vNew}${percent < 1 ? ' thousand' : ''}` },
        { type: 'step', content: `This represents ${isIncrease ? 100 + percent : 100 - percent}% of the original` },
        { type: 'step', content: `Multiplier = ${multiplier}` },
        { type: 'step', content: `Original = ${percent >= 1 ? '£' : ''}${vNew}${percent < 1 ? ' thousand' : ''} ÷ ${multiplier} = ${answer}` }
      ];

      values = { percent, vOrig, vNew, isIncrease, multiplier };
    }
  }

  return {
    display,
    answer,
    working,
    values,
    difficulty: level,
  };
};

const getQuestionUniqueKey = (q: Question): string => {
  if (q.values.compound) {
    return `${q.values.percent1}-${q.values.percent2}-${q.values.vOrig}`;
  }
  return `${q.values.percent}-${q.values.vOrig}-${q.values.isIncrease}`;
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
  const [currentTool, setCurrentTool] = useState<ToolType>('findingPercentages');
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
  
  // Set variable value (with mutual exclusivity for Finding Percentages)
  const setVariableValue = (key: string, value: boolean): void => {
    setToolVariables((prev: Record<string, Record<string, boolean>>) => {
      const newToolVars = { ...prev[currentTool] };
      
      // Handle mutual exclusivity for Finding Percentages
      if (currentTool === 'findingPercentages') {
        if (key === 'useIntegers' && value) {
          newToolVars.useIntegers = true;
          newToolVars.useDecimals = false;
        } else if (key === 'useDecimals' && value) {
          newToolVars.useDecimals = true;
          newToolVars.useIntegers = false;
        } else {
          newToolVars[key] = value;
        }
      } else {
        newToolVars[key] = value;
      }
      
      return {
        ...prev,
        [currentTool]: newToolVars,
      };
    });
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
          
          {/* Line 3: Variables only (no dropdown in worksheet mode) */}
          {currentVariables.length > 0 && (
            <div className="flex justify-center items-center gap-6 mb-4">
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
            
            {/* Dropdown (only in Worked Example mode) */}
            {mode === 'single' && currentDropdown && (
              <div className="flex items-center gap-3">
                {currentDropdown.label && <span className="text-sm font-semibold" style={{ color: '#000000' }}>{currentDropdown.label}</span>}
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
              <span className="text-6xl font-bold" style={{ color: '#000000' }}>
                {currentQuestion.display}
              </span>
              {showWhiteboardAnswer && (
                <span className="text-6xl font-bold ml-4" style={{ color: '#166534' }}>
                  = {currentQuestion.answer}
                </span>
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
                      <span className="text-4xl font-bold" style={{ color: '#000000' }}>
                        {currentQuestion.display}
                      </span>
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
                          <span className="text-5xl font-bold" style={{ color: '#166534' }}>= {currentQuestion.answer}</span>
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
                <span className="text-6xl font-bold" style={{ color: '#000000' }}>{currentQuestion.display}</span>
              </div>
              
              {showAnswer && (
                <>
                  {/* Working Steps */}
                  <div className="space-y-4 mt-8">
                    {currentQuestion.working.map((step: WorkingStep, i: number) => (
                      <div key={i} className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                        <h4 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>Step {i + 1}</h4>
                        <p className="text-3xl" style={{ color: '#000000' }}>{step.content}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Final Answer */}
                  <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: getFinalAnswerBg() }}>
                    <span className="text-5xl font-bold" style={{ color: '#166534' }}>= {currentQuestion.answer}</span>
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
                          <span className={`${fontSizes[worksheetFontSize]} font-semibold`} style={{ color: '#000000' }}>
                            {idx + 1}. {q.display}
                          </span>
                          {showWorksheetAnswers && (
                            <span className={`${fontSizes[worksheetFontSize]} font-semibold ml-2`} style={{ color: '#059669' }}>
                              = {q.answer}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div key={idx} className="p-2">
                          <span className={`${fontSizes[worksheetFontSize]} font-semibold`} style={{ color: '#000000' }}>
                            {idx + 1}. {q.display}
                          </span>
                          {showWorksheetAnswers && (
                            <span className={`${fontSizes[worksheetFontSize]} font-semibold ml-2`} style={{ color: '#059669' }}>
                              = {q.answer}
                            </span>
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
    const toolSettings = getCurrentToolSettings();
    
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
                <span className={`${fontSizes[worksheetFontSize]} font-semibold`} style={{ color: '#000000' }}>
                  {idx + 1}. {q.display}
                </span>
                {showWorksheetAnswers && (
                  <span className={`${fontSizes[worksheetFontSize]} font-semibold ml-2`} style={{ color: '#059669' }}>
                    = {q.answer}
                  </span>
                )}
              </div>
            ) : (
              <div key={idx} className="p-3">
                <span className={`${fontSizes[worksheetFontSize]} font-semibold`} style={{ color: '#000000' }}>
                  {idx + 1}. {q.display}
                </span>
                {showWorksheetAnswers && (
                  <span className={`${fontSizes[worksheetFontSize]} font-semibold ml-2`} style={{ color: '#059669' }}>
                    = {q.answer}
                  </span>
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
