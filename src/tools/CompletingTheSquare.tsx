import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// ===== TYPE DEFINITIONS =====
type WorkingStep = {
  type: string;
  title?: string;
  content: string;
};

type QuestionValues = {
  a: number;
  b: number;
  c: number;
  p: number;
  q: number;
};

type QuestionType = {
  display: string;
  answer: string;
  working: WorkingStep[];
  values: QuestionValues;
  difficulty: string;
};

export default function CompletingTheSquareTool() {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [questionType, setQuestionType] = useState<string>('completing');
  const [mode, setMode] = useState<string>('whiteboard');
  const [difficulty, setDifficulty] = useState<string>('level1');
  const [negativeCoefficients, setNegativeCoefficients] = useState<boolean>(false);
  
  const [currentQuestion, setCurrentQuestion] = useState<QuestionType | null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [worksheet, setWorksheet] = useState<QuestionType[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState<boolean>(false);
  const [isDifferentiated, setIsDifferentiated] = useState<boolean>(false);
  const [numColumns, setNumColumns] = useState<number>(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState<number>(1);
  
  const [colorScheme, setColorScheme] = useState<string>('default');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  
  // ===== FONT SIZES =====
  const fontSizes: string[] = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const getFontSize = (): string => fontSizes[worksheetFontSize];
  
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
  
  const getWhiteboardWorkingBg = (): string => getStepBg();
  const getFinalAnswerBg = (): string => getStepBg();
  
  // ===== DIFFICULTY BUTTON CLASS =====
  const getDifficultyButtonClass = (lvl: string, idx: number, isActive: boolean): string => {
    if (isActive) {
      return idx === 0 ? 'bg-green-600 text-white' 
           : idx === 1 ? 'bg-yellow-600 text-white' 
           : 'bg-red-600 text-white';
    }
    return idx === 0 ? 'bg-white text-green-600 border-2 border-green-600' 
         : idx === 1 ? 'bg-white text-yellow-600 border-2 border-yellow-600' 
         : 'bg-white text-red-600 border-2 border-red-600';
  };
  
  // ===== QUESTION GENERATION =====
  const generateQuestion = (level: string, useNegative: boolean = false): QuestionType => {
    let a = 0, b = 0, c = 0, p = 0, q = 0;
    
    if (level === 'level1') {
      a = 1;
      p = Math.floor(Math.random() * 19) - 9;
      if (p === 0) p = 1;
    } else if (level === 'level2') {
      a = 1;
      p = (Math.floor(Math.random() * 19) - 9) + 0.5;
    } else {
      a = Math.floor(Math.random() * 4) + 2;
      if (useNegative && Math.random() > 0.5) a = -a;
      
      if (Math.random() > 0.5) {
        p = Math.floor(Math.random() * 19) - 9;
        if (p === 0) p = 1;
      } else {
        p = (Math.floor(Math.random() * 19) - 9) + 0.5;
      }
    }
    
    if (questionType === 'roots') {
      if (Math.random() < 0.1) {
        q = Math.floor(Math.random() * 15) + 1;
      } else {
        q = -(Math.floor(Math.random() * 15) + 1);
      }
      c = a * p * p + q;
    } else {
      if (p % 1 !== 0) {
        if (Math.random() > 0.5) {
          c = Math.floor(Math.random() * 17) - 8;
          q = c - a * p * p;
        } else {
          q = Math.floor(Math.random() * 17) - 8;
          c = a * p * p + q;
        }
      } else {
        q = Math.floor(Math.random() * 17) - 8;
        c = a * p * p + q;
      }
    }
    
    b = 2 * a * p;
    c = a * p * p + q;
    
    const aStr = a === 1 ? '' : a === -1 ? '−' : a > 0 ? a : `−${Math.abs(a)}`;
    const bStr = b === 0 ? '' : 
                 Math.abs(b) === 1 ? (b > 0 ? ' + x' : ' − x') :
                 b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
    const cStr = c === 0 ? '' : c > 0 ? ` + ${c}` : ` − ${Math.abs(c)}`;
    
    const display = `y = ${aStr}x²${bStr}${cStr}`;
    
    const working: WorkingStep[] = [];
    
    if (a !== 1) {
      const bOverA = b / a;
      const bOverAStr = bOverA > 0 ? `+ ${bOverA}x` : bOverA < 0 ? `− ${Math.abs(bOverA)}x` : '';
      const cStr2 = c > 0 ? ` + ${c}` : c < 0 ? ` − ${Math.abs(c)}` : '';
      
      working.push({
        type: 'step',
        title: `Factor out ${a}`,
        content: `y = ${a}(x²${bOverAStr ? ' ' + bOverAStr : ''})${cStr2}`
      });
    }
    
    const halfCoef = b / (2 * a);
    const halfCoefStr = halfCoef % 1 === 0 ? halfCoef : halfCoef.toFixed(1);
    const coeffAfterFactoring = b / a;
    const coeffAfterFactoringStr = coeffAfterFactoring % 1 === 0 ? coeffAfterFactoring : coeffAfterFactoring.toFixed(1);
    
    working.push({
      type: 'step',
      title: 'Half the coefficient of x',
      content: a !== 1 ? `${coeffAfterFactoringStr}/2 = ${halfCoefStr}` : `${b}/2 = ${halfCoefStr}`
    });
    
    const pStr = p > 0 ? `+ ${p % 1 === 0 ? p : p.toFixed(1)}` : p < 0 ? `− ${Math.abs(p) % 1 === 0 ? Math.abs(p) : Math.abs(p).toFixed(1)}` : '';
    const pSquared = p * p;
    const pSquaredStr = pSquared % 1 === 0 ? pSquared : pSquared.toFixed(2);
    
    if (a !== 1) {
      working.push({
        type: 'step',
        title: 'Complete the square',
        content: `y = ${a}[(x ${pStr})² − ${pSquaredStr}] ${c > 0 ? `+ ${c}` : c < 0 ? `− ${Math.abs(c)}` : ''}`
      });
    } else {
      working.push({
        type: 'step',
        title: 'Complete the square',
        content: `y = [(x ${pStr})² − ${pSquaredStr}] ${c > 0 ? `+ ${c}` : c < 0 ? `− ${Math.abs(c)}` : ''}`
      });
    }
    
    const aPSquared = a * pSquared;
    const aPSquaredStr = aPSquared % 1 === 0 ? aPSquared : aPSquared.toFixed(2);
    
    if (a !== 1) {
      working.push({
        type: 'step',
        title: 'Expand the square brackets',
        content: `y = ${a}(x ${pStr})² − ${aPSquaredStr} ${c > 0 ? `+ ${c}` : c < 0 ? `− ${Math.abs(c)}` : ''}`
      });
    } else {
      working.push({
        type: 'step',
        title: 'Expand the square brackets',
        content: `y = (x ${pStr})² − ${pSquaredStr} ${c > 0 ? `+ ${c}` : c < 0 ? `− ${Math.abs(c)}` : ''}`
      });
    }
    
    const aFinal = a === 1 ? '' : a === -1 ? '−' : a;
    const pFinal = p > 0 ? `+ ${p % 1 === 0 ? p : p.toFixed(1)}` : p < 0 ? `− ${Math.abs(p) % 1 === 0 ? Math.abs(p) : Math.abs(p).toFixed(1)}` : '';
    const qFinal = q > 0 ? `+ ${q % 1 === 0 ? q : q.toFixed(2)}` : q < 0 ? `− ${Math.abs(q) % 1 === 0 ? Math.abs(q) : Math.abs(q).toFixed(2)}` : '';
    
    let answer = '';
    
    if (questionType === 'roots') {
      working.push({
        type: 'step',
        title: 'Set equal to zero',
        content: `0 = ${aFinal}(x ${pFinal})² ${qFinal}`
      });
      
      working.push({
        type: 'step',
        title: 'Rearrange',
        content: `${aFinal}(x ${pFinal})² = ${-q % 1 === 0 ? -q : (-q).toFixed(2)}`
      });
      
      if (q > 0) {
        answer = "No real roots";
      } else {
        if (a !== 1) {
          const qOverA = -q / a;
          const qOverAStr = qOverA % 1 === 0 ? qOverA : qOverA.toFixed(2);
          working.push({
            type: 'step',
            title: `Divide by ${a}`,
            content: `(x ${pFinal})² = ${qOverAStr}`
          });
        }
        
        const sqrtValue = a !== 1 ? -q / a : -q;
        const sqrtStr = sqrtValue % 1 === 0 && Math.sqrt(sqrtValue) % 1 === 0 
          ? Math.sqrt(sqrtValue).toString() 
          : `√${sqrtValue % 1 === 0 ? sqrtValue : sqrtValue.toFixed(2)}`;
        
        working.push({
          type: 'step',
          title: 'Square root both sides',
          content: `x ${pFinal} = ±${sqrtStr}`
        });
        
        const negPStr = -p > 0 ? -p % 1 === 0 ? (-p).toString() : (-p).toFixed(1) : 
                         -p < 0 ? `−${Math.abs(-p) % 1 === 0 ? Math.abs(-p) : Math.abs(-p).toFixed(1)}` : '0';
        
        answer = `x = ${negPStr} ± ${sqrtStr}`;
      }
    } else if (questionType === 'turning') {
      working.push({
        type: 'step',
        title: 'Identify minimum value of squared term',
        content: `(x ${pFinal})² ≥ 0 for all values of x`
      });
      
      const negP = -p;
      const negPStr = negP > 0 ? (negP % 1 === 0 ? negP.toString() : negP.toFixed(1)) : 
                      negP < 0 ? `−${Math.abs(negP) % 1 === 0 ? Math.abs(negP) : Math.abs(negP).toFixed(1)}` : '0';
      
      working.push({
        type: 'step',
        title: 'Find when the bracket equals zero',
        content: `(x ${pFinal})² = 0 when x = ${negPStr}`
      });
      
      const qStr = q % 1 === 0 ? q.toString() : q.toFixed(2);
      
      working.push({
        type: 'step',
        title: 'Find the y-coordinate',
        content: `When x = ${negPStr}, y = ${qStr}`
      });
      
      answer = `(${negPStr}, ${qStr})`;
    } else {
      answer = `y = ${aFinal}(x ${pFinal})² ${qFinal}`;
    }
    
    return {
      display,
      answer,
      working,
      values: { a, b, c, p, q },
      difficulty: level
    };
  };
  
  // ===== EVENT HANDLERS =====
  const handleNewQuestion = (): void => {
    setCurrentQuestion(generateQuestion(difficulty, negativeCoefficients));
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };
  
  const handleGenerateWorksheet = (): void => {
    const questions: QuestionType[] = [];
    const usedKeys = new Set<string>();
    
    const generateUniqueQuestion = (lvl: string): QuestionType => {
      let attempts = 0;
      let q: QuestionType = generateQuestion(lvl, negativeCoefficients);
      let uniqueKey = '';
      
      do {
        q = generateQuestion(lvl, negativeCoefficients);
        uniqueKey = `${q.values.a}-${q.values.b}-${q.values.c}`;
        if (++attempts > 100) break;
      } while (usedKeys.has(uniqueKey));
      
      usedKeys.add(uniqueKey);
      return q;
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
  
  // ===== EFFECTS =====
  useEffect(() => {
    if (!currentQuestion || 
        currentQuestion.difficulty !== difficulty || 
        (mode === 'whiteboard' || mode === 'single')) {
      handleNewQuestion();
    }
  }, [mode, difficulty, negativeCoefficients, questionType]);
  
  // ===== RENDER =====
  return (
    <>
      {/* Header Bar */}
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} />
            <span className="font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border-2 border-gray-200 overflow-hidden z-50">
                <div className="py-2">
                  <div className="px-6 py-2 font-bold text-gray-700 text-sm uppercase tracking-wide">Color Schemes</div>
                  {['default', 'blue', 'pink', 'yellow'].map((scheme: string) => (
                    <button key={scheme} onClick={() => setColorScheme(scheme)}
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
            Completing the Square
          </h1>
          
          {/* Divider */}
          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }}></div>
          </div>
          
          {/* Question Type Selectors */}
          <div className="flex justify-center gap-4 mb-6">
            {[
              { key: 'completing', label: 'Completing the Square' },
              { key: 'roots', label: 'Finding Roots' },
              { key: 'turning', label: 'Turning Points' }
            ].map((type: { key: string; label: string }) => (
              <button key={type.key} onClick={() => setQuestionType(type.key)}
                className={'px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ' +
                  (questionType === type.key 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900')}>
                {type.label}
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
              <button key={m} onClick={() => setMode(m)}
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
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: '#000000' }}>Difficulty:</span>
                      <div className="flex gap-2">
                        {['level1', 'level2', 'level3'].map((lvl: string, idx: number) => (
                          <button key={lvl} onClick={() => setDifficulty(lvl)}
                            className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                              getDifficultyButtonClass(lvl, idx, difficulty === lvl)}>
                            Level {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {difficulty === 'level3' && (
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={negativeCoefficients} 
                            onChange={(e) => setNegativeCoefficients(e.target.checked)} className="w-4 h-4" />
                          <span className="text-sm font-semibold" style={{ color: '#000000' }}>Negative Coefficients</span>
                        </label>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button onClick={handleNewQuestion}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <RefreshCw size={18} />
                      New Question
                    </button>
                    <button onClick={() => setShowWhiteboardAnswer(!showWhiteboardAnswer)}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <Eye size={18} />
                      {showWhiteboardAnswer ? 'Hide Answer' : 'Show Answer'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
                <div className="text-center">
                  <span className="text-6xl font-bold" style={{ color: '#000000' }}>
                    {currentQuestion.display}
                  </span>
                  {showWhiteboardAnswer && (
                    <span className="text-6xl font-bold ml-4" style={{ color: '#166534' }}>
                      {currentQuestion.answer}
                    </span>
                  )}
                </div>
                <div className="rounded-xl mt-8" style={{ height: '500px', backgroundColor: getWhiteboardWorkingBg() }}></div>
              </div>
            </>
          )}
          
          {/* WORKED EXAMPLE MODE */}
          {mode === 'single' && currentQuestion && (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: '#000000' }}>Difficulty:</span>
                      <div className="flex gap-2">
                        {['level1', 'level2', 'level3'].map((lvl: string, idx: number) => (
                          <button key={lvl} onClick={() => setDifficulty(lvl)}
                            className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                              getDifficultyButtonClass(lvl, idx, difficulty === lvl)}>
                            Level {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {difficulty === 'level3' && (
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={negativeCoefficients} 
                            onChange={(e) => setNegativeCoefficients(e.target.checked)} className="w-4 h-4" />
                          <span className="text-sm font-semibold" style={{ color: '#000000' }}>Negative Coefficients</span>
                        </label>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button onClick={handleNewQuestion}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <RefreshCw size={18} />
                      New Question
                    </button>
                    <button onClick={() => setShowAnswer(!showAnswer)}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <Eye size={18} />
                      {showAnswer ? 'Hide Answer' : 'Show Answer'}
                    </button>
                  </div>
                </div>
              </div>
              
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
                              Step {i + 1}{step.title ? `: ${step.title}` : ''}
                            </h4>
                            <p className="text-3xl" style={{ color: '#000000' }}>
                              {step.content}
                            </p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: getFinalAnswerBg() }}>
                        <span className="text-5xl font-bold" style={{ color: '#166534' }}>
                          {currentQuestion.answer}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* WORKSHEET MODE */}
          {mode === 'worksheet' && (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="space-y-4">
                  {/* Line 1 */}
                  <div className="flex justify-center items-center gap-6">
                    <div className="flex items-center gap-3">
                      <label className="text-lg font-semibold" style={{ color: '#000000' }}>Questions per level:</label>
                      <input type="number" min="1" max="20" value={numQuestions} 
                        onChange={(e) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))} 
                        className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg" />
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="diff" checked={isDifferentiated} 
                        onChange={(e) => setIsDifferentiated(e.target.checked)} className="w-5 h-5" />
                      <label htmlFor="diff" className="text-lg font-semibold" style={{ color: '#000000' }}>Differentiated</label>
                    </div>
                  </div>
                  
                  {/* Line 2 */}
                  {!isDifferentiated && (
                    <div className="flex justify-center items-center gap-6">
                      <div className="flex items-center gap-3">
                        <label className="text-lg font-semibold" style={{ color: '#000000' }}>Difficulty:</label>
                        <div className="flex gap-2">
                          {['level1', 'level2', 'level3'].map((lvl: string, idx: number) => (
                            <button key={lvl} onClick={() => setDifficulty(lvl)}
                              className={'px-6 py-2 rounded-lg font-semibold ' + 
                                (difficulty === lvl 
                                  ? (idx === 0 ? 'bg-green-600 text-white' : idx === 1 ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white')
                                  : 'bg-gray-200')}>
                              Level {idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-lg font-semibold" style={{ color: '#000000' }}>Columns:</label>
                        <input type="number" min="1" max="4" value={numColumns} 
                          onChange={(e) => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))} 
                          className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg" />
                      </div>
                    </div>
                  )}
                  
                  {/* Line 3 */}
                  {!isDifferentiated && difficulty === 'level3' && (
                    <div className="flex justify-center items-center gap-6">
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={negativeCoefficients} 
                            onChange={(e) => setNegativeCoefficients(e.target.checked)} className="w-5 h-5" />
                          <span className="text-lg font-semibold" style={{ color: '#000000' }}>Negative Coefficients</span>
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Line 4 */}
                  <div className="flex justify-center gap-4">
                    <button onClick={handleGenerateWorksheet}
                      className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-800">
                      <RefreshCw size={20} />
                      Generate Worksheet
                    </button>
                    {worksheet.length > 0 && (
                      <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)}
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
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    <button onClick={() => setWorksheetFontSize(Math.max(0, worksheetFontSize - 1))} 
                      disabled={worksheetFontSize === 0} 
                      className={'w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ' + 
                        (worksheetFontSize === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-blue-800')}>
                      <ChevronDown size={20} />
                    </button>
                    <button onClick={() => setWorksheetFontSize(Math.min(3, worksheetFontSize + 1))} 
                      disabled={worksheetFontSize === 3} 
                      className={'w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ' + 
                        (worksheetFontSize === 3 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-blue-800')}>
                      <ChevronUp size={20} />
                    </button>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>
                    Completing the Square - Worksheet
                  </h2>
                  
                  {isDifferentiated ? (
                    <div className="grid grid-cols-3 gap-6">
                      {['level1', 'level2', 'level3'].map((lvl: string, idx: number) => {
                        const config = idx === 0 
                          ? { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700' }
                          : idx === 1 
                          ? { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700' }
                          : { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700' };
                        
                        return (
                          <div key={lvl} className={`rounded-xl p-6 border-4 ${config.bg} ${config.border}`}>
                            <h3 className={`text-3xl font-bold text-center mb-6 ${config.text}`}>
                              Level {idx + 1}
                            </h3>
                            <div className="space-y-4">
                              {worksheet.filter((q: QuestionType) => q.difficulty === lvl).map((q: QuestionType, i: number) => (
                                <div key={i} className="text-2xl">
                                  <span className="font-semibold" style={{ color: '#000000' }}>{i + 1}.</span>
                                  <span className="ml-3 font-bold" style={{ color: '#000000' }}>{q.display}</span>
                                  {showWorksheetAnswers && (
                                    <div className="ml-8 font-semibold mt-1" style={{ color: '#059669' }}>
                                      {q.answer}
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
                    <div className={`grid gap-x-6 gap-y-3 ${
                      numColumns === 1 ? 'grid-cols-1' : 
                      numColumns === 2 ? 'grid-cols-2' : 
                      numColumns === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                      {worksheet.map((q: QuestionType, i: number) => (
                        <div key={i} className={getFontSize()}>
                          <span className="font-semibold" style={{ color: '#000000' }}>{i + 1}.</span>
                          <span className="ml-2 font-bold" style={{ color: '#000000' }}>{q.display}</span>
                          {showWorksheetAnswers && (
                            <span className="ml-4 font-semibold" style={{ color: '#059669' }}>{q.answer}</span>
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
