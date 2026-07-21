import { Fragment, useState, useEffect, useRef } from 'react';
import { Download, Home, Eye, RefreshCw, ChevronDown } from 'lucide-react';

const TOOL_CONFIG = {
  pageTitle: 'Times Tables Generator',
};

type LayoutMode = 'list' | 'cells';

type Question = {
  question: string; // full string including ___ for the blank
  answer: number;
  missing?: boolean; // true = missing-factor format
  key: string;       // canonical identity — commutative/duplicate questions share a key
};

// ── QUESTION GENERATION ───────────────────────────────────────────────────────

const shuffle = <T,>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Build the standard and missing-factor question pools with duplicate questions
// removed. Two questions are treated as "the same" when they test an identical
// task, even if the operands are written in a different order:
//   • Missing multiply — the known factor + product fix the answer, so
//     `4 × ___ = 12` and `___ × 4 = 12` are one question (commutative blank).
//   • Missing/standard divide — the tt/other swap produces byte-identical
//     strings (`12 ÷ 3` twice, `___ ÷ 3 = 4` twice), collapsed to one.
// Two optional toggles:
//   • excludeOnes — drop the trivial ×1 / ÷1 facts (e.g. `___ × 1 = 12`).
//   • suppressCommutative — treat standard multiply `3 × 4` and `4 × 3` as one
//     question. (Missing multiply always collapses its commutative pair; this
//     only controls the standard-format ordering.)
const buildPools = (
  selectedTables: number[],
  includeMultiply: boolean,
  includeDivide: boolean,
  excludeOnes: boolean,
  suppressCommutative: boolean
): { standardPool: Question[]; missingPool: Question[] } => {
  const standardPool: Question[] = [];
  const missingPool: Question[] = [];
  const stdSeen = new Set<string>();
  const misSeen = new Set<string>();

  const addStd = (q: Question) => { if (!stdSeen.has(q.key)) { stdSeen.add(q.key); standardPool.push(q); } };
  const addMis = (q: Question) => { if (!misSeen.has(q.key)) { misSeen.add(q.key); missingPool.push(q); } };

  selectedTables.forEach(tt => {
    for (let other = 1; other <= 12; other++) {
      if (excludeOnes && (tt === 1 || other === 1)) continue;
      const product = tt * other;

      if (includeMultiply) {
        const stdMulKey = suppressCommutative
          ? `sm|${Math.min(tt, other)}|${Math.max(tt, other)}`
          : `sm|${tt}|${other}`;
        addStd({ question: `${tt} × ${other} = ___`, answer: product, key: stdMulKey });
        addMis({ question: `${tt} × ___ = ${product}`, answer: other, missing: true, key: `mm|${tt}|${product}` });
        addMis({ question: `___ × ${other} = ${product}`, answer: tt, missing: true, key: `mm|${other}|${product}` });
      }
      if (includeDivide) {
        addStd({ question: `${product} ÷ ${tt} = ___`, answer: other, key: `sd|${product}|${tt}` });
        addMis({ question: `___ ÷ ${tt} = ${other}`, answer: product, missing: true, key: `md|${tt}|${other}` });
        if (other !== tt) {
          addStd({ question: `${product} ÷ ${other} = ___`, answer: tt, key: `sd|${product}|${other}` });
          addMis({ question: `___ ÷ ${other} = ${tt}`, answer: product, missing: true, key: `md|${other}|${tt}` });
        }
      }
    }
  });

  return { standardPool, missingPool };
};

