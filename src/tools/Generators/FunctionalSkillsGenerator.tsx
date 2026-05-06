import { useState } from 'react';
import { Home, Eye, Download, RefreshCw } from 'lucide-react';

const TOOL_CONFIG = {
  pageTitle: 'Maths Skills Generator',
};

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Question = {
  question: string;
  answer: number | string;
  displayQuestion?: string; // for superscript rendering in preview
  skill?: SkillId; // which skill generated this question
};

type SkillId =
  | 'numberBonds'
  | 'timesTables'
  | 'addition'
  | 'subtraction'
  | 'negatives'
  | 'division'
  | 'busStop'
  | 'indices';

// ─── SKILL CONFIG ─────────────────────────────────────────────────────────────

type NumberBondsConfig = { targets: number[] };
type TimesTablesConfig = { range: 10 | 12 | 20; specificTables: number[]; suppressDuplicates: boolean };
type AdditionConfig = { digitBands: (1 | 2 | 3)[]; allowCarrying: boolean };
type SubtractionConfig = { digitBands: (1 | 2 | 3)[]; requireBorrowing: boolean; noNegativeResults: boolean };
type NegativesConfig = { operations: ('addition' | 'subtraction' | 'multiplication' | 'division')[]; range: 10 | 25 };
type DivisionConfig = { range: 10 | 12 | 20; allowRemainders: boolean };
type BusStopConfig = { type: ('2d1d' | '3d1d')[]; allowRemainders: boolean };
type IndicesConfig = { baseRange: 10 | 15; exponentRange: (2 | 3 | 4)[] };

type SkillConfigs = {
  numberBonds: NumberBondsConfig;
  timesTables: TimesTablesConfig;
  addition: AdditionConfig;
  subtraction: SubtractionConfig;
  negatives: NegativesConfig;
  division: DivisionConfig;
  busStop: BusStopConfig;
  indices: IndicesConfig;
};

// ─── QUESTION GENERATORS ─────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function genNumberBonds(config: NumberBondsConfig): Question[] {
  const pool: Question[] = [];
  for (const target of config.targets) {
    for (let a = 0; a <= target; a++) {
      const b = target - a;
      // standard: a + b = ___
      pool.push({ question: `${a} + ${b} = ___`, answer: target });
      // missing first: __ + b = target
      pool.push({ question: `___ + ${b} = ${target}`, answer: a });
      // missing second: a + __ = target
      pool.push({ question: `${a} + ___ = ${target}`, answer: b });
    }
  }
  return shuffle(pool);
}

function genTimesTables(config: TimesTablesConfig): Question[] {
  const pool: Question[] = [];
  const tables = config.specificTables.length > 0
    ? config.specificTables
    : Array.from({ length: config.range }, (_, i) => i + 1);

  for (const a of tables) {
    for (let b = 1; b <= config.range; b++) {
      const ans = a * b;
      pool.push({ question: `${a} × ${b} = ___`, answer: ans });
      if (!config.suppressDuplicates) {
        pool.push({ question: `${b} × ${a} = ___`, answer: ans });
      }
    }
  }
  return shuffle(pool);
}

function genAddition(config: AdditionConfig): Question[] {
  const pool: Question[] = [];
  for (const band of config.digitBands) {
    const [min, max] = band === 1 ? [1, 9] : band === 2 ? [10, 99] : [100, 999];
    for (let i = 0; i < 200; i++) {
      const a = randInt(min, max);
      const b = randInt(min, max);
      const ans = a + b;
      if (!config.allowCarrying) {
        // skip if any digit column carries
        const aStr = a.toString().padStart(3, '0');
        const bStr = b.toString().padStart(3, '0');
        let carries = false;
        for (let d = 2; d >= 0; d--) {
          if (parseInt(aStr[d]) + parseInt(bStr[d]) >= 10) { carries = true; break; }
        }
        if (carries) continue;
      }
      pool.push({ question: `${a} + ${b} = ___`, answer: ans });
    }
  }
  return shuffle(pool);
}

