
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { WorksheetSettings, MathProblem } from './types';
import { SUBTYPES } from './constants';
import { generateProblem } from './utils/mathUtils';
import Worksheet from './components/Worksheet';

const PROBLEMS_PER_PAGE = 12;
const A4_WIDTH_PX = 794; // Roughly 210mm at 96dpi

const App: React.FC = () => {
  const [settings, setSettings] = useState<WorksheetSettings>({
    title: '', 
    enabledSubtypes: [], 
    allowNegatives: false,
    wholeNumberDivisionOnly: true,
    generateAnswerKey: false,
    pageCount: 1,
    longMultiplication: {
      multiplicandDigits: 4,
      multiplierDigits: 2,
    }
  });

  const [pages, setPages] = useState<MathProblem[][]>([]);
  const [previewScale, setPreviewScale] = useState(0.85);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Auto-fit scale logic for responsive preview
  const updateScale = useCallback(() => {
    if (mainContentRef.current) {
      const padding = window.innerWidth < 640 ? 32 : 96; // Adjust padding for mobile vs desktop
      const availableWidth = mainContentRef.current.clientWidth - padding;
      const fitScale = Math.min(availableWidth / A4_WIDTH_PX, 1);
      setPreviewScale(fitScale);
    }
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  const generate = useCallback(() => {
    if (settings.enabledSubtypes.length === 0) {
      alert("Bitte wählen Sie mindestens einen Aufgabentyp aus.");
      return;
    }

    const allPages: MathProblem[][] = [];
    const seenGlobal = new Set<string>();

    const activeSubtypes = SUBTYPES.filter(s => settings.enabledSubtypes.includes(s.id));

    for (let p = 0; p < settings.pageCount; p++) {
      const pageProblems: MathProblem[] = [];
      for (let i = 0; i < PROBLEMS_PER_PAGE; i++) {
        let attempts = 0;
        let problem: MathProblem;
        do {
          const subtype = activeSubtypes[Math.floor(Math.random() * activeSubtypes.length)];
          problem = generateProblem(subtype, {
            allowNegatives: settings.allowNegatives,
            wholeNumberDivision: settings.wholeNumberDivisionOnly,
            longMulti: {
              m1: settings.longMultiplication.multiplicandDigits,
              m2: settings.longMultiplication.multiplierDigits
            }
          });
          attempts++;
        } while (seenGlobal.has(`${problem.num1}${problem.operation}${problem.num2}`) && attempts < 30);
        
        seenGlobal.add(`${problem.num1}${problem.operation}${problem.num2}`);
        pageProblems.push(problem);
      }
      allPages.push(pageProblems);
    }

    setPages(allPages);
    setIsSidebarOpen(false);
    setTimeout(updateScale, 100);
  }, [settings, updateScale]);

  const toggleSubtype = (id: string) => {
    setSettings(prev => ({
      ...prev,
      enabledSubtypes: prev.enabledSubtypes.includes(id)
        ? prev.enabledSubtypes.filter(i => i !== id)
        : [...prev.enabledSubtypes, id]
    }));
  };

  const handlePrint = () => {
    if (pages.length === 0) {
      alert("Bitte klicken Sie zuerst auf 'Aufgaben Generieren'.");
      return;
    }
    window.focus();
    window.print();
  };

  const handleDownload = () => {
    if (pages.length === 0) {
      alert("Bitte klicken Sie zuerst auf 'Aufgaben Generieren'.");
      return;
    }

    const container = document.querySelector('.print-container') as HTMLElement;
    if (!container) return;

    const originalTransform = container.style.transform;
    const originalGap = container.className;
    
    container.style.transform = 'none';
    container.classList.remove('gap-16');

    const opt = {
      margin: 0,
      filename: `Mathe_Meister_${settings.title.replace(/\s+/g, '_') || 'Arbeitsblatt'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        scrollY: -window.scrollY
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    // @ts-ignore
    if (typeof html2pdf !== 'undefined') {
      // @ts-ignore
      html2pdf().from(container).set(opt).save().then(() => {
        container.style.transform = originalTransform;
        container.className = originalGap;
      });
    } else {
      alert("PDF-Bibliothek lädt noch... bitte versuchen Sie es gleich erneut.");
      container.style.transform = originalTransform;
      container.className = originalGap;
    }
  };

  // Flatten all problems for the compact answer key
  const allProblemsFlat = useMemo(() => pages.flat(), [pages]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 app-container font-inter">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar / Settings Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl overflow-y-auto no-print border-r border-gray-300 flex flex-col 
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 bg-indigo-600 text-white flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Mathe Meister</h1>
            <p className="text-xs opacity-80 mt-1 uppercase tracking-widest font-semibold">Generator</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 flex-grow">
          <section>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Arbeitsblatt Titel</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none mb-4 bg-gray-50"
              placeholder="z.B. Kopfrechnen Übung"
              value={settings.title}
              onChange={e => setSettings({...settings, title: e.target.value})}
            />
            
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Seitenanzahl</label>
            <input 
              type="number" min="1" max="10"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 font-bold"
              value={settings.pageCount}
              onChange={e => setSettings({...settings, pageCount: parseInt(e.target.value) || 1})}
            />
          </section>

          <section>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-3">Aufgabentypen</label>
            <div className="grid grid-cols-1 gap-2">
              {SUBTYPES.map(s => (
                <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${settings.enabledSubtypes.includes(s.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    checked={settings.enabledSubtypes.includes(s.id)}
                    onChange={() => toggleSubtype(s.id)}
                  />
                  <span className="text-xs font-medium leading-tight">{s.name}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-gray-100">
             <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-600 transition-colors">Lösungsblatt</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.generateAnswerKey ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                <input 
                  type="checkbox" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  checked={settings.generateAnswerKey}
                  onChange={e => setSettings({...settings, generateAnswerKey: e.target.checked})}
                />
                <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${settings.generateAnswerKey ? 'translate-x-5' : ''}`}></div>
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-600 transition-colors">Neg. Zahlen</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.allowNegatives ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                <input 
                  type="checkbox" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  checked={settings.allowNegatives}
                  onChange={e => setSettings({...settings, allowNegatives: e.target.checked})}
                />
                <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${settings.allowNegatives ? 'translate-x-5' : ''}`}></div>
              </div>
            </label>
          </section>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <button 
            onClick={generate}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <span>🔄</span> Aufgaben Generieren
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col relative overflow-hidden h-full" ref={mainContentRef}>
        
        {/* Responsive Navbar */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-gray-200 no-print shadow-sm z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <div className="hidden sm:block">
              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-tighter block leading-none mb-1">Mathe Meister</span>
              <h2 className="text-sm font-bold text-gray-800 leading-none">Arbeitsblatt Vorschau</h2>
            </div>
            <div className="sm:hidden text-indigo-600 font-bold text-sm">Mathe Meister</div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="p-2 sm:px-4 sm:py-2 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm uppercase tracking-wider"
              title="Drucken"
            >
              <span className="hidden sm:inline">🖨️ Drucken</span>
              <span className="sm:hidden text-lg">🖨️</span>
            </button>
            <button 
              onClick={handleDownload}
              className="p-2 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm uppercase tracking-wider"
              title="Download PDF"
            >
              <span className="hidden sm:inline">💾 Download</span>
              <span className="sm:hidden text-lg">💾</span>
            </button>
          </div>
        </header>

        {/* Scrollable Preview Container */}
        <div className="flex-grow overflow-auto p-4 sm:p-12 no-scrollbar bg-gray-200 flex flex-col items-center">
          <div 
            className="flex flex-col gap-16 transition-transform duration-300 ease-out origin-top print-container pb-20"
            style={{ transform: `scale(${previewScale})` }}
          >
            {pages.length > 0 ? (
              <>
                {/* Standard Problem Pages */}
                {pages.map((problems, pageIdx) => (
                  <div key={`page-${pageIdx}`} className="bg-white shadow-2xl printable-page ring-1 ring-black/5">
                    <Worksheet problems={problems} settings={settings} pageNumber={pageIdx + 1} />
                  </div>
                ))}
                
                {/* Single Compact Answer Sheet */}
                {settings.generateAnswerKey && (
                  <div key="answer-page-compact" className="bg-white shadow-2xl printable-page ring-1 ring-black/5">
                    <Worksheet 
                      problems={allProblemsFlat} 
                      settings={settings} 
                      isAnswerKey={true} 
                      pageNumber={1} 
                    />
                  </div>
                )}
              </>
            ) : (
              <div 
                className="bg-white p-8 sm:p-20 rounded-3xl shadow-xl text-center border-4 border-dashed border-gray-100 flex flex-col items-center justify-center min-h-[400px] sm:min-h-[800px] w-full"
                style={{ maxWidth: '210mm' }}
              >
                <div className="text-5xl sm:text-6xl mb-6 grayscale opacity-20">📚</div>
                <h2 className="text-base sm:text-xl font-bold text-gray-400 uppercase tracking-widest">Warten auf Aufgaben...</h2>
                <p className="text-gray-300 mt-2 text-xs sm:text-sm">Wähle links die Aufgaben aus und klicke auf Generieren.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @media print {
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .app-container { display: block !important; height: auto !important; overflow: visible !important; position: relative !important; }
          .print-container { transform: none !important; display: block !important; width: 100% !important; gap: 0 !important; padding: 0 !important; }
          .printable-page { box-shadow: none !important; margin: 0 !important; border: none !important; width: 210mm !important; height: 297mm !important; display: block !important; }
          .printable-page:not(:last-child) { page-break-after: always !important; }
          @page { size: A4; margin: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
