import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, Home, Menu, X, ChevronUp, ChevronDown } from 'lucide-react';

type WorkingStep = {
  type: string;
  ratio?: any;
  dividedBy?: any;
  answer?: string;
};

type AlgebraicTerm = {
  coeff: number;
  vars: { [key: string]: number };
};

type QuestionType = {
  display: string;
  answer: string;
  originalParts?: number[];
  simplifiedParts?: number[];
  hcf?: number;
  working?: WorkingStep[];
  difficulty: string;
  isAlgebraic?: boolean;
  original?: AlgebraicTerm[];
  simplified?: AlgebraicTerm[];
};

const SimplifyingRatiosTool = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<string>('whiteboard');
  const [difficulty, setDifficulty] = useState<string>('level1');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<string>('default');
  const [ratioType, setRatioType] = useState<string>('numeric'); // 'numeric' or 'algebraic'
  
  const [question, setQuestion] = useState<QuestionType | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState<boolean>(false);
  
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [worksheet, setWorksheet] = useState<QuestionType[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState<boolean>(false);
  const [isDifferentiated, setIsDifferentiated] = useState<boolean>(false);
  const [numColumns, setNumColumns] = useState<number>(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState<number>(1);

  const fontSizes = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const getFontSize = (): string => fontSizes[worksheetFontSize];
  
  const getStepBg = (): string => {
    if (colorScheme === 'blue') return '#B3D9F2';
    if (colorScheme === 'pink') return '#F2B3D9';
    if (colorScheme === 'yellow') return '#F2EBB3';
    return '#f3f4f6';
  };
  
  const getQuestionBg = (): string => {
    if (colorScheme === 'blue') return '#D1E7F8';
    if (colorScheme === 'pink') return '#F8D1E7';
    if (colorScheme === 'yellow') return '#F8F4D1';
    return '#ffffff';
  };
  
  const getWhiteboardWorkingBg = (): string => {
    if (colorScheme === 'blue') return '#B3D9F2';
    if (colorScheme === 'pink') return '#F2B3D9';
    if (colorScheme === 'yellow') return '#F2EBB3';
    return '#f3f4f6';
  };

  const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomChoice = (arr: any[]): any => arr[Math.floor(Math.random() * arr.length)];

  // Helper to format algebraic terms
  const formatTerm = (coeff: number, vars: { [key: string]: number }): string => {
    let result = coeff === 1 && Object.keys(vars).length > 0 ? '' : coeff.toString();
    
    Object.entries(vars).sort().forEach(([variable, power]: [string, number]) => {
      if (power > 0) {
        result += variable;
        if (power > 1) {
          result += power === 2 ? '²' : power === 3 ? '³' : `^${power}`;
        }
      }
    });
    
    return result || coeff.toString();
  };

  // GCD for algebraic coefficients
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

  // Generate algebraic ratio question
  const generateAlgebraicQuestion = (diff: string): QuestionType => {
    const variables = ['x', 'y', 'z'];
    let term1: AlgebraicTerm = { coeff: 1, vars: {} };
    let term2: AlgebraicTerm = { coeff: 1, vars: {} };
    
    if (diff === 'level1') {
      // One common factor ONLY (could be numeric OR algebraic OR power, but not multiple)
      const factorType = randomChoice(['numeric', 'algebraic', 'power']);
      
      if (factorType === 'numeric') {
        // e.g., 6x:9y (only numeric factor 3, variables are different)
        const commonFactor = randomChoice([2, 3, 4, 5, 6, 8, 10]);
        // Generate coprime coefficients for simplified form
        const coeff1 = randomInt(1, 5);
        let coeff2 = randomInt(1, 5);
        while (gcd(coeff1, coeff2) !== 1 || coeff1 === coeff2) {
          coeff2 = randomInt(1, 5);
        }
        term1.coeff = commonFactor * coeff1;
        term2.coeff = commonFactor * coeff2;
        const var1 = randomChoice(variables);
        const var2 = randomChoice(variables.filter(v => v !== var1));
        term1.vars[var1] = 1;
        term2.vars[var2] = 1;
      } else if (factorType === 'algebraic') {
        // e.g., 2xy:3xz (only algebraic factor x, coefficients coprime and different)
        let coeff1 = randomInt(2, 5);
        let coeff2 = randomInt(2, 5);
        while (gcd(coeff1, coeff2) !== 1 || coeff1 === coeff2) {
          coeff2 = randomInt(2, 5);
        }
        term1.coeff = coeff1;
        term2.coeff = coeff2;
        const commonVar = randomChoice(variables);
        const var1 = randomChoice(variables.filter(v => v !== commonVar));
        const var2 = randomChoice(variables.filter(v => v !== commonVar && v !== var1));
        term1.vars[commonVar] = 1;
        term1.vars[var1] = 1;
        term2.vars[commonVar] = 1;
        term2.vars[var2] = 1;
      } else {
        // e.g., 2x²:3x (only power factor x, coefficients coprime and different)
        let coeff1 = randomInt(2, 5);
        let coeff2 = randomInt(2, 5);
        while (gcd(coeff1, coeff2) !== 1 || coeff1 === coeff2) {
          coeff2 = randomInt(2, 5);
        }
        term1.coeff = coeff1;
        term2.coeff = coeff2;
        const var1 = randomChoice(variables);
        term1.vars[var1] = 2;
        term2.vars[var1] = 1;
      }
    } else if (diff === 'level2') {
      // Two independent factors
      const commonNumFactor = randomChoice([2, 3, 4, 5, 6, 8, 10, 12]);
      const mult1 = randomInt(1, 4);
      let mult2 = randomInt(1, 4);
      while (mult1 === mult2) {
        mult2 = randomInt(1, 4);
      }
      term1.coeff = commonNumFactor * mult1;
      term2.coeff = commonNumFactor * mult2;
      
      const type = randomChoice(['power', 'twoVars']);
      
      if (type === 'power') {
        // e.g., 4x:6x² → 2:3x
        const var1 = randomChoice(variables);
        term1.vars[var1] = 1;
        term2.vars[var1] = 2;
      } else {
        // e.g., 4xy:10xz → 2y:5z
        const commonVar = randomChoice(variables);
        const var1 = randomChoice(variables.filter(v => v !== commonVar));
        const var2 = randomChoice(variables.filter(v => v !== commonVar && v !== var1));
        term1.vars[commonVar] = 1;
        term1.vars[var1] = 1;
        term2.vars[commonVar] = 1;
        term2.vars[var2] = 1;
      }
    } else {
      // Level 3: Powers of variables
      // e.g., 3x²y³:9x³y → y²:3x
      const commonNumFactor = randomChoice([2, 3, 4, 5, 6, 8, 9, 10, 12]);
      const mult1 = randomInt(1, 3);
      let mult2 = randomInt(2, 4);
      while (mult1 * commonNumFactor === mult2 * commonNumFactor) {
        mult2 = randomInt(2, 4);
      }
      term1.coeff = commonNumFactor * mult1;
      term2.coeff = commonNumFactor * mult2;
      
      const var1 = randomChoice(variables);
      const var2 = randomChoice(variables.filter(v => v !== var1));
      
      term1.vars[var1] = 2;
      term1.vars[var2] = 3;
      term2.vars[var1] = 3;
      term2.vars[var2] = 1;
    }
    
    // Calculate simplified form
    const coeffGcd = gcd(term1.coeff, term2.coeff);
    const simplified1: AlgebraicTerm = { coeff: term1.coeff / coeffGcd, vars: {} };
    const simplified2: AlgebraicTerm = { coeff: term2.coeff / coeffGcd, vars: {} };
    
    // Find common variable powers
    const allVars = new Set([...Object.keys(term1.vars), ...Object.keys(term2.vars)]);
    allVars.forEach((v: string) => {
      const power1 = term1.vars[v] || 0;
      const power2 = term2.vars[v] || 0;
      const minPower = Math.min(power1, power2);
      
      if (power1 > minPower) simplified1.vars[v] = power1 - minPower;
      if (power2 > minPower) simplified2.vars[v] = power2 - minPower;
    });
    
    return {
      display: `${formatTerm(term1.coeff, term1.vars)}:${formatTerm(term2.coeff, term2.vars)}`,
      answer: `${formatTerm(simplified1.coeff, simplified1.vars)}:${formatTerm(simplified2.coeff, simplified2.vars)}`,
      original: [term1, term2],
      simplified: [simplified1, simplified2],
      working: generateAlgebraicWorking(term1, term2, simplified1, simplified2, coeffGcd),
      difficulty: diff,
      isAlgebraic: true
    };
  };

  const generateAlgebraicWorking = (term1: AlgebraicTerm, term2: AlgebraicTerm, simp1: AlgebraicTerm, simp2: AlgebraicTerm, coeffGcd: number): WorkingStep[] => {
    const steps: WorkingStep[] = [{ 
      type: 'original', 
      ratio: [formatTerm(term1.coeff, term1.vars), formatTerm(term2.coeff, term2.vars)] 
    }];
    
    let currentTerm1: AlgebraicTerm = { coeff: term1.coeff, vars: {...term1.vars} };
    let currentTerm2: AlgebraicTerm = { coeff: term2.coeff, vars: {...term2.vars} };
    
    // Step 1: Divide by numeric factor if > 1
    if (coeffGcd > 1) {
      currentTerm1.coeff = currentTerm1.coeff / coeffGcd;
      currentTerm2.coeff = currentTerm2.coeff / coeffGcd;
      steps.push({ 
        type: 'step', 
        ratio: [formatTerm(currentTerm1.coeff, currentTerm1.vars), formatTerm(currentTerm2.coeff, currentTerm2.vars)],
        dividedBy: coeffGcd.toString()
      });
    }
    
    // Step 2: Divide by each algebraic factor separately
    const allVars = new Set([...Object.keys(term1.vars), ...Object.keys(term2.vars)]);
    
    // Sort variables alphabetically for consistent order
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
        
        steps.push({ 
          type: 'step', 
          ratio: [formatTerm(currentTerm1.coeff, currentTerm1.vars), formatTerm(currentTerm2.coeff, currentTerm2.vars)],
          dividedBy: factor
        });
      }
    });
    
    steps.push({ 
      type: 'final', 
      answer: `${formatTerm(simp1.coeff, simp1.vars)}:${formatTerm(simp2.coeff, simp2.vars)}` 
    });
    
    return steps;
  };

  const findHCF = (numbers: number[]): number => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    return numbers.reduce((acc: number, num: number) => gcd(acc, num));
  };

  const verifyHCF = (parts: number[], hcf: number): boolean => {
    const allDivisible = parts.every((p: number) => p % hcf === 0);
    const simplified = parts.map((p: number) => p / hcf);
    const simplifiedHCF = findHCF(simplified);
    return allDivisible && simplifiedHCF === 1;
  };

  const findSmallestCommonFactor = (numbers: number[]): number => {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
    for (let prime of primes) {
      if (numbers.every((n: number) => n % prime === 0)) return prime;
    }
    return 1;
  };

  const generateWorking = (original: number[], simplified: number[]): WorkingStep[] => {
    const steps: WorkingStep[] = [{ type: 'original', ratio: [...original] }];
    let current = [...original];
    
    while (findHCF(current) > 1) {
      const commonFactor = findSmallestCommonFactor(current);
      const next = current.map((x: number) => x / commonFactor);
      steps.push({ type: 'step', ratio: next, dividedBy: commonFactor });
      current = next;
    }
    
    steps.push({ type: 'final', answer: simplified.join(':') });
    return steps;
  };

  const generateQuestion = (diff: string): QuestionType => {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      attempts++;

      // Level 3 is always 3-part ratios
      const isThreePart = diff === 'level3';
      const numParts = isThreePart ? 3 : 2;

      let simplified: number[] = [];
      let hcf = 0;
      let minPart = 0, maxPart = 0;
      let hcfChoices: number[] = [];

      if (diff === 'level1') {
        for (let i = 0; i < numParts; i++) {
          simplified.push(randomInt(1, 5));
        }
        hcfChoices = [2, 3, 4, 5];
        minPart = 4;
        maxPart = 20;
      } else if (diff === 'level2') {
        for (let i = 0; i < numParts; i++) {
          simplified.push(randomInt(1, 8));
        }
        hcfChoices = [6, 8, 9, 10, 12, 15, 18];
        minPart = 12;
        maxPart = 60;
      } else {
        // Level 3: 3-part ratios with similar difficulty to Level 2
        for (let i = 0; i < numParts; i++) {
          simplified.push(randomInt(1, 8));
        }
        hcfChoices = [6, 8, 9, 10, 12, 15, 18];
        minPart = 12;
        maxPart = 60;
      }

      if (findHCF(simplified) !== 1) continue;

      hcf = randomChoice(hcfChoices);
      const original = simplified.map((x: number) => x * hcf);

      if (original.some((x: number) => x < minPart || x > maxPart)) continue;
      if (!verifyHCF(original, hcf)) continue;

      return {
        display: `${original.join(':')}`,
        answer: simplified.join(':'),
        originalParts: original,
        simplifiedParts: simplified,
        hcf: hcf,
        working: generateWorking(original, simplified),
        difficulty: diff
      };
    }

    return {
      display: '6:9',
      answer: '2:3',
      originalParts: [6, 9],
      simplifiedParts: [2, 3],
      hcf: 3,
      working: generateWorking([6, 9], [2, 3]),
      difficulty: diff
    };
  };

  const handleNewQuestion = (): void => {
    if (ratioType === 'algebraic') {
      setQuestion(generateAlgebraicQuestion(difficulty));
    } else {
      setQuestion(generateQuestion(difficulty));
    }
    setShowAnswer(false);
    setShowWhiteboardAnswer(false);
  };

  const handleGenerateWorksheet = (): void => {
    const questions: QuestionType[] = [];
    const usedKeys = new Set();
    
    const generateUniqueQuestion = (level: string): QuestionType => {
      let attempts = 0;
      const maxAttempts = 100;
      
      while (attempts < maxAttempts) {
        const q = ratioType === 'algebraic' ? generateAlgebraicQuestion(level) : generateQuestion(level);
        const uniqueKey = q.display;
        
        if (!usedKeys.has(uniqueKey)) {
          usedKeys.add(uniqueKey);
          return q;
        }
        
        attempts++;
      }
      
      return ratioType === 'algebraic' ? generateAlgebraicQuestion(level) : generateQuestion(level);
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
    if ((mode === 'single' || mode === 'whiteboard') && !question) {
      handleNewQuestion();
    }
  }, [mode]);

  useEffect(() => {
    if ((mode === 'single' || mode === 'whiteboard') && question) {
      handleNewQuestion();
    }
  }, [difficulty, ratioType]);

  const renderStep = (step: WorkingStep, idx: number) => {
    const displayRatio = Array.isArray(step.ratio) ? step.ratio.join(':') : step.ratio;
    
    return (
      <div key={idx} className="rounded-lg p-6 border border-gray-200" style={{ backgroundColor: getStepBg() }}>
        {step.type === 'original' && (
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-3" style={{ color: '#000000' }}>Original Ratio</h4>
            <div className="text-5xl font-bold" style={{ color: '#000000' }}>{displayRatio}</div>
          </div>
        )}

        {step.type === 'step' && (
          <div className="text-center">
            <div className="text-3xl mb-2" style={{ color: '#000000' }}>↓ (÷{step.dividedBy})</div>
            <div className="text-5xl font-bold" style={{ color: '#000000' }}>{displayRatio}</div>
          </div>
        )}

        {step.type === 'final' && (
          <div className="text-center">
            <h4 className="text-xl font-semibold mb-3" style={{ color: '#000000' }}>Simplified Ratio</h4>
            <div className="text-5xl font-bold" style={{ color: '#166534' }}>{step.answer}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
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
                  <button 
                    onClick={() => setColorScheme('default')}
                    className={'w-full text-left px-6 py-3 font-semibold transition-colors ' + 
                      (colorScheme === 'default' ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}>
                    Default
                  </button>
                  <button 
                    onClick={() => setColorScheme('blue')}
                    className={'w-full text-left px-6 py-3 font-semibold transition-colors ' + 
                      (colorScheme === 'blue' ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}>
                    Blue
                  </button>
                  <button 
                    onClick={() => setColorScheme('pink')}
                    className={'w-full text-left px-6 py-3 font-semibold transition-colors ' + 
                      (colorScheme === 'pink' ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}>
                    Pink
                  </button>
                  <button 
                    onClick={() => setColorScheme('yellow')}
                    className={'w-full text-left px-6 py-3 font-semibold transition-colors ' + 
                      (colorScheme === 'yellow' ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}>
                    Yellow
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>Simplifying Ratios</h1>

          {/* Ratio Type Toggle */}
          <div className="flex justify-center gap-4 mb-8">
            <button 
              onClick={() => setRatioType('numeric')}
              className={'px-8 py-4 rounded-xl font-bold text-xl transition-all border-2 border-gray-200 ' + 
                (ratioType === 'numeric' 
                  ? 'bg-blue-900 text-white shadow-lg' 
                  : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900 shadow')}>
              Numeric Ratios
            </button>
            <button 
              onClick={() => setRatioType('algebraic')}
              className={'px-8 py-4 rounded-xl font-bold text-xl transition-all border-2 border-gray-200 ' + 
                (ratioType === 'algebraic' 
                  ? 'bg-blue-900 text-white shadow-lg' 
                  : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900 shadow')}>
              Algebraic Ratios
            </button>
          </div>

          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '1px', backgroundColor: '#d1d5db' }}></div>
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center gap-4 mb-8">
            {(['whiteboard', 'single', 'worksheet'] as const).map((m: string) => (
              <button 
                key={m}
                onClick={() => setMode(m)}
                className={'px-8 py-4 rounded-xl font-bold text-xl transition-all border-2 border-gray-200 ' + 
                  (mode === m 
                    ? 'bg-blue-900 text-white shadow-lg' 
                    : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900 shadow')}>
                {m === 'whiteboard' ? 'Whiteboard' :
                 m === 'single' ? 'Single Q' :
                 'Worksheet'}
              </button>
            ))}
          </div>

          {/* WHITEBOARD & SINGLE Q MODES */}
          {(mode === 'whiteboard' || mode === 'single') && (
            <div className="flex flex-col gap-4" style={mode === 'single' ? { minHeight: '120vh' } : {}}>
              {/* Compact Control Bar */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-600">Difficulty:</span>
                    <div className="flex gap-2">
                      {(['level1', 'level2', 'level3'] as const).map((lvl: string, idx: number) => (
                        <button 
                          key={lvl}
                          onClick={() => setDifficulty(lvl)}
                          className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                            (difficulty === lvl 
                              ? (lvl === 'level1' ? 'bg-green-600 text-white' :
                                 lvl === 'level2' ? 'bg-yellow-600 text-white' :
                                 'bg-red-600 text-white')
                              : (lvl === 'level1' ? 'bg-white text-green-600 border-2 border-green-600' :
                                 lvl === 'level2' ? 'bg-white text-yellow-600 border-2 border-yellow-600' :
                                 'bg-white text-red-600 border-2 border-red-600'))}>
                          Level {idx + 1}
                        </button>
                      ))}
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
                      onClick={() => mode === 'whiteboard' ? setShowWhiteboardAnswer(!showWhiteboardAnswer) : setShowAnswer(!showAnswer)}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <Eye size={18} />
                      {(mode === 'whiteboard' ? showWhiteboardAnswer : showAnswer) ? 'Hide Answer' : 'Show Answer'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Question Display */}
              {question && (
                <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
                  {mode === 'whiteboard' ? (
                    <>
                      <div className="text-center mb-6">
                        <span className="text-2xl font-semibold" style={{ color: '#000000' }}>Simplify:</span>
                      </div>
                      {!showWhiteboardAnswer ? (
                        <div className="text-6xl font-bold text-center mb-6" style={{ color: '#000000' }}>
                          {question.display}
                        </div>
                      ) : (
                        <div className="text-6xl font-bold text-center mb-6">
                          <span style={{ color: '#000000' }}>{question.display}</span>
                          <span style={{ color: '#166534' }} className="ml-4">= {question.answer}</span>
                        </div>
                      )}
                      
                      <div className="rounded-xl" style={{ height: '500px', backgroundColor: getWhiteboardWorkingBg() }}></div>
                    </>
                  ) : (
                    <>
                      <div className="text-center mb-8">
                        <div className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Simplify:</div>
                        <span className="text-6xl font-bold" style={{ color: '#000000' }}>
                          {question.display}
                        </span>
                      </div>
                      
                      {showAnswer && question.working && (
                        <div className="mt-8 space-y-6">
                          <h3 className="text-3xl font-bold mb-6 text-center" style={{ color: '#000000' }}>Solution:</h3>
                          {question.working.map((step: WorkingStep, idx: number) => renderStep(step, idx))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* WORKSHEET MODE */}
          {mode === 'worksheet' && (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="space-y-4">
                  {/* Line 1 */}
                  <div className="flex justify-center items-center gap-8">
                    <div className="flex items-center gap-3">
                      <label className="text-lg font-semibold">Questions per level:</label>
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
                      <label htmlFor="diff" className="text-lg font-semibold">Differentiated</label>
                    </div>
                  </div>

                  {/* Line 2 */}
                  <div className="flex justify-center items-center gap-8">
                    {!isDifferentiated && (
                      <>
                        <div className="flex items-center gap-3">
                          <label className="text-lg font-semibold">Difficulty:</label>
                          <div className="flex gap-2">
                            {(['level1', 'level2', 'level3'] as const).map((lvl: string, idx: number) => (
                              <button 
                                key={lvl}
                                onClick={() => setDifficulty(lvl)}
                                className={'px-6 py-2 rounded-lg font-semibold w-24 ' + 
                                  (difficulty === lvl 
                                    ? (lvl === 'level1' ? 'bg-green-600 text-white' :
                                       lvl === 'level2' ? 'bg-yellow-600 text-white' :
                                       'bg-red-600 text-white')
                                    : (lvl === 'level1' ? 'bg-white text-green-600 border-2 border-green-600' :
                                       lvl === 'level2' ? 'bg-white text-yellow-600 border-2 border-yellow-600' :
                                       'bg-white text-red-600 border-2 border-red-600'))}>
                                Level {idx + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <label className="text-lg font-semibold">Columns:</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="4" 
                            value={numColumns} 
                            onChange={(e) => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))} 
                            className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg" 
                          />
                        </div>
                      </>
                    )}

                    <button onClick={handleGenerateWorksheet}
                      className="px-8 py-3 bg-blue-900 text-white rounded-lg font-semibold text-lg hover:bg-blue-800 shadow-lg">
                      Generate Worksheet
                    </button>
                    {worksheet.length > 0 && (
                      <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)}
                        className="px-8 py-3 bg-blue-900 text-white rounded-lg font-semibold text-lg flex items-center gap-2 hover:bg-blue-800 shadow-lg">
                        <Eye size={20} />
                        {showWorksheetAnswers ? 'Hide' : 'Show'} Answers
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {worksheet.length > 0 && (
                <div className="bg-white rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQuestionBg() }}>
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

                  <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>Simplifying Ratios Worksheet</h2>
                  
                  {isDifferentiated ? (
                    <div className="grid grid-cols-3 gap-6">
                      {(['level1', 'level2', 'level3'] as const).map((lvl: string, idx: number) => (
                        <div key={lvl} className={'rounded-xl p-6 border-4 ' +
                          (lvl === 'level1' ? 'bg-green-50 border-green-500' :
                           lvl === 'level2' ? 'bg-yellow-50 border-yellow-500' :
                           'bg-red-50 border-red-500')}>
                          <h3 className="text-2xl font-bold text-center mb-6" style={{ color: '#000000' }}>
                            Level {idx + 1}
                          </h3>
                          <div className="space-y-3">
                            {worksheet.filter((q: QuestionType) => q.difficulty === lvl).map((q: QuestionType, i: number) => (
                              <div key={i} className={getFontSize()} style={{ color: '#000000' }}>
                                <span className="font-semibold" style={{ color: '#000000' }}>{i + 1}.</span>
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
                          <span className="font-semibold" style={{ color: '#000000' }}>{i + 1}.</span>
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
};

export default SimplifyingRatiosTool;