function genSubtraction(config: SubtractionConfig): Question[] {
  const pool: Question[] = [];
  for (const band of config.digitBands) {
    const [min, max] = band === 1 ? [1, 9] : band === 2 ? [10, 99] : [100, 999];
    for (let i = 0; i < 200; i++) {
      let a = randInt(min, max);
      let b = randInt(min, max);
      if (config.noNegativeResults && b > a) [a, b] = [b, a];
      if (a === b) continue;
      const ans = a - b;

      // detect borrowing
      const aStr = a.toString().padStart(3, '0');
      const bStr = b.toString().padStart(3, '0');
      let needsBorrow = false;
      for (let d = 2; d >= 0; d--) {
        if (parseInt(aStr[d]) < parseInt(bStr[d])) { needsBorrow = true; break; }
      }
      if (config.requireBorrowing && !needsBorrow) continue;

      pool.push({ question: `${a} − ${b} = ___`, answer: ans });
    }
  }
  return shuffle(pool);
}

function genNegatives(config: NegativesConfig): Question[] {
  const pool: Question[] = [];
  const r = config.range;
  for (const op of config.operations) {
    if (op === 'addition' || op === 'subtraction') {
      for (let a = -r; a <= r; a++) {
        for (let b = -r; b <= r; b++) {
          if (a === 0 || b === 0) continue;
          const sym = op === 'addition' ? '+' : '−';
          const ans = op === 'addition' ? a + b : a - b;
          const fmtA = a < 0 ? `(${a})` : `${a}`;
          const fmtB = b < 0 ? `(${b})` : `${b}`;
          pool.push({ question: `${fmtA} ${sym} ${fmtB} = ___`, answer: ans });
        }
      }
    } else if (op === 'multiplication') {
      for (let a = -r; a <= r; a++) {
        for (let b = -r; b <= r; b++) {
          if (a === 0 || b === 0) continue;
          const fmtA = a < 0 ? `(${a})` : `${a}`;
          const fmtB = b < 0 ? `(${b})` : `${b}`;
          pool.push({ question: `${fmtA} × ${fmtB} = ___`, answer: a * b });
        }
      }
    } else if (op === 'division') {
      for (let divisor = 1; divisor <= r; divisor++) {
        for (let quotient = 1; quotient <= r; quotient++) {
          const product = divisor * quotient;
          // pos ÷ neg
          pool.push({ question: `${product} ÷ (${-divisor}) = ___`, answer: -quotient });
          // neg ÷ pos
          pool.push({ question: `(${-product}) ÷ ${divisor} = ___`, answer: -quotient });
          // neg ÷ neg
          pool.push({ question: `(${-product}) ÷ (${-divisor}) = ___`, answer: quotient });
        }
      }
    }
  }
  return shuffle(pool);
}

function genDivision(config: DivisionConfig): Question[] {
  const pool: Question[] = [];
  for (let divisor = 1; divisor <= config.range; divisor++) {
    for (let quotient = 1; quotient <= config.range; quotient++) {
      const dividend = divisor * quotient;
      pool.push({ question: `${dividend} ÷ ${divisor} = ___`, answer: quotient });
    }
  }
  if (config.allowRemainders) {
    for (let i = 0; i < 200; i++) {
      const divisor = randInt(2, config.range);
      const dividend = randInt(divisor + 1, config.range * config.range);
      if (dividend % divisor === 0) continue;
      const q = Math.floor(dividend / divisor);
      const r = dividend % divisor;
      pool.push({ question: `${dividend} ÷ ${divisor} = ___`, answer: `${q} r${r}` });
    }
  }
  return shuffle(pool);
}

function genBusStop(config: BusStopConfig): Question[] {
  const pool: Question[] = [];
  for (const type of config.type) {
    const [minD, maxD] = type === '2d1d' ? [10, 99] : [100, 999];
    for (let i = 0; i < 300; i++) {
      const divisor = randInt(2, 9);
      if (!config.allowRemainders) {
        const quotient = randInt(type === '2d1d' ? 2 : 10, type === '2d1d' ? 9 : 99);
        const dividend = divisor * quotient;
        if (dividend < minD || dividend > maxD) continue;
        pool.push({ question: `${dividend} ÷ ${divisor} = ___`, answer: quotient });
      } else {
        const dividend = randInt(minD, maxD);
        const q = Math.floor(dividend / divisor);
        const r = dividend % divisor;
        if (r === 0) {
          pool.push({ question: `${dividend} ÷ ${divisor} = ___`, answer: q });
        } else {
          pool.push({ question: `${dividend} ÷ ${divisor} = ___`, answer: `${q} r${r}` });
        }
      }
    }
  }
  return shuffle(pool);
}

