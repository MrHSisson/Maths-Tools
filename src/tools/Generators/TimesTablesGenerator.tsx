import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Home, Menu, X, Eye } from 'lucide-react';
import { jsPDF } from 'jspdf';

const TOOL_CONFIG = {
  pageTitle: 'Times Tables Generator',
};

type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';
type LayoutMode = 'list' | 'cells';

type Question = {
  question: string; // full string including ___ for the blank
  answer: number;
};

// ── QUESTION GENERATION ───────────────────────────────────────────────────────

const generateQuestions = (
  selectedTables: number[],
  numQuestions: number,
  includeMultiply: boolean,
  includeDivide: boolean,
  includeMissingFactor: boolean,
  tableFirst: boolean
): Question[] => {
  const pool: Question[] = [];

  selectedTables.forEach(tt => {
    for (let other = 1; other <= 12; other++) {
      const product = tt * other;
      const first = tableFirst ? tt : other;
      const second = tableFirst ? other : tt;

      // Standard: a × b = ___
      if (includeMultiply) {
        pool.push({ question: `${first} × ${second} = ___`, answer: product });
      }

      // Standard: dividend ÷ divisor = ___
      if (includeDivide) {
        pool.push({ question: `${product} ÷ ${tt} = ___`, answer: other });
        if (other !== tt) {
          pool.push({ question: `${product} ÷ ${other} = ___`, answer: tt });
        }
      }

      // Missing factor: a × ___ = product
      if (includeMissingFactor && includeMultiply) {
        pool.push({ question: `${first} × ___ = ${product}`, answer: second });
      }

      // Missing dividend: ___ ÷ divisor = quotient
      if (includeMissingFactor && includeDivide) {
        pool.push({ question: `___ ÷ ${tt} = ${other}`, answer: product });
        if (other !== tt) {
          pool.push({ question: `___ ÷ ${other} = ${tt}`, answer: product });
        }
      }
    }
  });

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, numQuestions);
};

// ── CELLS PDF ─────────────────────────────────────────────────────────────────

