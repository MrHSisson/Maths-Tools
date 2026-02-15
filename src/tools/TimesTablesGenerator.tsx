import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Home, Menu, X, Eye } from 'lucide-react';
import { jsPDF } from 'jspdf';

// TIMES TABLES GENERATOR
// A tool for generating customizable times tables practice with PDF export

const TOOL_CONFIG = {
  pageTitle: 'Times Tables Generator',
};

// TYPE DEFINITIONS
type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';

type Question = {
  question: string;
  answer: number;
};

// QUESTION GENERATION
const generateQuestions = (
  selectedTables: number[],
  numQuestions: number,
  includeMultiply: boolean,
  includeDivide: boolean,
  tableFirst: boolean
): Question[] => {
  const allPossible: Array<{ type: string; a?: number; b?: number; dividend?: number; divisor?: number; answer: number }> = [];
  
  selectedTables.forEach(selectedTable => {
    for (let otherFactor = 1; otherFactor <= 12; otherFactor++) {
      const product = selectedTable * otherFactor;
      
      // Add multiplication questions
      if (includeMultiply) {
        allPossible.push({ 
          type: 'multiply',
          a: selectedTable, 
          b: otherFactor,
          answer: product
        });
      }
      
      // Add division questions
      if (includeDivide) {
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

export default function TimesTablesQuizGenerator() {
  const navigate = useNavigate();
  const [selectedTables, setSelectedTables] = useState<number[]>([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const [numQuestions, setNumQuestions] = useState<number>(40);
  const [includeMultiply, setIncludeMultiply] = useState<boolean>(true);
  const [includeDivide, setIncludeDivide] = useState<boolean>(false);
  const [tableFirst, setTableFirst] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  const toggleTable = (table: number): void => {
    setSelectedTables(prev => 
      prev.includes(table) 
        ? prev.filter(t => t !== table)
        : [...prev, table].sort((a, b) => a - b)
    );
    setError('');
  };

  const selectAll = (): void => {
    setSelectedTables(Array.from({length: 20}, (_, i) => i + 1));
  };

  const selectNone = (): void => {
    setSelectedTables([]);
  };

  const handleGeneratePreview = (): void => {
    if (selectedTables.length === 0) {
      setError('Please select at least one times table');
      return;
    }

    if (!includeMultiply && !includeDivide) {
      setError('Please select at least one question type (Multiply or Divide)');
      return;
    }

    const questions = generateQuestions(selectedTables, numQuestions, includeMultiply, includeDivide, tableFirst);
    setPreviewQuestions(questions);
    setError('');
  };

  const handleGeneratePDF = (): void => {
    if (selectedTables.length === 0) {
      setError('Please select at least one times table');
      return;
    }

    if (!includeMultiply && !includeDivide) {
      setError('Please select at least one question type (Multiply or Divide)');
      return;
    }

    const questions = generateQuestions(selectedTables, numQuestions, includeMultiply, includeDivide, tableFirst);
    
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
      title: `Times Tables ${dateStr}`,
      subject: 'Mathematics Practice',
      author: 'Times Tables Generator',
      keywords: 'times tables, multiplication, quiz',
      creator: 'Times Tables Generator'
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
    doc.text('Times Tables Generator', pageWidth / 2, pageHeight - 10, { align: 'center' });

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
    doc.text('Times Tables Generator', pageWidth / 2, pageHeight - 10, { align: 'center' });

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
            onClick={() => navigate('/')}
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
          
          {/* Control Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            {/* Question Types - Checkboxes */}
            <div className="flex justify-center items-center gap-6 mb-6">
              <span className="text-lg font-semibold" style={{ color: '#000000' }}>Question Types:</span>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeMultiply}
                    onChange={(e) => setIncludeMultiply(e.target.checked)}
                    className="w-5 h-5 cursor-pointer accent-color"
                    style={{ accentColor: '#1e3a8a' }}
                  />
                  <span className="text-lg font-semibold" style={{ color: '#000000' }}>Multiply</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeDivide}
                    onChange={(e) => setIncludeDivide(e.target.checked)}
                    className="w-5 h-5 cursor-pointer"
                    style={{ accentColor: '#1e3a8a' }}
                  />
                  <span className="text-lg font-semibold" style={{ color: '#000000' }}>Divide</span>
                </label>
              </div>
            </div>

            {/* Format Toggle Switch */}
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
                    style={{ 
                      left: tableFirst ? '32px' : '4px',
                      transform: 'translateX(0)'
                    }}
                  />
                </button>
                <span className={`text-sm font-semibold ${tableFirst ? 'text-blue-900' : 'text-gray-500'}`}>
                  TT Last (e.g. 3 × <span style={{ textDecoration: 'underline' }}>2</span>)
                </span>
              </div>
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
              
              <div className="grid grid-cols-10 gap-3 max-w-4xl mx-auto">
                {Array.from({length: 20}, (_, i) => i + 1).map(table => (
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
                disabled={selectedTables.length === 0 || (!includeMultiply && !includeDivide)}
                className={`px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 transition-all ${
                  selectedTables.length === 0 || (!includeMultiply && !includeDivide)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-900 text-white hover:bg-blue-800 shadow-xl'
                }`}
              >
                <Eye size={24} />
                Generate Preview
              </button>
              <button 
                onClick={handleGeneratePDF}
                disabled={selectedTables.length === 0 || (!includeMultiply && !includeDivide)}
                className={`px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 transition-all ${
                  selectedTables.length === 0 || (!includeMultiply && !includeDivide)
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
                  <div key={idx}>
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
                <span>Select which times tables you want to practice (1-20)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Choose multiplication, division, or both (mixed questions)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Toggle between format styles (TT First vs TT Last)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Set the number of questions (21-60)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Click "Generate Preview" to see a sample of your questions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-900 font-bold">•</span>
                <span>Click "Generate PDF" to create a 2-page worksheet with questions and answers</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
