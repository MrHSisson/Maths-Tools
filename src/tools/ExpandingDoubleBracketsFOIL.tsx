import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// Type definitions
type QuestionValues = {
  a: number;
  b: number;
  c: number;
  d: number;
};

type WorkingStep = {
  type: string;
  content?: string;
};

type QuestionType = {
  display: string;
  answer: string;
  working: WorkingStep[];
  values: QuestionValues;
  difficulty: string;
};

type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';
type DifficultyLevel = 'level1' | 'level2' | 'level3';
type Mode = 'whiteboard' | 'workedExample' | 'worksheet';

export default function ExpandingDoubleBracketsGenerator() {
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<Mode>('whiteboard');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('level1');
  
  const [currentQuestion, setCurrentQuestion] = useState<QuestionType | null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [worksheet, setWorksheet] = useState<QuestionType[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState<boolean>(false);
  const [isDifferentiated, setIsDifferentiated] = useState<boolean>(false);
  const [numColumns, setNumColumns] = useState<number>(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState<number>(1);
  
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');

  const fontSizes: string[] = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const getFontSize = (): string => fontSizes[worksheetFontSize];

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

  const getDifficultyButtonClass = (level: DifficultyLevel, idx: number, isActive: boolean): string => {
    if (isActive) {
      return idx === 0 ? 'bg-green-600 text-white' 
           : idx === 1 ? 'bg-yellow-600 text-white' 
           : 'bg-red-600 text-white';
    }
    return idx === 0 ? 'bg-white text-green-600 border-2 border-green-600' 
         : idx === 1 ? 'bg-white text-yellow-600 border-2 border-yellow-600' 
         : 'bg-white text-red-600 border-2 border-red-600';
  };

  const FoilDisplay = ({ q }: { q: QuestionType }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const b1t1Ref = useRef<HTMLDivElement>(null);
    const b1t2Ref = useRef<HTMLDivElement>(null);
    const b2t1Ref = useRef<HTMLDivElement>(null);
    const b2t2Ref = useRef<HTMLDivElement>(null);
    
    type Position = {
      x: number;
      y: number;
    };
    
    type Positions = {
      b1t1Top: Position;
      b1t2Bottom: Position;
      b2t1Top: Position;
      b2t1Bottom: Position;
      b2t2Top: Position;
      b2t2Bottom: Position;
    };
    
    const [positions, setPositions] = useState<Positions | null>(null);

    useEffect(() => {
      if (b1t1Ref.current && b1t2Ref.current && b2t1Ref.current && b2t2Ref.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        
        const getTopCenter = (ref: React.RefObject<HTMLDivElement>): Position => {
          const rect = ref.current!.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2 - containerRect.left,
            y: rect.top - containerRect.top
          };
        };

        const getBottomCenter = (ref: React.RefObject<HTMLDivElement>): Position => {
          const rect = ref.current!.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2 - containerRect.left,
            y: rect.bottom - containerRect.top
          };
        };

        setPositions({
          b1t1Top: getTopCenter(b1t1Ref),
          b1t2Bottom: getBottomCenter(b1t2Ref),
          b2t1Top: getTopCenter(b2t1Ref),
          b2t1Bottom: getBottomCenter(b2t1Ref),
          b2t2Top: getTopCenter(b2t2Ref),
          b2t2Bottom: getBottomCenter(b2t2Ref)
        });
      }
    }, [q]);

    const { a, b, c, d } = q.values;

    const formatFirstTerm = (coeff: number): string => {
      if (coeff === 1) return 'x';
      if (coeff === -1) return '−x';
      return (coeff < 0 ? '−' : '') + Math.abs(coeff) + 'x';
    };

    const formatSecondTerm = (value: number): string => {
      if (value >= 0) return '+' + value;
      return '−' + Math.abs(value);
    };

    const b1term1 = formatFirstTerm(a);
    const b1term2 = formatSecondTerm(b);
    const b2term1 = formatFirstTerm(c);
    const b2term2 = formatSecondTerm(d);

    const first = a * c;
    const outer = a * d;
    const inner = b * c;
    const last = b * d;

    const formatResult = (value: number): string => {
      if (value === 0) return '';
      return (value > 0 ? '+' : '−') + Math.abs(value) + 'x';
    };

    const firstResult = first === 1 ? 'x²' : first === -1 ? '−x²' : first + 'x²';
    const outerResult = formatResult(outer);
    const innerResult = formatResult(inner);
    const lastResult = last >= 0 ? '+' + last : String(last);

    const CurvedArrow = ({ from, to, curveUp = true, color = '#ef4444' }: { 
      from: Position | undefined; 
      to: Position | undefined; 
      curveUp?: boolean; 
      color?: string;
    }) => {
      if (!from || !to) return null;
      
      const midX = (from.x + to.x) / 2;
      const curveHeight = curveUp ? -60 : 60;
      const controlY = Math.min(from.y, to.y) + curveHeight;
      
      const path = `M ${from.x} ${from.y} Q ${midX} ${controlY} ${to.x} ${to.y}`;
      
      const dx = to.x - midX;
      const dy = to.y - controlY;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      
      return (
        <g>
          <path d={path} fill="none" stroke={color} strokeWidth="4" />
          <polygon 
            points="0,-8 16,0 0,8" 
            fill={color}
            transform={`translate(${to.x},${to.y}) rotate(${angle})`}
          />
        </g>
      );
    };

    return (
      <div ref={containerRef} className="relative w-full mx-auto" style={{ minHeight: '280px', paddingTop: '60px', paddingBottom: '20px' }}>
        <div className="flex items-center justify-center gap-2">
          <span className="font-bold text-4xl">(</span>
          <div ref={b1t1Ref} className="inline-flex items-center justify-center font-bold text-4xl px-4 py-2" style={{ minWidth: '70px' }}>{b1term1}</div>
          <div ref={b1t2Ref} className="inline-flex items-center justify-center font-bold text-4xl px-4 py-2" style={{ minWidth: '70px' }}>{b1term2}</div>
          <span className="font-bold text-4xl">)</span>
          <span className="font-bold text-4xl">(</span>
          <div ref={b2t1Ref} className="inline-flex items-center justify-center font-bold text-4xl px-4 py-2" style={{ minWidth: '70px' }}>{b2term1}</div>
          <div ref={b2t2Ref} className="inline-flex items-center justify-center font-bold text-4xl px-4 py-2" style={{ minWidth: '70px' }}>{b2term2}</div>
          <span className="font-bold text-4xl">)</span>
        </div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <div className="inline-flex items-center justify-center font-bold text-4xl px-4 py-2" style={{ minWidth: '70px', color: '#000000' }}>{firstResult}</div>
          <div className="inline-flex items-center justify-center font-bold text-4xl px-4 py-2" style={{ minWidth: '70px', color: '#000000' }}>{outerResult}</div>
          <div className="inline-flex items-center justify-center font-bold text-4xl px-4 py-2" style={{ minWidth: '70px', color: '#000000' }}>{innerResult}</div>
          <div className="inline-flex items-center justify-center font-bold text-4xl px-4 py-2" style={{ minWidth: '70px', color: '#000000' }}>{lastResult}</div>
        </div>

        {positions && (
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
            <CurvedArrow from={positions.b1t1Top} to={positions.b2t1Top} curveUp={true} color="#ef4444" />
            <CurvedArrow from={positions.b1t1Top} to={positions.b2t2Top} curveUp={true} color="#3b82f6" />
            <CurvedArrow from={positions.b1t2Bottom} to={positions.b2t1Bottom} curveUp={false} color="#92400e" />
            <CurvedArrow from={positions.b1t2Bottom} to={positions.b2t2Bottom} curveUp={false} color="#22c55e" />
          </svg>
        )}
      </div>
    );
  };

  const generateQuestion = (level: DifficultyLevel): QuestionType => {
    let a = 0;
    let b = 0;
    let c = 0;
    let d = 0;
    
    if (level === 'level1') {
      a = 1;
      b = Math.floor(Math.random() * 9) + 1;
      c = 1;
      d = Math.floor(Math.random() * 9) + 1;
    } else if (level === 'level2') {
      a = 1;
      b = Math.floor(Math.random() * 19) - 9;
      c = 1;
      d = Math.floor(Math.random() * 19) - 9;
      if (b === 0) b = 1;
      if (d === 0) d = 1;
      
      if (b > 0 && d > 0) {
        if (Math.random() < 0.5) {
          b = -b;
        } else {
          d = -d;
        }
      }
    } else {
      a = Math.floor(Math.random() * 5) + 1;
      b = Math.floor(Math.random() * 15) - 7;
      if (b === 0) b = 1;
      
      c = Math.floor(Math.random() * 5) + 1;
      d = Math.floor(Math.random() * 15) - 7;
      if (d === 0) d = 1;
      
      if (Math.random() < 0.3) {
        if (Math.random() < 0.5) {
          a = -a;
        } else {
          c = -c;
        }
      }
    }
    
    const x2Coeff = a * c;
    const xCoeff = a * d + c * b;
    const constant = b * d;
    
    const formatSign = (value: number, isFirst: boolean = false): string => {
      if (isFirst) return value < 0 ? '−' : '';
      return value < 0 ? ' − ' : ' + ';
    };
    
    const formatTerm = (coeff: number, variable: string = ''): string => {
      const abs = Math.abs(coeff);
      if (variable) {
        if (abs === 1) return variable;
        return abs + variable;
      }
      return abs.toString();
    };
    
    let display = '(';
    
    if (a === 1) {
      display += 'x';
    } else if (a === -1) {
      display += '−x';
    } else {
      display += (a < 0 ? '−' : '') + Math.abs(a) + 'x';
    }
    
    if (b >= 0) {
      display += ' + ' + b;
    } else {
      display += ' − ' + Math.abs(b);
    }
    
    display += ')(';
    
    if (c === 1) {
      display += 'x';
    } else if (c === -1) {
      display += '−x';
    } else {
      display += (c < 0 ? '−' : '') + Math.abs(c) + 'x';
    }
    
    if (d >= 0) {
      display += ' + ' + d;
    } else {
      display += ' − ' + Math.abs(d);
    }
    
    display += ')';
    
    let answer = '';
    let isFirst = true;
    
    if (x2Coeff !== 0) {
      answer += formatSign(x2Coeff, true);
      answer += formatTerm(x2Coeff, 'x²');
      isFirst = false;
    }
    
    if (xCoeff !== 0) {
      answer += formatSign(xCoeff, isFirst);
      answer += formatTerm(xCoeff, 'x');
      isFirst = false;
    }
    
    if (constant !== 0 || isFirst) {
      answer += formatSign(constant, isFirst);
      answer += Math.abs(constant);
    }
    
    const working: WorkingStep[] = [{
      type: 'foil',
      content: 'Use FOIL method to expand the brackets'
    }];
    
    return {
      display,
      answer,
      working,
      values: { a, b, c, d },
      difficulty: level
    };
  };

  const handleNewQuestion = (): void => {
    setCurrentQuestion(generateQuestion(difficulty));
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = (): void => {
    const questions: QuestionType[] = [];
    const usedKeys = new Set<string>();
    
    const generateUniqueQuestion = (lvl: DifficultyLevel): QuestionType => {
      let attempts = 0;
      let q: QuestionType = generateQuestion(lvl);
      let uniqueKey = '';
      
      do {
        q = generateQuestion(lvl);
        uniqueKey = `${q.values.a}-${q.values.b}-${q.values.c}-${q.values.d}`;
        attempts++;
        if (attempts > 100) break;
      } while (usedKeys.has(uniqueKey));
      
      usedKeys.add(uniqueKey);
      return q;
    };
    
    if (isDifferentiated) {
      (['level1', 'level2', 'level3'] as const).forEach((lvl: DifficultyLevel) => {
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
    if ((mode === 'whiteboard' || mode === 'workedExample') && !currentQuestion) {
      handleNewQuestion();
    }
  }, [mode]);

  useEffect(() => {
    if ((mode === 'whiteboard' || mode === 'workedExample') && currentQuestion) {
      handleNewQuestion();
    }
  }, [difficulty]);

  return (
    <>
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
                  {(['default', 'blue', 'pink', 'yellow'] as const).map((scheme: ColorScheme) => (
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

      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f3f0' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>
            Expanding Double Brackets (FOIL)
          </h1>

          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }}></div>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            {[
              { key: 'whiteboard' as Mode, label: 'Whiteboard' },
              { key: 'workedExample' as Mode, label: 'Worked Example' },
              { key: 'worksheet' as Mode, label: 'Worksheet' }
            ].map((m: { key: Mode; label: string }) => (
              <button key={m.key} onClick={() => setMode(m.key)}
                className={'px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ' +
                  (mode === m.key ? 'bg-blue-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900')}>
                {m.label}
              </button>
            ))}
          </div>

          {(mode === 'whiteboard' || mode === 'workedExample') && (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold" style={{ color: '#000000' }}>Difficulty:</span>
                    <div className="flex gap-2">
                      {(['level1', 'level2', 'level3'] as const).map((lvl: DifficultyLevel, idx: number) => (
                        <button key={lvl} onClick={() => setDifficulty(lvl)}
                          className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + 
                            getDifficultyButtonClass(lvl, idx, difficulty === lvl)}>
                          Level {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleNewQuestion}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <RefreshCw size={18} />
                      New Question
                    </button>
                    <button onClick={() => {
                        if (mode === 'whiteboard') {
                          setShowWhiteboardAnswer(!showWhiteboardAnswer);
                        } else {
                          setShowAnswer(!showAnswer);
                        }
                      }}
                      className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <Eye size={18} />
                      {(mode === 'whiteboard' ? showWhiteboardAnswer : showAnswer) ? 'Hide Answer' : 'Show Answer'}
                    </button>
                  </div>
                </div>
              </div>

              {mode === 'whiteboard' && currentQuestion && (
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

              {mode === 'workedExample' && currentQuestion && (
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
                          <div className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                            <h4 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>FOIL Method</h4>
                            <p className="text-2xl mb-4" style={{ color: '#000000' }}>
                              First · Outer · Inner · Last
                            </p>
                            <FoilDisplay q={currentQuestion} />
                          </div>
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

          {mode === 'worksheet' && (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="space-y-6">
                  <div className="flex justify-center items-center gap-6">
                    <div className="flex items-center gap-3">
                      <label className="text-lg font-semibold" style={{ color: '#000000' }}>Questions per level:</label>
                      <input type="number" min="1" max="20" value={numQuestions}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                        className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg" />
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="diff" checked={isDifferentiated}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsDifferentiated(e.target.checked)} className="w-5 h-5" />
                      <label htmlFor="diff" className="text-lg font-semibold" style={{ color: '#000000' }}>Differentiated</label>
                    </div>
                  </div>

                  {!isDifferentiated && (
                    <div className="flex justify-center items-center gap-6">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold" style={{ color: '#000000' }}>Difficulty:</span>
                        <div className="flex gap-2">
                          {(['level1', 'level2', 'level3'] as const).map((lvl: DifficultyLevel, idx: number) => (
                            <button key={lvl} onClick={() => setDifficulty(lvl)}
                              className={'px-6 py-2 rounded-lg font-semibold ' +
                                (difficulty === lvl
                                  ? (idx === 0 ? 'bg-green-600 text-white' :
                                     idx === 1 ? 'bg-yellow-600 text-white' :
                                     'bg-red-600 text-white')
                                  : 'bg-gray-200')}>
                              Level {idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-lg font-semibold" style={{ color: '#000000' }}>Columns:</label>
                        <input type="number" min="1" max="4" value={numColumns}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))}
                          className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg" />
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

                  <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>
                    Worksheet
                  </h2>

                  {isDifferentiated ? (
                    <div className="grid grid-cols-3 gap-6">
                      {(['level1', 'level2', 'level3'] as const).map((lvl: DifficultyLevel, idx: number) => (
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
}
