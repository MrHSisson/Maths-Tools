import { useState } from 'react';
import { Home, Menu, X, Eye, Download } from 'lucide-react';

// NEGATIVE NUMBERS OPERATIONS
// A tool for practicing arithmetic operations with positive and negative numbers

const TOOL_CONFIG = {
  pageTitle: 'Negative Operations Generator',
};

// TYPE DEFINITIONS
type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';

type Question = {
  question: string;
  answer: number;
  key?: string; // Unique key for deduplication
};

type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'division';
type SignCombination = 'pos_pos' | 'pos_neg' | 'neg_pos' | 'neg_neg';

// QUESTION GENERATION
const generateQuestions = (
  operationCombinations: Record<OperationType, SignCombination[]>,
  numQuestions: number,
  useBrackets: boolean,
  missingNumberPercent: number
): Question[] => {
  const allPossible: Question[] = [];
  
  (Object.keys(operationCombinations) as OperationType[]).forEach(operation => {
    operationCombinations[operation].forEach(signCombo => {
      if (operation === 'addition' || operation === 'subtraction') {
        generateAdditionSubtractionQuestions(operation, signCombo, 25, allPossible, useBrackets);
      } else if (operation === 'multiplication') {
        generateMultiplicationQuestions(signCombo, 12, allPossible, useBrackets);
      } else if (operation === 'division') {
        generateDivisionQuestions(signCombo, 12, allPossible, useBrackets);
      }
    });
  });

  // Shuffle using Fisher-Yates algorithm
  for (let i = allPossible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPossible[i], allPossible[j]] = [allPossible[j], allPossible[i]];
  }

  const selected = allPossible.slice(0, Math.min(numQuestions, allPossible.length));
  
  // Add unique keys before conversion
  selected.forEach((q, i) => {
    // Clean up any spacing issues in the question text
    q.question = q.question.replace(/\s+/g, ' ').trim();
    // Also fix any "( - N )" patterns to "(-N)"
    q.question = q.question.replace(/\(\s*-\s*(\d+)\s*\)/g, '(-$1)');
    q.key = `${q.question}_${q.answer}_${i}`;
  });
  
  // Convert to missing number format based on percentage
  selected.forEach(q => {
    if (Math.random() * 100 < missingNumberPercent) {
      convertToMissingNumber(q);
      // Update key after conversion to reflect the change
      q.key = `${q.question}_${q.answer}_missing`;
    }
  });

  // Deduplicate based on question text and answer
  const seen = new Set<string>();
  const deduplicated = selected.filter(q => {
    const key = `${q.question}_${q.answer}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return deduplicated;
};

// Convert a standard question to missing number format
const convertToMissingNumber = (q: Question): void => {
  // Clean the question first - collapse multiple spaces
  q.question = q.question.replace(/\s+/g, ' ').trim();
  
  // Parse the question to extract parts
  const parts = q.question.split(' ');
  const firstNum = parts[0];
  const operator = parts[1];
  const secondNum = parts.slice(2).join(' '); // May include parentheses
  
  // Randomly choose to make first or second number missing (50/50)
  const makeFirstMissing = Math.random() < 0.5;
  
  if (makeFirstMissing) {
    // __ + 5 = 10  (answer is the missing first number)
    q.question = `__ ${operator} ${secondNum} = ${q.answer}`;
    // Calculate what the first number should be based on the operation
    if (operator === '+') {
      q.answer = q.answer - parseFloat(secondNum.replace(/[()]/g, ''));
    } else if (operator === '-' || operator === '−') {
      q.answer = q.answer + parseFloat(secondNum.replace(/[()]/g, ''));
    } else if (operator === '×' || operator === 'x') {
      q.answer = q.answer / parseFloat(secondNum.replace(/[()]/g, ''));
    } else if (operator === '÷' || operator === '/') {
      q.answer = q.answer * parseFloat(secondNum.replace(/[()]/g, ''));
    }
  } else {
    // 5 + __ = 10  (answer is the missing second number)
    const originalAnswer = q.answer;
    q.question = `${firstNum} ${operator} __ = ${originalAnswer}`;
    // Calculate what the second number should be
    const first = parseFloat(firstNum.replace(/[()]/g, ''));
    if (operator === '+') {
      q.answer = originalAnswer - first;
    } else if (operator === '-' || operator === '−') {
      q.answer = first - originalAnswer;
    } else if (operator === '×' || operator === 'x') {
      q.answer = originalAnswer / first;
    } else if (operator === '÷' || operator === '/') {
      q.answer = first / originalAnswer;
    }
  }
};

const generateAdditionSubtractionQuestions = (
  operation: OperationType,
  signCombo: SignCombination,
  range: number,
  questions: Question[],
  useBrackets: boolean
): void => {
  for (let a = 1; a <= range; a++) {
    for (let b = 1; b <= range; b++) {
      let num1: number, num2: number, answer: number;
      
      switch (signCombo) {
        case 'pos_pos':
          num1 = a;
          num2 = b;
          if (operation === 'addition') {
            answer = num1 + num2;
            questions.push({ question: `${num1} + ${num2}`, answer });
          } else {
            answer = num1 - num2;
            questions.push({ question: `${num1} − ${num2}`, answer });
          }
          break;
        case 'pos_neg':
          num1 = a;
          num2 = -b;
          if (operation === 'addition') {
            answer = num1 + num2;
            const formatted = useBrackets ? `${num1} + (${num2})` : `${num1} + ${num2}`;
            questions.push({ question: formatted, answer });
          } else {
            answer = num1 - num2;
            const formatted = useBrackets ? `${num1} − (${num2})` : `${num1} − ${num2}`;
            questions.push({ question: formatted, answer });
          }
          break;
        case 'neg_pos':
          num1 = -a;
          num2 = b;
          if (operation === 'addition') {
            answer = num1 + num2;
            const formatted = useBrackets ? `(${num1}) + ${num2}` : `${num1} + ${num2}`;
            questions.push({ question: formatted, answer });
          } else {
            answer = num1 - num2;
            const formatted = useBrackets ? `(${num1}) − ${num2}` : `${num1} − ${num2}`;
            questions.push({ question: formatted, answer });
          }
          break;
        case 'neg_neg':
          num1 = -a;
          num2 = -b;
          if (operation === 'addition') {
            answer = num1 + num2;
            const formatted = useBrackets ? `(${num1}) + (${num2})` : `${num1} + ${num2}`;
            questions.push({ question: formatted, answer });
          } else {
            answer = num1 - num2;
            const formatted = useBrackets ? `(${num1}) − (${num2})` : `${num1} − ${num2}`;
            questions.push({ question: formatted, answer });
          }
          break;
      }
    }
  }
};

const generateMultiplicationQuestions = (
  signCombo: SignCombination, 
  range: number, 
  questions: Question[],
  useBrackets: boolean
): void => {
  for (let a = 1; a <= range; a++) {
    for (let b = 1; b <= range; b++) {
      let num1: number, num2: number, answer: number;
      
      switch (signCombo) {
        case 'pos_pos':
          num1 = a;
          num2 = b;
          answer = num1 * num2;
          questions.push({ question: `${num1} × ${num2}`, answer });
          break;
        case 'pos_neg':
          num1 = a;
          num2 = -b;
          answer = num1 * num2;
          const formatted1 = useBrackets ? `${num1} × (${num2})` : `${num1} × ${num2}`;
          questions.push({ question: formatted1, answer });
          break;
        case 'neg_pos':
          num1 = -a;
          num2 = b;
          answer = num1 * num2;
          const formatted2 = useBrackets ? `(${num1}) × ${num2}` : `${num1} × ${num2}`;
          questions.push({ question: formatted2, answer });
          break;
        case 'neg_neg':
          num1 = -a;
          num2 = -b;
          answer = num1 * num2;
          const formatted3 = useBrackets ? `(${num1}) × (${num2})` : `${num1} × ${num2}`;
          questions.push({ question: formatted3, answer });
          break;
      }
    }
  }
};

const generateDivisionQuestions = (
  signCombo: SignCombination, 
  range: number, 
  questions: Question[],
  useBrackets: boolean
): void => {
  // For division, we generate from multiplication facts to ensure integer answers
  for (let divisor = 1; divisor <= range; divisor++) {
    for (let quotient = 1; quotient <= range; quotient++) {
      const product = divisor * quotient;
      let dividend: number, div: number, answer: number;
      
      switch (signCombo) {
        case 'pos_pos':
          dividend = product;
          div = divisor;
          answer = quotient;
          questions.push({ question: `${dividend} ÷ ${div}`, answer });
          break;
        case 'pos_neg':
          dividend = product;
          div = -divisor;
          answer = -quotient;
          const formatted1 = useBrackets ? `${dividend} ÷ (${div})` : `${dividend} ÷ ${div}`;
          questions.push({ question: formatted1, answer });
          break;
        case 'neg_pos':
          dividend = -product;
          div = divisor;
          answer = -quotient;
          const formatted2 = useBrackets ? `(${dividend}) ÷ ${div}` : `${dividend} ÷ ${div}`;
          questions.push({ question: formatted2, answer });
          break;
        case 'neg_neg':
          dividend = -product;
          div = -divisor;
          answer = quotient;
          const formatted3 = useBrackets ? `(${dividend}) ÷ (${div})` : `${dividend} ÷ ${div}`;
          questions.push({ question: formatted3, answer });
          break;
      }
    }
  }
};

// PDF PRINT FUNCTION
const handlePrint = (
  questions: Question[],
  useMissingNumber: boolean
) => {
  const FONT_PX = 11;
  const PAD_MM = 2;
  const MARGIN_MM = 12;
  const HEADER_MM = 14;
  const GAP_MM = 2;
  const PAGE_H_MM = 297 - MARGIN_MM * 2;
  const PAGE_W_MM = 210 - MARGIN_MM * 2;
  const usableH_MM = PAGE_H_MM - HEADER_MM;
  
  // For this tool, use 3 columns fixed
  const cols = 3;
  const cellW_MM = (PAGE_W_MM - GAP_MM * 2) / 3;
  
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {day:"numeric",month:"long",year:"numeric"});
  const totalQ = questions.length;

  // Format a number to 5 characters: ( - TO )
  const formatNumber = (num: string): string => {
    // Handle blanks first
    if (num === '__') {
      return '_____';
    }
    if (num === '___') {
      return '  ___';
    }
    
    // Clean up: remove ALL spaces, then check structure
    let cleaned = num.replace(/\s+/g, '');
    
    // Check if it has parentheses
    const hasParens = cleaned.includes('(') && cleaned.includes(')');
    
    // Extract the actual number (remove parentheses for processing)
    const numOnly = cleaned.replace(/[()]/g, '');
    const isNegative = numOnly.startsWith('-');
    const absValue = isNegative ? numOnly.substring(1) : numOnly;
    
    let result = '';
    
    if (hasParens) {
      result += '(';
      result += isNegative ? '-' : ' ';
      result += absValue.padStart(2, ' ');
      result += ')';
    } else {
      result += ' ';
      result += isNegative ? '-' : ' ';
      result += absValue.padStart(2, ' ');
      result += ' ';
    }
    
    return result;
  };

  const questionToHtml = (idx: number, showAnswer: boolean): string => {
    const q = questions[idx];
    const questionText = useMissingNumber ? q.question : `${q.question} = ___`;
    
    // Parse the question properly by identifying components
    // Question format: "num1 op num2 = answer" or "num1 op __ = answer" or "__ op num2 = answer"
    
    // Use regex to match: (optional parens + number) operator (optional parens + number) = (answer or blank)
    const regex = /^\s*(\(?-?\d+\)?)\s*([\+\-−×÷x\/])\s*(\(?-?\d+\)?|__)\s*=\s*(.+)$/;
    const match = questionText.match(regex);
    
    if (!match) {
      // Fallback if regex doesn't match
      return `<div class="qbody">${questionText}</div>`;
    }
    
    let [, num1, operator, num2, result] = match;
    
    // Clean up any extra spaces in the captured groups
    num1 = num1.trim();
    operator = operator.trim();
    num2 = num2.trim();
    result = result.trim();
    
    let formatted = '';
    
    if (showAnswer) {
      if (useMissingNumber) {
        // Replace __ with actual answer
        if (num1 === '__') {
          num1 = String(q.answer);
        } else if (num2 === '__') {
          num2 = String(q.answer);
        }
      } else {
        // Standard question - replace ___ with answer
        result = String(q.answer);
      }
    }
    
    // Format each component
    const formattedNum1 = formatNumber(num1);
    const formattedNum2 = formatNumber(num2);
    const formattedResult = formatNumber(result);
    
    formatted = `${formattedNum1} ${operator} ${formattedNum2} = ${formattedResult}`;
    
    return `<div class="qbody">${formatted}</div>`;
  };

  // Build probe HTML
  const probeHtml = questions.map((_, i) =>
    `<div class="q-inner" id="probe-${i}">${questionToHtml(i, true)}</div>`
  ).join("");

  // Build HTML
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Negative Operations — Worksheet</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: ${MARGIN_MM}mm; }
  body { font-family: "Segoe UI", Arial, sans-serif; background: #fff; }
  
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  .page { width: ${PAGE_W_MM}mm; height: ${PAGE_H_MM}mm; overflow: hidden; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .page-header {
    display: flex; justify-content: space-between; align-items: baseline;
    border-bottom: 0.4mm solid #1e3a8a; padding-bottom: 1.5mm; margin-bottom: 2mm;
  }
  .page-header h1 { font-size: 5mm; font-weight: 700; color: #1e3a8a; }
  .page-header .meta { font-size: 3mm; color: #6b7280; }
  
  .grid { display: grid; gap: ${GAP_MM}mm; }
  .cell {
    border: 0.4mm solid #000000; border-radius: 3mm;
    overflow: hidden; display: flex; flex-direction: column;
    align-items: stretch; justify-content: flex-start;
  }
  
  #probe {
    position: fixed; left: -9999px; top: 0; visibility: hidden;
    font-family: "Segoe UI", Arial, sans-serif; font-size: ${FONT_PX}px; line-height: 1.4;
    width: ${cellW_MM}mm;
  }
  
  .q-inner { width: 100%; display: flex; flex-direction: column; flex: 1; }
  .qbody { 
    padding: ${PAD_MM}mm; 
    text-align: center; 
    flex: 1;
    font-size: ${FONT_PX}px;
    line-height: 1.4;
  }
  .q-answer { 
    font-size: ${FONT_PX}px; 
    color: #059669; 
    display: block; 
    margin-top: 0.8mm; 
    text-align: center; 
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
  var usableH   = ${usableH_MM};
  var PAGE_W_MM = ${PAGE_W_MM};
  var cols      = ${cols};
  var totalQ    = ${totalQ};
  var dateStr   = "${dateStr}";

  // Pre-determined row heights for 1–15 rows
  var rowHeights = [];
  for (var r = 1; r <= 15; r++) {
    rowHeights.push((usableH - GAP_MM * (r - 1)) / r);
  }

  // Step 1: measure tallest question content
  var probe = document.getElementById('probe');
  var maxH_px = 0;
  probe.querySelectorAll('.q-inner').forEach(function(el) {
    if (el.scrollHeight > maxH_px) maxH_px = el.scrollHeight;
  });
  var maxH_mm = maxH_px / pxPerMm;
  var needed_mm = maxH_mm + PAD_MM * 2 + 6;

  // Step 2: find optimal row count
  var chosenH_mm = rowHeights[0];
  var rowsPerPage = 1;

  var found = false;
  for (var r = 0; r < rowHeights.length; r++) {
    var capacity = (r + 1) * cols;
    if (capacity >= totalQ && rowHeights[r] >= needed_mm) {
      chosenH_mm = rowHeights[r];
      rowsPerPage = r + 1;
      found = true;
      break;
    }
  }

  if (!found) {
    for (var r2 = 0; r2 < rowHeights.length; r2++) {
      if (rowHeights[r2] >= needed_mm) {
        chosenH_mm = rowHeights[r2];
        rowsPerPage = r2 + 1;
      }
    }
  }

  // Step 3: split into pages
  var pageCapacity = rowsPerPage * cols;
  var pages = [];
  for (var s = 0; s < totalQ; s += pageCapacity) {
    pages.push(s);
  }
  var totalPages = pages.length;

  function makeCellW(c) {
    return (PAGE_W_MM - GAP_MM * (c - 1)) / c;
  }

  function buildCell(idx, showAnswer, cW, cH) {
    var inner = showAnswer 
      ? ${JSON.stringify(questions.map((_, i) => questionToHtml(i, true)))}[idx]
      : ${JSON.stringify(questions.map((_, i) => questionToHtml(i, false)))}[idx];
    return '<div class="cell" style="width:' + cW + 'mm;height:' + cH + 'mm;">' + inner + '</div>';
  }

  function buildGrid(startIdx, showAnswer, cH) {
    var endIdx = Math.min(startIdx + pageCapacity, totalQ);
    var cW = makeCellW(cols);
    var gridRows = Math.ceil((endIdx - startIdx) / cols);
    var cells = '';
    for (var i = startIdx; i < endIdx; i++) {
      cells += buildCell(i, showAnswer, cW, cH);
    }
    return '<div class="grid" style="grid-template-columns:repeat(' + cols + ',' + cW + 'mm);grid-template-rows:repeat(' + gridRows + ',' + cH + 'mm);">' + cells + '</div>';
  }

  function buildPage(startIdx, showAnswer, pgIdx) {
    var lbl = totalPages > 1
      ? totalQ + ' questions (' + (pgIdx+1) + '/' + totalPages + ')'
      : totalQ + ' questions';
    var title = showAnswer ? 'Negative Operations — Answers' : 'Negative Operations';
    return '<div class="page">'
      + '<div class="page-header"><div><h1>' + title + '</h1></div>'
      + '<div class="meta">' + dateStr + ' · ' + lbl + '</div></div>'
      + buildGrid(startIdx, showAnswer, chosenH_mm)
      + '</div>';
  }

  // Render all question pages then all answer pages
  var html = pages.map(function(startIdx, i) { return buildPage(startIdx, false, i); }).join('')
           + pages.map(function(startIdx, i) { return buildPage(startIdx, true,  i); }).join('');

  document.getElementById('pages').innerHTML = html;
  probe.remove();

  setTimeout(function() { window.print(); }, 300);
});
</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(html);
  win.document.close();
};

export default function NegativeNumbersOperations() {
  // Per-operation combination state
  const [operationCombinations, setOperationCombinations] = useState<Record<OperationType, SignCombination[]>>({
    addition: [],
    subtraction: [],
    multiplication: [],
    division: [],
  });
  const [numQuestions, setNumQuestions] = useState<number>(40);
  const [useBrackets, setUseBrackets] = useState<boolean>(true);
  const [standardQuestions, setStandardQuestions] = useState<boolean>(true);
  const [missingNumberQuestions, setMissingNumberQuestions] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [error, setError] = useState<string>('');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  const allCombos: SignCombination[] = ['pos_pos', 'pos_neg', 'neg_pos', 'neg_neg'];

  const isOperationFullySelected = (op: OperationType): boolean =>
    allCombos.every(c => operationCombinations[op].includes(c));

  const toggleOperation = (operation: OperationType): void => {
    setOperationCombinations(prev => ({
      ...prev,
      [operation]: isOperationFullySelected(operation) ? [] : [...allCombos],
    }));
    setError('');
  };

  const toggleCombination = (operation: OperationType, combo: SignCombination): void => {
    setOperationCombinations(prev => {
      const current = prev[operation];
      return {
        ...prev,
        [operation]: current.includes(combo)
          ? current.filter(c => c !== combo)
          : [...current, combo],
      };
    });
    setError('');
  };

  const handleGeneratePreview = (): void => {
    const activeOperations = (Object.keys(operationCombinations) as OperationType[])
      .filter(op => operationCombinations[op].length > 0);

    if (activeOperations.length === 0) {
      setError('Please select at least one operation and sign combination');
      return;
    }

    if (!standardQuestions && !missingNumberQuestions) {
      setError('Please select at least one question type (standard or missing number)');
      return;
    }

    // Calculate percentage: both checked = 50%, only missing = 100%, only standard = 0%
    const missingPercent = standardQuestions && missingNumberQuestions ? 50 : missingNumberQuestions ? 100 : 0;
    const questions = generateQuestions(operationCombinations, numQuestions, useBrackets, missingPercent);

    if (questions.length === 0) {
      setError('No questions could be generated with the current settings');
      return;
    }

    setPreviewQuestions(questions);
    setError('');
  };

  const handleGeneratePDF = (): void => {
    const activeOperations = (Object.keys(operationCombinations) as OperationType[])
      .filter(op => operationCombinations[op].length > 0);

    if (activeOperations.length === 0) {
      setError('Please select at least one operation and sign combination');
      return;
    }

    if (!standardQuestions && !missingNumberQuestions) {
      setError('Please select at least one question type (standard or missing number)');
      return;
    }

    const missingPercent = standardQuestions && missingNumberQuestions ? 50 : missingNumberQuestions ? 100 : 0;
    const questions = generateQuestions(operationCombinations, numQuestions, useBrackets, missingPercent);
    
    if (questions.length === 0) {
      setError('No questions could be generated with the current settings');
      return;
    }

    handlePrint(questions, missingPercent > 0);
    setError('');
  };

  return (
    <>
      {/* Header Bar */}
      <div className="bg-blue-900 shadow-lg" style={{backgroundColor:"#1e3a8a"}}>
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button 
            onClick={() => window.location.href = '/'}
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
                      className={'w-full text-left px-6 py-3 font-semibold transition-colors ' +
                        (colorScheme === scheme ? 'bg-blue-100 text-blue-900' : 'text-gray-800 hover:bg-gray-100')}
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
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }}></div>
          </div>
          
          {/* Configuration Panel */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-center mb-4" style={{ color: '#000000' }}>
              Customisation Options
            </h2>

            <div className="flex justify-center mb-6">
              <div style={{ width: '100%', height: '1px', backgroundColor: '#e5e7eb' }}></div>
            </div>

            {/* Operation Selection Grid */}
            <div className="mb-8">
              <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">

                {/* Addition */}
                <div className="text-center">
                  <label className="flex items-center justify-center gap-3 cursor-pointer mb-3">
                    <input 
                      type="checkbox" 
                      checked={isOperationFullySelected('addition')}
                      onChange={() => toggleOperation('addition')}
                      className="w-5 h-5 cursor-pointer"
                      style={{ accentColor: '#1e3a8a' }}
                    />
                    <span className="text-xl font-bold" style={{ color: '#000000' }}>Addition (+)</span>
                  </label>
                  <div className="flex flex-col gap-2 items-center">
                    {(['pos_pos', 'pos_neg', 'neg_pos', 'neg_neg'] as SignCombination[]).map(combo => (
                      <label key={combo} className="flex items-center gap-2 cursor-pointer text-gray-700">
                        <input 
                          type="checkbox"
                          checked={operationCombinations.addition.includes(combo)}
                          onChange={() => toggleCombination('addition', combo)}
                          className="w-4 h-4 cursor-pointer"
                          style={{ accentColor: '#1e3a8a' }}
                        />
                        <span>{combo === 'pos_pos' ? 'Positive + Positive' : combo === 'pos_neg' ? 'Positive + Negative' : combo === 'neg_pos' ? 'Negative + Positive' : 'Negative + Negative'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Subtraction */}
                <div className="text-center">
                  <label className="flex items-center justify-center gap-3 cursor-pointer mb-3">
                    <input 
                      type="checkbox" 
                      checked={isOperationFullySelected('subtraction')}
                      onChange={() => toggleOperation('subtraction')}
                      className="w-5 h-5 cursor-pointer"
                      style={{ accentColor: '#1e3a8a' }}
                    />
                    <span className="text-xl font-bold" style={{ color: '#000000' }}>Subtraction (−)</span>
                  </label>
                  <div className="flex flex-col gap-2 items-center">
                    {(['pos_pos', 'pos_neg', 'neg_pos', 'neg_neg'] as SignCombination[]).map(combo => (
                      <label key={combo} className="flex items-center gap-2 cursor-pointer text-gray-700">
                        <input 
                          type="checkbox"
                          checked={operationCombinations.subtraction.includes(combo)}
                          onChange={() => toggleCombination('subtraction', combo)}
                          className="w-4 h-4 cursor-pointer"
                          style={{ accentColor: '#1e3a8a' }}
                        />
                        <span>{combo === 'pos_pos' ? 'Positive − Positive' : combo === 'pos_neg' ? 'Positive − Negative' : combo === 'neg_pos' ? 'Negative − Positive' : 'Negative − Negative'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Multiplication */}
                <div className="text-center">
                  <label className="flex items-center justify-center gap-3 cursor-pointer mb-3">
                    <input 
                      type="checkbox" 
                      checked={isOperationFullySelected('multiplication')}
                      onChange={() => toggleOperation('multiplication')}
                      className="w-5 h-5 cursor-pointer"
                      style={{ accentColor: '#1e3a8a' }}
                    />
                    <span className="text-xl font-bold" style={{ color: '#000000' }}>Multiplication (×)</span>
                  </label>
                  <div className="flex flex-col gap-2 items-center">
                    {(['pos_pos', 'pos_neg', 'neg_pos', 'neg_neg'] as SignCombination[]).map(combo => (
                      <label key={combo} className="flex items-center gap-2 cursor-pointer text-gray-700">
                        <input 
                          type="checkbox"
                          checked={operationCombinations.multiplication.includes(combo)}
                          onChange={() => toggleCombination('multiplication', combo)}
                          className="w-4 h-4 cursor-pointer"
                          style={{ accentColor: '#1e3a8a' }}
                        />
                        <span>{combo === 'pos_pos' ? 'Positive × Positive' : combo === 'pos_neg' ? 'Positive × Negative' : combo === 'neg_pos' ? 'Negative × Positive' : 'Negative × Negative'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Division */}
                <div className="text-center">
                  <label className="flex items-center justify-center gap-3 cursor-pointer mb-3">
                    <input 
                      type="checkbox" 
                      checked={isOperationFullySelected('division')}
                      onChange={() => toggleOperation('division')}
                      className="w-5 h-5 cursor-pointer"
                      style={{ accentColor: '#1e3a8a' }}
                    />
                    <span className="text-xl font-bold" style={{ color: '#000000' }}>Division (÷)</span>
                  </label>
                  <div className="flex flex-col gap-2 items-center">
                    {(['pos_pos', 'pos_neg', 'neg_pos', 'neg_neg'] as SignCombination[]).map(combo => (
                      <label key={combo} className="flex items-center gap-2 cursor-pointer text-gray-700">
                        <input 
                          type="checkbox"
                          checked={operationCombinations.division.includes(combo)}
                          onChange={() => toggleCombination('division', combo)}
                          className="w-4 h-4 cursor-pointer"
                          style={{ accentColor: '#1e3a8a' }}
                        />
                        <span>{combo === 'pos_pos' ? 'Positive ÷ Positive' : combo === 'pos_neg' ? 'Positive ÷ Negative' : combo === 'neg_pos' ? 'Negative ÷ Positive' : 'Negative ÷ Negative'}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            <div className="flex justify-center my-6">
              <div style={{ width: '80%', height: '1px', backgroundColor: '#e5e7eb' }}></div>
            </div>

            {/* All Question Options */}
            <div className="flex flex-col justify-center items-center gap-2 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useBrackets}
                  onChange={(e) => setUseBrackets(e.target.checked)}
                  className="w-5 h-5 cursor-pointer"
                  style={{ accentColor: '#1e3a8a' }}
                />
                <span className="text-lg font-semibold" style={{ color: '#000000' }}>
                  Use brackets for negative numbers
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={standardQuestions}
                  onChange={(e) => setStandardQuestions(e.target.checked)}
                  className="w-5 h-5 cursor-pointer"
                  style={{ accentColor: '#1e3a8a' }}
                />
                <span className="text-lg font-semibold" style={{ color: '#000000' }}>
                  Standard questions (e.g., 2 + 3 = ___)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={missingNumberQuestions}
                  onChange={(e) => setMissingNumberQuestions(e.target.checked)}
                  className="w-5 h-5 cursor-pointer"
                  style={{ accentColor: '#1e3a8a' }}
                />
                <span className="text-lg font-semibold" style={{ color: '#000000' }}>
                  Missing number questions (e.g., 2 + __ = 5)
                </span>
              </label>
            </div>

            {/* Number of Questions */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <label className="text-lg font-semibold" style={{ color: '#000000' }}>
                Questions (15-45):
              </label>
              <input 
                type="number" 
                min="15" 
                max="45" 
                value={numQuestions}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 15;
                  if (val >= 15 && val <= 45) {
                    setNumQuestions(val);
                    setError('');
                  } else {
                    setError('Please enter a number between 15 and 45');
                  }
                }}
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
                disabled={(Object.keys(operationCombinations) as OperationType[]).every(op => operationCombinations[op].length === 0)}
                className={`px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 transition-all ${
                  (Object.keys(operationCombinations) as OperationType[]).every(op => operationCombinations[op].length === 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-900 text-white hover:bg-blue-800 shadow-xl'
                }`}
              >
                <Eye size={24} />
                Generate Example
              </button>
              <button 
                onClick={handleGeneratePDF}
                disabled={(Object.keys(operationCombinations) as OperationType[]).every(op => operationCombinations[op].length === 0)}
                className={`px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 transition-all ${
                  (Object.keys(operationCombinations) as OperationType[]).every(op => operationCombinations[op].length === 0)
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
              <div className="grid grid-cols-3 gap-6">
                {previewQuestions.slice(0, 12).map((q, idx) => (
                  <div key={idx} className="p-3">
                    <span className="text-xl font-semibold" style={{ color: '#000000' }}>
                      {idx + 1}. {q.question.includes('__') ? q.question : `${q.question} = ___`}
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
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Select which operations you want to practice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Uncheck specific sign combinations if you want to focus on particular cases</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Addition and Subtraction use numbers from −25 to 25</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Multiplication and Division tests up to 12×12</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>All division questions use integer results to keep focus on sign rules</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Missing number questions put the unknown in different positions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Set the number of questions (15-45)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Click "Generate Example" to see your style of questions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Click "Generate PDF" to generate your worksheet in a new tab</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
