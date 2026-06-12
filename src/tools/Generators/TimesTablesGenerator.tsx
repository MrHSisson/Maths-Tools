import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Home, Menu, X, Eye } from 'lucide-react';

const TOOL_CONFIG = {
  pageTitle: 'Times Tables Generator',
};

type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';
type LayoutMode = 'list' | 'cells';

type Question = {
  question: string; // full string including ___ for the blank
  answer: number;
  missing?: boolean; // true = missing-factor format
};

// ── QUESTION GENERATION ───────────────────────────────────────────────────────

const shuffle = <T,>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const generateQuestions = (
  selectedTables: number[],
  numQuestions: number,
  includeMultiply: boolean,
  includeDivide: boolean,
  includeStandard: boolean,
  includeMissingFactor: boolean,
  missingPct: number,        // % of questions in missing-factor format (both formats on)
  separateSections: boolean  // true = standard block first, then missing factors
): Question[] => {
  const standardPool: Question[] = [];
  const missingPool: Question[] = [];

  selectedTables.forEach(tt => {
    for (let other = 1; other <= 12; other++) {
      const product = tt * other;

      if (includeMultiply) {
        standardPool.push({ question: `${tt} × ${other} = ___`, answer: product });
        missingPool.push({ question: `${tt} × ___ = ${product}`, answer: other, missing: true });
        missingPool.push({ question: `___ × ${other} = ${product}`, answer: tt, missing: true });
      }
      if (includeDivide) {
        standardPool.push({ question: `${product} ÷ ${tt} = ___`, answer: other });
        missingPool.push({ question: `___ ÷ ${tt} = ${other}`, answer: product, missing: true });
        if (other !== tt) {
          standardPool.push({ question: `${product} ÷ ${other} = ___`, answer: tt });
          missingPool.push({ question: `___ ÷ ${other} = ${tt}`, answer: product, missing: true });
        }
      }
    }
  });

  shuffle(standardPool);
  shuffle(missingPool);

  if (!includeMissingFactor) return standardPool.slice(0, numQuestions);
  if (!includeStandard) return missingPool.slice(0, numQuestions);

  // Both formats — honour the requested split, topping up from the other
  // pool if one runs short of questions.
  let missingCount = Math.round((numQuestions * missingPct) / 100);
  missingCount = Math.min(missingCount, missingPool.length);
  let standardCount = Math.min(numQuestions - missingCount, standardPool.length);
  missingCount = Math.min(numQuestions - standardCount, missingPool.length);

  const standard = standardPool.slice(0, standardCount);
  const missing = missingPool.slice(0, missingCount);

  return separateSections ? [...standard, ...missing] : shuffle([...standard, ...missing]);
};

// ── CELLS PDF ─────────────────────────────────────────────────────────────────