const generateQuestions = (
  selectedTables: number[],
  numQuestions: number,
  includeMultiply: boolean,
  includeDivide: boolean,
  includeStandard: boolean,
  includeMissingFactor: boolean,
  missingPct: number,        // % of questions in missing-factor format (both formats on)
  separateSections: boolean, // true = standard block first, then missing factors
  excludeOnes: boolean,
  suppressCommutative: boolean
): Question[] => {
  const { standardPool, missingPool } = buildPools(selectedTables, includeMultiply, includeDivide, excludeOnes, suppressCommutative);

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
  const [excludeOnes, setExcludeOnes] = useState<boolean>(false);
  const [suppressCommutative, setSuppressCommutative] = useState<boolean>(true);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('list');
  const [error, setError] = useState<string>('');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);

  // Close the Question Options popover on an outside click.
  const optionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!optionsOpen) return;
    const h = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) setOptionsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [optionsOpen]);

  // ── Reusable pill controls (matching the Maths Skills generator) ────────────
  const SectionLabel = ({ children }: { children: string }) => (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{children}</p>
  );

  const PillToggle = ({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
        active
          ? 'bg-blue-900 border-blue-900 text-white'
          : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900'
      }`}
    >
      {label}
    </button>
  );

  // Switch-style toggle used inside the Question Options popover (matches the
  // standard tool's QO menu).
  const TogglePill = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center gap-3 cursor-pointer py-1">
      <div
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${checked ? 'bg-blue-900' : 'bg-gray-300'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
      </div>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
    </label>
  );

  const maxQ = layoutMode === 'cells' ? 45 : 60;
  const hasOperation = includeMultiply || includeDivide;
  const hasFormat = includeStandard || includeMissingFactor;
  const bothFormats = includeStandard && includeMissingFactor;

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
    generateQuestions(selectedTables, numQuestions, includeMultiply, includeDivide, includeStandard, includeMissingFactor, missingPct, separateSections, excludeOnes, suppressCommutative);

  const handleGeneratePreview = (): void => {
    if (!validate()) return;
    setPreviewQuestions(getQuestions());
    setError('');
  };

  // Refresh a single preview question — replace it with a fresh one of the same
  // format (standard vs missing) that isn't already on the sheet.
  const regenPreviewQuestion = (idx: number): void => {
    setPreviewQuestions(prev => {
      const target = prev[idx];
      if (!target) return prev;
      const { standardPool, missingPool } = buildPools(selectedTables, includeMultiply, includeDivide, excludeOnes, suppressCommutative);
      const pool = target.missing ? missingPool : standardPool;
      const usedKeys = new Set(prev.map(q => q.key));
      const candidates = pool.filter(q => !usedKeys.has(q.key));
      if (candidates.length === 0) return prev; // no unused question available
      const replacement = candidates[Math.floor(Math.random() * candidates.length)];
      return prev.map((q, i) => (i === idx ? replacement : q));
    });
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
      <div style={{ backgroundColor: '#1e3a8a' }}>
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <button onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} />
            <span className="font-semibold text-lg">Home</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f3f0' }}>
        <div className="max-w-3xl mx-auto">

          <h1 className="text-5xl font-bold text-center mb-2" style={{ color: '#000000' }}>
            {TOOL_CONFIG.pageTitle}
          </h1>
          <p className="text-center text-gray-500 mb-6">Build a custom times tables worksheet, then export it to PDF</p>

          {/* Question setup */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">

            {/* Operations + Format */}
            <div className="grid sm:grid-cols-2 gap-6 mb-5">
              <div>
                <SectionLabel>Operations</SectionLabel>
                <div className="flex gap-2">
                  <PillToggle label="× Multiply" active={includeMultiply} onToggle={() => setIncludeMultiply(v => !v)} />
                  <PillToggle label="÷ Divide" active={includeDivide} onToggle={() => setIncludeDivide(v => !v)} />
                </div>
              </div>
              <div>
                <SectionLabel>Question format</SectionLabel>
                <div className="flex gap-2">
                  <PillToggle label="Standard" active={includeStandard} onToggle={() => setIncludeStandard(v => !v)} />
                  <PillToggle label="Missing factor" active={includeMissingFactor} onToggle={() => setIncludeMissingFactor(v => !v)} />
                </div>
              </div>
            </div>

            {/* Question Options menu — matches the standard tool's QO popover */}
            <div className="relative" ref={optionsRef}>
              <button
                onClick={() => setOptionsOpen(o => !o)}
                className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-colors shadow-sm flex items-center gap-2 ${
                  optionsOpen
                    ? 'bg-blue-900 border-blue-900 text-white'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900'
                }`}
              >
                Question Options
                <ChevronDown size={18} style={{ transition: 'transform 0.2s', transform: optionsOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>
              {optionsOpen && (
                <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-[22rem] p-5 flex flex-col gap-5">

                  {/* Missing factor split — only relevant when both formats are on */}
                  {bothFormats && (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Missing factor split</span>
                      <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
                        <button
                          onClick={() => setSeparateSections(false)}
                          className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${!separateSections ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >Mixed in</button>
                        <button
                          onClick={() => setSeparateSections(true)}
                          className={`flex-1 px-3 py-2 text-sm font-bold transition-colors border-l-2 border-gray-200 ${separateSections ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >Separate section</button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          min={5}
                          max={95}
                          step={5}
                          value={pctInput}
                          onChange={e => setPctInput(e.target.value)}
                          onBlur={commitPctInput}
                          className="w-16 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-sm font-bold text-gray-800 text-center focus:outline-none focus:border-blue-900"
                        />
                        <span className="text-xs font-bold text-gray-500">% missing factor</span>
                      </div>
                    </div>
                  )}

                  {/* Extra options */}
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
                    <TogglePill
                      label="Exclude × 1 / ÷ 1 facts"
                      checked={excludeOnes}
                      onChange={setExcludeOnes}
                    />
                    {includeMultiply && (
                      <TogglePill
                        label="Suppress 4×5 / 5×4 duplicates"
                        checked={suppressCommutative}
                        onChange={setSuppressCommutative}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Times tables */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Times tables</SectionLabel>
              <div className="flex gap-2">
                <button onClick={selectAll} className="px-3 py-1 rounded-full text-xs font-bold border-2 border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:text-blue-900 transition-all">
                  All
                </button>
                <button onClick={selectNone} className="px-3 py-1 rounded-full text-xs font-bold border-2 border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:text-blue-900 transition-all">
                  None
                </button>
              </div>
            </div>
            <div className="grid grid-cols-10 gap-2">
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

          {/* Toolbar — layout + questions */}
          <div className="bg-white rounded-2xl shadow-lg mb-6 px-6 py-4 flex items-center gap-4 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Layout</label>
              <div className="flex rounded-lg overflow-hidden border-2 border-gray-200">
                <button
                  onClick={() => setLayoutAndClamp('list')}
                  className={`px-3 py-1.5 text-sm font-bold transition-all ${layoutMode === 'list' ? 'bg-blue-900 text-white' : 'bg-white text-gray-500 hover:text-blue-900'}`}
                >No cells</button>
                <button
                  onClick={() => setLayoutAndClamp('cells')}
                  className={`px-3 py-1.5 text-sm font-bold transition-all border-l-2 border-gray-200 ${layoutMode === 'cells' ? 'bg-blue-900 text-white' : 'bg-white text-gray-500 hover:text-blue-900'}`}
                >Cells</button>
              </div>
            </div>

            <div className="w-px self-stretch bg-gray-200 flex-shrink-0" />

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Questions</label>
              <input
                type="number"
                min={21}
                max={maxQ}
                value={qInput}
                onChange={e => setQInput(e.target.value)}
                onBlur={commitQInput}
                className="w-16 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-sm font-bold text-gray-800 text-center focus:outline-none focus:border-blue-900"
              />
              <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">max {maxQ}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border-2 border-red-400 rounded-xl text-red-700 font-semibold text-sm text-center">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleGeneratePreview}
              disabled={!canGenerate}
              className={`flex-1 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                !canGenerate
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-2 border-blue-900 text-blue-900 hover:bg-blue-50 shadow-sm'}`}
            >
              <Eye size={20} /> Preview
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={!canGenerate}
              className={`flex-1 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                !canGenerate
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-900 text-white hover:bg-blue-800 shadow-lg'}`}
            >
              <Download size={20} /> Generate PDF
            </button>
          </div>

          {/* Preview */}
          {previewQuestions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-lg font-bold" style={{ color: '#000000' }}>
                  Preview — {previewQuestions.length} questions
                </h2>
              </div>
              <p className="text-sm text-gray-400 mb-4 font-semibold flex items-center gap-1">
                Hover a question and click <RefreshCw size={13} className="inline" /> to swap it for a new one
              </p>
              <div className="grid grid-cols-3 gap-2">
                {previewQuestions.map((q, idx) => (
                  <Fragment key={q.key}>
                    {separateSections && bothFormats && q.missing && idx > 0 && !previewQuestions[idx - 1].missing && (
                      <div className="col-span-3 w-3/5 mx-auto border-b border-gray-300 my-1" />
                    )}
                    <div className="group relative p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                      <span className="text-sm font-semibold text-gray-800 pr-5 block">
                        {idx + 1}. {q.question}
                      </span>
                      <button
                        onClick={() => regenPreviewQuestion(idx)}
                        title="Refresh this question"
                        className="absolute top-2 right-2 p-1 rounded text-gray-300 hover:text-blue-900 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <RefreshCw size={13} />
                      </button>
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">How it works</h3>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {[
                'Pick one or both operations (× and/or ÷), then choose your question format — Standard (answer at the end) or Missing Factor (gap in the middle), or both together.',
                'With both formats on, set what percentage of questions are missing factor, and choose whether they are mixed in or grouped into a separate section below a divider line.',
                'Use Exclude × 1 / ÷ 1 to drop the trivial one-times-table facts, and Suppress duplicates so 4 × 5 and 5 × 4 are never both included.',
                'Select which times tables to include from 1–20.',
                '"No cells" generates a numbered list (21–60 questions). "Cells" generates a bordered grid (21–45 cells).',
                'Preview shows the full worksheet — hover any question and click the refresh icon to swap just that one. Generate PDF opens a printable worksheet with an answer key on the second page.',
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




