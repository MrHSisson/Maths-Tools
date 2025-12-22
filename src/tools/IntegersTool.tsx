import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Eye, Home, Menu, X, ChevronUp, ChevronDown } from 'lucide-react'

export default function IntegersTool() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<string>('whiteboard')
  const [difficulty, setDifficulty] = useState<string>('level1')
  const [operationType, setOperationType] = useState<string>('mixed')
  const [whiteboardQuestion, setWhiteboardQuestion] = useState<any>(null)
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState<boolean>(false)
  const [question, setQuestion] = useState<any>(null)
  const [showAnswer, setShowAnswer] = useState<boolean>(false)
  const [numQuestions, setNumQuestions] = useState<number>(5)
  const [worksheet, setWorksheet] = useState<any[]>([])
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState<boolean>(false)
  const [isDifferentiated, setIsDifferentiated] = useState<boolean>(false)
  const [numColumns, setNumColumns] = useState<number>(2)
  const [worksheetFontSize, setWorksheetFontSize] = useState<number>(1)
  const [colorScheme, setColorScheme] = useState<string>('default')
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

  const fontSizes = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl']
  const getFontSize = () => fontSizes[worksheetFontSize]

  const getQuestionBg = () => {
    if (colorScheme === 'blue') return '#D1E7F8'
    if (colorScheme === 'pink') return '#F8D1E7'
    if (colorScheme === 'yellow') return '#F8F4D1'
    return '#ffffff'
  }
  const getStepBg = () => {
    if (colorScheme === 'blue') return '#B3D9F2'
    if (colorScheme === 'pink') return '#F2B3D9'
    if (colorScheme === 'yellow') return '#F2EBB3'
    return '#f3f4f6'
  }
  const getWhiteboardWorkingBg = () => getStepBg()
  const getFinalAnswerBg = () => getStepBg()

  const generateQuestion = (level: string, opType: string = operationType): any => {
    let a = 0, b = 0, operation = '+', display = '', answer = 0
    
    const generate = () => {
      if (level === 'level1') {
        a = Math.floor(Math.random() * 21) - 10
        b = Math.floor(Math.random() * 10) + 1
        let op: string
        if (opType === 'addition') op = '+'
        else if (opType === 'subtraction') op = '−'
        else op = Math.random() < 0.5 ? '+' : '−'
        operation = op
        display = `${a} ${op} ${b}`
        answer = op === '+' ? a + b : a - b
      } else if (level === 'level2') {
        a = Math.floor(Math.random() * 21) - 10
        b = Math.floor(Math.random() * 12) + 1
        operation = '+'
        display = `${a} + (−${b})`
        answer = a + (-b)
      } else {
        a = Math.floor(Math.random() * 21) - 10
        b = Math.floor(Math.random() * 12) + 1
        operation = '−'
        display = `${a} − (−${b})`
        answer = a - (-b)
      }
    }
    generate()
    if (answer === 0 && Math.random() < 0.9) generate()

    const direction = answer > a ? 'right' : answer < a ? 'left' : 'none'
    const steps = Math.abs(answer - a)

    return { display, answer, a, b: level === 'level1' ? b : -b, operation, direction, steps, difficulty: level }
  }

  const BlankNumberLine = () => {
    const width = 750, height = 100, padding = 50, lineY = 50, numSlots = 14
    const spacing = (width - 2 * padding) / (numSlots - 1)
    return (
      <svg width={width} height={height} className="mx-auto block">
        <polygon points={`${padding - 22},${lineY} ${padding - 10},${lineY - 6} ${padding - 10},${lineY + 6}`} fill="#6b7280" />
        <line x1={padding - 15} y1={lineY} x2={width - padding + 15} y2={lineY} stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
        <polygon points={`${width - padding + 22},${lineY} ${width - padding + 10},${lineY - 6} ${width - padding + 10},${lineY + 6}`} fill="#6b7280" />
        {Array.from({ length: numSlots }, (_, i) => (
          <line key={i} x1={padding + i * spacing} y1={lineY - 12} x2={padding + i * spacing} y2={lineY + 12} stroke="#6b7280" strokeWidth="2" />
        ))}
      </svg>
    )
  }

  const NumberLine = ({ q }: { q: any }) => {
    const minVal = Math.min(q.a, q.answer) - 3
    const maxVal = Math.max(q.a, q.answer) + 3
    const range = maxVal - minVal
    const width = 750, height = 180, padding = 50, lineY = height * 0.65
    const getX = (val: number) => padding + ((val - minVal) / range) * (width - 2 * padding)
    const ticks: number[] = []
    for (let i = minVal; i <= maxVal; i++) ticks.push(i)
    const arrowColor = q.direction === 'right' ? '#059669' : q.direction === 'left' ? '#dc2626' : '#6b7280'
    const arrowLabel = q.direction === 'right' ? `+${q.steps}` : q.direction === 'left' ? `−${q.steps}` : '0'
    const startX = getX(q.a), endX = getX(q.answer), midX = (startX + endX) / 2

    return (
      <svg width={width} height={height} className="mx-auto block">
        <defs>
          <marker id={`arrowhead-${q.a}-${q.answer}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={arrowColor} />
          </marker>
        </defs>
        <line x1={padding - 15} y1={lineY} x2={width - padding + 15} y2={lineY} stroke="#4b5563" strokeWidth="3" strokeLinecap="round" />
        <polygon points={`${width - padding + 22},${lineY} ${width - padding + 10},${lineY - 6} ${width - padding + 10},${lineY + 6}`} fill="#4b5563" />
        {ticks.map(tick => (
          <g key={tick}>
            <line x1={getX(tick)} y1={lineY - (tick === 0 ? 12 : 8)} x2={getX(tick)} y2={lineY + (tick === 0 ? 12 : 8)} stroke={tick === 0 ? '#1e40af' : '#4b5563'} strokeWidth={tick === 0 ? 3 : 2} />
            <text x={getX(tick)} y={lineY + 28} textAnchor="middle" fontSize={15} fill={tick === 0 ? '#1e40af' : '#374151'} fontWeight={tick === 0 ? 'bold' : '500'}>{tick}</text>
          </g>
        ))}
        <circle cx={startX} cy={lineY} r={10} fill="#7c3aed" stroke="#5b21b6" strokeWidth="2" />
        <text x={startX} y={lineY - 18} textAnchor="middle" fontSize={14} fill="#7c3aed" fontWeight="bold">Start</text>
        {q.direction !== 'none' && (
          <>
            <path d={`M ${startX} ${lineY - 14} Q ${midX} ${lineY - 59} ${endX} ${lineY - 14}`} fill="none" stroke={arrowColor} strokeWidth="3" strokeLinecap="round" markerEnd={`url(#arrowhead-${q.a}-${q.answer})`} />
            <rect x={midX - 22} y={lineY - 83} width={44} height={24} rx="4" fill="white" stroke={arrowColor} strokeWidth="2" />
            <text x={midX} y={lineY - 66} textAnchor="middle" fontSize={16} fill={arrowColor} fontWeight="bold">{arrowLabel}</text>
          </>
        )}
        <circle cx={endX} cy={lineY} r={10} fill="#059669" stroke="#047857" strokeWidth="2" />
      </svg>
    )
  }

  const handleNewWhiteboardQuestion = (): void => { setWhiteboardQuestion(generateQuestion(difficulty)); setShowWhiteboardAnswer(false) }
  const handleNewQuestion = (): void => { setQuestion(generateQuestion(difficulty)); setShowAnswer(false) }

  const handleGenerateWorksheet = (): void => {
    const questions: any[] = []
    const usedKeys = new Set<string>()
    const generateUniqueQuestion = (lvl: string): any => {
      let attempts = 0, q: any, uniqueKey: string
      do {
        q = generateQuestion(lvl, isDifferentiated ? 'mixed' : operationType)
        uniqueKey = q.display
        if (++attempts > 100) break
      } while (usedKeys.has(uniqueKey))
      usedKeys.add(uniqueKey)
      return q
    }
    if (isDifferentiated) {
      ['level1', 'level2', 'level3'].forEach(lvl => {
        for (let i = 0; i < numQuestions; i++) questions.push({ ...generateUniqueQuestion(lvl), difficulty: lvl })
      })
    } else {
      for (let i = 0; i < numQuestions; i++) questions.push({ ...generateUniqueQuestion(difficulty), difficulty })
    }
    setWorksheet(questions)
    setShowWorksheetAnswers(false)
  }

  useEffect(() => {
    if (mode === 'whiteboard' && !whiteboardQuestion) handleNewWhiteboardQuestion()
    if (mode === 'single' && !question) handleNewQuestion()
  }, [mode])

  useEffect(() => {
    if (mode === 'whiteboard' && whiteboardQuestion) handleNewWhiteboardQuestion()
    if (mode === 'single' && question) handleNewQuestion()
  }, [difficulty, operationType])

  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} /><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border-2 border-gray-200 overflow-hidden z-50">
                <div className="py-2">
                  <div className="px-6 py-2 font-bold text-gray-700 text-sm uppercase tracking-wide">Color Schemes</div>
                  {['default', 'blue', 'pink', 'yellow'].map(scheme => (
                    <button key={scheme} onClick={() => setColorScheme(scheme)} className={'w-full text-left px-6 py-3 font-semibold transition-colors ' + (colorScheme === scheme ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}>
                      {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>Adding & Subtracting Integers</h1>
          <div className="flex justify-center mb-8"><div style={{ width: '90%', height: '1px', backgroundColor: '#d1d5db' }}></div></div>

          <div className="flex justify-center gap-4 mb-8">
            {['whiteboard', 'single', 'worksheet'].map((m) => (
              <button key={m} onClick={() => setMode(m)} className={'px-8 py-4 rounded-xl font-bold text-xl transition-all border-2 border-gray-200 ' + (mode === m ? 'bg-blue-900 text-white shadow-lg' : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900 shadow')}>
                {m === 'whiteboard' ? 'Whiteboard' : m === 'single' ? 'Single Q' : 'Worksheet'}
              </button>
            ))}
          </div>

          {(mode === 'whiteboard' || mode === 'single') && (
            <div className="flex flex-col gap-4" style={mode === 'single' ? { minHeight: '120vh' } : {}}>
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-600">Difficulty:</span>
                    <div className="flex gap-2">
                      {['level1', 'level2', 'level3'].map((lvl, idx) => (
                        <button key={lvl} onClick={() => setDifficulty(lvl)} className={'px-4 py-2 rounded-lg font-bold text-sm w-24 ' + (difficulty === lvl ? (idx === 0 ? 'bg-green-600 text-white' : idx === 1 ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white') : (idx === 0 ? 'bg-white text-green-600 border-2 border-green-600' : idx === 1 ? 'bg-white text-yellow-600 border-2 border-yellow-600' : 'bg-white text-red-600 border-2 border-red-600'))}>
                          Level {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  {difficulty === 'level1' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-gray-600">Type:</label>
                      <select value={operationType} onChange={(e) => setOperationType(e.target.value)} className="px-2 py-1 border-2 border-gray-300 rounded-lg text-xs font-semibold">
                        <option value="mixed">Mixed</option>
                        <option value="addition">Addition</option>
                        <option value="subtraction">Subtraction</option>
                      </select>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={mode === 'whiteboard' ? handleNewWhiteboardQuestion : handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <RefreshCw size={18} />New Question
                    </button>
                    <button onClick={() => mode === 'whiteboard' ? setShowWhiteboardAnswer(!showWhiteboardAnswer) : setShowAnswer(!showAnswer)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 w-52">
                      <Eye size={18} />{(mode === 'whiteboard' ? showWhiteboardAnswer : showAnswer) ? 'Hide Answer' : 'Show Answer'}
                    </button>
                  </div>
                </div>
              </div>

              {mode === 'whiteboard' && whiteboardQuestion && (
                <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
                  <div className="text-6xl font-bold text-center mb-6" style={{ color: '#000000' }}>
                    {showWhiteboardAnswer ? whiteboardQuestion.answer : whiteboardQuestion.display}
                  </div>
                  <div className="rounded-xl pt-8 px-4" style={{ height: '500px', backgroundColor: getWhiteboardWorkingBg() }}>
                    <BlankNumberLine />
                  </div>
                </div>
              )}

              {mode === 'single' && question && (
                <div className="rounded-xl shadow-2xl p-12" style={{ backgroundColor: getQuestionBg() }}>
                  <div className="text-6xl font-bold text-center mb-8" style={{ color: '#000000' }}>{question.display}</div>
                  {showAnswer && (
                    <div className="mt-8 space-y-6">
                      <div className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                        <h3 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>Number Line:</h3>
                        <NumberLine q={question} />
                        <div className="mt-6 text-center space-y-2">
                          <p className="text-2xl" style={{ color: '#000000' }}>Start at <span className="font-bold" style={{ color: '#7c3aed' }}>{question.a}</span></p>
                          <p className="text-2xl" style={{ color: '#000000' }}>
                            {question.direction === 'right' ? <span>Move <span className="font-bold" style={{ color: '#059669' }}>{question.steps} to the right</span></span> : question.direction === 'left' ? <span>Move <span className="font-bold" style={{ color: '#dc2626' }}>{question.steps} to the left</span></span> : <span className="font-bold">Stay at the same position</span>}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-xl p-6 text-center" style={{ backgroundColor: getFinalAnswerBg() }}>
                        <span className="text-3xl font-bold" style={{ color: '#000000' }}>{question.display} = {question.answer}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === 'worksheet' && (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="space-y-6">
                  <div className="flex justify-center items-center gap-8">
                    <div className="flex items-center gap-3">
                      <label className="text-lg font-semibold">Questions per level:</label>
                      <input type="number" min="1" max="20" value={numQuestions} onChange={(e) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))} className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg" />
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="diff" checked={isDifferentiated} onChange={(e) => setIsDifferentiated(e.target.checked)} className="w-5 h-5" />
                      <label htmlFor="diff" className="text-lg font-semibold">Differentiated</label>
                    </div>
                  </div>
                  <div className="flex justify-center items-center gap-8">
                    {!isDifferentiated && (
                      <>
                        <div className="flex items-center gap-3">
                          <label className="text-lg font-semibold">Difficulty:</label>
                          <div className="flex gap-2">
                            {['level1', 'level2', 'level3'].map((lvl, idx) => (
                              <button key={lvl} onClick={() => setDifficulty(lvl)} className={'px-6 py-2 rounded-lg font-semibold ' + (difficulty === lvl ? (idx === 0 ? 'bg-green-600 text-white' : idx === 1 ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white') : 'bg-gray-200')}>Level {idx + 1}</button>
                            ))}
                          </div>
                        </div>
                        {difficulty === 'level1' && (
                          <div className="flex items-center gap-2">
                            <label className="text-base font-semibold">Type:</label>
                            <select value={operationType} onChange={(e) => setOperationType(e.target.value)} className="px-3 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold">
                              <option value="mixed">Mixed</option>
                              <option value="addition">Addition</option>
                              <option value="subtraction">Subtraction</option>
                            </select>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <label className="text-lg font-semibold">Columns:</label>
                          <input type="number" min="1" max="4" value={numColumns} onChange={(e) => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))} className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg" />
                        </div>
                      </>
                    )}
                    <div className="flex gap-4">
                      <button onClick={handleGenerateWorksheet} className="px-8 py-3 bg-blue-900 text-white rounded-lg font-semibold text-lg hover:bg-blue-800 shadow-lg">Generate Worksheet</button>
                      {worksheet.length > 0 && (
                        <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-8 py-3 bg-blue-900 text-white rounded-lg font-semibold text-lg flex items-center gap-2 hover:bg-blue-800 shadow-lg">
                          <Eye size={20} />{showWorksheetAnswers ? 'Hide' : 'Show'} Answers
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {worksheet.length > 0 && (
                <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQuestionBg() }}>
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    <button onClick={() => setWorksheetFontSize(Math.max(0, worksheetFontSize - 1))} disabled={worksheetFontSize === 0} className={'w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ' + (worksheetFontSize === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-blue-800')}><ChevronDown size={20} /></button>
                    <button onClick={() => setWorksheetFontSize(Math.min(3, worksheetFontSize + 1))} disabled={worksheetFontSize === 3} className={'w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ' + (worksheetFontSize === 3 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-blue-800')}><ChevronUp size={20} /></button>
                  </div>
                  <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>Worksheet</h2>
                  {isDifferentiated ? (
                    <div className="grid grid-cols-3 gap-6">
                      {['level1', 'level2', 'level3'].map((lvl, idx) => (
                        <div key={lvl} className={'rounded-xl p-6 border-4 ' + (idx === 0 ? 'bg-green-50 border-green-500' : idx === 1 ? 'bg-yellow-50 border-yellow-500' : 'bg-red-50 border-red-500')}>
                          <h3 className="text-2xl font-bold text-center mb-6" style={{ color: '#000000' }}>Level {idx + 1}</h3>
                          <div className="space-y-3">
                            {worksheet.filter(q => q.difficulty === lvl).map((q, i) => (
                              <div key={i} className={getFontSize()} style={{ color: '#000000' }}>
                                <span className="font-semibold">{i + 1}.</span>
                                <span className="ml-3 font-bold">{q.display}</span>
                                {showWorksheetAnswers && <div className="ml-8 font-semibold mt-1" style={{ color: '#059669' }}>= {q.answer}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`grid gap-x-6 gap-y-3 ${numColumns === 1 ? 'grid-cols-1' : numColumns === 2 ? 'grid-cols-2' : numColumns === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                      {worksheet.map((q, i) => (
                        <div key={i} className={getFontSize()} style={{ color: '#000000' }}>
                          <span className="font-semibold">{i + 1}.</span>
                          <span className="ml-2 font-bold">{q.display}</span>
                          {showWorksheetAnswers && <span className="ml-3 font-semibold" style={{ color: '#059669' }}>= {q.answer}</span>}
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
  )
}
