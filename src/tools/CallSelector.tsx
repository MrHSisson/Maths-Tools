
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shuffle, UserPlus, Trash2, Copy, RotateCcw,
  UserMinus, Home, Menu, X, CheckCircle2, ArrowRight
} from 'lucide-react';

// ── TYPES ────────────────────────────────────────────────────────────────────

type Pool = string[];

// ── INFO MODAL ───────────────────────────────────────────────────────────────

const InfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" style={{ color: '#1e3a8a' }}>
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Tool Information
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h3 className="font-bold text-blue-900 text-sm mb-1 uppercase tracking-wider">How to use</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Enter student names on the left using commas or new lines. Push them into the active pool to prepare for the Friday Call Draw.
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h3 className="font-bold text-blue-900 text-sm mb-1 uppercase tracking-wider">Management</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Use the reroll icon next to a name to swap a student out. Use the minus icon to remove them from the pool entirely if they aren't eligible this week.
          </p>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

// ── MENU DROPDOWN (v1.5.1 standard) ─────────────────────────────────────────

interface MenuDropdownProps {
  onOpenInfo: () => void;
  onClose: () => void;
}

const MenuDropdown: React.FC<MenuDropdownProps> = ({ onOpenInfo, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
      style={{ minWidth: '200px' }}
    >
      <div className="py-1">
        <button
          onClick={() => { onOpenInfo(); onClose(); }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Tool Information</span>
        </button>
      </div>
    </div>
  );
};

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CallSelector(): JSX.Element {
  const navigate = useNavigate();

  const [nameInput, setNameInput] = useState<string>('');
  const [pool, setPool] = useState<Pool>([]);
  const [count, setCount] = useState<number>(4);
  const [selectedNames, setSelectedNames] = useState<Pool>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const addNames = (): void => {
    if (!nameInput.trim()) return;
    const newNames: string[] = nameInput
      .split(/[\n,]+/)
      .map((n: string) => n.trim())
      .filter((n: string) => n !== '');
    setPool((prev: Pool) => [...new Set([...prev, ...newNames])]);
    setNameInput('');
  };

  const handleDraw = (): void => {
    if (pool.length === 0) return;
    const shuffled: Pool = [...pool].sort(() => 0.5 - Math.random());
    setSelectedNames(shuffled.slice(0, Math.min(count, pool.length)));
  };

  const rerollName = (indexToReplace: number): void => {
    const available: Pool = pool.filter((name: string) => !selectedNames.includes(name));
    if (available.length === 0) return;
    const replacement: string = available[Math.floor(Math.random() * available.length)];
    const updated: Pool = [...selectedNames];
    updated[indexToReplace] = replacement;
    setSelectedNames(updated);
  };

  const removeFromPool = (nameToRemove: string): void => {
    setPool((prev: Pool) => prev.filter((n: string) => n !== nameToRemove));
    setSelectedNames((prev: Pool) => prev.filter((n: string) => n !== nameToRemove));
  };

  const copyToClipboard = (): void => {
    const text: string = selectedNames.join(', ');
    const ta: HTMLTextAreaElement = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAll = (): void => {
    if (window.confirm('Clear active list and results?')) {
      setPool([]);
      setSelectedNames([]);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Navigation Bar — v1.5.1 standard */}
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
          >
            <Home size={24} />
          </button>
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {isMenuOpen && (
              <MenuDropdown
                onOpenInfo={() => setIsInfoOpen(true)}
                onClose={() => setIsMenuOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {isInfoOpen && <InfoModal onClose={() => setIsInfoOpen(false)} />}

      {/* Page Body */}
      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f3f0' }}>
        <div className="max-w-6xl mx-auto">

          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>
            Friday Call Selector
          </h1>
          <div className="flex justify-center mb-10">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }} />
          </div>

          {/* ── Pool Management ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-12">
            <div className="flex flex-col lg:flex-row items-stretch gap-6 mb-8">

              {/* Input */}
              <div className="flex-1 flex flex-col">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                  1. Enter Students
                </span>
                <textarea
                  className="w-full h-48 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-900 outline-none text-base transition-all resize-none"
                  placeholder="Paste names here, separated by commas or new lines..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </div>

              <div className="hidden lg:flex items-center justify-center pt-8">
                <ArrowRight className="text-gray-300" size={32} />
              </div>

              {/* Pool display */}
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    2. Active Pool ({pool.length})
                  </span>
                  {pool.length > 0 && (
                    <button
                      onClick={resetAll}
                      className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 overflow-y-auto max-h-48 custom-scrollbar">
                  {pool.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">
                      Pool is empty
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {pool.map((name: string, i: number) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 shadow-sm"
                        >
                          {name}
                          <button
                            onClick={() => removeFromPool(name)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={addNames}
              className="w-full bg-blue-900 text-white font-bold py-5 rounded-xl shadow-md hover:bg-blue-800 transition-all flex items-center justify-center gap-3 text-xl"
            >
              <UserPlus size={24} /> Push to Pool
            </button>
          </div>

          <div className="flex justify-center mb-10">
            <div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }} />
          </div>

          {/* ── Draw Selector ────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-gray-100">
              <div className="w-full md:w-1/3">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Count
                </label>
                <input
                  type="number"
                  min={1}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl text-3xl font-black focus:border-blue-900 outline-none transition-all"
                />
              </div>
              <div className="w-full md:w-2/3">
                <button
                  onClick={handleDraw}
                  disabled={pool.length === 0}
                  className={`w-full py-5 rounded-xl font-bold text-2xl transition-all shadow-xl flex items-center justify-center gap-4 ${
                    pool.length > 0
                      ? 'bg-blue-900 text-white hover:bg-blue-800 active:scale-95'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Shuffle size={28} /> Draw Selection
                </button>
              </div>
            </div>

            {selectedNames.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                    <CheckCircle2 size={28} className="text-green-600" /> Friday Call List
                  </h2>
                  <button
                    onClick={copyToClipboard}
                    className="px-6 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-sm text-gray-700 transition-all border border-gray-200 flex items-center gap-2 shadow-sm"
                  >
                    {copied ? '✓ Copied' : <><Copy size={18} /> Copy Names</>}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedNames.map((name: string, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors"
                    >
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                          Pick #{idx + 1}
                        </span>
                        <span className="text-4xl font-black text-gray-900">{name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => rerollName(idx)}
                          className="p-4 bg-blue-50 text-blue-900 rounded-2xl hover:bg-blue-900 hover:text-white transition-all shadow-sm"
                          title="Reroll"
                        >
                          <RotateCcw size={28} />
                        </button>
                        <button
                          onClick={() => removeFromPool(name)}
                          className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="Remove from pool"
                        >
                          <UserMinus size={28} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center border-4 border-dashed border-gray-100 rounded-3xl">
                <p className="text-gray-300 text-3xl font-bold italic tracking-tight">
                  No names selected yet
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>
    </>
  );
}