function handlePrintCells(questions: Question[], separate = false) {
  const MARGIN_MM = 12;
  const HEADER_MM = 16;
  const GAP_MM = 1.5;
  const DIV_MM = 4; // vertical space taken by the section divider line
  const PAGE_H_MM = 297 - MARGIN_MM * 2;
  const PAGE_W_MM = 210 - MARGIN_MM * 2;
  const COLS = 3;
  const totalQ = questions.length;
  // Section headings only apply when both formats are present in separate blocks.
  const firstMissing = questions.findIndex(q => q.missing);
  const hasSections = separate && firstMissing > 0;
  const stdQs = hasSections ? questions.slice(0, firstMissing) : questions;
  const misQs = hasSections ? questions.slice(firstMissing) : [];
  const rows = hasSections
    ? Math.ceil(stdQs.length / COLS) + Math.ceil(misQs.length / COLS)
    : Math.ceil(totalQ / COLS);
  const usableH = PAGE_H_MM - HEADER_MM - (hasSections ? DIV_MM + GAP_MM : 0);
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
    const gridOf = (qs: Question[], offset: number): string => {
      const cells = qs
        .map((_q, i) => `<div class="cell" style="width:${cellW_MM}mm;height:${cellH_MM}mm;">${qHtml(offset + i, showAnswer)}</div>`)
        .join('');
      return `<div class="grid" style="grid-template-columns:repeat(${COLS},${cellW_MM}mm);">${cells}</div>`;
    };
    if (!hasSections) return gridOf(questions, 0);
    return `${gridOf(stdQs, 0)}<div class="divider"></div>${gridOf(misQs, firstMissing)}`;
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
  .grid { display:grid; gap:${GAP_MM}mm; margin-bottom:${GAP_MM}mm; }
  .divider { width:60%; margin:${(DIV_MM - 0.3) / 2}mm auto; border-top:0.3mm solid #d1d5db; }
  .cell {
    border:0.3mm solid #000; border-radius:3mm;
    overflow:hidden; display:flex; align-items:stretch; justify-content:flex-start;
  }
  .qbody { padding:2mm; flex:1; font-size:${FONT_PX}px; line-height:1.4; text-align:center; }
  .qbody-ans { display:flex; flex-direction:column; justify-content:space-between; align-items:center; padding:2mm; flex:1; }
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

// ── LIST ("No Cells") PDF ─────────────────────────────────────────────────────

function handlePrintList(questions: Question[], separate = false) {
  // Answers render inline where the blank was, in the same bold green as the
  // cells layout — important for missing-factor questions where the answer
  // sits mid-expression.
  const answerHtml = (q: Question): string => {
    const [before, after] = q.question.split('___');
    return `${before}<span class="ans">${q.answer}</span>${after ?? ''}`;
  };

  // Section headings only apply when both formats are present in separate blocks.
  const firstMissing = questions.findIndex(q => q.missing);
  const hasSections = separate && firstMissing > 0;

  const buildPage = (showAnswer: boolean): string => {
    const title = showAnswer ? 'Answer Key' : 'Times Tables Quiz';
    const listOf = (qs: Question[]): string =>
      `<div class="list">${qs.map(q => `<div class="q">${showAnswer ? answerHtml(q) : q.question}</div>`).join('')}</div>`;
    const items = hasSections
      ? `${listOf(questions.slice(0, firstMissing))}<div class="divider"></div>${listOf(questions.slice(firstMissing))}`
      : listOf(questions);
    return `<div class="page">
      <h1>${title}</h1>
      ${showAnswer ? '' : '<div class="name">Name: ________________________________</div>'}
      ${items}
      <div class="footer">Times Tables Generator</div>
    </div>`;
  };

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Times Tables Quiz</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size:A4 portrait; margin:14mm 20mm; }
  body { font-family:Helvetica,Arial,sans-serif; background:#fff; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  .page { width:170mm; height:269mm; position:relative; page-break-after:always; }
  .page:last-child { page-break-after:auto; }
  h1 { font-size:7mm; font-weight:700; text-align:center; }
  .name { font-size:3.9mm; margin-top:6mm; }
  .list { display:grid; grid-template-columns:repeat(3,1fr); column-gap:4mm; margin-top:7mm; }
  .q { font-size:4.6mm; height:11.5mm; white-space:nowrap; }
  .divider { width:60%; margin:0 auto 6mm; border-top:0.3mm solid #d1d5db; }
  .divider + .list { margin-top:0; }
  .ans { color:#059669; font-weight:700; text-decoration:underline; text-decoration-thickness:0.4mm; text-underline-offset:0.8mm; }
  .footer { position:absolute; bottom:0; left:0; right:0; text-align:center; font-size:2.5mm; color:#646464; }
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
  const [qInput, setQInput] = useState<string>('40');
  const [includeMultiply, setIncludeMultiply] = useState<boolean>(true);
  const [includeDivide, setIncludeDivide] = useState<boolean>(false);
  const [includeStandard, setIncludeStandard] = useState<boolean>(true);
  const [includeMissingFactor, setIncludeMissingFactor] = useState<boolean>(false);
  const [missingPct, setMissingPct] = useState<number>(50);
  const [pctInput, setPctInput] = useState<string>('50');
  const [separateSections, setSeparateSections] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('list');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  const Pill = ({ label, sub, active, onClick }: {
    label: string; sub?: string; active: boolean; onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-lg font-bold text-base border-2 transition-all text-center ${
        active
          ? 'bg-blue-900 border-blue-900 text-white'
          : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900'
      }`}
    >
      {label}
      {sub && <span className={`block text-xs font-normal mt-0.5 ${active ? 'text-blue-200' : 'text-gray-400'}`}>{sub}</span>}
    </button>
  );

  const SectionLabel = ({ children }: { children: string }) => (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">{children}</p>
  );

  const maxQ = layoutMode === 'cells' ? 45 : 60;
  const hasOperation = includeMultiply || includeDivide;
  const hasFormat = includeStandard || includeMissingFactor;

  const commitQInput = () => {
    const parsed = parseInt(qInput);
    const clamped = isNaN(parsed) ? 21 : Math.min(maxQ, Math.max(21, parsed));
    setNumQuestions(clamped);
    setQInput(String(clamped));
  };

  const commitPctInput = () => {
    const parsed = parseInt(pctInput);
    const clamped = isNaN(parsed) ? 50 : Math.min(95, Math.max(5, parsed));
    setMissingPct(clamped);
    setPctInput(String(clamped));
  };

  const bothFormats = includeStandard && includeMissingFactor;

  const setLayoutAndClamp = (mode: LayoutMode) => {
    setLayoutMode(mode);
    if (mode === 'cells' && numQuestions > 45) {
      setNumQuestions(45);
      setQInput('45');
    }
  };

  const toggleTable = (table: number): void => {
    setSelectedTables(prev =>
      prev.includes(table)
        ? prev.filter(t => t !== table)
        : [...prev, table].sort((a, b) => a - b)
    );
    setError('');
  };

  const selectAll = () => setSelectedTables(Array.from({ length: 20 }, (_, i) => i + 1));
  const selectNone = () => setSelectedTables([]);

  const validate = (): boolean => {
    if (selectedTables.length === 0) { setError('Please select at least one times table.'); return false; }
    if (!hasOperation) { setError('Please select at least one operation (× or ÷).'); return false; }
    if (!hasFormat) { setError('Please select at least one question format (Standard or Missing Factor).'); return false; }
    return true;
  };

  const getQuestions = (): Question[] =>
    generateQuestions(selectedTables, numQuestions, includeMultiply, includeDivide, includeStandard, includeMissingFactor, missingPct, separateSections);

  const handleGeneratePreview = (): void => {
    if (!validate()) return;
    setPreviewQuestions(getQuestions());
    setError('');
  };

  const handleGeneratePDF = (): void => {
    if (!validate()) return;
    const questions = previewQuestions.length > 0 ? previewQuestions : getQuestions();

    const separate = separateSections && bothFormats;
    if (layoutMode === 'cells') {
      handlePrintCells(questions, separate);
    } else {
      handlePrintList(questions, separate);
    }
    setError('');
  };

  const canGenerate = selectedTables.length > 0 && hasOperation && hasFormat;

  return (
    <>
      {/* Header */}
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
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border-2 border-gray-200 overflow-hidden z-50">
                <div className="py-2">
                  <div className="px-5 py-2 font-bold text-gray-400 text-xs uppercase tracking-widest">Colour Scheme</div>
                  {(['default', 'blue', 'pink', 'yellow'] as const).map(scheme => (
                    <button
                      key={scheme}
                      onClick={() => { setColorScheme(scheme); setIsMenuOpen(false); }}
                      className={`w-full text-left px-5 py-2.5 font-semibold transition-colors text-sm ${
                        colorScheme === scheme ? 'bg-blue-50 text-blue-900' : 'text-gray-700 hover:bg-gray-50'
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

      {/* Main */}
      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f3f0' }}>
        <div className="max-w-5xl mx-auto">

          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>
            {TOOL_CONFIG.pageTitle}
          </h1>

          {/* Control Panel */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-center mb-6" style={{ color: '#000000' }}>Customisation Options</h2>

            {/* Operations + Format — two columns */}
            <div className="flex justify-center gap-12 mb-7 flex-wrap">

              {/* Operations */}
              <div className="flex flex-col items-center">
                <SectionLabel>Operations</SectionLabel>
                <div className="flex gap-2">
                  <Pill
                    label="× Multiply"
                    active={includeMultiply}
                    onClick={() => setIncludeMultiply(v => !v)}
                  />
                  <Pill
                    label="÷ Divide"
                    active={includeDivide}
                    onClick={() => setIncludeDivide(v => !v)}
                  />
                </div>
              </div>

              {/* Question Format */}
              <div className="flex flex-col items-center">
                <SectionLabel>Question Format</SectionLabel>
                <div className="flex gap-2">
                  <Pill
                    label="Standard"
                    active={includeStandard}
                    onClick={() => setIncludeStandard(v => !v)}
                  />
                  <Pill
                    label="Missing Factor"
                    active={includeMissingFactor}
                    onClick={() => setIncludeMissingFactor(v => !v)}
                  />
                </div>
              </div>

              {/* Missing factor split — only when both formats are on */}
              {bothFormats && (
                <div className="flex flex-col items-center">
                  <SectionLabel>Missing Factor Split</SectionLabel>
                  <div className="flex gap-2 items-center">
                    <Pill
                      label="Mixed In"
                      active={!separateSections}
                      onClick={() => setSeparateSections(false)}
                    />
                    <Pill
                      label="Separate Section"
                      active={separateSections}
                      onClick={() => setSeparateSections(true)}
                    />
                    <div className="flex items-center gap-1.5 ml-2">
                      <input
                        type="number"
                        min={5}
                        max={95}
                        step={5}
                        value={pctInput}
                        onChange={e => setPctInput(e.target.value)}
                        onBlur={commitPctInput}
                        className="w-20 px-3 py-2.5 border-2 border-gray-200 rounded-lg text-base font-bold text-gray-800 text-center focus:outline-none focus:border-blue-900"
                      />
                      <span className="text-sm font-bold text-gray-500">% missing factor</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Times Tables Selection */}
            <div className="mb-7">
              <div className="flex justify-center items-center gap-4 mb-4">
                <SectionLabel>Select Times Tables</SectionLabel>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:text-blue-900 transition-all">
                    All
                  </button>
                  <button onClick={selectNone} className="px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:text-blue-900 transition-all">
                    None
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-10 gap-3 max-w-3xl mx-auto">
                {Array.from({ length: 20 }, (_, i) => i + 1).map(table => (
                  <button
                    key={table}
                    onClick={() => toggleTable(table)}
                    className={`py-2 rounded-lg font-bold text-sm border-2 transition-all ${
                      selectedTables.includes(table)
                        ? 'bg-blue-900 border-blue-900 text-white'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900'
                    }`}
                  >
                    {table}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center mb-7">
              <div style={{ width: '85%', height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>

            {/* Layout + Questions */}
            <div className="flex justify-center items-start gap-10 mb-6 flex-wrap">

              <div className="flex flex-col items-center gap-2">
                <SectionLabel>Layout</SectionLabel>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLayoutAndClamp('list')}
                    className={`px-5 py-2.5 rounded-lg font-bold text-base border-2 transition-all ${
                      layoutMode === 'list'
                        ? 'bg-blue-900 border-blue-900 text-white'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900'
                    }`}
                  >
                    No Cells
                  </button>
                  <button
                    onClick={() => setLayoutAndClamp('cells')}
                    className={`px-5 py-2.5 rounded-lg font-bold text-base border-2 transition-all ${
                      layoutMode === 'cells'
                        ? 'bg-blue-900 border-blue-900 text-white'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900'
                    }`}
                  >
                    Cells
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <SectionLabel>Questions</SectionLabel>
                <input
                  type="number"
                  min={21}
                  max={maxQ}
                  value={qInput}
                  onChange={e => setQInput(e.target.value)}
                  onBlur={commitQInput}
                  className="w-24 px-4 py-2.5 border-2 border-gray-200 rounded-lg text-base font-bold text-gray-800 text-center focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex justify-center mb-4">
                <div className="px-4 py-2 bg-red-50 border-2 border-red-400 rounded-lg text-red-700 font-semibold text-sm">
                  {error}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleGeneratePreview}
                disabled={!canGenerate}
                className={`px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 transition-all ${
                  !canGenerate
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-2 border-blue-900 text-blue-900 hover:bg-blue-50 shadow-sm'
                }`}
              >
                <Eye size={22} />
                Generate Example
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={!canGenerate}
                className={`px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 transition-all ${
                  !canGenerate
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-900 text-white hover:bg-blue-800 shadow-lg'
                }`}
              >
                <Download size={22} />
                Generate PDF
              </button>
            </div>
          </div>

          {/* Preview */}
          {previewQuestions.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-center mb-6" style={{ color: '#000000' }}>
                Question Example
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {previewQuestions.slice(0, 12).map((q, idx) => (
                  <Fragment key={idx}>
                    {separateSections && bothFormats && q.missing && idx > 0 && !previewQuestions[idx - 1].missing && (
                      <div className="col-span-3 w-3/5 mx-auto border-b border-gray-300 my-1" />
                    )}
                    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                      <span className="text-lg font-semibold" style={{ color: '#000000' }}>
                        {idx + 1}. {q.question}
                      </span>
                    </div>
                  </Fragment>
                ))}
              </div>
              {previewQuestions.length > 12 && (
                <p className="text-center mt-5 text-gray-500 font-semibold">
                  …plus {previewQuestions.length - 12} more questions
                </p>
              )}
            </div>
          )}

          {/* Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>How it works</h3>
            <ul className="space-y-2 text-gray-600">
              {[
                'Pick one or both operations (× and/or ÷), then choose your question format — Standard (answer at the end) or Missing Factor (gap in the middle), or both together.',
                'With both formats on, set what percentage of questions are missing factor, and choose whether they are mixed in or grouped into a separate section below a divider line.',
                'Select which times tables to include from 1–20.',
                '"No Cells" generates a numbered list (21–60 questions). "Cells" generates a bordered grid (21–45 cells).',
                'Generate Example previews a sample on screen. Generate PDF opens a printable worksheet with an answer key on the second page.',
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-900 font-bold mt-0.5">·</span>
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




