import React, { useState } from 'react';
import { Home, Menu, X, Eye, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

const TOOL_CONFIG = {
  pageTitle: 'Multiplication Worksheet Generator',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type MultType = '2x1' | '2x2' | '3x1' | '3x2' | '3x3';
type Method = 'blank' | 'grid' | 'lattice';
type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';

type Question = {
  a: number;
  b: number;
  type: MultType;
  answer: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randDigit = () => randInt(2, 9);
const rand2 = () => randInt(10, 99);
const rand3 = () => randInt(100, 999);

const generateQuestion = (type: MultType): Question => {
  let a: number, b: number;
  switch (type) {
    case '2x1': a = rand2(); b = randDigit(); break;
    case '2x2': a = rand2(); b = rand2(); break;
    case '3x1': a = rand3(); b = randDigit(); break;
    case '3x2': a = rand3(); b = rand2(); break;
    case '3x3': default: a = rand3(); b = rand3(); break;
  }
  return { a, b, type, answer: a * b };
};

const generateQuestions = (selectedTypes: MultType[], count: number): Question[] => {
  if (selectedTypes.length === 0) return [];
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    questions.push(generateQuestion(selectedTypes[i % selectedTypes.length]));
  }
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  return questions;
};

const getDims = (q: Question): { cols: number; rows: number } => {
  const cols = String(q.a).length;
  const rows = String(q.b).length;
  return { cols, rows };
};

// ─── PDF drawing helpers ──────────────────────────────────────────────────────
// All measurements in mm.

// Grid col widths in mm: rightmost=12mm, +3mm each step left (matches px ratio)
const gridColWidths = (cols: number): number[] =>
  Array.from({ length: cols }, (_, ci) => {
    const fromRight = cols - 1 - ci;
    return 12 + fromRight * 3; // 12, 15, 18 mm
  });

const drawPdfGrid = (
  doc: jsPDF,
  q: Question,
  originX: number, // left edge of grid
  originY: number, // top edge of grid
) => {
  const { cols, rows } = getDims(q);
  const cellH = 9; // mm
  const colW = gridColWidths(cols);
  const colX: number[] = colW.reduce<number[]>((acc, w, i) => {
    acc.push(i === 0 ? originX : acc[i - 1] + colW[i - 1]);
    return acc;
  }, []);

  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.3);

  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      doc.rect(colX[ci], originY + ri * cellH, colW[ci], cellH);
    }
  }
};

const drawPdfLattice = (
  doc: jsPDF,
  q: Question,
  originX: number,
  originY: number,
) => {
  const { cols, rows } = getDims(q);
  const CELL = 9; // mm square cells
  const EXT = CELL; // SW extension length along diagonal
  const gridW = cols * CELL;
  const gridH = rows * CELL;

  doc.setDrawColor(55, 65, 81);

  // Diagonals first (lighter)
  doc.setLineWidth(0.2);
  doc.setDrawColor(107, 114, 128);
  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      const x = originX + ci * CELL;
      const y = originY + ri * CELL;
      const isLastRow = ri === rows - 1;
      const isFirstCol = ci === 0;
      const extend = isLastRow || isFirstCol;
      const x1 = x + CELL;
      const y1 = y;
      const x2 = extend ? x - EXT / Math.SQRT2 : x;
      const y2 = extend ? y + CELL + EXT / Math.SQRT2 : y + CELL;
      doc.line(x1, y1, x2, y2);
    }
  }

  // Cell borders
  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.3);
  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      doc.rect(originX + ci * CELL, originY + ri * CELL, CELL, CELL);
    }
  }

  // Outer border (heavier)
  doc.setLineWidth(0.5);
  doc.rect(originX, originY, gridW, gridH);
};

// Returns the height (mm) that a question block occupies on the PDF
const getBlockHeight = (has3x3: boolean): number => has3x3 ? 58 : 48;