function genIndices(config: IndicesConfig): Question[] {
  const pool: Question[] = [];
  for (let base = 2; base <= config.baseRange; base++) {
    for (const exp of config.exponentRange) {
      const ans = Math.pow(base, exp);
      const supMap: Record<number, string> = { 2: '²', 3: '³', 4: '⁴' };
      pool.push({
        question: `${base}${supMap[exp]} = ___`,
        answer: ans,
        displayQuestion: `${base}<sup>${exp}</sup> = ___`,
      });
    }
  }
  return shuffle(pool);
}

// ─── MAIN GENERATOR ───────────────────────────────────────────────────────────

function generateQuestions(
  enabledSkills: SkillId[],
  configs: SkillConfigs,
  total: number
): Question[] {
  if (enabledSkills.length === 0) return [];

  const pools: Record<string, Question[]> = {};
  for (const skill of enabledSkills) {
    switch (skill) {
      case 'numberBonds': pools[skill] = genNumberBonds(configs.numberBonds); break;
      case 'timesTables': pools[skill] = genTimesTables(configs.timesTables); break;
      case 'addition':    pools[skill] = genAddition(configs.addition); break;
      case 'subtraction': pools[skill] = genSubtraction(configs.subtraction); break;
      case 'negatives':   pools[skill] = genNegatives(configs.negatives); break;
      case 'division':    pools[skill] = genDivision(configs.division); break;
      case 'busStop':     pools[skill] = genBusStop(configs.busStop); break;
      case 'indices':     pools[skill] = genIndices(configs.indices); break;
    }
  }

  // Equal split, round-robin fill
  const perSkill = Math.floor(total / enabledSkills.length);
  const remainder = total % enabledSkills.length;
  const selected: Question[] = [];

  enabledSkills.forEach((skill, i) => {
    const count = perSkill + (i < remainder ? 1 : 0);
    selected.push(...(pools[skill] || []).slice(0, count));
  });

  return shuffle(selected).slice(0, total);
}

// ─── PDF PRINT ────────────────────────────────────────────────────────────────