function handlePrintCells(questions: Question[]) {
  const MARGIN_MM = 12;
  const HEADER_MM = 16;
  const GAP_MM = 1.5;
  const PAGE_H_MM = 297 - MARGIN_MM * 2;
  const PAGE_W_MM = 210 - MARGIN_MM * 2;
  const usableH = PAGE_H_MM - HEADER_MM;
  const COLS = 3;
  const totalQ = questions.length;
  const rows = Math.ceil(totalQ / COLS);
  const cellH_MM = (usableH - GAP_MM * (rows - 1)) / rows;
  const cellW_MM = (PAGE_W_MM - GAP_MM * (COLS - 1)) / COLS;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const FONT_PX = 14;
  const ANS_PX = Math.round(FONT_PX * 1.55);

  const qHtml = (idx: number, showAnswer: boolean): string => {
    const q = questions[idx];
    if (showAnswer) {
      return `<div class="qbody qbody-ans"><div class="q-text">${q.question}</div><div class="q-ans">${q.answer}</div></div>`;
    }
    return `<div class="qbody">${q.question}</div>`;
  };

  const buildGrid = (showAnswer: boolean): string => {
    let cells = '';
    for (let i = 0; i < totalQ; i++) {
      cells += `<div class="cell" style="width:${cellW_MM}mm;height:${cellH_MM}mm;">${qHtml(i, showAnswer)}</div>`;
    }
    return `<div class="grid" style="grid-template-columns:repeat(${COLS},${cellW_MM}mm);grid-template-rows:repeat(${rows},${cellH_MM}mm);">${cells}</div>`;
  };

  const buildPage = (showAnswer: boolean): string => {
    const title = showAnswer ? 'Times Tables — Answers' : 'Times Tables Worksheet';
    return `<div class="page">
      <div class="page-header"><h1>${title}</h1><div class="meta">${dateStr} · ${totalQ} questions</div></div>
      ${buildGrid(showAnswer)}
    </div>`;
  };

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Times Tables Worksheet</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size:A4; margin:${MARGIN_MM}mm; }
  body { font-family:"Segoe UI",Arial,sans-serif; background:#fff; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  .page { width:${PAGE_W_MM}mm; height:${PAGE_H_MM}mm; overflow:hidden; page-break-after:always; }
  .page:last-child { page-break-after:auto; }
  .page-header {
    display:flex; justify-content:space-between; align-items:baseline;
    border-bottom:0.4mm solid #1e3a8a; padding-bottom:1.5mm; margin-bottom:2.5mm;
  }
  .page-header h1 { font-size:5mm; font-weight:700; color:#1e3a8a; }
  .page-header .meta { font-size:3mm; color:#6b7280; }
  .grid { display:grid; gap:${GAP_MM}mm; }
  .cell {
    border:0.3mm solid #000; border-radius:3mm;
    overflow:hidden; display:flex; align-items:center; justify-content:center;
  }
  .qbody { padding:2mm; text-align:center; font-size:${FONT_PX}px; line-height:1.4; width:100%; }
  .qbody-ans { display:flex; flex-direction:column; justify-content:center; align-items:center; gap:1.5mm; }
  .q-text { text-align:center; width:100%; font-size:${FONT_PX}px; }
  .q-ans { font-size:${ANS_PX}px; font-weight:700; color:#059669; text-align:center; width:100%; }
</style>
</head>
<body>
${buildPage(false)}
${buildPage(true)}
<script>setTimeout(function(){ window.print(); }, 300);</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to use the PDF export.'); return; }
  win.document.write(html);
  win.document.close();
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function TimesTablesQuizGenerator() {
  const navigate = useNavigate();
  const [selectedTables, setSelectedTables] = useState<number[]>([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const [numQuestions, setNumQuestions] = useState<number>(40);
  const [includeMultiply, setIncludeMultiply] = useState<boolean>(true);
  const [includeDivide, setIncludeDivide] = useState<boolean>(false);
  const [includeMissingFactor, setIncludeMissingFactor] = useState<boolean>(false);
  const [tableFirst, setTableFirst] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('list');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  const maxQ = layoutMode === 'cells' ? 45 : 60;
  const hasQuestionType = includeMultiply || includeDivide;

  const toggleTable = (table: number): void => {
    setSelectedTables(prev =>
      prev.includes(table)
        ? prev.filter(t => t !== table)
        : [...prev, table].sort((a, b) => a - b)
    );
    setError('');
  };

  const selectAll = (): void => setSelectedTables(Array.from({ length: 20 }, (_, i) => i + 1));
  const selectNone = (): void => setSelectedTables([]);

  const validate = (): boolean => {
    if (selectedTables.length === 0) {
      setError('Please select at least one times table');
      return false;
    }
    if (!hasQuestionType) {
      setError('Please select at least one question type (Multiply or Divide)');
      return false;
    }
    return true;
  };

  const getQuestions = (): Question[] =>
    generateQuestions(selectedTables, numQuestions, includeMultiply, includeDivide, includeMissingFactor, tableFirst);

  const handleGeneratePreview = (): void => {
    if (!validate()) return;
    setPreviewQuestions(getQuestions());
    setError('');
  };

  const handleGeneratePDF = (): void => {
    if (!validate()) return;
    const questions = previewQuestions.length > 0 ? previewQuestions : getQuestions();

    if (layoutMode === 'cells') {
      handlePrintCells(questions);
      setError('');
      return;
    }

    // List mode — jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getFullYear()).slice(-2)}`;

    doc.setProperties({ title: `Times Tables ${dateStr}`, subject: 'Mathematics Practice' });

    // Page 1: Questions
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Times Tables Quiz', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Name: ________________________________', 20, 35);

    const startY = 48;
    const colWidth = (pageWidth - 40) / 3;
    const lineH = 11.5;
    const numCols = 3;

    doc.setFontSize(13);
    questions.forEach((q, i) => {
      const row = Math.floor(i / numCols);
      const col = i % numCols;
      const x = 20 + col * colWidth;
      const y = startY + row * lineH;
      if (y < pageHeight - 20) doc.text(`${i + 1}. ${q.question}`, x, y);
    });

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('Times Tables Generator', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Page 2: Answers
    doc.addPage();
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Answer Key', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    questions.forEach((q, i) => {
      const row = Math.floor(i / numCols);
      const col = i % numCols;
      const x = 20 + col * colWidth;
      const y = 35 + row * lineH;
      if (y < pageHeight - 20) {
        doc.text(`${i + 1}. ${q.question.replace('___', String(q.answer))}`, x, y);
      }
    });

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('Times Tables Generator', pageWidth / 2, pageHeight - 10, { align: 'center' });

    const pdfBlob = doc.output('blob');
    window.open(URL.createObjectURL(pdfBlob), '_blank');
    setError('');
  };

  return (
    <>
      {/* Header Bar */}
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
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
                  <div className="px-6 py-2 font-bold text-gray-700 text-sm uppercase tracking-wide">Color Schemes</div>
                  {(['default', 'blue', 'pink', 'yellow'] as const).map((scheme: ColorScheme) => (
                    <button
                      key={scheme}
                      onClick={() => { setColorScheme(scheme); setIsMenuOpen(false); }}
                      className={`w-full text-left px-6 py-3 font-semibold transition-colors ${
                        colorScheme === scheme ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100'
                      }`}
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

          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>
            {TOOL_CONFIG.pageTitle}
          </h1>

          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }} />
          </div>

          {/* Control Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-center mb-4" style={{ color: '#000000' }}>Customisation Options</h2>
            <div className="flex justify-center mb-6">
              <div style={{ width: '80%', height: '1px', backgroundColor: '#d1d5db' }} />
            </div>

            {/* Question Types */}
            <div className="flex justify-center items-center gap-6 mb-6 flex-wrap">
              <span className="text-lg font-semibold" style={{ color: '#000000' }}>Question Types:</span>
              <div className="flex gap-6 flex-wrap justify-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMultiply}
                    onChange={e => setIncludeMultiply(e.target.checked)}
                    className="w-5 h-5 cursor-pointer"
                    style={{ accentColor: '#1e3a8a' }}
                  />
                  <span className="text-lg font-semibold" style={{ color: '#000000' }}>
                    Multiply <span className="text-sm text-gray-500 font-normal">(e.g. 3 × 7 = ___)</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDivide}
                    onChange={e => setIncludeDivide(e.target.checked)}
                    className="w-5 h-5 cursor-pointer"
                    style={{ accentColor: '#1e3a8a' }}
                  />
                  <span className="text-lg font-semibold" style={{ color: '#000000' }}>
                    Divide <span className="text-sm text-gray-500 font-normal">(e.g. 21 ÷ 7 = ___)</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMissingFactor}
                    onChange={e => setIncludeMissingFactor(e.target.checked)}
                    className="w-5 h-5 cursor-pointer"
                    style={{ accentColor: '#1e3a8a' }}
                  />
                  <span className="text-lg font-semibold" style={{ color: '#000000' }}>
                    Missing Factor <span className="text-sm text-gray-500 font-normal">(e.g. 3 × ___ = 21, ___ ÷ 7 = 3)</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Format Toggle */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <span className="text-sm font-semibold" style={{ color: '#000000' }}>Format:</span>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${!tableFirst ? 'text-blue-900' : 'text-gray-500'}`}>
                  TT First (e.g. <span style={{ textDecoration: 'underline' }}>2</span> × 3)
                </span>
                <button
                  onClick={() => setTableFirst(!tableFirst)}
                  className="relative w-14 h-7 rounded-full transition-colors bg-blue-900"
                >
                  <div
                    className="absolute top-1 w-5 h-5 bg-white rounded-full transition-transform"
                    style={{ left: tableFirst ? '32px' : '4px' }}
                  />
                </button>
                <span className={`text-sm font-semibold ${tableFirst ? 'text-blue-900' : 'text-gray-500'}`}>
                  TT Last (e.g. 3 × <span style={{ textDecoration: 'underline' }}>2</span>)
                </span>
              </div>
            </div>

            <div className="flex justify-center my-6">
              <div style={{ width: '80%', height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>

            {/* Times Tables Selection */}
            <div className="mb-6">
              <div className="flex justify-center items-center gap-4 mb-4">
                <span className="text-lg font-semibold" style={{ color: '#000000' }}>Select Times Tables:</span>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-sm">
                    Select All
                  </button>
                  <button onClick={selectNone} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-sm">
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-10 gap-3 max-w-4xl mx-auto">
                {Array.from({ length: 20 }, (_, i) => i + 1).map(table => (
                  <div key={table} className="flex flex-col items-center gap-2">
                    <span
                      onClick={() => toggleTable(table)}
                      className="text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-900 transition-colors"
                    >
                      {table}
                    </span>
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(table)}
                      onChange={() => toggleTable(table)}
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: '#1e3a8a' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center my-6">
              <div style={{ width: '80%', height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>

            {/* Layout Mode + Questions — single row */}
            <div className="flex justify-center items-center gap-8 mb-6 flex-wrap">

              {/* Layout mode */}
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold" style={{ color: '#000000' }}>Layout:</span>
                <div className="flex rounded-lg overflow-hidden border-2 border-gray-200">
                  <button
                    onClick={() => setLayoutMode('list')}
                    className={`px-4 py-2 text-sm font-bold transition-all ${
                      layoutMode === 'list' ? 'bg-blue-900 text-white' : 'bg-white text-gray-500 hover:text-blue-900'
                    }`}
                  >
                    No Cells
                  </button>
                  <button
                    onClick={() => {
                      setLayoutMode('cells');
                      if (numQuestions > 45) setNumQuestions(45);
                    }}
                    className={`px-4 py-2 text-sm font-bold border-l-2 border-gray-200 transition-all ${
                      layoutMode === 'cells' ? 'bg-blue-900 text-white' : 'bg-white text-gray-500 hover:text-blue-900'
                    }`}
                  >
                    Cells
                  </button>
                </div>
              </div>

              {/* Number of questions */}
              <div className="flex items-center gap-3">
                <label className="text-lg font-semibold" style={{ color: '#000000' }}>
                  {layoutMode === 'cells' ? 'Cells (21–45):' : 'Questions (21–60):'}
                </label>
                <input
                  type="number"
                  min={21}
                  max={maxQ}
                  value={numQuestions}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 21;
                    if (val >= 21 && val <= maxQ) {
                      setNumQuestions(val);
                      setError('');
                    } else {
                      setError(`Please enter a number between 21 and ${maxQ}`);
                    }
                  }}
                  className="w-24 px-4 py-2 border-2 border-gray-300 rounded-lg text-lg"
                />
              </div>
            </div>

            {/* Error */}
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
                disabled={selectedTables.length === 0 || !hasQuestionType}
                className={`px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 transition-all ${
                  selectedTables.length === 0 || !hasQuestionType
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-900 text-white hover:bg-blue-800 shadow-xl'
                }`}
              >
                <Eye size={24} />
                Generate Example
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={selectedTables.length === 0 || !hasQuestionType}
                className={`px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 transition-all ${
                  selectedTables.length === 0 || !hasQuestionType
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-900 text-white hover:bg-blue-800 shadow-xl'
                }`}
              >
                <Download size={24} />
                Generate PDF
              </button>
            </div>
          </div>

          {/* Example Questions */}
          {previewQuestions.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-bold text-center mb-6" style={{ color: '#000000' }}>
                Question Example
              </h2>
              <div className="grid grid-cols-3 gap-6">
                {previewQuestions.slice(0, 12).map((q, idx) => (
                  <div key={idx}>
                    <span className="text-xl font-semibold" style={{ color: '#000000' }}>
                      {idx + 1}. {q.question}
                    </span>
                  </div>
                ))}
              </div>
              {previewQuestions.length > 12 && (
                <p className="text-center mt-6 text-gray-700 font-semibold text-lg">
                  ...plus {previewQuestions.length - 12} more questions
                </p>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>How it works:</h3>
            <ul className="space-y-2 text-gray-700">
              {[
                'Select which times tables you want to practice (1–20).',
                'Choose from Multiply (3 × 7 = ___), Divide (21 ÷ 7 = ___), or Missing Factor (3 × ___ = 21 / ___ ÷ 7 = 3). Any combination can be active.',
                'Toggle between TT First and TT Last to control which factor appears on the left in multiply questions.',
                '"No Cells" produces a numbered list (21–60 questions). "Cells" produces a bordered grid (21–45 cells).',
                'Click "Generate Example" to preview up to 12 questions on screen.',
                'Click "Generate PDF" to open a print-ready worksheet with questions on page 1 and answers on page 2.',
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-900 font-bold">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </>
  );
}