// ─── Full PDF generation ──────────────────────────────────────────────────────
const buildPDF = (questions: Question[], method: Method) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 15;
  const COLS = 3;
  const colW = (PAGE_W - 2 * MARGIN) / COLS; // 60mm per column

  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getFullYear()).slice(-2)}`;

  const has3x3 = questions.some(q => q.type === '3x3');
  const BLOCK_H = getBlockHeight(has3x3);
  // spacing between question number line and structure
  const STRUCT_OFFSET_Y = 8; // mm below question text to start grid/lattice
  const STRUCT_OFFSET_X = 4; // mm indent from column left

  const drawPage = (pageQuestions: Question[], pageNum: number, isAnswerKey: boolean) => {
    if (pageNum > 1) doc.addPage();

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text(
      isAnswerKey ? 'Answer Key' : 'Multiplication Worksheet',
      PAGE_W / 2, MARGIN, { align: 'center' }
    );

    if (!isAnswerKey) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Name: ________________________________   Date: ${dateStr}`, MARGIN, MARGIN + 8);
    }

    const startY = MARGIN + (isAnswerKey ? 12 : 18);

    pageQuestions.forEach((q, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x = MARGIN + col * colW;
      const y = startY + row * BLOCK_H;

      // Question number + expression
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`${idx + 1}.  ${q.a} × ${q.b}`, x + 2, y + 5);

      if (isAnswerKey) {
        // Answer key: just show the answer below the expression
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(30, 58, 138);
        doc.text(`= ${q.answer}`, x + 10, y + 12);
        doc.setTextColor(0);
      } else {
        // Worksheet: draw structure in working space
        const structX = x + STRUCT_OFFSET_X;
        const structY = y + STRUCT_OFFSET_Y + 3;

        if (method === 'grid') {
          drawPdfGrid(doc, q, structX, structY);
        } else if (method === 'lattice') {
          drawPdfLattice(doc, q, structX, structY);
        }
        // blank: nothing drawn
      }
    });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text('Multiplication Worksheet Generator', PAGE_W / 2, PAGE_H - 8, { align: 'center' });
    doc.setTextColor(0);
  };

  // Page 1: questions
  drawPage(questions, 1, false);
  // Page 2: answer key
  drawPage(questions, 2, true);

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

