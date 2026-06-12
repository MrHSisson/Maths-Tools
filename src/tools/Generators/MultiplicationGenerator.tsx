import React, { useState } from 'react';
import { Home, Menu, X, Eye, Download } from 'lucide-react';

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

// ─── Shared layout — single source of truth (all values in mm) ───────────────
// To adjust spacing/sizing, change values here — both PDF and preview update.
const L = {
  // PDF page
  pageW: 210, pageH: 297, marginSide: 10, marginTop: 15, cols: 3,

  // Per-question block height
  blockH: 48,     // mm — standard questions
  blockH3x3: 60,  // mm — 3×3 questions

  // Text position within block
  textOffsetY: 6,  // mm from block top (baseline)

  // Structure (grid/lattice) positioning within block
  structOffsetY: 12, // mm from block top to top of structure

  // Grid cell dimensions
  gridCellH: 9,          // mm tall
  gridColBase: 12,       // mm — rightmost column width
  gridColStep: 3,        // mm — added per step left

  // Lattice cell
  latticeCell: 9,        // mm — square cell side
  latticeExt: 9,         // mm — SW diagonal extension
};

// px per mm — used to convert mm constants into preview pixel sizes
const MM2PX = 3.78;

// ─── Shared geometry helpers ──────────────────────────────────────────────────
// All return mm values. Preview multiplies by MM2PX.

const gridColWidths = (cols: number): number[] =>
  Array.from({ length: cols }, (_, ci) => L.gridColBase + (cols - 1 - ci) * L.gridColStep);

const gridW = (cols: number): number => gridColWidths(cols).reduce((a, b) => a + b, 0);
const gridH = (rows: number): number => rows * L.gridCellH;
const latticeW = (cols: number): number => cols * L.latticeCell + L.latticeExt * 2;
const latticeH = (rows: number): number => rows * L.latticeCell + L.latticeExt * 2;
const blockHmm = (has3x3: boolean): number => has3x3 ? L.blockH3x3 : L.blockH;

// ─── Print SVG builders (mm units — viewBox is in mm, sized with mm widths) ──
const printGridSvg = (q: Question): string => {
  const { cols, rows } = getDims(q);
  const colW = gridColWidths(cols);
  const colX = colW.reduce<number[]>((acc, _w, i) =>
    [...acc, i === 0 ? 0 : acc[i - 1] + colW[i - 1]], []);
  const w = gridW(cols), h = gridH(rows);
  let rects = '';
  for (let ri = 0; ri < rows; ri++)
    for (let ci = 0; ci < cols; ci++)
      rects += `<rect x="${colX[ci]}" y="${ri * L.gridCellH}" width="${colW[ci]}" height="${L.gridCellH}" fill="white" stroke="#374151" stroke-width="0.3"/>`;
  return `<svg width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" style="display:block;overflow:visible">${rects}</svg>`;
};

const printLatticeSvg = (q: Question): string => {
  const { cols, rows } = getDims(q);
  const C = L.latticeCell;
  const EXT = L.latticeExt;
  const gx = EXT, gy = EXT;
  const w = latticeW(cols), h = latticeH(rows);
  let lines = '', cells = '';
  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      const x = gx + ci * C;
      const y = gy + ri * C;
      const extend = ri === rows - 1 || ci === 0;
      lines += `<line x1="${x + C}" y1="${y}" x2="${extend ? x - EXT / Math.SQRT2 : x}" y2="${extend ? y + C + EXT / Math.SQRT2 : y + C}" stroke="#6b7280" stroke-width="0.2"/>`;
      cells += `<rect x="${x}" y="${y}" width="${C}" height="${C}" fill="none" stroke="#374151" stroke-width="0.3"/>`;
    }
  }
  const outer = `<rect x="${gx}" y="${gy}" width="${cols * C}" height="${rows * C}" fill="none" stroke="#374151" stroke-width="0.5"/>`;
  return `<svg width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" style="display:block;overflow:visible">${lines}${cells}${outer}</svg>`;
};

