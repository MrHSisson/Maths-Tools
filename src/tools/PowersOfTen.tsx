import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// v4.0 TYPESCRIPT-STRICT SHELL
// Powers of 10: Multiply & Divide

const TOOL_CONFIG = {
  pageTitle: 'Powers of 10: Multiply & Divide',
  tools: {
    directCalc: { 
      name: 'Direct Calculation', 
      useSubstantialBoxes: true,
      variables: [
        { key: 'powersNotation', label: '10ⁿ', defaultValue: false },
      ],
      dropdown: {
        key: 'operation',
        label: 'Operation',
        options: [
          { value: 'mixed', label: 'Mixed' },
          { value: 'multiply', label: 'Multiply' },
          { value: 'divide', label: 'Divide' },
        ],
        defaultValue: 'mixed',
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
type ToolType = 'directCalc';

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
const getPowerOfTen = (level: DifficultyLevel): number => {
  if (level === 'level1') {
    const powers = [10, 100, 1000];
    return powers[Math.floor(Math.random() * powers.length)];
  } else if (level === 'level2') {
    const powers = [10, 100, 1000, 10000, 100000];
    return powers[Math.floor(Math.random() * powers.length)];
  } else {
    const powers = [10, 100, 1000, 10000, 100000, 1000000];
    return powers[Math.floor(Math.random() * powers.length)];
  }
};

const countZeros = (power: number): number => {
  return Math.round(Math.log10(power));
};

const formatPower = (power: number, usePowersNotation: boolean): string => {
  if (usePowersNotation) {
    const exponent = countZeros(power);
    return `10${getSuperscript(exponent)}`;
  }
  return power.toLocaleString();
};

const getSuperscript = (n: number): string => {
  const superscripts: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', 
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  return n.toString().split('').map(d => superscripts[d] || d).join('');
};

const formatNumber = (num: number): string => {
  // Avoid scientific notation
  if (num === 0) return '0';
  
  // Convert to string first to preserve all digits
  let str = num.toString();
  
  // Handle scientific notation
  if (str.includes('e')) {
    // For very small numbers, expand the scientific notation manually
    const parts = str.split('e');
    parseFloat(parts[0]);
    const exp = parseInt(parts[1]);
    
    if (exp < 0) {
      // Negative exponent - very small number
      const decimalPlaces = Math.abs(exp) + (parts[0].includes('.') ? parts[0].split('.')[1].length : 0);
      str = num.toFixed(decimalPlaces);
    } else {
      // Positive exponent - large number
      str = num.toFixed(0);
    }
  }
  
  // Remove commas first if any
  str = str.replace(/,/g, '');
  
  // Split into integer and decimal parts
  let parts: string[];
  if (str.includes('.')) {
    parts = str.split('.');
    // Keep all decimal places - don't remove trailing zeros
  } else {
    parts = [str];
  }
  
  // Add thousand separators to integer part
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
};

const getPlaceValueColumns = (level?: DifficultyLevel): string[] => {
  if (level === 'level1') {
    // Only whole numbers for Level 1
    return ['M', 'HTt', 'TTt', 'Tt', 'H', 'T', 'O'];
  } else {
    // Full range for Level 2 and Level 3
    return ['M', 'HTt', 'TTt', 'Tt', 'H', 'T', 'O', 't', 'h', 'th', 'tth', 'htth', 'mth'];
  }
};

const findDecimalPosition = (num: number): number => {
  const str = num.toString();
  const decimalIndex = str.indexOf('.');
  if (decimalIndex === -1) {
    // No decimal, position is after the last digit
    return str.length;
  }
  return decimalIndex;
};



const getDigitAtPosition = (num: number, position: number, onesIndex: number): string => {
  // Remove commas and convert to string
  const str = num.toString().replace(/,/g, '');
  
  // Find decimal point
  const decimalIdx = str.indexOf('.');
  
  // Split into whole and fractional parts
  let wholePart = '';
  let fractionalPart = '';
  
  if (decimalIdx === -1) {
    wholePart = str;
    fractionalPart = '';
  } else {
    wholePart = str.substring(0, decimalIdx);
    fractionalPart = str.substring(decimalIdx + 1);
  }
  
  // Calculate which digit we need
  if (position === onesIndex) {
    // Ones position - last digit of whole part
    return wholePart.length > 0 ? wholePart[wholePart.length - 1] : '0';
  } else if (position < onesIndex) {
    // Tens, hundreds, thousands, etc. (to the left of ones)
    const stepsLeft = onesIndex - position; // 1 for tens, 2 for hundreds, etc.
    const idx = wholePart.length - 1 - stepsLeft; // Index in wholePart string
    
    if (idx >= 0 && idx < wholePart.length) {
      return wholePart[idx];
    }
    return '';
  } else {
    // Tenths, hundredths, etc. (to the right of ones)
    const stepsRight = position - onesIndex; // 1 for tenths, 2 for hundredths, etc.
    const idx = stepsRight - 1; // Index in fractionalPart string (0-indexed)
    
    if (idx >= 0 && idx < fractionalPart.length) {
      return fractionalPart[idx];
    }
    return '';
  }
};

// QUESTION GENERATION
const generateQuestion = (
  _tool: ToolType,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string
): Question => {
  // For Level 2, skip validation loop
  if (level === 'level2') {
    return generateQuestionAttempt(_tool, level, variables, dropdownValue);
  }

  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;
    const result = generateQuestionAttempt(_tool, level, variables, dropdownValue);
    const answerStr = result.answer.replace(/,/g, '');
    if (answerStr.includes('.')) {
      const decimalPart = answerStr.split('.')[1];
      if (decimalPart && decimalPart.length > 7) continue;
    }
    return result;
  }

  return generateQuestionAttempt(_tool, level, variables, dropdownValue);
};

const generateQuestionAttempt = (
  tool: ToolType,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string
): Question => {
  let vin = 0;
  let vout = 0;
  let power = 0;
  let op = '';
  let display = '';
  let answer = '';
  let working: WorkingStep[] = [];
  let zeros = 0;
  
  const usePowersNotation = variables['powersNotation'] || false;
  
  // Determine operation
  if (dropdownValue === 'mixed') {
    op = Math.random() < 0.5 ? 'multiply' : 'divide';
  } else {
    op = dropdownValue;
  }
  
  // Set power for levels 1 and 3
  if (level === 'level1' || level === 'level3') {
    power = getPowerOfTen(level);
    zeros = countZeros(power);
  }
  
  if (level === 'level1') {
    // Vin is integer, Vout must be integer, max 3 non-zero digits
    power = getPowerOfTen(level);
    
    if (op === 'multiply') {
      // Generate number with at most 3 non-zero digits
      const digits = Math.floor(Math.random() * 3) + 1; // 1-3 digits
      
      if (digits === 1) {
        vin = Math.floor(Math.random() * 9) + 1; // 1-9
      } else if (digits === 2) {
        vin = Math.floor(Math.random() * 90) + 10; // 10-99
      } else {
        vin = Math.floor(Math.random() * 900) + 100; // 100-999
      }
      
      vout = vin * power;
      
      // Ensure result doesn't exceed 7 digits
      if (vout > 9999999) {
        vin = Math.floor(vin / 10);
        vout = vin * power;
      }
    } else {
      // Divide - work backwards to ensure integer result with max 3 non-zero digits
      const digits = Math.floor(Math.random() * 3) + 1; // 1-3 digits
      
      if (digits === 1) {
        vout = Math.floor(Math.random() * 9) + 1; // 1-9
      } else if (digits === 2) {
        vout = Math.floor(Math.random() * 90) + 10; // 10-99
      } else {
        vout = Math.floor(Math.random() * 900) + 100; // 100-999
      }
      
      vin = vout * power;
    }
  } else if (level === 'level2') {
    // Generate integer between 1 and 9999
    const baseInteger = Math.floor(Math.random() * 9999) + 1;
    
    // Decide whether to divide by 10 (1 d.p.) or 100 (2 d.p.)
    const divideBy = Math.random() < 0.5 ? 10 : 100;
    
    // Create the decimal input
    vin = baseInteger / divideBy;
    
    // Select appropriate power based on divideBy value
    if (divideBy === 10) {
      // 1 decimal place
      if (op === 'multiply') {
        // Can multiply by 10, 100, 1000, or 10000
        const powers = [10, 100, 1000, 10000];
        power = powers[Math.floor(Math.random() * powers.length)];
      } else {
        // Can divide by 10, 100, 1000, 10000, or 100000
        const powers = [10, 100, 1000, 10000, 100000];
        power = powers[Math.floor(Math.random() * powers.length)];
      }
    } else {
      // 2 decimal places (divideBy === 100)
      if (op === 'multiply') {
        // Can multiply by 10, 100, 1000, 10000, or 100000
        const powers = [10, 100, 1000, 10000, 100000];
        power = powers[Math.floor(Math.random() * powers.length)];
      } else {
        // Can divide by 10, 100, 1000, or 10000
        const powers = [10, 100, 1000, 10000];
        power = powers[Math.floor(Math.random() * powers.length)];
      }
    }
    
    // Calculate output
    if (op === 'multiply') {
      vout = vin * power;
    } else {
      vout = vin / power;
    }
    
    // No rounding - use exact result
    vout = parseFloat(vout.toFixed(12)); // Only to handle floating point precision
  } else {
    // Level 3 - extreme numbers, answer must be between 0.000001 and 1,000,000,000
    if (op === 'multiply') {
      // Choose whether to generate large or small input
      if (Math.random() < 0.5) {
        // Large number input
        vin = Math.floor(Math.random() * 900000) + 100000; // 100,000 to 999,999
        
        // Choose power that keeps result under 1 billion
        const maxPower = Math.floor(1000000000 / vin);
        const availablePowers = [10, 100, 1000, 10000, 100000, 1000000].filter(p => p <= maxPower);
        power = availablePowers.length > 0 
          ? availablePowers[Math.floor(Math.random() * availablePowers.length)]
          : 10;
          
        vout = vin * power;
      } else {
        // Very small number input - build as string to avoid floating point errors
        const decimalPlaces = Math.floor(Math.random() * 4) + 5; // 5-8 decimal places
        const randomDigits = Math.floor(Math.random() * 9000) + 1000; // 4 digits
        const digitStr = randomDigits.toString();
        const leadingZeros = '0'.repeat(decimalPlaces - digitStr.length);
        vin = parseFloat(`0.${leadingZeros}${digitStr}`);
        
        // Choose power that keeps result over 0.000001
        power = getPowerOfTen(level);
        vout = vin * power;
        
        // If result too small, increase power
        while (vout < 0.000001 && power < 1000000) {
          power = power * 10;
          vout = vin * power;
        }
        
        // Round result to avoid floating point errors
        vout = parseFloat(vout.toFixed(12));
      }
    } else {
      // Division
      if (Math.random() < 0.5) {
        // Large number input
        vin = Math.floor(Math.random() * 900000) + 100000; // 100,000 to 999,999
        power = getPowerOfTen(level);
        vout = vin / power;
        
        // If result too small, decrease power
        while (vout < 0.000001 && power > 10) {
          power = power / 10;
          vout = vin / power;
        }
        
        // Round to clean decimal
        vout = parseFloat(vout.toFixed(12));
      } else {
        // Very small number input - build as string to avoid floating point errors
        const decimalPlaces = Math.floor(Math.random() * 4) + 5; // 5-8 decimal places
        const randomDigits = Math.floor(Math.random() * 9000) + 1000;
        const digitStr = randomDigits.toString();
        const leadingZeros = '0'.repeat(decimalPlaces - digitStr.length);
        vin = parseFloat(`0.${leadingZeros}${digitStr}`);
        
        // Choose smaller power for division to keep result in range
        const smallPowers = [10, 100, 1000];
        power = smallPowers[Math.floor(Math.random() * smallPowers.length)];
        vout = vin / power;
        
        // Ensure result is not too small
        if (vout < 0.000001) {
          vin = parseFloat((vin * 1000).toFixed(12));
          vout = vin / power;
        }
        
        // Round to clean decimal
        vout = parseFloat(vout.toFixed(12));
      }
    }
    
    // Final safety check
    if (vout >= 1000000000) vout = 999999999;
    if (vout < 0.000001 && vout !== 0) vout = 0.000001;
  }
  
  // Build display
  const opSymbol = op === 'multiply' ? '×' : '÷';
  display = `${formatNumber(vin)} ${opSymbol} ${formatPower(power, usePowersNotation)}`;
  answer = formatNumber(vout);
  
  // Recalculate zeros from final power to ensure accuracy
  zeros = countZeros(power);
  
  // Build working steps
  const powerDisplay = formatPower(power, usePowersNotation);
  const exponent = countZeros(power);
  
  working.push({
    type: 'step',
    content: usePowersNotation 
      ? `Setup — 10${getSuperscript(exponent)} means ${zeros} zero${zeros !== 1 ? 's' : ''}`
      : `Setup — ${powerDisplay} has ${zeros} zero${zeros !== 1 ? 's' : ''}`
  });
  
  const direction = op === 'multiply' ? 'left' : 'right';
  working.push({
    type: 'step',
    content: `Method — Digits move ${direction} by ${zeros} place${zeros !== 1 ? 's' : ''}`
  });
  
  working.push({
    type: 'calculation',
    content: 'See place value grid above'
  });
  
  return {
    display,
    answer,
    working,
    values: { vin, vout, power, op, zeros, usePowersNotation },
    difficulty: level,
  };
};

const getQuestionUniqueKey = (q: Question): string => {
  return `${q.values.vin}-${q.values.power}-${q.values.op}`;
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

const renderPlaceValueGrid = (question: Question | null, showAnswerInGrid: boolean, showNumbers: boolean, bgColor: string): JSX.Element => {
  if (!question) {
    return <></>;
  }
  
  if (question.difficulty === 'level3') {
    const { op, zeros } = question.values;
    const direction = op === 'multiply' ? 'left' : 'right';
    return (
      <div className="w-full flex justify-center">
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: bgColor }}>
          <span className="text-3xl font-bold" style={{ color: '#000000' }}>
            All digits move {zeros} place{zeros !== 1 ? 's' : ''} to the {direction}
          </span>
        </div>
      </div>
    );
  }
  
  const { vin, vout, op, zeros } = question.values;
  const allColumns = getPlaceValueColumns(question.difficulty as DifficultyLevel);
  const onesIndex = allColumns.indexOf('O');
  const isLevel2 = question.difficulty === 'level2';
  
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {allColumns.map((col: string, idx: number) => (
                <th 
                  key={idx} 
                  className="border-2 border-black py-3 font-bold text-xl relative"
                  style={{ color: '#000000', width: `${100 / allColumns.length}%`, backgroundColor: bgColor }}
                >
                  {col}
                  {idx === onesIndex && isLevel2 && (
                    <div className="absolute w-3 h-3 bg-black rounded-full" style={{ right: '-8px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}></div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {allColumns.map((_col: string, idx: number) => {
                const digit = showNumbers ? getDigitAtPosition(vin, idx, onesIndex) : '';
                return (
                  <td 
                    key={idx} 
                    className="border-2 border-black text-center text-3xl font-semibold"
                    style={{ color: '#000000', height: showNumbers ? '100px' : '200px', backgroundColor: bgColor }}
                  >
                    {digit}
                  </td>
                );
              })}
            </tr>
            {showAnswerInGrid && (
              <>
                <tr>
                  <td colSpan={allColumns.length} className="text-center py-4 font-bold text-2xl border-2 border-black" style={{ color: '#000000', backgroundColor: bgColor }}>
                    ↓ {op === 'multiply' ? 'Move LEFT' : 'Move RIGHT'} by {zeros} place{zeros !== 1 ? 's' : ''}
                  </td>
                </tr>
                <tr>
                  {allColumns.map((_col: string, idx: number) => {
                    const digit = showNumbers ? getDigitAtPosition(vout, idx, onesIndex) : '';
                    return (
                      <td 
                        key={idx} 
                        className="border-2 border-black text-center text-3xl font-semibold relative"
                        style={{ color: '#000000', height: showNumbers ? '100px' : '200px', backgroundColor: bgColor }}
                      >
                        {digit}
                        {idx === onesIndex && isLevel2 && (
                          <div className="absolute w-3 h-3 bg-black rounded-full" style={{ right: '-8px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function PowersOfTenTool() {
  const navigate = useNavigate();
  const [currentTool] = useState<ToolType>('directCalc');
  const [mode, setMode] = useState<Mode>('whiteboard');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('level1');
  
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
      const levels: DifficultyLevel[] = ['level1', 'level2', 'level3'];
      levels.forEach((level: DifficultyLevel) => {
        for (let i = 0; i < numQuestions; i++) {
          const q = generateUniqueQuestion(currentTool, level, variables, dropdownValue, usedKeys);
          questions.push(q);
        }
      });
    } else {
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
  
  const getCurrentDropdownConfig = (): DropdownConfig | null => {
    const toolSettings = getCurrentToolSettings();
    if (toolSettings.difficultySettings?.[difficulty]?.dropdown) {
      return toolSettings.difficultySettings[difficulty].dropdown!;
    }
    return toolSettings.dropdown;
  };
  
  const getCurrentVariablesConfig = (): VariableConfig[] => {
    const toolSettings = getCurrentToolSettings();
    if (toolSettings.difficultySettings?.[difficulty]?.variables) {
      return toolSettings.difficultySettings[difficulty].variables!;
    }
    return toolSettings.variables;
  };
  
  const getVariableValue = (key: string): boolean => {
    return toolVariables[currentTool]?.[key] ?? false;
  };
  
  const setVariableValue = (key: string, value: boolean): void => {
    setToolVariables((prev: Record<string, Record<string, boolean>>) => ({
      ...prev,
      [currentTool]: {
        ...prev[currentTool],
        [key]: value,
      },
    }));
  };
  
  const getDropdownValue = (): string => {
    return toolDropdowns[currentTool] ?? '';
  };
  
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
    const currentVariables = getCurrentVariablesConfig();
    const currentDropdown = getCurrentDropdownConfig();
    
    if (mode === 'worksheet') {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
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
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
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
    return (
      <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
        <div className="text-center mb-6">
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
          className="rounded-xl p-6" 
          style={{ minHeight: '500px', backgroundColor: getWhiteboardWorkingBg() }}
        >
          {currentQuestion && renderPlaceValueGrid(currentQuestion, false, false, getWhiteboardWorkingBg())}
        </div>
      </div>
    );
  };
  
  const renderWorkedExampleMode = (): JSX.Element => {
    return (
      <div className="w-full">
        <div className="rounded-xl shadow-lg p-8 w-full" style={{ backgroundColor: getQuestionBg() }}>
          {currentQuestion ? (
            <>
              <div className="text-center mb-8">
                <span className="text-6xl font-bold" style={{ color: '#000000' }}>{currentQuestion.display}</span>
              </div>
              
              {showAnswer && (
                <>
                  <div className="mb-8 p-6 rounded-xl" style={{ backgroundColor: getStepBg() }}>
                    {renderPlaceValueGrid(currentQuestion, true, true, getStepBg())}
                  </div>
                  
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
    
    const toolSettings = getCurrentToolSettings();
    
    if (isDifferentiated) {
      const levels = ['level1', 'level2', 'level3'];
      const levelNames = ['Level 1', 'Level 2', 'Level 3'];
      
      const getLevelQuestionBoxBg = (level: string): string => {
        const levelColors: Record<string, string> = {
          level1: '#dcfce7',
          level2: '#fef9c3',
          level3: '#fee2e2',
        };
        return levelColors[level] || '#f3f4f6';
      };
      
      return (
        <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQuestionBg() }}>
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
    
    return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQuestionBg() }}>
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
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
          >
            <Home size={24} />
            <span className="font-semibold text-lg">Home</span>
          </button>
          
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
      
      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f3f0' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>
            {TOOL_CONFIG.pageTitle}
          </h1>
          
          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }}></div>
          </div>
          
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
          
          {renderControlBar()}
          
          {mode === 'whiteboard' && renderWhiteboardMode()}
          {mode === 'single' && renderWorkedExampleMode()}
          {mode === 'worksheet' && renderWorksheetMode()}
        </div>
      </div>
    </>
  );
}
