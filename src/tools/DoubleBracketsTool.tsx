import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, Home, Menu, X, ChevronUp, ChevronDown } from 'lucide-react';

// ===== TYPE DEFINITIONS =====
type TableData = {
  row1Term1: string;
  row1Term2: string;
  row2Term1: string;
  row2Term2: string;
  cell11: string;
  cell12: string;
  cell21: string;
  cell22: string;
};

type WorkingStep = {
  title: string;
  tableData?: TableData;
  content?: string;
  explanation?: string;
};

type QuestionValues = {
  a: number;
  b: number;
  c: number;
  d: number;
};

type QuestionType = {
  display: string;
  answer: string;
  working: WorkingStep[];
  values: QuestionValues;
  difficulty: string;
};

export default function ExpandingDoubleBracketsGenerator() {
  const navigate = useNavigate();

  // ===== STATE MANAGEMENT =====
  const [mode, setMode] = useState<string>('whiteboard');
  const [difficulty, setDifficulty] = useState<string>('level1');
  
  // Whiteboard mode
  const [whiteboardQuestion, setWhiteboardQuestion] = useState<QuestionType | null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState<boolean>(false);
  
  // Single Q mode
  const [question, setQuestion] = useState<QuestionType | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  
  // Worksheet mode
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [worksheet, setWorksheet] = useState<QuestionType[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState<boolean>(false);
  const [isDifferentiated, setIsDifferentiated] = useState<boolean>(false);
  const [numColumns, setNumColumns] = useState<number>(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState<number>(1);
  
  // Optional features
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<string>('default');

  // ===== FONT SIZE =====
  const fontSizes = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const getFontSize = (): string => fontSizes[worksheetFontSize];

  // ===== COLOR HELPER FUNCTIONS =====
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
  
  // Table-specific helpers for grid method
  const getTableLabelBg = (): string => {
    if (colorScheme === 'blue') return '#B3D9F2';
    if (colorScheme === 'pink') return '#F2B3D9';
    if (colorScheme === 'yellow') return '#F2EBB3';
    return '#dbeafe';
  };

  // ===== QUESTION GENERATION =====
  const generateQuestion = (level: string): QuestionType => {
    let a = 0;
    let b = 0;
    let c = 0;
    let d = 0;
    
    if (level === 'level1') {
      // Level 1: (x + b)(x + d) where b,d are positive 1-9
      a = 1;
      b = Math.floor(Math.random() * 9) + 1;
      c = 1;
      d = Math.floor(Math.random() * 9) + 1;
    } else if (level === 'level2') {
      // Level 2: (x + b)(x + d) with at least one negative
      a = 1;
      b = Math.floor(Math.random() * 19) - 9;
      c = 1;
      d = Math.floor(Math.random() * 19) - 9;
      if (b === 0) b = 1;
      if (d === 0) d = 1;
      
      // Ensure at least one negative
      if (b > 0 && d > 0) {
        if (Math.random() < 0.5) {
          b = -b;
        } else {
          d = -d;
        }
      }
    } else {
      // Level 3: (ax+b)(cx+d) where a,c are 1-5 (30% chance one negative)
      a = Math.floor(Math.random() * 5) + 1;
      b = Math.floor(Math.random() * 15) - 7;
      if (b === 0) b = 1;
      
      c = Math.floor(Math.random() * 5) + 1;
      d = Math.floor(Math.random() * 15) - 7;
      if (d === 0) d = 1;
      
      // 30% of the time, make one coefficient negative
      if (Math.random() < 0.3) {
        if (Math.random() < 0.5) {
          a = -a;
        } else {
          c = -c;
        }
      }
    }
    
    // Calculate answer
    const x2Coeff = a * c;
    const xCoeff = a * d + c * b;
    const constant = b * d;
    
    // Build display string
    let display = '(';
    
    // First bracket
    if (a < 0) {
      display += b;
      display += ' − ';
      if (Math.abs(a) === 1) {
        display += 'x';
      } else {
        display += Math.abs(a) + 'x';
      }
    } else {
      if (a === 1) {
        display += 'x';
      } else {
        display += a + 'x';
      }
      if (b >= 0) {
        display += ' + ' + b;
      } else {
        display += ' − ' + Math.abs(b);
      }
    }
    
    display += ')(';
    
    // Second bracket
    if (c < 0) {
      display += d;
      display += ' − ';
      if (Math.abs(c) === 1) {
        display += 'x';
      } else {
        display += Math.abs(c) + 'x';
      }
    } else {
      if (c === 1) {
        display += 'x';
      } else {
        display += c + 'x';
      }
      if (d >= 0) {
        display += ' + ' + d;
      } else {
        display += ' − ' + Math.abs(d);
      }
    }
    
    display += ')';
    
    // Format answer
    let answer = '';
    let isFirst = true;
    
    if (x2Coeff !== 0) {
      if (x2Coeff < 0) {
        answer += '−';
      }
      if (Math.abs(x2Coeff) === 1) {
        answer += 'x²';
      } else {
        answer += Math.abs(x2Coeff) + 'x²';
      }
      isFirst = false;
    }
    
    if (xCoeff !== 0) {
      if (!isFirst) {
        answer += xCoeff < 0 ? ' − ' : ' + ';
      } else if (xCoeff < 0) {
        answer += '−';
      }
      if (Math.abs(xCoeff) === 1) {
        answer += 'x';
      } else {
        answer += Math.abs(xCoeff) + 'x';
      }
      isFirst = false;
    }
    
    if (constant !== 0 || isFirst) {
      if (!isFirst) {
        answer += constant < 0 ? ' − ' : ' + ';
      } else if (constant < 0) {
        answer += '−';
      }
      answer += Math.abs(constant);
    }
    
    // Create table data for grid method
    const formatTableTerm = (value: number): string => {
      if (value >= 0) return `+${value}`;
      return `−${Math.abs(value)}`;
    };
    
    const formatCellContent = (value: number, includeX: boolean = false): string => {
      const sign = value >= 0 ? '+' : '−';
      const absValue = Math.abs(value);
      if (includeX) {
        return `${sign}${absValue}x`;
      }
      return `${sign}${absValue}`;
    };
    
    const formatX2Term = (coeff: number): string => {
      if (coeff === 1) return 'x²';
      if (coeff === -1) return '−x²';
      return `${coeff}x²`;
    };
    
    const tableData: TableData = {
      row1Term1: a === 1 ? 'x' : (a === -1 ? '−x' : `${a}x`),
      row1Term2: formatTableTerm(b),
      row2Term1: c === 1 ? 'x' : (c === -1 ? '−x' : `${c}x`),
      row2Term2: formatTableTerm(d),
      cell11: formatX2Term(x2Coeff),
      cell12: formatCellContent(c * b, true),
      cell21: formatCellContent(a * d, true),
      cell22: formatCellContent(constant)
    };
    
    // Create working steps
    const working: WorkingStep[] = [
      {
        title: "Step 1: Set up the grid",
        tableData: tableData,
        explanation: "Write the terms from each bracket along the top and side of the grid"
      },
      {
        title: "Step 2: Collect all terms from the grid",
        content: `${tableData.cell11} ${tableData.cell12} ${tableData.cell21} ${tableData.cell22}`,
      },
      {
        title: "Step 3: Combine like terms",
        content: answer,
        explanation: xCoeff !== (c * b) && xCoeff !== (a * d) ? 
          `Combine the x terms: ${formatCellContent(c * b, true)} ${formatCellContent(a * d, true)} = ${xCoeff < 0 ? '−' : '+'}${Math.abs(xCoeff)}x` : 
          undefined
      }
    ];
    
    return {
      display,
      answer,
      working,
      values: { a, b, c, d },
      difficulty: level
    };
  };

  // ===== EVENT HANDLERS =====
  const handleNewWhiteboardQuestion = (): void => {
    setWhiteboardQuestion(generateQuestion(difficulty));
    setShowWhiteboardAnswer(false);
  };

  const handleNewQuestion = (): void => {
    setQuestion(generateQuestion(difficulty));
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = (): void => {
    const questions: QuestionType[] = [];
    const usedKeys = new Set<string>();
    
    const generateUniqueQuestion = (lvl: string): QuestionType => {
      let attempts = 0;
      let q: QuestionType = generateQuestion(lvl);
      let uniqueKey = '';
      
      do {
        q = generateQuestion(lvl);
        uniqueKey = `${q.values.a}-${q.values.b}-${q.values.c}-${q.values.d}-${lvl}`;
        attempts++;
        if (attempts > 100) break;
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
    if (mode === 'whiteboard' && !whiteboardQuestion) {
      handleNewWhiteboardQuestion();
    }
    if (mode === 'single' && !question) {
      handleNewQuestion();
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'whiteboard' && whiteboardQuestion) {
      handleNewWhiteboardQuestion();
    }
    if (mode === 'single' && question) {
      handleNewQuestion();
    }
  }, [difficulty]);

  // ===== RENDER =====
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
          {/* Title */}
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>
            Expanding Double Brackets
          </h1>

          {/* Dividing Line */}
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
                {m === 'whiteboard' ? 'Whiteboard' : m === 'single' ? 'Single Q' : 'Worksheet'}
              </button>
            ))}
          </div>

          {/* WHITEBOARD & SINGLE Q MODES */}
          {(mode === 'whiteboard' || mode === 'single') && (
            <div className="flex flex-col gap-4" style={mode === 'single' ? { minHeight: '120vh' } : {}}>
              {/* Control Bar - IDENTICAL FOR BOTH MODES */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                  {/* Difficulty */}
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

                  {/* Options - stacked vertically */}
                  <div className="flex flex-col gap-1">
                    {/* Add checkboxes here if needed */}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={mode === 'whiteboard' ? handleNewWhiteboardQuestion : handleNewQuestion}
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

              {/* WHITEBOARD MODE */}
              {mode === 'whiteboard' && whiteboardQuestion && (
                <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
                  <div className="text-center mb-6">
                    <span className="text-6xl font-bold" style={{ color: '#000000' }}>
                      {whiteboardQuestion.display}
                    </span>
                    {showWhiteboardAnswer && (
                      <span className="text-6xl font-bold ml-4" style={{ color: '#166534' }}>
                        = {whiteboardQuestion.answer}
                      </span>
                    )}
                  </div>
                  
                  {/* 500px Annotation Workspace */}
                  <div className="rounded-xl" style={{ height: '500px', backgroundColor: getWhiteboardWorkingBg() }}></div>
                </div>
              )}

              {/* SINGLE Q MODE */}
              {mode === 'single' && question && (
                <div className="rounded-xl shadow-2xl p-12" style={{ backgroundColor: getQuestionBg() }}>
                  <div className="text-6xl font-bold text-center mb-8" style={{ color: '#000000' }}>
                    {question.display}
                  </div>
                  
                  {showAnswer && (
                    <div className="mt-8 space-y-6">
                      <h3 className="text-3xl font-bold mb-6 text-center" style={{ color: '#000000' }}>
                        Solution:
                      </h3>
                      {question.working.map((step: WorkingStep, idx: number) => (
                        <div key={idx} className="rounded-lg p-6 border border-gray-200" style={{ backgroundColor: getStepBg() }}>
                          <h4 className="text-xl font-semibold mb-3" style={{ color: '#000000' }}>
                            {step.title}
                          </h4>
                          {step.tableData ? (
                            <div className="flex flex-col items-center">
                              <div className="inline-block border-4 border-gray-800">
                                <table className="border-collapse">
                                  <tbody>
                                    <tr>
                                      <td className="border-4 border-gray-800 p-6 text-3xl font-bold text-center w-40 h-28" style={{ backgroundColor: getTableLabelBg() }}></td>
                                      <td className="border-4 border-gray-800 p-6 text-3xl font-bold text-center w-40 h-28" style={{ backgroundColor: getTableLabelBg(), color: '#000000' }}>
                                        {step.tableData.row1Term1}
                                      </td>
                                      <td className="border-4 border-gray-800 p-6 text-3xl font-bold text-center w-40 h-28" style={{ backgroundColor: getTableLabelBg(), color: '#000000' }}>
                                        {step.tableData.row1Term2}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="border-4 border-gray-800 p-6 text-3xl font-bold text-center w-40 h-28" style={{ backgroundColor: getTableLabelBg(), color: '#000000' }}>
                                        {step.tableData.row2Term1}
                                      </td>
                                      <td className="border-4 border-gray-800 p-6 text-3xl font-bold text-center w-40 h-28" style={{ backgroundColor: getQuestionBg(), color: '#000000' }}>
                                        {step.tableData.cell11}
                                      </td>
                                      <td className="border-4 border-gray-800 p-6 text-3xl font-bold text-center w-40 h-28" style={{ backgroundColor: getQuestionBg(), color: '#000000' }}>
                                        {step.tableData.cell12}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="border-4 border-gray-800 p-6 text-3xl font-bold text-center w-40 h-28" style={{ backgroundColor: getTableLabelBg(), color: '#000000' }}>
                                        {step.tableData.row2Term2}
                                      </td>
                                      <td className="border-4 border-gray-800 p-6 text-3xl font-bold text-center w-40 h-28" style={{ backgroundColor: getQuestionBg(), color: '#000000' }}>
                                        {step.tableData.cell21}
                                      </td>
                                      <td className="border-4 border-gray-800 p-6 text-3xl font-bold text-center w-40 h-28" style={{ backgroundColor: getQuestionBg(), color: '#000000' }}>
                                        {step.tableData.cell22}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              {step.explanation && (
                                <p className="text-sm mt-4 italic" style={{ color: '#000000' }}>
                                  {step.explanation}
                                </p>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="text-3xl font-medium text-center whitespace-pre-line" style={{ color: '#000000' }}>
                                {step.content}
                              </div>
                              {step.explanation && (
                                <p className="text-sm mt-2 italic" style={{ color: '#000000' }}>
                                  {step.explanation}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                      
                      <div className="rounded-lg p-6 border border-gray-200 text-center" style={{ backgroundColor: getFinalAnswerBg() }}>
                        <span className="text-5xl font-bold" style={{ color: '#166534' }}>
                          = {question.answer}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* WORKSHEET MODE */}
          {mode === 'worksheet' && (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="space-y-6">
                  {/* Line 1: Questions & Differentiated */}
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

                  {/* Line 2: Difficulty/Columns & Actions */}
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
                                className={'px-6 py-2 rounded-lg font-semibold ' +
                                  (difficulty === lvl
                                    ? (lvl === 'level1' ? 'bg-green-600 text-white' :
                                       lvl === 'level2' ? 'bg-yellow-600 text-white' :
                                       'bg-red-600 text-white')
                                    : 'bg-gray-200')}>
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

                    <div className="flex gap-4">
                      <button
                        onClick={handleGenerateWorksheet}
                        className="px-8 py-3 bg-blue-900 text-white rounded-lg font-semibold text-lg hover:bg-blue-800 shadow-lg">
                        Generate Worksheet
                      </button>
                      {worksheet.length > 0 && (
                        <button
                          onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)}
                          className="px-8 py-3 bg-blue-900 text-white rounded-lg font-semibold text-lg flex items-center gap-2 hover:bg-blue-800 shadow-lg">
                          <Eye size={20} />
                          {showWorksheetAnswers ? 'Hide' : 'Show'} Answers
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Worksheet Display */}
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
                    Worksheet
                  </h2>

                  {isDifferentiated ? (
                    <div className="grid grid-cols-3 gap-6">
                      {(['level1', 'level2', 'level3'] as const).map((lvl: string, idx: number) => (
                        <div
                          key={lvl}
                          className={'rounded-xl p-6 border-4 ' +
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
                                  <div className="ml-8 font-semibold mt-1" style={{ color: '#059669' }}>= {q.answer}</div>
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
                            <span className="ml-3 font-semibold" style={{ color: '#059669' }}>= {q.answer}</span>
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
