import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// Type definitions (bottom-up hierarchy)
type AlgebraicTerm = {
  coeff: number;
  vars: { [key: string]: number };  // Index signature for dynamic variable access
};

type WorkingStep = {
  type: string;
  title?: string;
  content?: string;
  answer?: string;
};

type QuestionType = {
  display: string;
  answer: string;
  working: WorkingStep[];
  values: any;  // Can be numeric or algebraic values - too complex to type strictly
  difficulty: string;
};

const SimplifyingRatiosTool = () => {
  const navigate = useNavigate();
  
  // UI State
  const [colorScheme, setColorScheme] = useState<string>('default');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  
  // Tool & Mode
  const [currentTool, setCurrentTool] = useState<string>('numeric');
  const [mode, setMode] = useState<string>('whiteboard');
  const [difficulty, setDifficulty] = useState<string>('level1');
  
  // Questions
  const [currentQuestion, setCurrentQuestion] = useState<QuestionType | null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  
  // Worksheet
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [worksheet, setWorksheet] = useState<QuestionType[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState<boolean>(false);
  const [isDifferentiated, setIsDifferentiated] = useState<boolean>(false);
  const [numColumns, setNumColumns] = useState<number>(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState<number>(1);

  const toolNames: Record<string, string> = {
    numeric: 'Numeric Ratios',
    algebraic: 'Algebraic Ratios'
  };

  const fontSizes: string[] = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const getFontSize = (): string => fontSizes[worksheetFontSize];

  // Color Scheme Functions
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

  // Math Helpers
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

  const findHCF = (numbers: number[]): number => {
    return numbers.reduce((acc: number, num: number) => gcd(acc, num));
  };

  const findSmallestCommonFactor = (numbers: number[]): number => {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
    for (let prime of primes) {
      if (numbers.every((n: number) => n % prime === 0)) return prime;
    }
    return 1;
  };

  const formatTerm = (coeff: number, vars: { [key: string]: number }): string => {
    const absCoeff = Math.abs(coeff);
    let result = absCoeff === 1 && Object.keys(vars).length > 0 ? '' : absCoeff.toString();
    
    Object.entries(vars).sort().forEach(([variable, power]: [string, number]) => {
      if (power > 0) {
        result += variable;
        if (power > 1) {
          result += power === 2 ? '²' : power === 3 ? '³' : `^${power}`;
        }
      }
    });
    
    return result || absCoeff.toString();
  };

  // Numeric Question Generation
  const generateNumericQuestion = (level: string): QuestionType => {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      attempts++;

      const isThreePart = level === 'level3';
      const numParts = isThreePart ? 3 : 2;

      let simplified: number[] = [];
      let hcf = 0;
      let minPart = 0;
      let maxPart = 0;
      let hcfChoices: number[] = [];

      if (level === 'level1') {
        for (let i = 0; i < numParts; i++) {
          simplified.push(Math.floor(Math.random() * 5) + 1);
        }
        hcfChoices = [2, 3, 4, 5];
        minPart = 4;
        maxPart = 20;
      } else if (level === 'level2') {
        for (let i = 0; i < numParts; i++) {
          simplified.push(Math.floor(Math.random() * 8) + 1);
        }
        hcfChoices = [6, 8, 9, 10, 12, 15, 18];
        minPart = 12;
        maxPart = 60;
      } else {
        for (let i = 0; i < numParts; i++) {
          simplified.push(Math.floor(Math.random() * 8) + 1);
        }
        hcfChoices = [6, 8, 9, 10, 12, 15, 18];
        minPart = 12;
        maxPart = 60;
      }

      if (findHCF(simplified) !== 1) continue;

      hcf = hcfChoices[Math.floor(Math.random() * hcfChoices.length)];
      const original = simplified.map((x: number) => x * hcf);

      if (original.some((x: number) => x < minPart || x > maxPart)) continue;

      const working: WorkingStep[] = [{ 
        type: 'original', 
        title: 'Original Ratio',
        content: original.join(' : ')
      }];
      let current = [...original];
      
      while (findHCF(current) > 1) {
        const commonFactor = findSmallestCommonFactor(current);
        const next = current.map((x: number) => x / commonFactor);
        working.push({ 
          type: 'step',
          title: `Divide by ${commonFactor}`,
          content: next.join(' : ')
        });
        current = next;
      }
      
      working.push({ type: 'final', answer: simplified.join(' : ') });

      return {
        display: original.join(' : '),
        answer: simplified.join(' : '),
        working: working,
        values: { original, simplified, hcf },
        difficulty: level
      };
    }

    return {
      display: '6 : 9',
      answer: '2 : 3',
      working: [
        { type: 'original', title: 'Original Ratio', content: '6 : 9' },
        { type: 'step', title: 'Divide by 3', content: '2 : 3' },
        { type: 'final', answer: '2 : 3' }
      ],
      values: { original: [6, 9], simplified: [2, 3], hcf: 3 },
      difficulty: level
    };
  };

  // Algebraic Question Generation
  const generateAlgebraicQuestion = (level: string): QuestionType => {
    const variables = ['x', 'y', 'z'];
    let term1: AlgebraicTerm = { coeff: 1, vars: {} };
    let term2: AlgebraicTerm = { coeff: 1, vars: {} };
    
    if (level === 'level1') {
      const factorType = ['numeric', 'algebraic', 'power'][Math.floor(Math.random() * 3)];
      
      if (factorType === 'numeric') {
        const commonFactor = [2, 3, 4, 5, 6, 8, 10][Math.floor(Math.random() * 7)];
        const coeff1 = Math.floor(Math.random() * 5) + 1;
        let coeff2 = Math.floor(Math.random() * 5) + 1;
        while (gcd(coeff1, coeff2) !== 1 || coeff1 === coeff2) {
          coeff2 = Math.floor(Math.random() * 5) + 1;
        }
        term1.coeff = commonFactor * coeff1;
        term2.coeff = commonFactor * coeff2;
        const var1 = variables[Math.floor(Math.random() * variables.length)];
        const var2 = variables.filter((v: string) => v !== var1)[Math.floor(Math.random() * 2)];
        term1.vars[var1] = 1;
        term2.vars[var2] = 1;
      } else if (factorType === 'algebraic') {
        let coeff1 = Math.floor(Math.random() * 4) + 2;
        let coeff2 = Math.floor(Math.random() * 4) + 2;
        while (gcd(coeff1, coeff2) !== 1 || coeff1 === coeff2) {
          coeff2 = Math.floor(Math.random() * 4) + 2;
        }
        term1.coeff = coeff1;
        term2.coeff = coeff2;
        const commonVar = variables[Math.floor(Math.random() * variables.length)];
        const var1 = variables.filter((v: string) => v !== commonVar)[Math.floor(Math.random() * 2)];
        const var2 = variables.filter((v: string) => v !== commonVar && v !== var1)[0];
        term1.vars[commonVar] = 1;
        term1.vars[var1] = 1;
        term2.vars[commonVar] = 1;
        term2.vars[var2] = 1;
      } else {
        let coeff1 = Math.floor(Math.random() * 4) + 2;
        let coeff2 = Math.floor(Math.random() * 4) + 2;
        while (gcd(coeff1, coeff2) !== 1 || coeff1 === coeff2) {
          coeff2 = Math.floor(Math.random() * 4) + 2;
        }
        term1.coeff = coeff1;
        term2.coeff = coeff2;
        const var1 = variables[Math.floor(Math.random() * variables.length)];
        term1.vars[var1] = 2;
        term2.vars[var1] = 1;
      }
    } else if (level === 'level2') {
      const commonNumFactor = [2, 3, 4, 5, 6, 8, 10, 12][Math.floor(Math.random() * 8)];
      const mult1 = Math.floor(Math.random() * 4) + 1;
      let mult2 = Math.floor(Math.random() * 4) + 1;
      while (mult1 === mult2) {
        mult2 = Math.floor(Math.random() * 4) + 1;
      }
      term1.coeff = commonNumFactor * mult1;
      term2.coeff = commonNumFactor * mult2;
      
      const type = Math.random() < 0.5 ? 'power' : 'twoVars';
      
      if (type === 'power') {
        const var1 = variables[Math.floor(Math.random() * variables.length)];
        term1.vars[var1] = 1;
        term2.vars[var1] = 2;
      } else {
        const commonVar = variables[Math.floor(Math.random() * variables.length)];
        const var1 = variables.filter((v: string) => v !== commonVar)[Math.floor(Math.random() * 2)];
        const var2 = variables.filter((v: string) => v !== commonVar && v !== var1)[0];
        term1.vars[commonVar] = 1;
        term1.vars[var1] = 1;
        term2.vars[commonVar] = 1;
        term2.vars[var2] = 1;
      }
    } else {
      const commonNumFactor = [2, 3, 4, 5, 6, 8, 9, 10, 12][Math.floor(Math.random() * 9)];
      const mult1 = Math.floor(Math.random() * 3) + 1;
      let mult2 = Math.floor(Math.random() * 3) + 2;
      while (mult1 * commonNumFactor === mult2 * commonNumFactor) {
        mult2 = Math.floor(Math.random() * 3) + 2;
      }
      term1.coeff = commonNumFactor * mult1;
      term2.coeff = commonNumFactor * mult2;
      
      const var1 = variables[Math.floor(Math.random() * variables.length)];
      const var2 = variables.filter((v: string) => v !== var1)[Math.floor(Math.random() * 2)];
      
      term1.vars[var1] = 2;
      term1.vars[var2] = 3;
      term2.vars[var1] = 3;
      term2.vars[var2] = 1;
    }
    
    // Calculate simplified form
    const coeffGcd = gcd(term1.coeff, term2.coeff);
    const simplified1: AlgebraicTerm = { coeff: term1.coeff / coeffGcd, vars: {} };
    const simplified2: AlgebraicTerm = { coeff: term2.coeff / coeffGcd, vars: {} };
    
    const allVars = new Set([...Object.keys(term1.vars), ...Object.keys(term2.vars)]);
    allVars.forEach((v: string) => {
      const power1 = term1.vars[v] || 0;
      const power2 = term2.vars[v] || 0;
      const minPower = Math.min(power1, power2);
      
      if (power1 > minPower) simplified1.vars[v] = power1 - minPower;
      if (power2 > minPower) simplified2.vars[v] = power2 - minPower;
    });
    
    // Generate working
    const working: WorkingStep[] = [{ 
      type: 'original', 
      content: `${formatTerm(term1.coeff, term1.vars)} : ${formatTerm(term2.coeff, term2.vars)}` 
    }];
    
    let currentTerm1: AlgebraicTerm = { coeff: term1.coeff, vars: {...term1.vars} };
    let currentTerm2: AlgebraicTerm = { coeff: term2.coeff, vars: {...term2.vars} };
    
    if (coeffGcd > 1) {
      currentTerm1.coeff = currentTerm1.coeff / coeffGcd;
      currentTerm2.coeff = currentTerm2.coeff / coeffGcd;
      working.push({ 
        type: 'step',
        content: `Divide by ${coeffGcd}: ${formatTerm(currentTerm1.coeff, currentTerm1.vars)} : ${formatTerm(currentTerm2.coeff, currentTerm2.vars)}`
      });
    }
    
    const sortedVars = Array.from(allVars).sort();
    sortedVars.forEach((v: string) => {
      const power1 = currentTerm1.vars[v] || 0;
      const power2 = currentTerm2.vars[v] || 0;
      const minPower = Math.min(power1, power2);
      
      if (minPower > 0) {
        const factor = minPower === 1 ? v : `${v}${minPower === 2 ? '²' : minPower === 3 ? '³' : `^${minPower}`}`;
        
        currentTerm1.vars[v] = (currentTerm1.vars[v] || 0) - minPower;
        currentTerm2.vars[v] = (currentTerm2.vars[v] || 0) - minPower;
        if (currentTerm1.vars[v] === 0) delete currentTerm1.vars[v];
        if (currentTerm2.vars[v] === 0) delete currentTerm2.vars[v];
        
        working.push({ 
          type: 'step',
          content: `Divide by ${factor}: ${formatTerm(currentTerm1.coeff, currentTerm1.vars)} : ${formatTerm(currentTerm2.coeff, currentTerm2.vars)}`
        });
      }
    });
    
    working.push({ 
      type: 'final', 
      answer: `${formatTerm(simplified1.coeff, simplified1.vars)} : ${formatTerm(simplified2.coeff, simplified2.vars)}` 
    });
    
    return {
      display: `${formatTerm(term1.coeff, term1.vars)} : ${formatTerm(term2.coeff, term2.vars)}`,
      answer: `${formatTerm(simplified1.coeff, simplified1.vars)} : ${formatTerm(simplified2.coeff, simplified2.vars)}`,
      working: working,
      values: { term1, term2, simplified1, simplified2 },
      difficulty: level
    };
  };

  const handleNewQuestion = (): void => {
    const q = currentTool === 'numeric' ? generateNumericQuestion(difficulty) : generateAlgebraicQuestion(difficulty);
    setCurrentQuestion(q);
    setShowAnswer(false);
    setShowWhiteboardAnswer(false);
  };

  const handleGenerateWorksheet = (): void => {
    const questions: QuestionType[] = [];
    const usedKeys = new Set<string>();
    
    const generateUniqueQuestion = (lvl: string): QuestionType => {
      let attempts = 0;
      const maxAttempts = 100;
      
      while (attempts < maxAttempts) {
        const q = currentTool === 'numeric' ? generateNumericQuestion(lvl) : generateAlgebraicQuestion(lvl);
        const uniqueKey = q.display;
        
        if (!usedKeys.has(uniqueKey)) {
          usedKeys.add(uniqueKey);
          return q;
        }
        
        attempts++;
      }
      
      return currentTool === 'numeric' ? generateNumericQuestion(lvl) : generateAlgebraicQuestion(lvl);
    };
    
    if (isDifferentiated) {
      ['level1', 'level2', 'level3'].forEach((lvl: string) => {
        for (let i = 0; i < numQuestions; i++) {
          questions.push({ ...generateUniqueQuestion(lvl), difficulty: lvl });
        }
      });
    } else {
      for (let i = 0; i < numQuestions; i++) {
        questions.push({ ...generateUniqueQuestion(difficulty), difficulty });
      }
    }
    
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  useEffect(() => {
    if ((mode === 'single' || mode === 'whiteboard') && !currentQuestion) {
      handleNewQuestion();
    }
  }, [mode]);

  useEffect(() => {
    if ((mode === 'single' || mode === 'whiteboard') && currentQuestion) {
      handleNewQuestion();
    }
  }, [difficulty, currentTool]);

  const colorConfig: Record<string, { bg: string; border: string; text: string }> = {
    level1: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700' },
    level2: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700' },
    level3: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700' }
  };

  return (
    <>
      {/* Header Bar */}
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} />
            <span className="font-semibold text-lg">Home</span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border-2 border-gray-200 overflow-hidden z-50">
                <div className="py-2">
                  <div className="px-6 py-2 font-bold text-gray-700 text-sm uppercase tracking-wide">
                    Color Schemes
                  </div>
                  {['default', 'blue', 'pink', 'yellow'].map((scheme: string) => (
                    <button 
                      key={scheme}
                      onClick={() => setColorScheme(scheme)}
                      className={'w-full text-left px-6 py-3 font-semibold transition-colors ' + 
                        (colorScheme === scheme ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}>
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
            Simplifying Ratios
          </h1>

          {/* Divider */}
          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }}></div>
          </div>

          {/* Tool Selectors */}
          <div className="flex justify-center gap-4 mb-6">
            {['numeric', 'algebraic'].map((tool: string) => (
              <button 
                key={tool}
                onClick={() => setCurrentTool(tool)}
                className={'px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ' + 
                  (currentTool === tool 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900')}>
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
            {['whiteboard', 'single', 'worksheet'].map((m: string) => (
              <button 
                key={m}
                onClick={() => setMode(m)}
                className={'px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ' + 
                  (mode === m 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900')}>
                {m === 'whiteboard' ? 'Whiteboard' : m === 'single' ? 'Worked Example' : 'Worksheet'}
              </button>
            ))}
          </div>

          {/* WHITEBOARD MODE */}
          {mode === 'whiteboard' && currentQuestion && (
            <div className="flex flex-col gap-4">
              {/* Control Bar */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: '#000000' }}>Difficulty:</span>
                      <div className="flex gap-2">
                        {['level1', 'level2', 'level3'].map((lvl: string, idx: number) => (
                          <button 
                            key={lvl}
                            onClick={() => setDifficulty(lvl)}
                            className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                              getDifficultyButtonClass(idx, difficulty === lvl)}>
                            Level {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={handleNewQuestion}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <RefreshCw size={18} />
                      New Question
                    </button>
                    <button 
                      onClick={() => setShowWhiteboardAnswer(!showWhiteboardAnswer)}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <Eye size={18} />
                      {showWhiteboardAnswer ? 'Hide Answer' : 'Show Answer'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Question Display */}
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
            </div>
          )}

          {/* WORKED EXAMPLE MODE */}
          {mode === 'single' && currentQuestion && (
            <div className="flex flex-col gap-4">
              {/* Control Bar */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: '#000000' }}>Difficulty:</span>
                      <div className="flex gap-2">
                        {['level1', 'level2', 'level3'].map((lvl: string, idx: number) => (
                          <button 
                            key={lvl}
                            onClick={() => setDifficulty(lvl)}
                            className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                              getDifficultyButtonClass(idx, difficulty === lvl)}>
                            Level {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={handleNewQuestion}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <RefreshCw size={18} />
                      New Question
                    </button>
                    <button 
                      onClick={() => setShowAnswer(!showAnswer)}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <Eye size={18} />
                      {showAnswer ? 'Hide Answer' : 'Show Answer'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Question Display */}
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
                        {currentQuestion.working.filter((s: WorkingStep) => s.type === 'step' || s.type === 'original').map((step: WorkingStep, i: number) => (
                          <div key={i} className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                            <h4 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>
                              {step.title || (step.type === 'original' ? 'Original Ratio' : `Step ${i}`)}
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
            </div>
          )}

          {/* WORKSHEET MODE */}
          {mode === 'worksheet' && (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="space-y-4">
                  {/* Line 1: Questions + Differentiated */}
                  <div className="flex justify-center items-center gap-6">
                    <div className="flex items-center gap-3">
                      <label className="text-lg font-semibold" style={{ color: '#000000' }}>
                        Questions per level:
                      </label>
                      <input 
                        type="number" 
                        min="1" 
                        max="20" 
                        value={numQuestions} 
                        onChange={(e) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))} 
                        className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="diff" 
                        checked={isDifferentiated} 
                        onChange={(e) => setIsDifferentiated(e.target.checked)} 
                        className="w-5 h-5" 
                      />
                      <label htmlFor="diff" className="text-lg font-semibold" style={{ color: '#000000' }}>
                        Differentiated
                      </label>
                    </div>
                  </div>

                  {/* Line 2: Difficulty + Columns (hidden if differentiated) */}
                  {!isDifferentiated && (
                    <div className="flex justify-center items-center gap-6">
                      <div className="flex items-center gap-3">
                        <label className="text-lg font-semibold" style={{ color: '#000000' }}>
                          Difficulty:
                        </label>
                        <div className="flex gap-2">
                          {['level1', 'level2', 'level3'].map((lvl: string, idx: number) => (
                            <button 
                              key={lvl}
                              onClick={() => setDifficulty(lvl)}
                              className={'px-6 py-2 rounded-lg font-semibold w-28 ' + 
                                getDifficultyButtonClass(idx, difficulty === lvl)}>
                              Level {idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <label className="text-lg font-semibold" style={{ color: '#000000' }}>
                          Columns:
                        </label>
                        <input 
                          type="number" 
                          min="1" 
                          max="4" 
                          value={numColumns} 
                          onChange={(e) => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))} 
                          className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg" 
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={handleGenerateWorksheet}
                      className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-800">
                      <RefreshCw size={20} /> Generate Worksheet
                    </button>
                    {worksheet.length > 0 && (
                      <button 
                        onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)}
                        className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-800">
                        <Eye size={20} />
                        {showWorksheetAnswers ? 'Hide' : 'Show'} Answers
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {worksheet.length > 0 && (
                <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQuestionBg() }}>
                  {/* Font Size Controls */}
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    <button 
                      onClick={() => setWorksheetFontSize(Math.max(0, worksheetFontSize - 1))} 
                      disabled={worksheetFontSize === 0} 
                      className={'w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ' + 
                        (worksheetFontSize === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-blue-800')}>
                      <ChevronDown size={20} />
                    </button>
                    <button 
                      onClick={() => setWorksheetFontSize(Math.min(3, worksheetFontSize + 1))} 
                      disabled={worksheetFontSize === 3} 
                      className={'w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ' + 
                        (worksheetFontSize === 3 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-blue-800')}>
                      <ChevronUp size={20} />
                    </button>
                  </div>

                  <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>
                    {toolNames[currentTool]} - Worksheet
                  </h2>
                  
                  {isDifferentiated ? (
                    <div className="grid grid-cols-3 gap-6">
                      {['level1', 'level2', 'level3'].map((lvl: string, idx: number) => (
                        <div 
                          key={lvl} 
                          className={`${colorConfig[lvl].bg} ${colorConfig[lvl].border} rounded-xl p-6 border-4`}>
                          <h3 className="text-2xl font-bold text-center mb-6" style={{ color: '#000000' }}>
                            Level {idx + 1}
                          </h3>
                          <div className="space-y-3">
                            {worksheet.filter((q: QuestionType) => q.difficulty === lvl).map((q: QuestionType, i: number) => (
                              <div key={i} className={getFontSize()} style={{ color: '#000000' }}>
                                <span className="font-semibold">{i + 1}.</span>
                                <span className="ml-3 font-bold">{q.display}</span>
                                {showWorksheetAnswers && (
                                  <div className="ml-8 font-semibold mt-1" style={{ color: '#059669' }}>
                                    = {q.answer}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`grid gap-x-6 gap-y-3 ${
                      numColumns === 1 ? 'grid-cols-1' :
                      numColumns === 2 ? 'grid-cols-2' :
                      numColumns === 3 ? 'grid-cols-3' :
                      'grid-cols-4'
                    }`}>
                      {worksheet.map((q: QuestionType, i: number) => (
                        <div key={i} className={getFontSize()} style={{ color: '#000000' }}>
                          <span className="font-semibold">{i + 1}.</span>
                          <span className="ml-2 font-bold">{q.display}</span>
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
};

export default SimplifyingRatiosTool;
