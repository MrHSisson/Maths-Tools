import { useState } from 'react';
import { Download, Home, Menu, X } from 'lucide-react';
import { jsPDF } from 'jspdf';

// TIMES TABLES QUIZ GENERATOR
// A tool for generating customizable times tables practice quizzes with PDF export

const TOOL_CONFIG = {
  pageTitle: 'Times Tables Quiz Generator',
};

// TYPE DEFINITIONS
type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';
type OperationType = 'multiply' | 'divide' | 'mixed';

type Question = {
  question: string;
  answer: number;
};

// QUESTION GENERATION
const generateQuestions = (
  selectedTables: number[],
  numQuestions: number,
  operationType: OperationType,
  tableFirst: boolean
): Question[] => {
  const allPossible: Array<{ type: string; a?: number; b?: number; dividend?: number; divisor?: number; answer: number }> = [];
  
  selectedTables.forEach(selectedTable => {
    for (let otherFactor = 1; otherFactor <= 12; otherFactor++) {
      const product = selectedTable * otherFactor;
      
      // Add multiplication questions
      if (operationType === 'multiply' || operationType === 'mixed') {
        allPossible.push({ 
          type: 'multiply',
          a: selectedTable, 
          b: otherFactor,
          answer: product
        });
      }
      
      // Add division questions
      if (operationType === 'divide' || operationType === 'mixed') {
        allPossible.push({
          type: 'divide',
          dividend: product,
          divisor: selectedTable,
          answer: otherFactor
        });
        
        if (otherFactor !== selectedTable) {
          allPossible.push({
            type: 'divide',
            dividend: product,
            divisor: otherFactor,
            answer: selectedTable
          });
        }
      }
    }
  });

  // Shuffle using Fisher-Yates algorithm
  for (let i = allPossible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPossible[i], allPossible[j]] = [allPossible[j], allPossible[i]];
  }

  // Select required number
  const selected = allPossible.slice(0, numQuestions);

  return selected.map(q => {
    if (q.type === 'multiply') {
      const displayFirst = tableFirst ? q.a! : q.b!;
      const displaySecond = tableFirst ? q.b! : q.a!;
      
      return {
        question: `${displayFirst} × ${displaySecond}`,
        answer: q.answer
      };
    } else {
      return {
        question: `${q.dividend} ÷ ${q.divisor}`,
        answer: q.answer
      };
    }
  });
};

const generatePDF = (
  questions: Question[],
  selectedTables: number[]
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Set PDF metadata
  doc.setProperties({
    title: 'Times Tables Quiz',
    subject: 'Mathematics Practice',
    author: 'Times Tables Quiz Generator',
    keywords: 'times tables, multiplication, quiz',
    creator: 'Times Tables Quiz Generator'
  });

  // Page 1: Questions
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Times Tables Quiz', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Name: ________________________________', 20, 35);

  // Draw questions in 3 columns (fill rows first, left to right)
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
  doc.text('Times Tables Quiz Generator', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Page 2: Answers
  doc.addPage();
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Answer Key', pageWidth / 2, 20, { align: 'center' });

  // Draw answers in 3 columns (fill rows first, left to right)
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
  doc.text('Times Tables Quiz Generator', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Open in browser
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};

export default function TimesTablesQuizGenerator() {
  const [selectedTables, setSelectedTables] = useState<number[]>([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const [numQuestions, setNumQuestions] = useState<number>(40);
  const [operationType, setOperationType] = useState<OperationType>('multiply');
  const [tableFirst, setTableFirst] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const toggleTable = (table: number): void => {
    setSelectedTables(prev => 
      prev.includes(table) 
        ? prev.filter(t => t !== table)
        : [...prev, table].sort((a, b) => a - b)
    );
    setError('');
  };

  const selectAll = (): void => {
    setSelectedTables(Array.from({length: 19}, (_, i) => i + 2));
  };

  const selectNone = (): void => {
    setSelectedTables([]);
  };

  const handleGeneratePDF = (): void => {
    if (selectedTables.length === 0) {
      setError('Please select at least one times table');
      return;
    }

    const questions = generateQuestions(selectedTables, numQuestions, operationType, tableFirst);
    generatePDF(questions, selectedTables);
  };

  const getBackgroundColor = (): string => {
    const colors: Record<ColorScheme, string> = {
      default: '#f5f3f0',
      blue: '#dbeafe',
      pink: '#fce7f3',
      yellow: '#fef9c3',
    };
    return colors[colorScheme];
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
      <div className="min-h-screen p-8" style={{ backgroundColor: getBackgroundColor() }}>
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>
            {TOOL_CONFIG.pageTitle}
          </h1>
          
          {/* Divider */}
          <div className="flex justify-center mb-8">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }}></div>
          </div>
          
          {/* Control Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            {/* Question Types */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <span className="text-lg font-semibold" style={{ color: '#000000' }}>Question Type:</span>
              <div className="flex gap-3">
                {(['multiply', 'divide', 'mixed'] as const).map((type: OperationType) => (
                  <button 
                    key={type} 
                    onClick={() => setOperationType(type)}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                      operationType === type 
                        ? 'bg-blue-900 text-white' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'multiply' ? 'Multiplication' : type === 'divide' ? 'Division' : 'Mixed'}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Toggle */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <span className="text-sm font-semibold" style={{ color: '#000000' }}>Format:</span>
              <button
                onClick={() => setTableFirst(!tableFirst)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  !tableFirst 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                1×4, 2×4, 3×4...
              </button>
              <button
                onClick={() => setTableFirst(!tableFirst)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  tableFirst 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                4×1, 4×2, 4×3...
              </button>
            </div>

            {/* Divider */}
            <div className="flex justify-center my-6">
              <div style={{ width: '80%', height: '1px', backgroundColor: '#e5e7eb' }}></div>
            </div>

            {/* Times Tables Selection */}
            <div className="mb-6">
              <div className="flex justify-center items-center gap-4 mb-4">
                <span className="text-lg font-semibold" style={{ color: '#000000' }}>Select Times Tables:</span>
                <div className="flex gap-2">
                  <button 
                    onClick={selectAll}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-sm"
                  >
                    Select All
                  </button>
                  <button 
                    onClick={selectNone}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-sm"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-10 gap-2 max-w-2xl mx-auto">
                {Array.from({length: 19}, (_, i) => i + 2).map(table => (
                  <button
                    key={table}
                    onClick={() => toggleTable(table)}
                    className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                      selectedTables.includes(table)
                        ? 'bg-blue-900 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {table}
                  </button>
                ))}
              </div>
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

            {/* Generate Button */}
            <div className="flex justify-center">
              <button 
                onClick={handleGeneratePDF}
                disabled={selectedTables.length === 0}
                className={`px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 transition-all ${
                  selectedTables.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-900 text-white hover:bg-blue-800 shadow-xl'
                }`}
              >
                <Download size={24} />
                Generate PDF Quiz
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>How it works:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Select which times tables you want to practice (2-20)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Choose multiplication, division, or mixed questions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Toggle between format styles (e.g., 1×4 vs 4×1)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Set the number of questions (21-60)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Click "Generate PDF Quiz" to create a 2-page PDF with questions and answers</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
