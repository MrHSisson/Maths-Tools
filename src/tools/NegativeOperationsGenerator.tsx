import { useState } from 'react';
import { Home, Menu, X, Eye, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

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
};

type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'division';
type SignCombination = 'pos_pos' | 'pos_neg' | 'neg_pos' | 'neg_neg';

// QUESTION GENERATION
const generateQuestions = (
  operations: OperationType[],
  signCombinations: SignCombination[],
  numQuestions: number,
  useBrackets: boolean
): Question[] => {
  const allPossible: Question[] = [];
  
  // Generate all possible questions for each operation type
  operations.forEach(operation => {
    signCombinations.forEach(signCombo => {
      // Use different ranges based on operation
      if (operation === 'addition' || operation === 'subtraction') {
        // For addition and subtraction: -25 to 25
        generateAdditionSubtractionQuestions(operation, signCombo, 25, allPossible, useBrackets);
      } else {
        // For multiplication and division: 1 to 12
        if (operation === 'multiplication') {
          generateMultiplicationQuestions(signCombo, 12, allPossible, useBrackets);
        } else if (operation === 'division') {
          generateDivisionQuestions(signCombo, 12, allPossible, useBrackets);
        }
      }
    });
  });

  // Shuffle using Fisher-Yates algorithm
  for (let i = allPossible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPossible[i], allPossible[j]] = [allPossible[j], allPossible[i]];
  }

  // Select required number
  return allPossible.slice(0, Math.min(numQuestions, allPossible.length));
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