function handlePrint(questions: Question[]) {
  const FONT_PX   = 13;
  const PAD_MM    = 1.2;
  const MARGIN_MM = 12;
  const HEADER_MM = 14;
  const GAP_MM    = 1.2;
  const PAGE_H_MM = 297 - MARGIN_MM * 2;
  const PAGE_W_MM = 210 - MARGIN_MM * 2;
  const usableH   = PAGE_H_MM - HEADER_MM;
  const cols      = 3;
  const cellW_MM  = (PAGE_W_MM - GAP_MM * 2) / 3;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const totalQ = questions.length;

  const qHtml = (idx: number, showAnswer: boolean): string => {
    const q = questions[idx];
    const ans = String(q.answer);
    // Replace ___ with answer if showing, otherwise leave
    const display = q.displayQuestion || q.question;
    if (showAnswer) {
      return `<div class="qbody">${display.replace('___', `<strong style="color:#059669">${ans}</strong>`)}</div>`;
    }
    return `<div class="qbody">${display}</div>`;
  };

  const probeHtml = questions.map((_, i) =>
    `<div class="q-inner" id="probe-${i}">${qHtml(i, true)}</div>`
  ).join('');

  const allQ     = questions.map((_, i) => qHtml(i, false));
  const allQAns  = questions.map((_, i) => qHtml(i, true));

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Maths Skills — Worksheet</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size:A4; margin:${MARGIN_MM}mm; }
  body { font-family:"Segoe UI",Arial,sans-serif; background:#fff; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  .page { width:${PAGE_W_MM}mm; height:${PAGE_H_MM}mm; overflow:hidden; page-break-after:always; }
  .page:last-child { page-break-after:auto; }
  .page-header {
    display:flex; justify-content:space-between; align-items:baseline;
    border-bottom:0.4mm solid #1e3a8a; padding-bottom:1.5mm; margin-bottom:2mm;
  }
  .page-header h1 { font-size:5mm; font-weight:700; color:#1e3a8a; }
  .page-header .meta { font-size:3mm; color:#6b7280; }
  .grid { display:grid; gap:${GAP_MM}mm; }
  .cell {
    border:0.3mm solid #000; border-radius:3mm;
    overflow:hidden; display:flex; align-items:stretch; justify-content:flex-start;
  }
  #probe {
    position:fixed; left:-9999px; top:0; visibility:hidden;
    font-family:"Segoe UI",Arial,sans-serif; font-size:${FONT_PX}px; line-height:1.4;
    width:${cellW_MM}mm;
  }
  .q-inner { width:100%; display:flex; flex-direction:column; flex:1; }
  .qbody {
    padding:${PAD_MM}mm; text-align:center; flex:1;
    font-size:${FONT_PX}px; line-height:1.4;
  }
</style>
</head>
<body>
<div id="probe">${probeHtml}</div>
<div id="pages"></div>
<script>
document.addEventListener("DOMContentLoaded", function() {
  var pxPerMm   = 3.7795;
  var PAD_MM    = ${PAD_MM};
  var GAP_MM    = ${GAP_MM};
  var usableH   = ${usableH};
  var PAGE_W_MM = ${PAGE_W_MM};
  var cols      = ${cols};
  var totalQ    = ${totalQ};
  var dateStr   = "${dateStr}";
  var allQ      = ${JSON.stringify(allQ)};
  var allQAns   = ${JSON.stringify(allQAns)};

  var rowHeights = [];
  for (var r = 1; r <= 15; r++) {
    rowHeights.push((usableH - GAP_MM * (r - 1)) / r);
  }

  var probe = document.getElementById("probe");
  var maxH_px = 0;
  probe.querySelectorAll(".q-inner").forEach(function(el) {
    if (el.scrollHeight > maxH_px) maxH_px = el.scrollHeight;
  });
  var maxH_mm = maxH_px / pxPerMm;
  var needed_mm = maxH_mm + PAD_MM * 2 + 6;

  var chosenH_mm = rowHeights[0];
  var rowsPerPage = 1;
  var found = false;
  for (var r = 0; r < rowHeights.length; r++) {
    var capacity = (r + 1) * cols;
    if (capacity >= totalQ && rowHeights[r] >= needed_mm) {
      chosenH_mm = rowHeights[r]; rowsPerPage = r + 1; found = true; break;
    }
  }
  if (!found) {
    for (var r2 = 0; r2 < rowHeights.length; r2++) {
      if (rowHeights[r2] >= needed_mm) { chosenH_mm = rowHeights[r2]; rowsPerPage = r2 + 1; }
    }
  }

  var pageCapacity = rowsPerPage * cols;
  var pages = [];
  for (var s = 0; s < totalQ; s += pageCapacity) pages.push(s);
  var totalPages = pages.length;

  function cW() { return (PAGE_W_MM - GAP_MM * (cols - 1)) / cols; }

  function buildCell(idx, showAnswer, h) {
    var inner = showAnswer ? allQAns[idx] : allQ[idx];
    return '<div class="cell" style="width:' + cW() + 'mm;height:' + h + 'mm;">' + inner + '</div>';
  }

  function buildGrid(start, showAnswer, h) {
    var end = Math.min(start + pageCapacity, totalQ);
    var rows = Math.ceil((end - start) / cols);
    var cells = '';
    for (var i = start; i < end; i++) cells += buildCell(i, showAnswer, h);
    return '<div class="grid" style="grid-template-columns:repeat(' + cols + ',' + cW() + 'mm);grid-template-rows:repeat(' + rows + ',' + h + 'mm);">' + cells + '</div>';
  }

  function buildPage(start, showAnswer, pgIdx) {
    var lbl = totalPages > 1 ? totalQ + ' questions (' + (pgIdx+1) + '/' + totalPages + ')' : totalQ + ' questions';
    var title = showAnswer ? 'Maths Skills — Answers' : 'Maths Skills Worksheet';
    return '<div class="page">'
      + '<div class="page-header"><h1>' + title + '</h1><div class="meta">' + dateStr + ' · ' + lbl + '</div></div>'
      + buildGrid(start, showAnswer, chosenH_mm)
      + '</div>';
  }

  var html = pages.map(function(s, i) { return buildPage(s, false, i); }).join('')
           + pages.map(function(s, i) { return buildPage(s, true,  i); }).join('');
  document.getElementById("pages").innerHTML = html;
  probe.remove();
  setTimeout(function() { window.print(); }, 300);
});
</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to use the PDF export.'); return; }
  win.document.write(html);
  win.document.close();
}

// ─── SKILL METADATA ───────────────────────────────────────────────────────────

const SKILL_META: Record<SkillId, { label: string; description: string }> = {
  numberBonds:  { label: 'Number Bonds',    description: 'Pairs that sum to a target' },
  timesTables:  { label: 'Times Tables',    description: 'Multiplication facts' },
  addition:     { label: 'Addition',        description: 'Column/mental addition' },
  subtraction:  { label: 'Subtraction',     description: 'Column/mental subtraction' },
  negatives:    { label: 'Negatives',       description: 'Operations with negative numbers' },
  division:     { label: 'Division',        description: 'Reverse times tables / division facts' },
  busStop:      { label: 'Bus Stop',        description: 'Long division (2 or 3 digit ÷ 1 digit)' },
  indices:      { label: 'Indices',         description: 'Powers and exponents' },
};

const ALL_SKILLS: SkillId[] = ['numberBonds', 'timesTables', 'addition', 'subtraction', 'negatives', 'division', 'busStop', 'indices'];

// ─── DEFAULT CONFIGS ──────────────────────────────────────────────────────────

const defaultConfigs: SkillConfigs = {
  numberBonds:  { targets: [10] },
  timesTables:  { range: 12, specificTables: [], suppressDuplicates: false },
  addition:     { digitBands: [2], allowCarrying: true },
  subtraction:  { digitBands: [2], requireBorrowing: false, noNegativeResults: true },
  negatives:    { operations: ['addition', 'subtraction'], range: 10 },
  division:     { range: 12, allowRemainders: false },
  busStop:      { type: ['2d1d'], allowRemainders: false },
  indices:      { baseRange: 10, exponentRange: [2, 3] },
};

const MAX_QUESTIONS = 30;

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function MathsSkillsGenerator() {
  const [enabledSkills, setEnabledSkills] = useState<SkillId[]>([]);
  const [skillCounts, setSkillCounts] = useState<Record<SkillId, number>>({
    numberBonds: 5, timesTables: 5, addition: 5, subtraction: 5,
    negatives: 5, division: 5, busStop: 5, indices: 5,
  });
  const [configs, setConfigs] = useState<SkillConfigs>(defaultConfigs);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string>('');
  const [expandedSkill, setExpandedSkill] = useState<SkillId | null>(null);

  const total = enabledSkills.reduce((sum, s) => sum + skillCounts[s], 0);
  const remaining = MAX_QUESTIONS - total;

  const toggleSkill = (skill: SkillId) => {
    setEnabledSkills(prev => {
      if (prev.includes(skill)) {
        if (expandedSkill === skill) setExpandedSkill(null);
        return prev.filter(s => s !== skill);
      }
      // When enabling, auto-assign remaining budget (min 1, max 5 or remaining)
      const budget = Math.max(1, Math.min(5, MAX_QUESTIONS - prev.reduce((s, sk) => s + skillCounts[sk], 0)));
      setSkillCounts(c => ({ ...c, [skill]: budget }));
      return [...prev, skill];
    });
    setError('');
  };

  const adjustCount = (skill: SkillId, delta: number) => {
    setSkillCounts(prev => {
      const next = prev[skill] + delta;
      if (next < 1) return prev;
      if (delta > 0 && total >= MAX_QUESTIONS) return prev;
      return { ...prev, [skill]: next };
    });
  };

  const updateConfig = <K extends SkillId>(skill: K, patch: Partial<SkillConfigs[K]>) => {
    setConfigs(prev => ({ ...prev, [skill]: { ...prev[skill], ...patch } }));
  };

  const getPool = (skill: SkillId): Question[] => {
    let pool: Question[] = [];
    switch (skill) {
      case 'numberBonds':  pool = genNumberBonds(configs.numberBonds); break;
      case 'timesTables':  pool = genTimesTables(configs.timesTables); break;
      case 'addition':     pool = genAddition(configs.addition); break;
      case 'subtraction':  pool = genSubtraction(configs.subtraction); break;
      case 'negatives':    pool = genNegatives(configs.negatives); break;
      case 'division':     pool = genDivision(configs.division); break;
      case 'busStop':      pool = genBusStop(configs.busStop); break;
      case 'indices':      pool = genIndices(configs.indices); break;
    }
    return pool.map(q => ({ ...q, skill }));
  };

  const buildQuestions = () => {
    const allQs: Question[] = [];
    for (const skill of enabledSkills) {
      allQs.push(...getPool(skill).slice(0, skillCounts[skill]));
    }
    return shuffle(allQs);
  };

  const regenQuestion = (idx: number) => {
    const skill = previewQuestions[idx].skill;
    if (!skill) return;
    // Get a fresh pool and pick one that isn't already shown
    const existing = new Set(previewQuestions.map(q => q.question));
    const pool = getPool(skill).filter(q => !existing.has(q.question));
    if (pool.length === 0) return; // pool exhausted, nothing to swap
    const replacement = pool[Math.floor(Math.random() * pool.length)];
    setPreviewQuestions(prev => prev.map((q, i) => i === idx ? replacement : q));
  };

  const handleGeneratePreview = () => {
    if (enabledSkills.length === 0) { setError('Please enable at least one skill.'); return; }
    const qs = buildQuestions();
    if (qs.length === 0) { setError('No questions could be generated with the current settings.'); return; }
    setPreviewQuestions(qs);
    setError('');
  };

  const handleGeneratePDF = () => {
    if (enabledSkills.length === 0) { setError('Please enable at least one skill.'); return; }
    const qs = buildQuestions();
    if (qs.length === 0) { setError('No questions could be generated with the current settings.'); return; }
    handlePrint(qs);
    setError('');
  };

  // ── PILL HELPERS ─────────────────────────────────────────────────────────

  const toggleArr = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  // Multi-select pill group
  const PillMulti = <T extends string | number>({
    label, options, selected, onToggle, format,
  }: {
    label: string;
    options: T[];
    selected: T[];
    onToggle: (v: T) => void;
    format?: (v: T) => string;
  }) => (
    <div className="mb-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button
              key={String(opt)}
              onClick={() => onToggle(opt)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                active
                  ? 'bg-blue-900 border-blue-900 text-white'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900'
              }`}
            >
              {format ? format(opt) : String(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Single-select pill group (radio behaviour)
  const PillSingle = <T extends string | number>({
    label, options, selected, onSelect, format,
  }: {
    label: string;
    options: T[];
    selected: T;
    onSelect: (v: T) => void;
    format?: (v: T) => string;
  }) => (
    <div className="mb-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = selected === opt;
          return (
            <button
              key={String(opt)}
              onClick={() => onSelect(opt)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                active
                  ? 'bg-blue-900 border-blue-900 text-white'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900'
              }`}
            >
              {format ? format(opt) : String(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Toggle pill (single boolean option)
  const PillToggle = ({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
        active
          ? 'bg-blue-900 border-blue-900 text-white'
          : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900'
      }`}
    >
      {label}
    </button>
  );

  // ── SKILL CONFIG PANELS ──────────────────────────────────────────────────

  const renderConfig = (skill: SkillId) => {
    if (expandedSkill !== skill) return null;
    const c = configs;

    const panels: Record<SkillId, JSX.Element> = {
      numberBonds: (
        <PillMulti
          label="Bond targets"
          options={[10, 20, 50, 100]}
          selected={c.numberBonds.targets}
          onToggle={v => updateConfig('numberBonds', { targets: toggleArr(c.numberBonds.targets, v) })}
          format={v => `to ${v}`}
        />
      ),

      timesTables: (
        <>
          <PillSingle
            label="Range"
            options={[10, 12, 20] as const}
            selected={c.timesTables.range}
            onSelect={v => updateConfig('timesTables', { range: v as 10 | 12 | 20, specificTables: [] })}
            format={v => `Up to ${v}×${v}`}
          />
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Specific tables <span className="normal-case font-normal">(leave blank for all)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: c.timesTables.range }, (_, i) => i + 1).map(t => (
                <button
                  key={t}
                  onClick={() => updateConfig('timesTables', { specificTables: toggleArr(c.timesTables.specificTables, t) })}
                  className={`w-9 h-9 rounded-full text-sm font-bold border-2 transition-all ${
                    c.timesTables.specificTables.includes(t)
                      ? 'bg-blue-900 border-blue-900 text-white'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <PillToggle
              label="Suppress duplicates"
              active={c.timesTables.suppressDuplicates}
              onToggle={() => updateConfig('timesTables', { suppressDuplicates: !c.timesTables.suppressDuplicates })}
            />
          </div>
        </>
      ),

      addition: (
        <>
          <PillMulti
            label="Digit size"
            options={[1, 2, 3] as const}
            selected={c.addition.digitBands}
            onToggle={v => updateConfig('addition', { digitBands: toggleArr(c.addition.digitBands, v as 1|2|3) })}
            format={v => `${v}-digit`}
          />
          <div className="flex gap-2">
            <PillToggle
              label="Carrying"
              active={c.addition.allowCarrying}
              onToggle={() => updateConfig('addition', { allowCarrying: !c.addition.allowCarrying })}
            />
          </div>
        </>
      ),

      subtraction: (
        <>
          <PillMulti
            label="Digit size"
            options={[1, 2, 3] as const}
            selected={c.subtraction.digitBands}
            onToggle={v => updateConfig('subtraction', { digitBands: toggleArr(c.subtraction.digitBands, v as 1|2|3) })}
            format={v => `${v}-digit`}
          />
          <div className="flex flex-wrap gap-2">
            <PillToggle
              label="Require borrowing"
              active={c.subtraction.requireBorrowing}
              onToggle={() => updateConfig('subtraction', { requireBorrowing: !c.subtraction.requireBorrowing })}
            />
            <PillToggle
              label="No negative results"
              active={c.subtraction.noNegativeResults}
              onToggle={() => updateConfig('subtraction', { noNegativeResults: !c.subtraction.noNegativeResults })}
            />
          </div>
        </>
      ),

      negatives: (
        <>
          <PillMulti
            label="Operations"
            options={['addition', 'subtraction', 'multiplication', 'division'] as const}
            selected={c.negatives.operations}
            onToggle={v => updateConfig('negatives', { operations: toggleArr(c.negatives.operations, v as any) })}
            format={v => v.charAt(0).toUpperCase() + v.slice(1)}
          />
          <PillSingle
            label="Number range"
            options={[10, 25] as const}
            selected={c.negatives.range}
            onSelect={v => updateConfig('negatives', { range: v as 10 | 25 })}
            format={v => `−${v} to ${v}`}
          />
        </>
      ),

      division: (
        <>
          <PillSingle
            label="Range"
            options={[10, 12, 20] as const}
            selected={c.division.range}
            onSelect={v => updateConfig('division', { range: v as 10 | 12 | 20 })}
            format={v => `Up to ${v}×${v}`}
          />
          <div className="flex gap-2">
            <PillToggle
              label="Allow remainders"
              active={c.division.allowRemainders}
              onToggle={() => updateConfig('division', { allowRemainders: !c.division.allowRemainders })}
            />
          </div>
        </>
      ),

      busStop: (
        <>
          <PillMulti
            label="Question type"
            options={['2d1d', '3d1d'] as const}
            selected={c.busStop.type}
            onToggle={v => updateConfig('busStop', { type: toggleArr(c.busStop.type, v as '2d1d'|'3d1d') })}
            format={v => v === '2d1d' ? '2-digit ÷ 1-digit' : '3-digit ÷ 1-digit'}
          />
          <div className="flex gap-2">
            <PillToggle
              label="Allow remainders"
              active={c.busStop.allowRemainders}
              onToggle={() => updateConfig('busStop', { allowRemainders: !c.busStop.allowRemainders })}
            />
          </div>
        </>
      ),

      indices: (
        <>
          <PillSingle
            label="Base range"
            options={[10, 15] as const}
            selected={c.indices.baseRange}
            onSelect={v => updateConfig('indices', { baseRange: v as 10 | 15 })}
            format={v => `2 to ${v}`}
          />
          <PillMulti
            label="Exponents"
            options={[2, 3, 4] as const}
            selected={c.indices.exponentRange}
            onToggle={v => updateConfig('indices', { exponentRange: toggleArr(c.indices.exponentRange, v as 2|3|4) })}
            format={v => `x${['', '', '²', '³', '⁴'][v]}`}
          />
        </>
      ),
    };

    return (
      <div className="pt-4 px-1">
        {panels[skill]}
      </div>
    );
  };

  // ── RENDER ───────────────────────────────────────────────────────────────

  const canGenerate = enabledSkills.length > 0 && total > 0;
  const overBudget = total > MAX_QUESTIONS;

  return (
    <>
      {/* Header */}
      <div style={{ backgroundColor: '#1e3a8a' }}>
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center">
          <button onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} />
            <span className="font-semibold text-lg">Home</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f3f0' }}>
        <div className="max-w-2xl mx-auto">

          <h1 className="text-5xl font-bold text-center mb-2" style={{ color: '#000000' }}>
            {TOOL_CONFIG.pageTitle}
          </h1>
          <p className="text-center text-gray-500 mb-8">Build a custom worksheet by selecting skills and question counts</p>

          {/* Skill list */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">

            {/* Budget bar */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-700">Questions</span>
              <div className="flex items-center gap-3">
                <div className="w-40 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-blue-900'}`}
                    style={{ width: `${Math.min(100, (total / MAX_QUESTIONS) * 100)}%` }}
                  />
                </div>
                <span className={`text-sm font-bold tabular-nums w-16 text-right ${overBudget ? 'text-red-600' : 'text-gray-700'}`}>
                  {total} / {MAX_QUESTIONS}
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {ALL_SKILLS.map(skill => {
                const enabled = enabledSkills.includes(skill);
                const expanded = expandedSkill === skill;

                return (
                  <div key={skill}>
                    {/* Row */}
                    <div className={`flex items-center gap-4 px-6 py-4 transition-colors ${enabled ? 'bg-white' : 'bg-gray-50/60'}`}>

                      {/* Toggle switch */}
                      <button
                        onClick={() => toggleSkill(skill)}
                        className={`relative flex-shrink-0 w-10 h-5.5 rounded-full transition-colors focus:outline-none ${enabled ? 'bg-blue-900' : 'bg-gray-300'}`}
                        style={{ height: '22px', width: '40px' }}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'left-5' : 'left-0.5'}`} />
                      </button>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <span className={`font-bold text-sm ${enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                          {SKILL_META[skill].label}
                        </span>
                        <span className={`ml-2 text-xs ${enabled ? 'text-gray-400' : 'text-gray-300'}`}>
                          {SKILL_META[skill].description}
                        </span>
                      </div>

                      {/* Right side: stepper + options */}
                      {enabled ? (
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Stepper */}
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() => adjustCount(skill, -1)}
                              disabled={skillCounts[skill] <= 1}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-white hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-lg leading-none"
                            >−</button>
                            <span className="w-7 text-center text-sm font-bold text-gray-800 tabular-nums">
                              {skillCounts[skill]}
                            </span>
                            <button
                              onClick={() => adjustCount(skill, 1)}
                              disabled={total >= MAX_QUESTIONS}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-white hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-lg leading-none"
                            >+</button>
                          </div>

                          {/* Options toggle */}
                          <button
                            onClick={() => setExpandedSkill(expanded ? null : skill)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                              expanded
                                ? 'bg-blue-900 border-blue-900 text-white'
                                : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900 bg-white'
                            }`}
                          >
                            Options
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 flex-shrink-0">off</span>
                      )}
                    </div>

                    {/* Expanded config */}
                    {enabled && expanded && (
                      <div className="px-6 pb-5 bg-slate-50 border-t border-slate-100">
                        {renderConfig(skill)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border-2 border-red-400 rounded-xl text-red-700 font-semibold text-sm text-center">
              {error}
            </div>
          )}

          {/* Generate buttons */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleGeneratePreview}
              disabled={!canGenerate || overBudget}
              className={`flex-1 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                !canGenerate || overBudget
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-2 border-blue-900 text-blue-900 hover:bg-blue-50 shadow-sm'}`}
            >
              <Eye size={20} /> Preview
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={!canGenerate || overBudget}
              className={`flex-1 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                !canGenerate || overBudget
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-900 text-white hover:bg-blue-800 shadow-lg'}`}
            >
              <Download size={20} /> Generate PDF
            </button>
          </div>

          {/* Preview grid */}
          {previewQuestions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#000000' }}>
                Preview — {previewQuestions.length} questions
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {previewQuestions.map((q, i) => (
                  <div key={i} className="group relative p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                    <span className="text-sm font-semibold text-gray-800 pr-5 block">
                      {i + 1}.{' '}
                      {q.displayQuestion
                        ? <span dangerouslySetInnerHTML={{ __html: q.displayQuestion }} />
                        : q.question}
                    </span>
                    <button
                      onClick={() => regenQuestion(i)}
                      className="absolute top-2 right-2 p-1 rounded text-gray-300 hover:text-blue-900 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
                      title="Regenerate this question"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">How it works</h3>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {[
                'Toggle skills on, then use − / + to set how many questions each one contributes.',
                'Maximum 30 questions total — the budget bar shows how many you have left.',
                'Click Options on any skill to configure difficulty and number ranges.',
                'Preview shows a sample; Generate PDF opens a print-ready worksheet with answers.',
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