// ─── Full PDF generation — print-window pattern (matches the rest of the app) ─
const buildPDF = (questions: Question[], method: Method) => {
  const BLOCK_H = blockHmm(questions.some(q => q.type === '3x3'));

  const block = (q: Question, idx: number, isAnswerKey: boolean): string => {
    const structure = isAnswerKey
      ? `<div class="answer">= ${q.answer}</div>`
      : method === 'grid' ? `<div class="struct">${printGridSvg(q)}</div>`
      : method === 'lattice' ? `<div class="struct">${printLatticeSvg(q)}</div>`
      : '';
    return `<div class="block" style="height:${BLOCK_H}mm"><div class="q-text">${idx + 1}.&nbsp;&nbsp;${q.a} × ${q.b}</div>${structure}</div>`;
  };

  const page = (isAnswerKey: boolean): string => `<div class="page">
    <h1>${isAnswerKey ? 'Answer Key' : 'Multiplication Worksheet'}</h1>
    ${isAnswerKey ? '' : '<div class="name">Name: ________________________________</div>'}
    <div class="grid">${questions.map((q, i) => block(q, i, isAnswerKey)).join('')}</div>
    <div class="footer">Multiplication Worksheet Generator</div>
  </div>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Multiplication Worksheet</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size:A4 portrait; margin:${L.marginTop}mm ${L.marginSide}mm; }
  body { font-family:Helvetica,Arial,sans-serif; background:#fff; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  .page { width:${L.pageW - 2 * L.marginSide}mm; height:${L.pageH - 2 * L.marginTop}mm; position:relative; page-break-after:always; }
  .page:last-child { page-break-after:auto; }
  h1 { font-size:6.3mm; font-weight:700; text-align:center; }
  .name { font-size:3.9mm; margin-top:3mm; }
  .grid { display:grid; grid-template-columns:repeat(${L.cols},1fr); margin-top:4mm; }
  .block { border:0.2mm solid #c8c8c8; display:flex; flex-direction:column; align-items:center; padding-top:2.5mm; overflow:hidden; }
  .q-text { font-size:4.2mm; font-weight:700; text-align:center; }
  .answer { font-size:3.9mm; color:#1e3a8a; margin-top:3mm; text-align:center; }
  .struct { flex:1; display:flex; align-items:center; justify-content:center; min-height:0; }
  .footer { position:absolute; bottom:0; left:0; right:0; text-align:center; font-size:2.5mm; color:#787878; }
</style>
</head><body>${page(false)}${page(true)}</body></html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to use the PDF export.'); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 300);
};

// ─── SVG preview components (mm → px via MM2PX) ───────────────────────────────
const BlankGrid: React.FC<{ q: Question }> = ({ q }) => {
  const { cols, rows } = getDims(q);
  const colWpx = gridColWidths(cols).map(w => w * MM2PX);
  const cellHpx = L.gridCellH * MM2PX;
  const totalW = colWpx.reduce((a, b) => a + b, 0);
  const colX = colWpx.reduce<number[]>((acc, _w, i) =>
    [...acc, i === 0 ? 0 : acc[i - 1] + colWpx[i - 1]], []);
  return (
    <svg width={totalW} height={rows * cellHpx} style={{ display: 'block' }}>
      {Array.from({ length: rows }).map((_, ri) =>
        Array.from({ length: cols }).map((_, ci) => (
          <rect key={`${ri}-${ci}`}
            x={colX[ci]} y={ri * cellHpx}
            width={colWpx[ci]} height={cellHpx}
            fill="white" stroke="#374151" strokeWidth="1.2" />
        ))
      )}
    </svg>
  );
};

const BlankLattice: React.FC<{ q: Question }> = ({ q }) => {
  const { cols, rows } = getDims(q);
  const C = L.latticeCell * MM2PX;
  const EXT = L.latticeExt * MM2PX;
  const gx = EXT;
  const gy = EXT;
  const totalW = cols * C + EXT * 2;
  const totalH = rows * C + EXT * 2;
  const clipId = `lc-${cols}-${rows}`;
  return (
    <svg width={totalW} height={totalH} style={{ display: 'block' }}>
      <defs>
        <clipPath id={clipId}><rect x={0} y={0} width={totalW} height={totalH} /></clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {Array.from({ length: rows }).map((_, ri) =>
          Array.from({ length: cols }).map((_, ci) => {
            const x = gx + ci * C;
            const y = gy + ri * C;
            const extend = ri === rows - 1 || ci === 0;
            return (
              <line key={`d-${ri}-${ci}`}
                x1={x + C} y1={y}
                x2={extend ? x - EXT / Math.SQRT2 : x}
                y2={extend ? y + C + EXT / Math.SQRT2 : y + C}
                stroke="#6b7280" strokeWidth="0.9" />
            );
          })
        )}
      </g>
      {Array.from({ length: rows }).map((_, ri) =>
        Array.from({ length: cols }).map((_, ci) => (
          <rect key={`c-${ri}-${ci}`}
            x={gx + ci * C} y={gy + ri * C} width={C} height={C}
            fill="none" stroke="#374151" strokeWidth="1.2" />
        ))
      )}
      <rect x={gx} y={gy} width={cols * C} height={rows * C}
        fill="none" stroke="#374151" strokeWidth="2" />
    </svg>
  );
};

// ─── Preview question block ───────────────────────────────────────────────────
// Block dimensions mirror the PDF exactly via MM2PX.
const PreviewQuestion: React.FC<{ q: Question; idx: number; method: Method; has3x3: boolean }> = ({ q, idx, method, has3x3 }) => {
  const BLOCK_H_PX = blockHmm(has3x3) * MM2PX;
  const STRUCT_OFFSET_Y_PX = L.structOffsetY * MM2PX;
  const remainingH = BLOCK_H_PX - STRUCT_OFFSET_Y_PX;
  return (
    <div style={{
      height: `${BLOCK_H_PX}px`,
      border: '1px solid #000',
      boxSizing: 'border-box',
      paddingTop: `${L.textOffsetY * MM2PX * 0.6}px`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <span className="font-semibold" style={{ fontSize: '14px', color: '#000', lineHeight: 1.2 }}>
        {idx + 1}. {q.a} × {q.b}
      </span>
      {(method === 'grid' || method === 'lattice') && (
        <div style={{ height: `${remainingH}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {method === 'grid' ? <BlankGrid q={q} /> : <BlankLattice q={q} />}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MultiplicationGenerator() {


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
  const [numQuestions, setNumQuestions] = useState<number>(12);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [error, setError] = useState<string>('');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  const has3x3 = selectedTypes.includes('3x3');
  const maxQ = has3x3 ? 12 : 15;
  const minQ = 9;

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
                className="grid"
                style={{ gridTemplateColumns: `repeat(${previewCols}, minmax(0, 1fr))` }}
              >
                {previewQuestions.slice(0, previewCount).map((q, idx) => (
                  <PreviewQuestion key={idx} q={q} idx={idx} method={method} has3x3={selectedTypes.includes('3x3')} />
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

