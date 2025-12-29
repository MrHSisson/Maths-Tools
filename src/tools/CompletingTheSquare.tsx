import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// Type definitions
type WorkingStep = {
  title: string;
  content: string;
  explanation?: string;
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
  const [mode, setMode] = useState<string>('whiteboard');
  const [questionType, setQuestionType] = useState<string>('completing');
  const [difficulty, setDifficulty] = useState<string>('level1');
  const [negativeCoefficients, setNegativeCoefficients] = useState<boolean>(false);
  
  const [whiteboardQuestion, setWhiteboardQuestion] = useState<QuestionType | null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState<boolean>(false);
  
  const [question, setQuestion] = useState<QuestionType | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [worksheet, setWorksheet] = useState<QuestionType[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState<boolean>(false);
  const [isDifferentiated, setIsDifferentiated] = useState<boolean>(false);
  const [numColumns, setNumColumns] = useState<number>(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState<number>(1);
  
  const [colorScheme, setColorScheme] = useState<string>('default');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  
  // ===== FONT SIZE =====
  const fontSizes = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
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
  
  // ===== QUESTION GENERATION =====
  const generateQuestion = (level: string, useNegative: boolean = false): QuestionType => {
    let a = 0, b = 0, c = 0, p = 0, q = 0;
    
    if (level === 'level1') {
      // Level 1: a=1, even coefficient (p is integer)
      a = 1;
      p = Math.floor(Math.random() * 19) - 9; // -9 to 9
      if (p === 0) p = 1; // Avoid zero
    } else if (level === 'level2') {
      // Level 2: a=1, odd coefficient (p is half-integer)
      a = 1;
      p = (Math.floor(Math.random() * 19) - 9) + 0.5; // -8.5 to 9.5
    } else {
      // Level 3: a=2-5 (randomly negative if checkbox enabled), p can be anything
      a = Math.floor(Math.random() * 4) + 2; // 2 to 5
      if (useNegative && Math.random() > 0.5) a = -a; // 50% chance of negative
      
      // Mix of integer and half-integer p values
      if (Math.random() > 0.5) {
        p = Math.floor(Math.random() * 19) - 9; // -9 to 9
        if (p === 0) p = 1;
      } else {
        p = (Math.floor(Math.random() * 19) - 9) + 0.5; // -8.5 to 9.5
      }
    }
    
    // Generate q and c
    if (questionType === 'roots') {
      // For roots mode: 90% chance q is negative (real roots), 10% chance q is positive (no real roots)
      if (Math.random() < 0.1) {
        q = Math.floor(Math.random() * 15) + 1; // +1 to +15 (no real roots)
      } else {
        q = -(Math.floor(Math.random() * 15) + 1); // -1 to -15 (real roots)
      }
      c = a * p * p + q;
    } else {
      // For completing the square mode, q can be anything
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
    
    const aStr = a === 1 ? '' : a === -1 ? '−' : a > 0 ? a.toString() : `−${Math.abs(a)}`;
    const bStr = b === 0 ? '' : 
                 Math.abs(b) === 1 ? (b > 0 ? ' + x' : ' − x') :
                 b > 0 ? ` + ${b}x` : ` − ${Math.abs(b)}x`;
    const cStr = c === 0 ? '' : c > 0 ? ` + ${c}` : ` − ${Math.abs(c)}`;
    
    const display = `y = ${aStr}x²${bStr}${cStr}`;
    
    const working: WorkingStep[] = [];
    
    working.push({
      title: "Step 1: Start with the equation",
      content: display
    });
    
    if (a !== 1) {
      const bOverA = b / a;
      const bOverAStr = bOverA > 0 ? `+ ${bOverA}x` : bOverA < 0 ? `− ${Math.abs(bOverA)}x` : '';
      const cStr2 = c > 0 ? ` + ${c}` : c < 0 ? ` − ${Math.abs(c)}` : '';
      
      working.push({
        title: `Step 2: Factor out ${a}`,
        content: `y = ${a}(x²${bOverAStr ? ' ' + bOverAStr : ''})${cStr2}`
      });
    }
    
    const halfCoef = b / (2 * a);
    const halfCoefStr = halfCoef % 1 === 0 ? halfCoef.toString() : halfCoef.toFixed(1);
    const coeffAfterFactoring = b / a;
    const coeffAfterFactoringStr = coeffAfterFactoring % 1 === 0 ? coeffAfterFactoring.toString() : coeffAfterFactoring.toFixed(1);
    
    working.push({
      title: a !== 1 ? "Step 3: Half the x-coefficient" : "Step 2: Half the x-coefficient",
      content: a !== 1 ? `${coeffAfterFactoringStr}/2 = ${halfCoefStr}` : `${b}/2 = ${halfCoefStr}`,
      explanation: "This becomes p in (x + p)²"
    });
    
    const pStr = p > 0 ? `+ ${p % 1 === 0 ? p.toString() : p.toFixed(1)}` : p < 0 ? `− ${Math.abs(p) % 1 === 0 ? Math.abs(p).toString() : Math.abs(p).toFixed(1)}` : '';
    const pSquared = p * p;
    const pSquaredStr = pSquared % 1 === 0 ? pSquared.toString() : pSquared.toFixed(2);
    
    if (a !== 1) {
      working.push({
        title: "Step 4: Complete the square",
        content: `y = ${a}[(x ${pStr})² − ${pSquaredStr}] ${c > 0 ? `+ ${c}` : c < 0 ? `− ${Math.abs(c)}` : ''}`
      });
    } else {
      working.push({
        title: "Step 3: Complete the square",
        content: `y = [(x ${pStr})² − ${pSquaredStr}] ${c > 0 ? `+ ${c}` : c < 0 ? `− ${Math.abs(c)}` : ''}`
      });
    }
    
    const aPSquared = a * pSquared;
    const aPSquaredStr = aPSquared % 1 === 0 ? aPSquared.toString() : aPSquared.toFixed(2);
    
    if (a !== 1) {
      working.push({
        title: "Step 5: Expand the square brackets",
        content: `y = ${a}(x ${pStr})² − ${aPSquaredStr} ${c > 0 ? `+ ${c}` : c < 0 ? `− ${Math.abs(c)}` : ''}`
      });
    } else {
      working.push({
        title: "Step 4: Expand the square brackets",
        content: `y = (x ${pStr})² − ${pSquaredStr} ${c > 0 ? `+ ${c}` : c < 0 ? `− ${Math.abs(c)}` : ''}`
      });
    }
    
    const aFinal = a === 1 ? '' : a === -1 ? '−' : a.toString();
    const pFinal = p > 0 ? `+ ${p % 1 === 0 ? p.toString() : p.toFixed(1)}` : p < 0 ? `− ${Math.abs(p) % 1 === 0 ? Math.abs(p).toString() : Math.abs(p).toFixed(1)}` : '';
    const qFinal = q > 0 ? `+ ${q % 1 === 0 ? q.toString() : q.toFixed(2)}` : q < 0 ? `− ${Math.abs(q) % 1 === 0 ? Math.abs(q).toString() : Math.abs(q).toFixed(2)}` : '';
    
    let answer = '';
    
    if (questionType === 'roots') {
      // Additional steps for finding roots
      const stepNum = a !== 1 ? 6 : 5;
      
      working.push({
        title: `Step ${stepNum}: Set equal to zero`,
        content: `0 = ${aFinal}(x ${pFinal})² ${qFinal}`
      });
      
      working.push({
        title: `Step ${stepNum + 1}: Rearrange`,
        content: `${aFinal}(x ${pFinal})² = ${-q % 1 === 0 ? (-q).toString() : (-q).toFixed(2)}`
      });
      
      // Check if there are real roots (q must be negative, so -q must be positive)
      if (q > 0) {
        // No real roots case
        answer = "No real roots";
      } else {
        // Real roots exist
        if (a !== 1) {
          const qOverA = -q / a;
          const qOverAStr = qOverA % 1 === 0 ? qOverA.toString() : qOverA.toFixed(2);
          working.push({
            title: `Step ${stepNum + 2}: Divide by ${a}`,
            content: `(x ${pFinal})² = ${qOverAStr}`
          });
        }
        
        const sqrtValue = a !== 1 ? -q / a : -q;
        const sqrtStr = sqrtValue % 1 === 0 && Math.sqrt(sqrtValue) % 1 === 0 
          ? Math.sqrt(sqrtValue).toString() 
          : `√${sqrtValue % 1 === 0 ? sqrtValue.toString() : sqrtValue.toFixed(2)}`;
        
        working.push({
          title: `Step ${a !== 1 ? stepNum + 3 : stepNum + 2}: Square root both sides`,
          content: `x ${pFinal} = ±${sqrtStr}`
        });
        
        // Calculate the actual roots
        const sqrtVal = Math.sqrt(-q / a);
        const root1 = -p + sqrtVal;
        const root2 = -p - sqrtVal;
        
        const root1Str = root1 % 1 === 0 ? root1.toString() : root1.toFixed(2);
        const root2Str = root2 % 1 === 0 ? root2.toString() : root2.toFixed(2);
        
        const negPStr = -p > 0 ? -p % 1 === 0 ? (-p).toString() : (-p).toFixed(1) : 
                         -p < 0 ? `−${Math.abs(-p) % 1 === 0 ? Math.abs(-p).toString() : Math.abs(-p).toFixed(1)}` : '0';
        
        answer = `x = ${negPStr} ± ${sqrtStr}`;
        
        // Add simplified answer if applicable
        if (sqrtValue % 1 === 0 && Math.sqrt(sqrtValue) % 1 === 0) {
          answer += ` → x = ${root1Str} or x = ${root2Str}`;
        }
      }
    } else if (questionType === 'turning') {
      // Additional steps for finding turning point
      const stepNum = a !== 1 ? 6 : 5;
      
      working.push({
        title: `Step ${stepNum}: Identify the turning point`,
        content: `(x ${pFinal})² ≥ 0 for all values of x`
      });
      
      const negP = -p;
      const negPStr = negP > 0 ? (negP % 1 === 0 ? negP.toString() : negP.toFixed(1)) : 
                      negP < 0 ? `−${Math.abs(negP) % 1 === 0 ? Math.abs(negP).toString() : Math.abs(negP).toFixed(1)}` : '0';
      
      working.push({
        title: `Step ${stepNum + 1}: Find when the bracket equals zero`,
        content: `(x ${pFinal})² = 0 when x = ${negPStr}`
      });
      
      const qStr = q % 1 === 0 ? q.toString() : q.toFixed(2);
      
      working.push({
        title: `Step ${stepNum + 2}: Find the y-coordinate`,
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
  const handleNewWhiteboardQuestion = (): void => {
    setWhiteboardQuestion(generateQuestion(difficulty, negativeCoefficients));
    setShowWhiteboardAnswer(false);
  };
  
  const handleNewQuestion = (): void => {
    setQuestion(generateQuestion(difficulty, negativeCoefficients));
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
    if (mode === 'whiteboard' && !whiteboardQuestion) handleNewWhiteboardQuestion();
    if (mode === 'single' && !question) handleNewQuestion();
  }, [mode]);
  
  useEffect(() => {
    if (mode === 'whiteboard' && whiteboardQuestion) handleNewWhiteboardQuestion();
    if (mode === 'single' && question) handleNewQuestion();
  }, [difficulty, negativeCoefficients, questionType]);
  
  // ===== RENDER =====
  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} /><span className="font-semibold text-lg">Home</span>
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
                  <button onClick={() => setColorScheme('default')}
                    className={'w-full text-left px-6 py-3 font-semibold transition-colors ' +
                      (colorScheme === 'default' ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}>
                    Default
                  </button>
                  <button onClick={() => setColorScheme('blue')}
                    className={'w-full text-left px-6 py-3 font-semibold transition-colors ' +
                      (colorScheme === 'blue' ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}>
                    Blue
                  </button>
                  <button onClick={() => setColorScheme('pink')}
                    className={'w-full text-left px-6 py-3 font-semibold transition-colors ' +
                      (colorScheme === 'pink' ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}>
                    Pink
                  </button>
                  <button onClick={() => setColorScheme('yellow')}
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
        <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>
          Completing the Square
        </h1>
        
        <div className="flex justify-center mb-8">
          <div style={{ width: '90%', height: '1px', backgroundColor: '#d1d5db' }}></div>
        </div>
        
        {/* Question Type Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setQuestionType('completing')}
            className={'px-8 py-4 rounded-xl font-bold text-xl transition-all border-2 border-gray-200 ' +
              (questionType === 'completing' ? 'bg-blue-900 text-white shadow-lg' : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900 shadow')}>
            Completing the Square
          </button>
          <button onClick={() => setQuestionType('roots')}
            className={'px-8 py-4 rounded-xl font-bold text-xl transition-all border-2 border-gray-200 ' +
              (questionType === 'roots' ? 'bg-blue-900 text-white shadow-lg' : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900 shadow')}>
            Finding Roots
          </button>
          <button onClick={() => setQuestionType('turning')}
            className={'px-8 py-4 rounded-xl font-bold text-xl transition-all border-2 border-gray-200 ' +
              (questionType === 'turning' ? 'bg-blue-900 text-white shadow-lg' : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900 shadow')}>
            Turning Points
          </button>
        </div>

        <div className="flex justify-center mb-8">
          <div style={{ width: '90%', height: '1px', backgroundColor: '#d1d5db' }}></div>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          {['whiteboard', 'single', 'worksheet'].map((m: string) => (
            <button key={m} onClick={() => setMode(m)}
              className={'px-8 py-4 rounded-xl font-bold text-xl transition-all border-2 border-gray-200 ' +
                (mode === m ? 'bg-blue-900 text-white shadow-lg' : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900 shadow')}>
              {m === 'whiteboard' ? 'Whiteboard' : m === 'single' ? 'Single Q' : 'Worksheet'}
            </button>
          ))}
        </div>

        {/* WHITEBOARD MODE */}
        {mode === 'whiteboard' && whiteboardQuestion && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600">Difficulty:</span>
                  <div className="flex gap-2">
                    <button onClick={() => setDifficulty('level1')}
                      className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                        (difficulty === 'level1' ? 'bg-green-600 text-white' : 'bg-white text-green-600 border-2 border-green-600')}>
                      Level 1
                    </button>
                    <button onClick={() => setDifficulty('level2')}
                      className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                        (difficulty === 'level2' ? 'bg-yellow-600 text-white' : 'bg-white text-yellow-600 border-2 border-yellow-600')}>
                      Level 2
                    </button>
                    <button onClick={() => setDifficulty('level3')}
                      className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                        (difficulty === 'level3' ? 'bg-red-600 text-white' : 'bg-white text-red-600 border-2 border-red-600')}>
                      Level 3
                    </button>
                  </div>
                  
                  {difficulty === 'level3' && (
                    <div className="flex items-center gap-2 ml-4">
                      <input 
                        type="checkbox" 
                        id="whiteboard-negative" 
                        checked={negativeCoefficients}
                        onChange={(e) => setNegativeCoefficients(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="whiteboard-negative" className="text-sm font-semibold text-gray-600">
                        Negative Coefficients
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button onClick={handleNewWhiteboardQuestion}
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
              <div className="text-center mb-6">
                <span className="text-6xl font-bold" style={{ color: '#000000' }}>
                  {whiteboardQuestion.display}
                </span>
                {showWhiteboardAnswer && (
                  <span className="text-6xl font-bold ml-6" style={{ color: '#166534' }}>
                    {whiteboardQuestion.answer}
                  </span>
                )}
              </div>
              
              <div className="rounded-xl" style={{ height: '500px', backgroundColor: getWhiteboardWorkingBg() }}></div>
            </div>
          </>
        )}

        {/* SINGLE Q MODE */}
        {mode === 'single' && question && (
          <div style={{ minHeight: '120vh' }}>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600">Difficulty:</span>
                  <div className="flex gap-2">
                    <button onClick={() => setDifficulty('level1')}
                      className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                        (difficulty === 'level1' ? 'bg-green-600 text-white' : 'bg-white text-green-600 border-2 border-green-600')}>
                      Level 1
                    </button>
                    <button onClick={() => setDifficulty('level2')}
                      className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                        (difficulty === 'level2' ? 'bg-yellow-600 text-white' : 'bg-white text-yellow-600 border-2 border-yellow-600')}>
                      Level 2
                    </button>
                    <button onClick={() => setDifficulty('level3')}
                      className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                        (difficulty === 'level3' ? 'bg-red-600 text-white' : 'bg-white text-red-600 border-2 border-red-600')}>
                      Level 3
                    </button>
                  </div>
                  
                  {difficulty === 'level3' && (
                    <div className="flex items-center gap-2 ml-4">
                      <input 
                        type="checkbox" 
                        id="single-negative" 
                        checked={negativeCoefficients}
                        onChange={(e) => setNegativeCoefficients(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="single-negative" className="text-sm font-semibold text-gray-600">
                        Negative Coefficients
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

            <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
              <div className="text-center mb-8">
                <span className="text-6xl font-bold" style={{ color: '#000000' }}>
                  {question.display}
                </span>
              </div>
              
              <p className="text-2xl text-center mb-8" style={{ color: '#000000' }}>
                {questionType === 'completing' 
                  ? 'Write in the form: y = a(x + p)² + q'
                  : questionType === 'roots'
                  ? 'Find the roots of the equation'
                  : 'Find the turning point of the graph'}
              </p>

              {showAnswer && (
                <>
                  <div className="space-y-4 mb-8">
                    {question.working.map((step: WorkingStep, i: number) => (
                      <div key={i} className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                        <h4 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>
                          {step.title}
                        </h4>
                        <p className="text-3xl" style={{ color: '#000000' }}>
                          {step.content}
                        </p>
                        {step.explanation && (
                          <p className="text-sm mt-2 italic" style={{ color: '#000000' }}>
                            {step.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl p-6 text-center" style={{ backgroundColor: getFinalAnswerBg() }}>
                    <span className="text-5xl font-bold" style={{ color: '#166534' }}>
                      {question.answer}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* WORKSHEET */}
        {mode === 'worksheet' && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="space-y-4">
                <div className="flex justify-center items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-3">
                    <label className="text-lg font-semibold">Questions per level:</label>
                    <input type="number" min="1" max="20" value={numQuestions} 
                      onChange={(e) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))} 
                      className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg" />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="diff" checked={isDifferentiated} 
                      onChange={(e) => setIsDifferentiated(e.target.checked)} className="w-5 h-5" />
                    <label htmlFor="diff" className="text-lg font-semibold">Differentiated</label>
                  </div>
                </div>

                {!isDifferentiated && (
                  <div className="flex justify-center items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-4">
                      <label className="text-lg font-semibold">Difficulty:</label>
                      <div className="flex gap-2">
                        <button onClick={() => setDifficulty('level1')}
                          className={'px-6 py-2 rounded-lg font-semibold ' + 
                            (difficulty === 'level1' ? 'bg-green-600 text-white' : 'bg-gray-200')}>
                          Level 1
                        </button>
                        <button onClick={() => setDifficulty('level2')}
                          className={'px-6 py-2 rounded-lg font-semibold ' + 
                            (difficulty === 'level2' ? 'bg-yellow-600 text-white' : 'bg-gray-200')}>
                          Level 2
                        </button>
                        <button onClick={() => setDifficulty('level3')}
                          className={'px-6 py-2 rounded-lg font-semibold ' + 
                            (difficulty === 'level3' ? 'bg-red-600 text-white' : 'bg-gray-200')}>
                          Level 3
                        </button>
                      </div>
                    </div>
                    
                    {difficulty === 'level3' && (
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="worksheet-negative" 
                          checked={negativeCoefficients}
                          onChange={(e) => setNegativeCoefficients(e.target.checked)}
                          className="w-5 h-5"
                        />
                        <label htmlFor="worksheet-negative" className="text-lg font-semibold">
                          Negative Coefficients
                        </label>
                      </div>
                    )}
                    
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
                  </div>
                )}
                
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

                <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>Worksheet</h2>
                <p className="text-center mb-8 text-xl font-semibold" style={{ color: '#000000' }}>
                  {questionType === 'completing' 
                    ? 'Write each equation in the form: y = a(x + p)² + q'
                    : questionType === 'roots'
                    ? 'Find the roots of each equation'
                    : 'Find the turning point of each graph'}
                </p>
                
                {isDifferentiated ? (
                  <div className="grid grid-cols-3 gap-6">
                    {['level1', 'level2', 'level3'].map((lvl: string, idx: number) => (
                      <div key={lvl} className={'rounded-xl p-6 border-4 ' +
                        (lvl === 'level1' ? 'bg-green-50 border-green-500' :
                         lvl === 'level2' ? 'bg-yellow-50 border-yellow-500' :
                         'bg-red-50 border-red-500')}>
                        <h3 className={'text-3xl font-bold text-center mb-6 ' + 
                          (lvl === 'level1' ? 'text-green-700' : 
                           lvl === 'level2' ? 'text-yellow-700' : 
                           'text-red-700')}>
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
                    ))}
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