// ─── Blank Grid ───────────────────────────────────────────────────────────────
const BlankGrid: React.FC<{ q: Question }> = ({ q }) => {
  const { cols, rows } = getDims(q);
  const CELL_H = 36;

  // Tiered column widths: rightmost = 45px, then 55px, then 65px, etc.
  // cols counted from the right (units, tens, hundreds...)
  const colWidths = Array.from({ length: cols }, (_, ci) => {
    const fromRight = cols - 1 - ci; // 0 = rightmost
    return 45 + fromRight * 10;
  });

  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const totalH = rows * CELL_H;

  // x offsets for each column
  const colX = colWidths.reduce<number[]>((acc, w, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + colWidths[i - 1]);
    return acc;
  }, []);

  return (
    <svg
      width={totalW}
      height={totalH}
      style={{ display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {Array.from({ length: rows }).map((_, ri) =>
        Array.from({ length: cols }).map((_, ci) => (
          <rect
            key={`cell-${ri}-${ci}`}
            x={colX[ci]}
            y={ri * CELL_H}
            width={colWidths[ci]}
            height={CELL_H}
            fill="white"
            stroke="#374151"
            strokeWidth="1.2"
          />
        ))
      )}
    </svg>
  );
};

// ─── Blank Lattice ────────────────────────────────────────────────────────────
const BlankLattice: React.FC<{ q: Question }> = ({ q }) => {
  const { cols, rows } = getDims(q);
  const CELL = 36;
  // Extra space around the grid so extended diagonals have room
  const EXT = CELL; // one full cell of extension on each side

  const gridX = EXT;
  const gridY = EXT;
  const gridW = cols * CELL;
  const gridH = rows * CELL;

  const totalW = gridW + EXT * 2;
  const totalH = gridH + EXT * 2;

  const clipId = `lattice-clip-${cols}-${rows}`;

  return (
    <svg
      width={totalW}
      height={totalH}
      style={{ display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Clip to the SVG canvas so extended lines don't bleed outside */}
        <clipPath id={clipId}>
          <rect x={0} y={0} width={totalW} height={totalH} />
        </clipPath>
      </defs>

      {/* Diagonals — extended SW only on last row and/or first column */}
      <g clipPath={`url(#${clipId})`}>
        {Array.from({ length: rows }).map((_, ri) =>
          Array.from({ length: cols }).map((_, ci) => {
            const x = gridX + ci * CELL;
            const y = gridY + ri * CELL;
            const isLastRow = ri === rows - 1;
            const isFirstCol = ci === 0;
            const extend = isLastRow || isFirstCol;
            // Diagonal runs from top-right corner to bottom-left corner of cell
            // SW extension: continue past bottom-left by one full cell diagonal (at 45°)
            const x1 = x + CELL;
            const y1 = y;
            const x2 = extend ? x - EXT / Math.SQRT2 : x;
            const y2 = extend ? y + CELL + EXT / Math.SQRT2 : y + CELL;
            return (
              <line
                key={`diag-${ri}-${ci}`}
                x1={x1} y1={y1}
                x2={x2} y2={y2}
                stroke="#6b7280"
                strokeWidth="0.9"
              />
            );
          })
        )}
      </g>

      {/* Cell borders */}
      {Array.from({ length: rows }).map((_, ri) =>
        Array.from({ length: cols }).map((_, ci) => (
          <rect
            key={`cell-${ri}-${ci}`}
            x={gridX + ci * CELL}
            y={gridY + ri * CELL}
            width={CELL}
            height={CELL}
            fill="none"
            stroke="#374151"
            strokeWidth="1.2"
          />
        ))
      )}

      {/* Outer border on top */}
      <rect
        x={gridX} y={gridY}
        width={gridW} height={gridH}
        fill="none"
        stroke="#374151"
        strokeWidth="2"
      />
    </svg>
  );
};

// ─── Preview question block ───────────────────────────────────────────────────
const PreviewQuestion: React.FC<{ q: Question; idx: number; method: Method }> = ({ q, idx, method }) => {
  return (
    <div className="p-3">
      <span className="text-xl font-semibold" style={{ color: '#000000' }}>
        {idx + 1}. {q.a} × {q.b}
      </span>
      {method === 'grid' && (
        <div style={{ marginTop: '28px', marginLeft: '20px' }}>
          <BlankGrid q={q} />
        </div>
      )}
      {method === 'lattice' && (
        <div style={{ marginTop: '28px', marginLeft: '20px' }}>
          <BlankLattice q={q} />
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MultiplicationGenerator() {
  const allTypes: MultType[] = ['2x1', '2x2', '3x1', '3x2', '3x3'];

  const typeLabels: Record<MultType, string> = {
    '2x1': '2-digit × 1-digit',
    '2x2': '2-digit × 2-digit',
    '3x1': '3-digit × 1-digit',
    '3x2': '3-digit × 2-digit',
    '3x3': '3-digit × 3-digit',
  };

  const typeExamples: Record<MultType, string> = {
    '2x1': 'e.g. 58 × 7',
    '2x2': 'e.g. 47 × 63',
    '3x1': 'e.g. 342 × 8',
    '3x2': 'e.g. 246 × 37',
    '3x3': 'e.g. 312 × 274',
  };

  const [selectedTypes, setSelectedTypes] = useState<MultType[]>([]);
  const [method, setMethod] = useState<Method>('blank');
  const [numQuestions, setNumQuestions] = useState<number>(20);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [error, setError] = useState<string>('');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  const has3x3 = selectedTypes.includes('3x3');
  const maxQ = has3x3 ? 12 : 15;
  const minQ = 9;
  const allSelected = allTypes.every(t => selectedTypes.includes(t));

  const toggleAll = () => {
    setSelectedTypes(allSelected ? [] : [...allTypes]);
    setError('');
  };

  const toggleType = (type: MultType) => {
    setSelectedTypes(prev => {
      const next = prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type];
      if (type === '3x3' && !prev.includes('3x3') && numQuestions > 12) {
        setNumQuestions(12);
      }
      return next;
    });
    setError('');
  };

  const handleNumChange = (raw: string) => {
    const val = parseInt(raw);
    if (isNaN(val)) return;
    const max = has3x3 ? 12 : 15;
    if (val < minQ || val > max) {
      setError(`Please enter a number between ${minQ} and ${max}`);
    } else {
      setNumQuestions(val);
      setError('');
    }
  };

  const handleGeneratePreview = () => {
    if (selectedTypes.length === 0) {
      setError('Please select at least one question type');
      return;
    }
    const qs = generateQuestions(selectedTypes, Math.min(numQuestions, maxQ));
    setPreviewQuestions(qs);
    setError('');
  };

  const handleGeneratePDF = () => {
    if (selectedTypes.length === 0) {
      setError('Please select at least one question type');
      return;
    }
    const qs = generateQuestions(selectedTypes, Math.min(numQuestions, maxQ));
    if (qs.length === 0) {
      setError('No questions could be generated');
      return;
    }
    buildPDF(qs, method);
    setError('');
  };

  const handleMethodChange = (m: Method) => {
    setMethod(m);
    setError('');
  };

  const noSelection = selectedTypes.length === 0;

  const previewCols = 3;
  const previewCount = 12;

  return (
    <>
      {/* Header Bar */}
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => (window.location.href = '/')}
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
                  {(['default', 'blue', 'pink', 'yellow'] as ColorScheme[]).map(scheme => (
                    <button
                      key={scheme}
                      onClick={() => { setColorScheme(scheme); setIsMenuOpen(false); }}
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

          {/* Title */}
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>
            {TOOL_CONFIG.pageTitle}
          </h1>

          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }} />
          </div>

          {/* Configuration Panel */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-center mb-4" style={{ color: '#000000' }}>
              Customisation Options
            </h2>

            <div className="flex justify-center mb-6">
              <div style={{ width: '100%', height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>

            {/* Question type selection */}
            <div className="mb-8">
              <div className="flex flex-col items-center gap-3">
                {(['2x1', '2x2', '3x1', '3x2', '3x3'] as MultType[]).map(type => (
                  <div key={type} className="text-center">
                    <label className="flex items-center justify-center gap-3 cursor-pointer mb-1">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleType(type)}
                        className="w-5 h-5 cursor-pointer"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span className="text-xl font-bold" style={{ color: '#000000' }}>
                        {typeLabels[type]}
                      </span>
                    </label>
                    <p className="text-gray-500 text-sm font-mono">{typeExamples[type]}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center my-6">
              <div style={{ width: '80%', height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>

            {/* Method selection */}
            <div className="mb-6">
              <div className="flex justify-center items-center gap-8">
                <span className="text-lg font-semibold" style={{ color: '#000000' }}>
                  Question Structure:
                </span>
                {(['blank', 'grid', 'lattice'] as Method[]).map(m => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="method"
                      value={m}
                      checked={method === m}
                      onChange={() => handleMethodChange(m)}
                      className="w-5 h-5 cursor-pointer"
                      style={{ accentColor: '#1e3a8a' }}
                    />
                    <span className="text-lg font-semibold capitalize" style={{ color: '#000000' }}>
                      {m === 'blank' ? 'Blank' : m === 'grid' ? 'Grid' : 'Lattice'}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-center text-gray-500 text-sm mt-2">
                {method === 'blank' && 'Blank working space — sized to also fit a grid or lattice if students prefer'}
                {method === 'grid' && 'A blank n×m grid is pre-drawn for students to fill in partial products'}
                {method === 'lattice' && 'A blank n×m lattice with diagonals is pre-drawn for students to fill in'}
              </p>
            </div>

            <div className="flex justify-center my-6">
              <div style={{ width: '80%', height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>

            {/* Number of questions */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <label className="text-lg font-semibold" style={{ color: '#000000' }}>
                Questions ({minQ}–{maxQ}):
              </label>
              <input
                type="number"
                min={minQ}
                max={maxQ}
                value={numQuestions}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNumChange(e.target.value)}
                className="w-24 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex justify-center mb-4">
                <div className="px-4 py-2 bg-red-100 border-2 border-red-500 rounded-lg text-red-700 font-semibold">
                  {error}
                </div>
              </div>
            )}

            {/* Generate Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleGeneratePreview}
                disabled={noSelection}
                className={`px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 transition-all ${
                  noSelection
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-900 text-white hover:bg-blue-800 shadow-xl'
                }`}
              >
                <Eye size={24} />
                Generate Example
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={noSelection}
                className={`px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 transition-all ${
                  noSelection
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-900 text-white hover:bg-blue-800 shadow-xl'
                }`}
              >
                <Download size={24} />
                Generate PDF
              </button>
            </div>
          </div>

          {/* Preview Questions */}
          {previewQuestions.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-bold text-center mb-6" style={{ color: '#000000' }}>
                Question Preview
              </h2>
              <div
                className="grid gap-6"
                style={{ gridTemplateColumns: `repeat(${previewCols}, minmax(0, 1fr))` }}
              >
                {previewQuestions.slice(0, previewCount).map((q, idx) => (
                  <PreviewQuestion key={idx} q={q} idx={idx} method={method} />
                ))}
              </div>
              {previewQuestions.length > previewCount && (
                <p className="text-center mt-6 text-gray-700 font-semibold text-lg">
                  ...plus {previewQuestions.length - previewCount} more questions
                </p>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>
              How it works:
            </h3>
            <ul className="space-y-2 text-gray-700">
              {[
                'Select which question types you want to practise using the checkboxes above.',
                'Single-digit factors are always 2–9 (never 1).',
                'Choose a question structure: Blank leaves generous working space; Grid pre-draws a blank partial-products grid; Lattice pre-draws a blank diagonal lattice.',
                'The working space is the same size regardless of structure — students can always use whichever approach they prefer.',
                '3×3 questions get extra working space and use 3 columns × 4 rows, capped at 12 questions.',
                'All other combinations fit 3 columns × 5 rows, capped at 15 questions.',
                'Set the number of questions (9–15, or 9–12 with 3×3 selected).',
                'Click "Generate Example" to preview your questions.',
                'Click "Generate PDF" to produce a printable worksheet with an answer key on page 2.',
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold" style={{ color: '#1e3a8a' }}>•</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </>
  );
}
