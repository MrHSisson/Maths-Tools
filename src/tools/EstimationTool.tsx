import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, Home, Menu, X, ChevronUp, ChevronDown } from 'lucide-react';

// ===== TYPE DEFINITIONS =====
type WorkingStep = {
  type: string;
  content: string;
};

type QuestionValues = {
  num1: number;
  num2: number;
  num3?: number;
};

type QuestionType = {
  display: string;
  answer: string;
  working: WorkingStep[];
  values: QuestionValues;
  difficulty: string;
};

type DifferentiatedLevel = {
  level: DifficultyLevel;
  questions: QuestionType[];
};

type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';
type DifficultyLevel = 'level1' | 'level2' | 'level3';
type Mode = 'whiteboard' | 'worked' | 'worksheet';
type Operation = 'add' | 'subtract' | 'multiply' | 'divide' | 'mixed';

export default function EstimationTool() {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [mode, setMode] = useState<Mode>('whiteboard');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('level1');
  const [currentQuestion, setCurrentQuestion] = useState<QuestionType | null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [worksheet, setWorksheet] = useState<QuestionType[] | DifferentiatedLevel[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState<boolean>(false);
  const [isDifferentiated, setIsDifferentiated] = useState<boolean>(false);
  const [numColumns, setNumColumns] = useState<number>(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState<number>(1);
  const [selectedOperation, setSelectedOperation] = useState<Operation>('mixed');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // ===== COLOR HELPERS =====
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

  const getWhiteboardWorkingBg = (): string => {
    if (colorScheme === 'blue') return '#B3D9F2';
    if (colorScheme === 'pink') return '#F2B3D9';
    if (colorScheme === 'yellow') return '#F2EBB3';
    return '#f3f4f6';
  };

  const getFinalAnswerBg = (): string => {
    if (colorScheme === 'blue') return '#B3D9F2';
    if (colorScheme === 'pink') return '#F2B3D9';
    if (colorScheme === 'yellow') return '#F2EBB3';
    return '#f3f4f6';
  };

  // ===== FONT SIZE =====
  const fontSizes: string[] = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const getFontSize = () => fontSizes[worksheetFontSize];

  // ===== DIFFICULTY BUTTON HELPER =====
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

  // ===== UTILITY FUNCTIONS =====
  const formatNumber = (num: number | string): string => {
    if (typeof num === 'string') num = parseFloat(num);
    if (num >= 1000) {
      return num.toLocaleString('en-US');
    }
    return num.toString();
  };

  const isAlreadyRounded = (num: number): boolean => {
    if (num === 0) return true;
    const magnitude = Math.floor(Math.log10(Math.abs(num)));
    const factor = Math.pow(10, magnitude);
    return Number.isInteger(num / factor);
  };

  const roundTo1SF = (num: number): number => {
    if (num === 0) return 0;
    const magnitude = Math.floor(Math.log10(Math.abs(num)));
    const factor = Math.pow(10, magnitude);
    const rounded = Math.round(num / factor) * factor;
    const decimalPlaces = Math.max(0, -magnitude + 1);
    return Number(rounded.toFixed(decimalPlaces));
  };

  const getOperationSymbol = (op: string): string => {
    const symbols: { [key: string]: string } = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
    return symbols[op] || op;
  };

  // ===== QUESTION GENERATION =====
  const generateLevel1 = (forcedOperation: string | null = null): QuestionType => {
    const operations: string[] = forcedOperation ? [forcedOperation] : ['add', 'subtract', 'multiply', 'divide'];
    let attempts = 0;
    
    while (attempts < 50) {
      attempts++;
      const operation = operations[Math.floor(Math.random() * operations.length)];
      let num1 = 0;
      let num2 = 0;
      
      if (operation === 'multiply') {
        if (Math.random() > 0.3) {
          num1 = Math.floor(Math.random() * 90) + 10;
          num2 = Math.floor(Math.random() * 90) + 10;
        } else {
          num1 = Math.floor(Math.random() * 290) + 10;
          num2 = Math.floor(Math.random() * 90) + 10;
        }
      } else if (operation === 'divide') {
        num2 = Math.floor(Math.random() * 90) + 10;
        const multiplier = Math.floor(Math.random() * 9) + 2;
        num1 = num2 * multiplier + Math.floor(Math.random() * (num2 * 0.3));
      } else {
        num1 = Math.random() > 0.5 
          ? Math.floor(Math.random() * 90) + 10
          : Math.floor(Math.random() * 890) + 10;
        num2 = Math.random() > 0.5 
          ? Math.floor(Math.random() * 90) + 10
          : Math.floor(Math.random() * 890) + 10;
      }
      
      if (isAlreadyRounded(num1) || isAlreadyRounded(num2)) continue;
      
      const firstDigit1 = parseInt(num1.toString()[0]);
      const firstDigit2 = parseInt(num2.toString()[0]);
      if (firstDigit1 === 5 || firstDigit2 === 5) continue;
      if (firstDigit1 === 9 && num1.toString()[1] >= '5') continue;
      if (firstDigit2 === 9 && num2.toString()[1] >= '5') continue;
      
      const rounded1 = roundTo1SF(num1);
      const rounded2 = roundTo1SF(num2);
      
      let answer = 0;
      if (operation === 'add') {
        answer = rounded1 + rounded2;
      } else if (operation === 'subtract') {
        if (rounded1 <= rounded2) continue;
        answer = rounded1 - rounded2;
      } else if (operation === 'multiply') {
        answer = rounded1 * rounded2;
      } else if (operation === 'divide') {
        if (rounded2 === 0) continue;
        answer = rounded1 / rounded2;
      }
      
      if (!Number.isInteger(answer)) continue;
      
      if (answer > 0 && answer < 10000) {
        return {
          display: `${formatNumber(num1)} ${getOperationSymbol(operation)} ${formatNumber(num2)}`,
          answer: formatNumber(answer),
          working: [
            { type: 'step', content: `Original: ${formatNumber(num1)} ${getOperationSymbol(operation)} ${formatNumber(num2)}` },
            { type: 'step', content: `Round to 1 s.f.: ${formatNumber(num1)} → ${formatNumber(rounded1)}, ${formatNumber(num2)} → ${formatNumber(rounded2)}` },
            { type: 'step', content: `Calculate: ${formatNumber(rounded1)} ${getOperationSymbol(operation)} ${formatNumber(rounded2)} = ${formatNumber(answer)}` }
          ],
          values: { num1, num2 },
          difficulty: 'level1'
        };
      }
    }
    
    return {
      display: '80 × 30',
      answer: '2,400',
      working: [
        { type: 'step', content: 'Original: 80 × 30' },
        { type: 'step', content: 'Round to 1 s.f.: 80 → 80, 30 → 30' },
        { type: 'step', content: 'Calculate: 80 × 30 = 2,400' }
      ],
      values: { num1: 80, num2: 30 },
      difficulty: 'level1'
    };
  };

  const generateLevel2 = (forcedOperation: string | null = null): QuestionType => {
    const operations: string[] = forcedOperation ? [forcedOperation] : ['add', 'subtract', 'multiply', 'divide'];
    let attempts = 0;
    
    while (attempts < 50) {
      attempts++;
      const useDecimals = Math.random() > 0.3;
      let num1 = 0;
      let num2 = 0;
      const operation = operations[Math.floor(Math.random() * operations.length)];
      
      if (useDecimals) {
        if (operation === 'multiply' || operation === 'divide') {
          num1 = Math.round((Math.random() * 9 + 1) * 10) / 10;
          num2 = Math.round((Math.random() * 0.89 + 0.1) * 100) / 100;
        } else {
          const magnitude = Math.pow(10, Math.floor(Math.random() * 2));
          num1 = Math.round((Math.random() * 9 + 1) * magnitude * 10) / 10;
          num2 = Math.round((Math.random() * 9 + 1) * magnitude * 10) / 10;
        }
      } else {
        if (operation === 'add' || operation === 'subtract') {
          const magnitude = Math.pow(10, Math.floor(Math.random() * 2) + 1);
          num1 = Math.floor(Math.random() * 9 + 1) * magnitude;
          num2 = Math.floor(Math.random() * 9 + 1) * magnitude;
        } else {
          num1 = Math.floor(Math.random() * 99) + 10;
          num2 = Math.floor(Math.random() * 99) + 10;
        }
      }
      
      const rounded1 = roundTo1SF(num1);
      const rounded2 = roundTo1SF(num2);
      
      if (isAlreadyRounded(num1) || isAlreadyRounded(num2)) continue;
      if (rounded1 === 0 || rounded2 === 0) continue;
      
      let answer = 0;
      if (operation === 'add') {
        answer = rounded1 + rounded2;
      } else if (operation === 'subtract') {
        if (rounded1 <= rounded2) continue;
        answer = rounded1 - rounded2;
      } else if (operation === 'multiply') {
        answer = rounded1 * rounded2;
      } else if (operation === 'divide') {
        if (rounded2 === 0) continue;
        answer = rounded1 / rounded2;
      }
      
      const answerRounded1DP = Math.round(answer * 10) / 10;
      if (Math.abs(answer - answerRounded1DP) > 0.0001) continue;
      answer = answerRounded1DP;
      
      if (answer > 0 && answer < 10000 && !isNaN(answer)) {
        const formattedAnswer = answer >= 1000 ? formatNumber(Math.round(answer)) : (Number.isInteger(answer) ? formatNumber(answer) : answer.toFixed(1));
        
        return {
          display: `${formatNumber(num1)} ${getOperationSymbol(operation)} ${formatNumber(num2)}`,
          answer: formattedAnswer,
          working: [
            { type: 'step', content: `Original: ${formatNumber(num1)} ${getOperationSymbol(operation)} ${formatNumber(num2)}` },
            { type: 'step', content: `Round to 1 s.f.: ${formatNumber(num1)} → ${formatNumber(rounded1)}, ${formatNumber(num2)} → ${formatNumber(rounded2)}` },
            { type: 'step', content: `Calculate: ${formatNumber(rounded1)} ${getOperationSymbol(operation)} ${formatNumber(rounded2)} = ${formattedAnswer}` }
          ],
          values: { num1, num2 },
          difficulty: 'level2'
        };
      }
    }
    
    return {
      display: '45 × 2',
      answer: '100',
      working: [
        { type: 'step', content: 'Original: 45 × 2' },
        { type: 'step', content: 'Round to 1 s.f.: 45 → 50, 2 → 2' },
        { type: 'step', content: 'Calculate: 50 × 2 = 100' }
      ],
      values: { num1: 45, num2: 2 },
      difficulty: 'level2'
    };
  };

  const generateLevel3 = (): QuestionType => {
    const operations: string[] = ['add', 'subtract', 'multiply', 'divide'];
    let attempts = 0;
    
    while (attempts < 50) {
      attempts++;
      
      const num1 = Math.floor(Math.random() * 890) + 10;
      const num2 = Math.floor(Math.random() * 90) + 10;
      const num3 = Math.floor(Math.random() * 90) + 2;
      
      let op1 = operations[Math.floor(Math.random() * operations.length)];
      let op2 = operations[Math.floor(Math.random() * operations.length)];
      
      while (op1 === op2) {
        op2 = operations[Math.floor(Math.random() * operations.length)];
      }
      
      if ((op1 === 'add' || op1 === 'subtract') && (op2 === 'add' || op2 === 'subtract')) {
        op2 = Math.random() > 0.5 ? 'multiply' : 'divide';
      }
      
      const op1IsHighPrecedence = (op1 === 'multiply' || op1 === 'divide');
      const op2IsHighPrecedence = (op2 === 'multiply' || op2 === 'divide');
      const useParentheses = !op1IsHighPrecedence && op2IsHighPrecedence && Math.random() > 0.5;
      
      const rounded1 = roundTo1SF(num1);
      const rounded2 = roundTo1SF(num2);
      const rounded3 = roundTo1SF(num3);
      
      if (isAlreadyRounded(num1) || isAlreadyRounded(num2) || isAlreadyRounded(num3)) continue;
      if (rounded2 === 0 || rounded3 === 0) continue;
      
      let intermediate = 0;
      let answer = 0;
      const doOp1First = useParentheses || op1IsHighPrecedence;
      
      if (doOp1First) {
        if (op1 === 'add') {
          intermediate = rounded1 + rounded2;
        } else if (op1 === 'subtract') {
          intermediate = rounded1 - rounded2;
        } else if (op1 === 'multiply') {
          intermediate = rounded1 * rounded2;
        } else {
          if (rounded2 === 0) continue;
          intermediate = rounded1 / rounded2;
        }
        
        const intermediateRounded1DP = Math.round(intermediate * 10) / 10;
        if (Math.abs(intermediate - intermediateRounded1DP) > 0.0001) continue;
        intermediate = intermediateRounded1DP;
        
        if (op2 === 'add') {
          answer = intermediate + rounded3;
        } else if (op2 === 'subtract') {
          answer = intermediate - rounded3;
        } else if (op2 === 'multiply') {
          answer = intermediate * rounded3;
        } else {
          if (rounded3 === 0) continue;
          answer = intermediate / rounded3;
        }
      } else {
        if (op2 === 'multiply') {
          intermediate = rounded2 * rounded3;
        } else {
          if (rounded3 === 0) continue;
          intermediate = rounded2 / rounded3;
        }
        
        const intermediateRounded1DP = Math.round(intermediate * 10) / 10;
        if (Math.abs(intermediate - intermediateRounded1DP) > 0.0001) continue;
        intermediate = intermediateRounded1DP;
        
        if (op1 === 'add') {
          answer = rounded1 + intermediate;
        } else if (op1 === 'subtract') {
          answer = rounded1 - intermediate;
        } else if (op1 === 'multiply') {
          answer = rounded1 * intermediate;
        } else {
          if (intermediate === 0) continue;
          answer = rounded1 / intermediate;
        }
      }
      
      const answerRounded1DP = Math.round(answer * 10) / 10;
      if (Math.abs(answer - answerRounded1DP) > 0.0001) continue;
      answer = answerRounded1DP;
      
      if (answer > 0 && answer < 10000 && !isNaN(answer)) {
        const formattedAnswer = answer >= 1000 ? formatNumber(Math.round(answer)) : (Number.isInteger(answer) ? formatNumber(answer) : answer.toFixed(1));
        const formattedIntermediate = intermediate >= 1000 ? formatNumber(Math.round(intermediate)) : (Number.isInteger(intermediate) ? formatNumber(intermediate) : intermediate.toFixed(1));
        
        const displayStr = useParentheses 
          ? `(${formatNumber(num1)} ${getOperationSymbol(op1)} ${formatNumber(num2)}) ${getOperationSymbol(op2)} ${formatNumber(num3)}`
          : `${formatNumber(num1)} ${getOperationSymbol(op1)} ${formatNumber(num2)} ${getOperationSymbol(op2)} ${formatNumber(num3)}`;
        
        const roundedDisplayStr = useParentheses
          ? `(${formatNumber(rounded1)} ${getOperationSymbol(op1)} ${formatNumber(rounded2)}) ${getOperationSymbol(op2)} ${formatNumber(rounded3)}`
          : `${formatNumber(rounded1)} ${getOperationSymbol(op1)} ${formatNumber(rounded2)} ${getOperationSymbol(op2)} ${formatNumber(rounded3)}`;
        
        const explanation = useParentheses
          ? `${formattedIntermediate} ${getOperationSymbol(op2)} ${formatNumber(rounded3)} [do brackets first]`
          : (doOp1First 
              ? `${formattedIntermediate} ${getOperationSymbol(op2)} ${formatNumber(rounded3)} [do ${getOperationSymbol(op1)} first]`
              : `${formatNumber(rounded1)} ${getOperationSymbol(op1)} ${formattedIntermediate} [do ${getOperationSymbol(op2)} first]`);
        
        return {
          display: displayStr,
          answer: formattedAnswer,
          working: [
            { type: 'step', content: `Original: ${displayStr}` },
            { type: 'step', content: `Round to 1 s.f.: ${formatNumber(num1)} → ${formatNumber(rounded1)}, ${formatNumber(num2)} → ${formatNumber(rounded2)}, ${formatNumber(num3)} → ${formatNumber(rounded3)}` },
            { type: 'step', content: `Calculate (BIDMAS): ${roundedDisplayStr} = ${explanation} = ${formattedAnswer}` }
          ],
          values: { num1, num2, num3 },
          difficulty: 'level3'
        };
      }
    }
    
    return {
      display: '200 + 30 × 4',
      answer: '320',
      working: [
        { type: 'step', content: 'Original: 200 + 30 × 4' },
        { type: 'step', content: 'Round to 1 s.f.: 200 → 200, 30 → 30, 4 → 4' },
        { type: 'step', content: 'Calculate (BIDMAS): 200 + 120 [do × first] = 320' }
      ],
      values: { num1: 200, num2: 30, num3: 4 },
      difficulty: 'level3'
    };
  };

  const generateQuestion = (level: DifficultyLevel, forcedOperation: string | null = null): QuestionType => {
    if (level === 'level1') return generateLevel1(forcedOperation);
    if (level === 'level2') return generateLevel2(forcedOperation);
    return generateLevel3();
  };

  // ===== EVENT HANDLERS =====
  const handleNewQuestion = (): void => {
    const operation = selectedOperation === 'mixed' ? null : selectedOperation;
    setCurrentQuestion(generateQuestion(difficulty, operation));
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = (): void => {
    if (isDifferentiated) {
      const allQuestions: DifferentiatedLevel[] = [];
      
      (['level1', 'level2', 'level3'] as const).forEach((level: DifficultyLevel) => {
        const levelQuestions: QuestionType[] = [];
        
        if (level === 'level3') {
          for (let i = 0; i < numQuestions; i++) {
            levelQuestions.push(generateQuestion(level));
          }
        } else {
          const operations: string[] = ['add', 'subtract', 'multiply', 'divide'];
          const operationList: string[] = [];
          
          for (let i = 0; i < numQuestions; i++) {
            operationList.push(operations[i % operations.length]);
          }
          
          for (let i = operationList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [operationList[i], operationList[j]] = [operationList[j], operationList[i]];
          }
          
          for (let i = 0; i < numQuestions; i++) {
            levelQuestions.push(generateQuestion(level, operationList[i]));
          }
        }
        
        allQuestions.push({ level, questions: levelQuestions });
      });
      
      setWorksheet(allQuestions);
    } else {
      const questions: QuestionType[] = [];
      
      if (difficulty === 'level3') {
        for (let i = 0; i < numQuestions; i++) {
          questions.push(generateQuestion(difficulty));
        }
      } else {
        const operations: string[] = ['add', 'subtract', 'multiply', 'divide'];
        const operationList: string[] = [];
        
        for (let i = 0; i < numQuestions; i++) {
          operationList.push(operations[i % operations.length]);
        }
        
        for (let i = operationList.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [operationList[i], operationList[j]] = [operationList[j], operationList[i]];
        }
        
        for (let i = 0; i < numQuestions; i++) {
          questions.push(generateQuestion(difficulty, operationList[i]));
        }
      }
      
      setWorksheet(questions);
    }
    
    setShowWorksheetAnswers(false);
  };

  // ===== EFFECTS =====
  useEffect(() => {
    if (mode === 'whiteboard' && !currentQuestion) {
      if (difficulty === 'level3') setSelectedOperation('mixed');
      handleNewQuestion();
    }
    if (mode === 'worked' && !currentQuestion) {
      if (difficulty === 'level3') setSelectedOperation('mixed');
      handleNewQuestion();
    }
  }, [mode]);

  useEffect(() => {
    if (difficulty === 'level3') setSelectedOperation('mixed');
    if (currentQuestion) handleNewQuestion();
  }, [difficulty, selectedOperation]);

  // ===== RENDER =====
  return (
    <>
      {/* Header Bar */}
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
                  <div className="px-6 py-2 font-bold text-gray-700 text-sm uppercase tracking-wide">
                    Color Schemes
                  </div>
                  {(['default', 'blue', 'pink', 'yellow'] as const).map((scheme: ColorScheme) => (
                    <button
                      key={scheme}
                      onClick={() => setColorScheme(scheme)}
                      className={
                        'w-full text-left px-6 py-3 font-semibold transition-colors ' +
                        (colorScheme === scheme
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-800 hover:bg-gray-100')
                      }
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
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>
            Estimation
          </h1>

          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }}></div>
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center gap-4 mb-8">
            {(['whiteboard', 'worked', 'worksheet'] as const).map((m: Mode) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={
                  'px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ' +
                  (mode === m
                    ? 'bg-blue-900 text-white'
                    : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900')
                }
              >
                {m === 'whiteboard' ? 'Whiteboard' : m === 'worked' ? 'Worked Example' : 'Worksheet'}
              </button>
            ))}
          </div>

          {/* WHITEBOARD MODE */}
          {mode === 'whiteboard' && (
            <>
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
                            className={
                              'px-4 py-2 rounded-lg font-bold text-sm w-24 ' +
                              getDifficultyButtonClass(idx, difficulty === lvl)
                            }
                          >
                            Level {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    {difficulty !== 'level3' && (
                      <select
                        value={selectedOperation}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const value = e.target.value as Operation;
                          setSelectedOperation(value);
                        }}
                        className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold bg-white"
                      >
                        <option value="mixed">Mixed</option>
                        <option value="add">Addition (+)</option>
                        <option value="subtract">Subtraction (−)</option>
                        <option value="multiply">Multiplication (×)</option>
                        <option value="divide">Division (÷)</option>
                      </select>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleNewQuestion}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52"
                    >
                      <RefreshCw size={18} />
                      New Question
                    </button>
                    <button
                      onClick={() => setShowWhiteboardAnswer(!showWhiteboardAnswer)}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52"
                    >
                      <Eye size={18} />
                      {showWhiteboardAnswer ? 'Hide Answer' : 'Show Answer'}
                    </button>
                  </div>
                </div>
              </div>

              {currentQuestion && (
                <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
                  <div className="text-center">
                    <span className="text-6xl font-bold" style={{ color: '#000000' }}>
                      {currentQuestion.display}
                    </span>
                    {showWhiteboardAnswer && (
                      <span className="text-6xl font-bold ml-4" style={{ color: '#166534' }}>
                        = {currentQuestion.answer}
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl mt-8" style={{ height: '500px', backgroundColor: getWhiteboardWorkingBg() }}></div>
                </div>
              )}
            </>
          )}

          {/* WORKED EXAMPLE MODE */}
          {mode === 'worked' && (
            <>
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
                            className={
                              'px-4 py-2 rounded-lg font-bold text-sm w-24 ' +
                              getDifficultyButtonClass(idx, difficulty === lvl)
                            }
                          >
                            Level {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    {difficulty !== 'level3' && (
                      <select
                        value={selectedOperation}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const value = e.target.value as Operation;
                          setSelectedOperation(value);
                        }}
                        className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold bg-white"
                      >
                        <option value="mixed">Mixed</option>
                        <option value="add">Addition (+)</option>
                        <option value="subtract">Subtraction (−)</option>
                        <option value="multiply">Multiplication (×)</option>
                        <option value="divide">Division (÷)</option>
                      </select>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleNewQuestion}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52"
                    >
                      <RefreshCw size={18} />
                      New Question
                    </button>
                    <button
                      onClick={() => setShowAnswer(!showAnswer)}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52"
                    >
                      <Eye size={18} />
                      {showAnswer ? 'Hide Answer' : 'Show Answer'}
                    </button>
                  </div>
                </div>
              </div>

              {currentQuestion && (
                <div className="overflow-y-auto" style={{ height: '120vh' }}>
                  <div className="rounded-xl shadow-lg p-8 w-full" style={{ backgroundColor: getQuestionBg() }}>
                    <div className="text-center">
                      <span className="text-6xl font-bold" style={{ color: '#000000' }}>
                        {currentQuestion.display}
                      </span>
                    </div>

                    {showAnswer && (
                      <>
                        <div className="space-y-4 mt-8">
                          {currentQuestion.working.map((step: WorkingStep, i: number) => (
                            <div key={i} className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                              <h4 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>
                                Step {i + 1}
                              </h4>
                              <p className="text-3xl" style={{ color: '#000000' }}>
                                {step.content}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: getFinalAnswerBg() }}>
                          <span className="text-5xl font-bold" style={{ color: '#166534' }}>
                            = {currentQuestion.answer}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* WORKSHEET MODE */}
          {mode === 'worksheet' && (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="space-y-4">
                  <div className="flex justify-center items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-3">
                      <label className="text-lg font-semibold" style={{ color: '#000000' }}>
                        Questions per level:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={numQuestions}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))
                        }
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
                      <label htmlFor="diff" className="text-lg font-semibold" style={{ color: '#000000' }}>
                        Differentiated
                      </label>
                    </div>
                  </div>

                  {!isDifferentiated && (
                    <div className="flex justify-center items-center gap-4">
                      <label className="text-lg font-semibold" style={{ color: '#000000' }}>Difficulty:</label>
                      <div className="flex gap-2">
                        {(['level1', 'level2', 'level3'] as const).map((lvl: DifficultyLevel, idx: number) => (
                          <button
                            key={lvl}
                            onClick={() => setDifficulty(lvl)}
                            className={
                              'px-4 py-2 rounded-lg font-bold text-sm w-24 ' +
                              getDifficultyButtonClass(idx, difficulty === lvl)
                            }
                          >
                            Level {idx + 1}
                          </button>
                        ))}
                      </div>

                      <label className="text-lg font-semibold ml-4" style={{ color: '#000000' }}>Columns:</label>
                      <input
                        type="number"
                        min="1"
                        max="4"
                        value={numColumns}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))
                        }
                        className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg"
                      />
                    </div>
                  )}

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={handleGenerateWorksheet}
                      className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-800"
                    >
                      <RefreshCw size={20} />
                      Generate Worksheet
                    </button>
                    {worksheet.length > 0 && (
                      <button
                        onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)}
                        className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-800"
                      >
                        <Eye size={20} />
                        {showWorksheetAnswers ? 'Hide' : 'Show'} Answers
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {worksheet.length > 0 && (
                <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQuestionBg() }}>
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    <button
                      onClick={() => setWorksheetFontSize(Math.max(0, worksheetFontSize - 1))}
                      disabled={worksheetFontSize === 0}
                      className={
                        'w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ' +
                        (worksheetFontSize === 0
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-900 text-white hover:bg-blue-800')
                      }
                    >
                      <ChevronDown size={20} />
                    </button>
                    <button
                      onClick={() => setWorksheetFontSize(Math.min(3, worksheetFontSize + 1))}
                      disabled={worksheetFontSize === 3}
                      className={
                        'w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ' +
                        (worksheetFontSize === 3
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-900 text-white hover:bg-blue-800')
                      }
                    >
                      <ChevronUp size={20} />
                    </button>
                  </div>

                  <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>
                    Estimation - Worksheet
                  </h2>

                  {Array.isArray(worksheet) && worksheet.length > 0 && 'level' in worksheet[0] ? (
                    <div className="grid grid-cols-3 gap-6">
                      {(worksheet as DifferentiatedLevel[]).map((levelData: DifferentiatedLevel, idx: number) => {
                        const levelNames: { [key in DifficultyLevel]: string } = { level1: 'Level 1', level2: 'Level 2', level3: 'Level 3' };
                        const levelIdx = (['level1', 'level2', 'level3'] as const).indexOf(levelData.level);
                        const colors: string[] = ['green', 'yellow', 'red'];
                        const color = colors[levelIdx];

                        return (
                          <div
                            key={idx}
                            className={`rounded-xl p-6 border-4 bg-${color}-50 border-${color}-500`}
                          >
                            <h3 className={`text-2xl font-bold text-center mb-6 text-${color}-700`}>
                              {levelNames[levelData.level]}
                            </h3>
                            <div className="space-y-3">
                              {levelData.questions.map((q: QuestionType, i: number) => (
                                <div key={i} className={getFontSize()}>
                                  <span className="font-semibold" style={{ color: '#000000' }}>
                                    {i + 1}.
                                  </span>
                                  <span className="ml-3 font-bold" style={{ color: '#000000' }}>
                                    {q.display}
                                  </span>
                                  {showWorksheetAnswers && (
                                    <div className="ml-8 font-semibold mt-1" style={{ color: '#059669' }}>
                                      = {q.answer}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      className={`grid gap-x-6 gap-y-3 ${
                        numColumns === 1
                          ? 'grid-cols-1'
                          : numColumns === 2
                          ? 'grid-cols-2'
                          : numColumns === 3
                          ? 'grid-cols-3'
                          : 'grid-cols-4'
                      }`}
                    >
                      {(worksheet as QuestionType[]).map((q: QuestionType, i: number) => (
                        <div key={i} className={getFontSize()}>
                          <span className="font-semibold" style={{ color: '#000000' }}>
                            {i + 1}.
                          </span>
                          <span className="ml-2 font-bold" style={{ color: '#000000' }}>
                            {q.display}
                          </span>
                          {showWorksheetAnswers && (
                            <span className="ml-3 font-semibold" style={{ color: '#059669' }}>
                              = {q.answer}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