export default function NegativeNumbersOperations() {
  const [selectedOperations, setSelectedOperations] = useState<OperationType[]>([]);
  const [selectedCombinations, setSelectedCombinations] = useState<SignCombination[]>([]);
  const [numQuestions, setNumQuestions] = useState<number>(40);
  const [useBrackets, setUseBrackets] = useState<boolean>(true);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [error, setError] = useState<string>('');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  const toggleOperation = (operation: OperationType): void => {
    setSelectedOperations(prev => {
      const isCurrentlySelected = prev.includes(operation);
      if (isCurrentlySelected) {
        // Unchecking operation - remove it
        return prev.filter(op => op !== operation);
      } else {
        // Checking operation - add it and select all combinations
        setSelectedCombinations(prevCombos => {
          // Add all combinations if they're not already there
          const allCombos: SignCombination[] = ['pos_pos', 'pos_neg', 'neg_pos', 'neg_neg'];
          const newCombos = [...prevCombos];
          allCombos.forEach(combo => {
            if (!newCombos.includes(combo)) {
              newCombos.push(combo);
            }
          });
          return newCombos;
        });
        return [...prev, operation];
      }
    });
    setError('');
  };

  const toggleCombination = (combo: SignCombination): void => {
    setSelectedCombinations(prev => 
      prev.includes(combo) 
        ? prev.filter(c => c !== combo)
        : [...prev, combo]
    );
    setError('');
  };

  const handleGeneratePreview = (): void => {
    if (selectedOperations.length === 0) {
      setError('Please select at least one operation type');
      return;
    }

    if (selectedCombinations.length === 0) {
      setError('Please select at least one sign combination');
      return;
    }

    const questions = generateQuestions(selectedOperations, selectedCombinations, numQuestions, useBrackets);
    
    if (questions.length === 0) {
      setError('No questions could be generated with the current settings');
      return;
    }

    setPreviewQuestions(questions);
    setError('');
  };

  const handleGeneratePDF = (): void => {
    if (selectedOperations.length === 0) {
      setError('Please select at least one operation type');
      return;
    }

    if (selectedCombinations.length === 0) {
      setError('Please select at least one sign combination');
      return;
    }

    const questions = generateQuestions(selectedOperations, selectedCombinations, numQuestions, useBrackets);
    
    if (questions.length === 0) {
      setError('No questions could be generated with the current settings');
      return;
    }

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Get current date for title
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    const dateStr = `${day}/${month}/${year}`;

    // Set PDF metadata
    doc.setProperties({
      title: `Negative Operations ${dateStr}`,
      subject: 'Mathematics Practice',
      author: 'Negative Operations Generator',
      keywords: 'negative numbers, operations, integers',
      creator: 'Negative Operations Generator'
    });

    // Page 1: Questions
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Negative Operations', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Name: ________________________________', 20, 35);

    // Draw questions in 3 columns
    const startY = 48;
    const columnWidth = (pageWidth - 40) / 3;
    const lineHeight = 11.5;
    const numColumns = 3;

    doc.setFontSize(13);
    questions.forEach((q, index) => {
      const row = Math.floor(index / numColumns);
      const column = index % numColumns;
      const x = 20 + (column * columnWidth);
      const y = startY + (row * lineHeight);

      if (y < pageHeight - 20) {
        doc.text(`${q.question} = _____`, x, y);
      }
    });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('Negative Operations Generator', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Page 2: Answers
    doc.addPage();
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Answer Key', pageWidth / 2, 20, { align: 'center' });

    // Draw answers in 3 columns
    const answerStartY = 35;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    questions.forEach((q, index) => {
      const row = Math.floor(index / numColumns);
      const column = index % numColumns;
      const x = 20 + (column * columnWidth);
      const y = answerStartY + (row * lineHeight);

      if (y < pageHeight - 20) {
        doc.text(`${q.question} = ${q.answer}`, x, y);
      }
    });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('Negative Operations Generator', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Open in browser
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    
    setError('');
  };

  return (
    <>
      {/* Header Bar */}
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          {/* Home Button */}
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
          >
            <Home size={24} />
            <span className="font-semibold text-lg">Home</span>
          </button>
          
          {/* Menu Dropdown */}
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
          {/* Title */}
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>
            {TOOL_CONFIG.pageTitle}
          </h1>
          
          {/* Divider */}
          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }}></div>
          </div>
          
          {/* Configuration Panel */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-center mb-4" style={{ color: '#000000' }}>
              Customisation Options
            </h2>

            {/* Divider */}
            <div className="flex justify-center mb-6">
              <div style={{ width: '100%', height: '1px', backgroundColor: '#e5e7eb' }}></div>
            </div>

            {/* Operation Selection with nested Sign Combinations */}
            <div className="mb-8">
              {/* 2x2 Grid for Operations */}
              <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
                {/* Addition */}
                <div className="text-center">
                  <label className="flex items-center justify-center gap-3 cursor-pointer mb-3">
                    <input 
                      type="checkbox" 
                      checked={selectedOperations.includes('addition')}
                      onChange={() => toggleOperation('addition')}
                      className="w-5 h-5 cursor-pointer"
                      style={{ accentColor: '#1e3a8a' }}
                    />
                    <span className="text-xl font-bold" style={{ color: '#000000' }}>
                      Addition (+)
                    </span>
                  </label>
                  <div className="flex flex-col gap-2 items-center">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('addition') && selectedCombinations.includes('pos_pos')}
                        onChange={() => toggleCombination('pos_pos')}
                        disabled={!selectedOperations.includes('addition')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Positive + Positive</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('addition') && selectedCombinations.includes('pos_neg')}
                        onChange={() => toggleCombination('pos_neg')}
                        disabled={!selectedOperations.includes('addition')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Positive + Negative</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('addition') && selectedCombinations.includes('neg_pos')}
                        onChange={() => toggleCombination('neg_pos')}
                        disabled={!selectedOperations.includes('addition')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Negative + Positive</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('addition') && selectedCombinations.includes('neg_neg')}
                        onChange={() => toggleCombination('neg_neg')}
                        disabled={!selectedOperations.includes('addition')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Negative + Negative</span>
                    </label>
                  </div>
                </div>

                {/* Subtraction */}
                <div className="text-center">
                  <label className="flex items-center justify-center gap-3 cursor-pointer mb-3">
                    <input 
                      type="checkbox" 
                      checked={selectedOperations.includes('subtraction')}
                      onChange={() => toggleOperation('subtraction')}
                      className="w-5 h-5 cursor-pointer"
                      style={{ accentColor: '#1e3a8a' }}
                    />
                    <span className="text-xl font-bold" style={{ color: '#000000' }}>
                      Subtraction (-)
                    </span>
                  </label>
                  <div className="flex flex-col gap-2 items-center">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('subtraction') && selectedCombinations.includes('pos_pos')}
                        onChange={() => toggleCombination('pos_pos')}
                        disabled={!selectedOperations.includes('subtraction')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Positive - Positive</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('subtraction') && selectedCombinations.includes('pos_neg')}
                        onChange={() => toggleCombination('pos_neg')}
                        disabled={!selectedOperations.includes('subtraction')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Positive - Negative</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('subtraction') && selectedCombinations.includes('neg_pos')}
                        onChange={() => toggleCombination('neg_pos')}
                        disabled={!selectedOperations.includes('subtraction')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Negative - Positive</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('subtraction') && selectedCombinations.includes('neg_neg')}
                        onChange={() => toggleCombination('neg_neg')}
                        disabled={!selectedOperations.includes('subtraction')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Negative - Negative</span>
                    </label>
                  </div>
                </div>

                {/* Multiplication */}
                <div className="text-center">
                  <label className="flex items-center justify-center gap-3 cursor-pointer mb-3">
                    <input 
                      type="checkbox" 
                      checked={selectedOperations.includes('multiplication')}
                      onChange={() => toggleOperation('multiplication')}
                      className="w-5 h-5 cursor-pointer"
                      style={{ accentColor: '#1e3a8a' }}
                    />
                    <span className="text-xl font-bold" style={{ color: '#000000' }}>
                      Multiplication (×)
                    </span>
                  </label>
                  <div className="flex flex-col gap-2 items-center">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('multiplication') && selectedCombinations.includes('pos_pos')}
                        onChange={() => toggleCombination('pos_pos')}
                        disabled={!selectedOperations.includes('multiplication')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Positive × Positive</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('multiplication') && selectedCombinations.includes('pos_neg')}
                        onChange={() => toggleCombination('pos_neg')}
                        disabled={!selectedOperations.includes('multiplication')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Positive × Negative</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('multiplication') && selectedCombinations.includes('neg_pos')}
                        onChange={() => toggleCombination('neg_pos')}
                        disabled={!selectedOperations.includes('multiplication')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Negative × Positive</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('multiplication') && selectedCombinations.includes('neg_neg')}
                        onChange={() => toggleCombination('neg_neg')}
                        disabled={!selectedOperations.includes('multiplication')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Negative × Negative</span>
                    </label>
                  </div>
                </div>

                {/* Division */}
                <div className="text-center">
                  <label className="flex items-center justify-center gap-3 cursor-pointer mb-3">
                    <input 
                      type="checkbox" 
                      checked={selectedOperations.includes('division')}
                      onChange={() => toggleOperation('division')}
                      className="w-5 h-5 cursor-pointer"
                      style={{ accentColor: '#1e3a8a' }}
                    />
                    <span className="text-xl font-bold" style={{ color: '#000000' }}>
                      Division (÷)
                    </span>
                  </label>
                  <div className="flex flex-col gap-2 items-center">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('division') && selectedCombinations.includes('pos_pos')}
                        onChange={() => toggleCombination('pos_pos')}
                        disabled={!selectedOperations.includes('division')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Positive ÷ Positive</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('division') && selectedCombinations.includes('pos_neg')}
                        onChange={() => toggleCombination('pos_neg')}
                        disabled={!selectedOperations.includes('division')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Positive ÷ Negative</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('division') && selectedCombinations.includes('neg_pos')}
                        onChange={() => toggleCombination('neg_pos')}
                        disabled={!selectedOperations.includes('division')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Negative ÷ Positive</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={selectedOperations.includes('division') && selectedCombinations.includes('neg_neg')}
                        onChange={() => toggleCombination('neg_neg')}
                        disabled={!selectedOperations.includes('division')}
                        className="w-4 h-4 cursor-pointer disabled:opacity-50"
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span>Negative ÷ Negative</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex justify-center my-6">
              <div style={{ width: '80%', height: '1px', backgroundColor: '#e5e7eb' }}></div>
            </div>

            {/* Bracket Option */}
            <div className="flex justify-center items-center gap-3 mb-6">
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
            </div>

            {/* Number of Questions */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <label className="text-lg font-semibold" style={{ color: '#000000' }}>
                Questions (21-60):
              </label>
              <input 
                type="number" 
                min="21" 
                max="60" 
                value={numQuestions}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 21;
                  if (val >= 21 && val <= 60) {
                    setNumQuestions(val);
                    setError('');
                  } else {
                    setError('Please enter a number between 21 and 60');
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
                disabled={selectedOperations.length === 0 || selectedCombinations.length === 0}
                className={`px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 transition-all ${
                  selectedOperations.length === 0 || selectedCombinations.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-900 text-white hover:bg-blue-800 shadow-xl'
                }`}
              >
                <Eye size={24} />
                Generate Example
              </button>
              <button 
                onClick={handleGeneratePDF}
                disabled={selectedOperations.length === 0 || selectedCombinations.length === 0}
                className={`px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 transition-all ${
                  selectedOperations.length === 0 || selectedCombinations.length === 0
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
                      {idx + 1}. {q.question} = _____
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
                <span>Addition and Subtraction use numbers from -25 to 25</span>
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
                <span>Set the number of questions (21-60)</span>
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
