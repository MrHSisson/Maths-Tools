import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────────────────

const TOOL_CONFIG = {
  pageTitle: 'Fractions of Amounts',
  tools: {
    tool1: {
      name: 'Find the Fraction',
      useSubstantialBoxes: false,
      variables: [],
      dropdown: null, // handled separately below
      difficultySettings: null,
    },
  },
  useGraphicalLayout: false,
};

const INFO_SECTIONS = [
  {
    title: 'Find the Fraction', icon: '½',
    content: [
      { label: 'Overview', detail: 'Practice finding fractions of amounts using the divide-then-multiply method.' },
      { label: 'Level 1 — Green', detail: 'Unit fractions only (e.g. ¼ of 20). The amount is always a multiple of the denominator, giving whole-number answers.' },
      { label: 'Level 2 — Yellow', detail: 'Non-unit fractions (e.g. ³⁄₅ of 40). One part (amount ÷ denominator) is always a whole number, so the final answer is also a whole number.' },
      { label: 'Level 3 — Red', detail: 'Non-unit fractions where one part may be a decimal. Answers can be decimals, fractions, or mixed numbers depending on the Answer Format setting.' },
    ],
  },
  {
    title: 'Question Options', icon: '⚙️',
    content: [
      { label: 'Standard (2–10)', detail: 'Denominators are chosen from 2–10, testing times tables up to 10×10.' },
      { label: 'Extended (2–20)', detail: 'Denominators are chosen from 2–20, testing times tables up to 20×20.' },
      { label: 'Answer Format (Level 3)', detail: 'For Level 3 questions, you can choose how answers are displayed: as a decimal (e.g. 3.5), a fraction (e.g. ⁷⁄₂), or a mixed number (e.g. 3 ½). Whole-number answers always display as integers regardless of this setting.' },
    ],
  },
  {
    title: 'Modes', icon: '🖥️',
    content: [
      { label: 'Whiteboard', detail: 'One large question with a blank working space. Use Show Answer to reveal the result. Ideal for whole-class teaching.' },
      { label: 'Worked Example', detail: 'Shows a question with a full step-by-step solution when revealed. Useful for modelling the method.' },
      { label: 'Worksheet', detail: 'Generates a grid of questions. Columns and count are adjustable. Answers can be shown or hidden.' },
    ],
  },
  {
    title: 'Differentiated Worksheet', icon: '📋',
    content: [
      { label: 'What it does', detail: 'Generates three columns — one per level — so the whole class can work from the same sheet at their own level.' },
      { label: 'Layout', detail: 'Level 1 (green), Level 2 (yellow), and Level 3 (red) each appear in their own colour-coded column.' },
      { label: 'Per-level Options', detail: 'In differentiated mode, Question Options shows Standard/Extended separately for each level, plus the Answer Format setting under Level 3.' },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const superscript = (n: number | string) => String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[parseInt(c)] ?? c).join('');
const subscript = (n: number | string) => String(n).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[parseInt(c)] ?? c).join('');

// Format fraction as unicode superscript/subscript
const frac = (n: number, d: number) => `${superscript(n)}⁄${subscript(d)}`;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// Represent a rational as { n, d } in lowest terms (d > 0)
const toRational = (n: number, d: number) => {
  const g = gcd(Math.abs(n), Math.abs(d));
  return { n: n / g, d: d / g };
};

// Format an answer value (stored as { n, d } rational) according to display mode
const formatAnswerRational = (n: number, d: number, mode: string): string => {
  const r = toRational(n, d);
  if (r.d === 1) return String(r.n); // whole number always shown plain
  if (mode === 'fraction') return frac(r.n, r.d);
  if (mode === 'mixed') {
    const whole = Math.floor(r.n / r.d);
    const rem = r.n % r.d;
    if (whole === 0) return frac(rem, r.d);
    return `${whole} ${frac(rem, r.d)}`;
  }
  // decimal — up to 2dp, no trailing zero if 1dp suffices
  const dec = r.n / r.d;
  const rounded = Math.round(dec * 100) / 100;
  return rounded % 1 === 0 ? String(rounded) : (Math.round(dec * 10) / 10 === rounded ? rounded.toFixed(1) : rounded.toFixed(2));
};

// Format a part value (always shown as decimal/fraction in working steps)
const formatPart = (n: number, d: number): string => {
  const r = toRational(n, d);
  if (r.d === 1) return String(r.n);
  return frac(r.n, r.d);
};

// ── Question generation ───────────────────────────────────────────────────────

interface Question {
  display: string;
  // answer stored as rational { n, d } so it can be reformatted
  answerN: number;
  answerD: number;
  working: { type: string; content: string }[];
  values: { key: string };
  difficulty: string;
}

const generateQuestion = (
  _tool: string,
  level: string,
  _variables: Record<string, boolean>,
  denomRange: string,
  _answerFormat: string   // kept for signature parity; formatting is done at render time
): Question => {
  const maxDenom = denomRange === 'extended' ? 20 : 10;

  if (level === 'level1') {
    // Unit fraction 1/d of amount, amount = d * k (integer), answer = k (integer)
    const d = randInt(2, maxDenom);
    const k = randInt(1, maxDenom);
    const amount = d * k;
    return {
      display: `${frac(1, d)} of ${amount}`,
      answerN: k, answerD: 1,
      working: [
        { type: 'step', content: `Divide by the denominator: ${amount} ÷ ${d} = ${k}` },
        { type: 'step', content: `${frac(1, d)} of ${amount} = ${k}` },
      ],
      values: { key: `1-${d}-${amount}` },
      difficulty: level,
    };
  }

  if (level === 'level2') {
    // Build the full pool of valid reduced non-unit fractions for this denom range,
    // then pick uniformly so no single fraction is over-represented.
    const pool: { rn: number; rd: number }[] = [];
    for (let d = 3; d <= maxDenom; d++) {
      for (let n = 2; n < d; n++) {
        const g = gcd(n, d);
        const rn = n / g, rd = d / g;
        if (rn === 1) continue;           // no unit fractions
        if (rn === rd) continue;          // no 1/1
        if (rd > maxDenom) continue;      // reduced denom still in range
        // Deduplicate: only add if this rn/rd pair isn't already in the pool
        if (!pool.some(p => p.rn === rn && p.rd === rd)) pool.push({ rn, rd });
      }
    }
    const { rn, rd } = pool[randInt(0, pool.length - 1)];
    const k = randInt(1, maxDenom);
    const amount = rd * k;
    const answerN = rn * k;
    return {
      display: `${frac(rn, rd)} of ${amount}`,
      answerN, answerD: 1,
      working: [
        { type: 'step', content: `Find 1 part: ${amount} ÷ ${rd} = ${k}` },
        { type: 'step', content: `Multiply by numerator: ${k} × ${rn} = ${answerN}` },
        { type: 'step', content: `${frac(rn, rd)} of ${amount} = ${answerN}` },
      ],
      values: { key: `2-${rn}-${rd}-${amount}` },
      difficulty: level,
    };
  }

  // Level 3: non-unit fraction, amount always integer, 1 part is a clean decimal/third.
  // Build a pool of all valid {rn, rd, offset} combos, then pick uniformly.
  type Offset = { num: number; den: number };
  const allOffsets: Offset[] = [
    { num: 1, den: 2 },
    { num: 1, den: 4 }, { num: 3, den: 4 },
    { num: 1, den: 3 }, { num: 2, den: 3 },
    { num: 1, den: 5 }, { num: 2, den: 5 }, { num: 3, den: 5 }, { num: 4, den: 5 },
    { num: 1, den: 10 }, { num: 3, den: 10 }, { num: 7, den: 10 }, { num: 9, den: 10 },
  ];

  const pool3: { rn: number; rd: number; offsets: Offset[] }[] = [];
  for (let d = 3; d <= maxDenom; d++) {
    for (let n = 2; n < d; n++) {
      const g = gcd(n, d);
      const rn = n / g, rd = d / g;
      if (rn === 1 || rd < 2 || rn === rd) continue;
      // Deduplicate fraction
      if (pool3.some(p => p.rn === rn && p.rd === rd)) continue;
      const validOffsets = allOffsets.filter(o => (rd * o.num) % o.den === 0);
      if (validOffsets.length === 0) continue;
      pool3.push({ rn, rd, offsets: validOffsets });
    }
  }

  if (pool3.length > 0) {
    const { rn, rd, offsets } = pool3[randInt(0, pool3.length - 1)];
    const k = randInt(1, maxDenom - 1);
    const off = offsets[randInt(0, offsets.length - 1)];
    const partN = k * off.den + off.num, partD = off.den;
    const amount = (rd * partN) / partD;
    const ansN = rn * partN, ansD = partD;
    const { n: ansRN, d: ansRD } = toRational(ansN, ansD);
    return {
      display: `${frac(rn, rd)} of ${amount}`,
      answerN: ansRN, answerD: ansRD,
      working: [
        { type: 'step', content: `Find 1 part: ${amount} ÷ ${rd} = ${formatPart(partN, partD)}` },
        { type: 'step', content: `Multiply by numerator: ${formatPart(partN, partD)} × ${rn} = ${formatPart(ansRN, ansRD)}` },
        { type: 'step', content: `${frac(rn, rd)} of ${amount} = ${formatPart(ansRN, ansRD)}` },
      ],
      values: { key: `3-${rn}-${rd}-${amount}` },
      difficulty: level,
    };
  }

  // Fallback to level 2 if pool is somehow empty
  return generateQuestion(_tool, 'level2', _variables, denomRange, _answerFormat);
};

const generateUniqueQuestion = (
  tool: string,
  level: string,
  variables: Record<string, boolean>,
  denomRange: string,
  answerFormat: string,
  usedKeys: Set<string>
): Question => {
  let attempts = 0;
  let q: Question;
  do {
    q = generateQuestion(tool, level, variables, denomRange, answerFormat);
    if (++attempts > 200) break;
  } while (usedKeys.has(q.values.key));
  usedKeys.add(q.values.key);
  return q;
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {[['level1', 'Level 1', 'bg-green-600'], ['level2', 'Level 2', 'bg-yellow-500'], ['level3', 'Level 3', 'bg-red-600']].map(([val, label, col]) => (
      <button key={val} onClick={() => onChange(val)}
        className={`px-5 py-2 font-bold text-base transition-colors ${value === val ? col + ' text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
        {label}
      </button>
    ))}
  </div>
);

const QuestionOptionsPopover = ({
  difficulty,
  denomRange, onDenomRangeChange,
  denomRangeByLevel, onDenomRangeByLevelChange,
  answerFormat, onAnswerFormatChange,
  isDifferentiated = false,
}: {
  difficulty: string;
  denomRange: string; onDenomRangeChange: (v: string) => void;
  denomRangeByLevel: Record<string, string>; onDenomRangeByLevelChange: (lv: string, v: string) => void;
  answerFormat: string; onAnswerFormatChange: (v: string) => void;
  isDifferentiated?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const showAnswerFormat = difficulty === 'level3' || isDifferentiated;
  const rangeOpts = [{ value: 'standard', label: 'Standard (2–10)' }, { value: 'extended', label: 'Extended (2–20)' }];
  const lvLabels: Record<string, string> = { level1: 'Level 1', level2: 'Level 2', level3: 'Level 3' };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? 'bg-blue-900 border-blue-900 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900'}`}>
        Question Options
        <ChevronDown size={18} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {isDifferentiated ? (
            /* Per-level denom range selectors */
            <>
              {([
                { lv: 'level1', label: 'Level 1', headerCls: 'text-green-600' },
                { lv: 'level2', label: 'Level 2', headerCls: 'text-yellow-500' },
                { lv: 'level3', label: 'Level 3', headerCls: 'text-red-600' },
              ] as const).map(({ lv, label, headerCls }) => (
                <div key={lv} className="flex flex-col gap-2">
                  <span className={`text-sm font-extrabold uppercase tracking-wider ${headerCls}`}>{label}</span>
                  <div className="flex flex-col gap-2 pl-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Denominator Range</span>
                    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
                      {rangeOpts.map(opt => (
                        <button key={opt.value} onClick={() => onDenomRangeByLevelChange(lv, opt.value)}
                          className={`flex-1 px-4 py-2 text-sm font-bold transition-colors ${denomRangeByLevel[lv] === opt.value ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {lv === 'level3' && (
                      <>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Answer Format</span>
                        <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
                          {[{ value: 'decimal', label: 'Decimal' }, { value: 'fraction', label: 'Fraction' }, { value: 'mixed', label: 'Mixed Number' }].map(opt => (
                            <button key={opt.value} onClick={() => onAnswerFormatChange(opt.value)}
                              className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${answerFormat === opt.value ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            /* Single-level view */
            <>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Denominator Range</span>
                <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
                  {rangeOpts.map(opt => (
                    <button key={opt.value} onClick={() => onDenomRangeChange(opt.value)}
                      className={`flex-1 px-4 py-2.5 text-sm font-bold transition-colors ${denomRange === opt.value ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {showAnswerFormat && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Answer Format</span>
                  <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
                    {[{ value: 'decimal', label: 'Decimal' }, { value: 'fraction', label: 'Fraction' }, { value: 'mixed', label: 'Mixed Number' }].map(opt => (
                      <button key={opt.value} onClick={() => onAnswerFormatChange(opt.value)}
                        className={`flex-1 px-3 py-2.5 text-sm font-bold transition-colors ${answerFormat === opt.value ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ height: '80vh' }} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tool Information</h2>
          <p className="text-sm text-gray-400 mt-0.5">A guide to all features and options</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <X size={20} />
        </button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {INFO_SECTIONS.map(section => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{section.icon}</span>
              <h3 className="text-lg font-bold text-blue-900">{section.title}</h3>
            </div>
            <div className="flex flex-col gap-2">
              {section.content.map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-7 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
        <button onClick={onClose} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors">Close</button>
      </div>
    </div>
  </div>
);

const MenuDropdown = ({ colorScheme, setColorScheme, onClose, onOpenInfo }: {
  colorScheme: string; setColorScheme: (s: string) => void; onClose: () => void; onOpenInfo: () => void;
}) => {
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: '200px' }}>
      <div className="py-1">
        <button onClick={() => setColorOpen(!colorOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 transition-transform duration-200 ${colorOpen ? 'rotate-90' : ''}`}>
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Colour Scheme</span>
          </div>
          <span className="text-xs text-gray-400 font-normal">{colorScheme.charAt(0).toUpperCase() + colorScheme.slice(1)}</span>
        </button>
        {colorOpen && (
          <div className="border-t border-gray-100">
            {['default', 'blue', 'pink', 'yellow'].map(s => (
              <button key={s} onClick={() => { setColorScheme(s); onClose(); }}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold transition-colors ${colorScheme === s ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {colorScheme === s && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1" />
        <button onClick={() => { onOpenInfo(); onClose(); }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function FractionsOfAmounts() {
  const [currentTool] = useState('tool1');
  const [mode, setMode] = useState<'whiteboard' | 'single' | 'worksheet'>('whiteboard');
  const [difficulty, setDifficulty] = useState('level1');
  const [denomRange, setDenomRange] = useState('standard');
  const [denomRangeByLevel, setDenomRangeByLevel] = useState<Record<string, string>>({
    level1: 'standard', level2: 'standard', level3: 'standard',
  });
  const [answerFormat, setAnswerFormat] = useState('decimal');

  const setDenomRangeForLevel = (lv: string, v: string) =>
    setDenomRangeByLevel(prev => ({ ...prev, [lv]: v }));

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(6);
  const [worksheet, setWorksheet] = useState<Question[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [numColumns, setNumColumns] = useState(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState(1);
  const [colorScheme, setColorScheme] = useState('default');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const getQBg = () => colorScheme === 'blue' ? '#D1E7F8' : colorScheme === 'pink' ? '#F8D1E7' : colorScheme === 'yellow' ? '#F8F4D1' : '#ffffff';
  const getStepBg = () => colorScheme === 'blue' ? '#B3D9F2' : colorScheme === 'pink' ? '#F2B3D9' : colorScheme === 'yellow' ? '#F2EBB3' : '#f3f4f6';

  const makeQ = () => generateQuestion(currentTool, difficulty, {}, denomRange, answerFormat);

  const handleNewQuestion = () => {
    setCurrentQuestion(makeQ());
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = () => {
    const usedKeys = new Set<string>();
    const questions: Question[] = [];
    if (isDifferentiated) {
      ['level1', 'level2', 'level3'].forEach(lv => {
        const dr = denomRangeByLevel[lv] ?? 'standard';
        for (let i = 0; i < numQuestions; i++) questions.push(generateUniqueQuestion(currentTool, lv, {}, dr, answerFormat, usedKeys));
      });
    } else {
      for (let i = 0; i < numQuestions; i++) questions.push(generateUniqueQuestion(currentTool, difficulty, {}, denomRange, answerFormat, usedKeys));
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  useEffect(() => {
    if (mode !== 'worksheet') handleNewQuestion();
  }, [difficulty, currentTool]);

  useEffect(() => {
    handleNewQuestion();
  }, []);

  const fontSizes = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const canIncrease = worksheetFontSize < fontSizes.length - 1;
  const canDecrease = worksheetFontSize > 0;

  const lvColors: Record<string, { bg: string; border: string; text: string; fill: string }> = {
    level1: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', fill: '#dcfce7' },
    level2: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', fill: '#fef9c3' },
    level3: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', fill: '#fee2e2' },
  };

  // answerFormat is only used at level 3; levels 1&2 answers are always integers
  const getDisplayAnswer = (q: Question) => {
    if (q.answerD === 1) return String(q.answerN); // integer — no formatting needed
    return formatAnswerRational(q.answerN, q.answerD, answerFormat);
  };

  const popoverEl = (isDiff = false) => (
    <QuestionOptionsPopover
      difficulty={difficulty}
      denomRange={denomRange} onDenomRangeChange={setDenomRange}
      denomRangeByLevel={denomRangeByLevel} onDenomRangeByLevelChange={setDenomRangeForLevel}
      answerFormat={answerFormat} onAnswerFormatChange={setAnswerFormat}
      isDifferentiated={isDiff}
    />
  );

  const renderControlBar = () => {
    if (mode === 'worksheet') return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="20" value={numQuestions}
              onChange={e => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 6)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base" />
          </div>
          {popoverEl(isDifferentiated)}
          <button onClick={() => setIsDifferentiated(!isDifferentiated)}
            className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDifferentiated ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900'}`}>
            Differentiated
          </button>
        </div>
        {!isDifferentiated && (
          <div className="flex justify-center items-center gap-6 mb-4">
            <DifficultyToggle value={difficulty} onChange={setDifficulty} />
            <div className="flex items-center gap-3">
              <label className="text-base font-semibold text-gray-700">Columns:</label>
              <input type="number" min="1" max="4" value={numColumns}
                onChange={e => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))}
                className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base" />
            </div>
          </div>
        )}
        <div className="flex justify-center items-center gap-4">
          <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
            <RefreshCw size={18} /> Generate Worksheet
          </button>
          {worksheet.length > 0 && (
            <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18} /> {showWorksheetAnswers ? 'Hide Answers' : 'Show Answers'}
            </button>
          )}
        </div>
      </div>
    );

    return (
      <div className="bg-white rounded-xl shadow-lg p-5 mb-8">
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={setDifficulty} />
          {popoverEl()}
          <div className="flex gap-3">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <RefreshCw size={18} /> New Question
            </button>
            <button onClick={() => mode === 'whiteboard' ? setShowWhiteboardAnswer(!showWhiteboardAnswer) : setShowAnswer(!showAnswer)}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18} /> {(mode === 'whiteboard' ? showWhiteboardAnswer : showAnswer) ? 'Hide Answer' : 'Show Answer'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWhiteboardMode = () => (
    <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQBg() }}>
      <div className="text-center">
        {currentQuestion ? (
          <>
            <span className="text-6xl font-bold" style={{ color: '#000000' }}>Find {currentQuestion.display}</span>
            {showWhiteboardAnswer && (
              <span className="text-6xl font-bold ml-4" style={{ color: '#166534' }}>= {getDisplayAnswer(currentQuestion)}</span>
            )}
          </>
        ) : <span className="text-4xl text-gray-400">Generate question</span>}
      </div>
      <div className="rounded-xl mt-8" style={{ height: '400px', backgroundColor: getStepBg() }} />
    </div>
  );

  const renderWorkedExampleMode = () => (
    <div className="rounded-xl shadow-lg p-8 w-full" style={{ backgroundColor: getQBg() }}>
      {currentQuestion ? (
        <>
          <div className="text-center mb-8">
            <span className="text-6xl font-bold" style={{ color: '#000000' }}>Find {currentQuestion.display}</span>
          </div>
          {showAnswer && (
            <>
              <div className="space-y-4">
                {currentQuestion.working.map((step, i) => (
                  <div key={i} className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                    <h4 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>Step {i + 1}</h4>
                    <p className="text-2xl" style={{ color: '#000000' }}>{step.content}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: getStepBg() }}>
                <span className="text-5xl font-bold" style={{ color: '#166534' }}>= {getDisplayAnswer(currentQuestion)}</span>
              </div>
            </>
          )}
        </>
      ) : <div className="text-center text-gray-400 text-4xl py-16">Generate question</div>}
    </div>
  );

  const renderWorksheetMode = () => {
    const fsz = fontSizes[worksheetFontSize];

    if (worksheet.length === 0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: getQBg() }}>
        <span className="text-2xl text-gray-400">Generate worksheet</span>
      </div>
    );

    const fontCtrl = (
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button onClick={() => canDecrease && setWorksheetFontSize(worksheetFontSize - 1)} disabled={!canDecrease}
          className={`w-8 h-8 rounded flex items-center justify-center ${canDecrease ? 'bg-blue-900 text-white hover:bg-blue-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          <ChevronDown size={20} />
        </button>
        <button onClick={() => canIncrease && setWorksheetFontSize(worksheetFontSize + 1)} disabled={!canIncrease}
          className={`w-8 h-8 rounded flex items-center justify-center ${canIncrease ? 'bg-blue-900 text-white hover:bg-blue-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          <ChevronUp size={20} />
        </button>
      </div>
    );

    const renderQCell = (q: Question, idx: number, bgOverride?: string) => {
      const bg = bgOverride ?? getStepBg();
      return (
        <div className="rounded-lg p-4 shadow" style={{ backgroundColor: bg }}>
          <span className={`${fsz} font-semibold`} style={{ color: '#000000' }}>{idx + 1}.  Find {q.display}</span>
          {showWorksheetAnswers && <span className={`${fsz} font-semibold ml-2`} style={{ color: '#059669' }}>= {getDisplayAnswer(q)}</span>}
        </div>
      );
    };

    if (isDifferentiated) return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQBg() }}>
        {fontCtrl}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>Fractions of Amounts — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4">
          {(['level1', 'level2', 'level3'] as const).map((lv, li) => {
            const lqs = worksheet.filter(q => q.difficulty === lv);
            const cc = lvColors[lv];
            return (
              <div key={lv} className={`${cc.bg} border-2 ${cc.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${cc.text}`}>Level {li + 1}</h3>
                <div className="space-y-3">{lqs.map((q, idx) => <div key={idx}>{renderQCell(q, idx, cc.fill)}</div>)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );

    return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQBg() }}>
        {fontCtrl}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>Fractions of Amounts — Worksheet</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}>
          {worksheet.map((q, idx) => <div key={idx}>{renderQCell(q, idx)}</div>)}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} /><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {isMenuOpen && (
              <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme}
                onClose={() => setIsMenuOpen(false)} onOpenInfo={() => setIsInfoOpen(true)} />
            )}
          </div>
        </div>
      </div>

      {isInfoOpen && <InfoModal onClose={() => setIsInfoOpen(false)} />}

      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f3f0' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>Fractions of Amounts</h1>
          <div className="flex justify-center mb-8"><div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }} /></div>
          <div className="flex justify-center gap-4 mb-8">
            {(['whiteboard', 'single', 'worksheet'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode === m ? 'bg-blue-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900'}`}>
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
