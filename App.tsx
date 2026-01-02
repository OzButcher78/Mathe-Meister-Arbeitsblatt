
import React, { useState, useCallback, useMemo } from 'react';
import { WorksheetSettings, MathProblem } from './types';
import { SUBTYPES } from './constants';
import { generateProblem } from './utils/mathUtils';
import Worksheet from './components/Worksheet';

const PROBLEMS_PER_PAGE = 12;

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

  const hasDivisionSelected = useMemo(() => {
    return settings.enabledSubtypes.some(id => id.startsWith('div_'));
  }, [settings.enabledSubtypes]);

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
  }, [settings]);

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

    // To prevent shifting and blank pages in the PDF:
    // 1. Temporarily set scale to 1:1
    // 2. Hide visual gaps
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
        scrollY: -window.scrollY // Fixes shifting if scrolled
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    // @ts-ignore
    if (typeof html2pdf !== 'undefined') {
      // @ts-ignore
      html2pdf().from(container).set(opt).save().then(() => {
        // Restore layout after generation
        container.style.transform = originalTransform;
        container.className = originalGap;
      });
    } else {
      alert("PDF-Bibliothek lädt noch... bitte versuchen Sie es gleich erneut.");
      container.style.transform = originalTransform;
      container.className = originalGap;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-200 app-container">
      {/* Sidebar */}
      <aside className="w-80 bg-white shadow-2xl overflow-y-auto no-print border-r border-gray-300 flex flex-col">
        <div className="p-6 border-b border-gray-100 bg-indigo-600 text-white">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">📝</span> Mathe Meister Arbeitsblatt
          </h1>
          <p className="text-xs opacity-80 mt-1 uppercase tracking-widest font-semibold">Konfiguration</p>
        </div>

        <div className="p-6 space-y-6 flex-grow">
          <section>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Titel des Arbeitsblatts</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
              placeholder="z.B. Kopfrechnen Übung"
              value={settings.title}
              onChange={e => setSettings({...settings, title: e.target.value})}
            />
            
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Seitenanzahl</label>
            <input 
              type="number" min="1" max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={settings.pageCount}
              onChange={e => setSettings({...settings, pageCount: parseInt(e.target.value) || 1})}
            />
          </section>

          <section>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Aufgabentypen</label>
            <div className="space-y-1">
              {SUBTYPES.map(s => (
                <label key={s.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${settings.enabledSubtypes.includes(s.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'}`}>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded text-indigo-600"
                    checked={settings.enabledSubtypes.includes(s.id)}
                    onChange={() => toggleSubtype(s.id)}
                  />
                  <span className="text-xs font-medium">{s.name}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3 pt-2 border-t border-gray-100">
             <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-xs font-bold text-gray-600 group-hover:text-black">Lösungsblatt erstellen</span>
              <input 
                type="checkbox" 
                className="w-4 h-4"
                checked={settings.generateAnswerKey}
                onChange={e => setSettings({...settings, generateAnswerKey: e.target.checked})}
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-xs font-bold text-gray-600 group-hover:text-black">Negative Subtraktion</span>
              <input 
                type="checkbox" 
                className="w-4 h-4"
                checked={settings.allowNegatives}
                onChange={e => setSettings({...settings, allowNegatives: e.target.checked})}
              />
            </label>
          </section>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button 
            onClick={generate}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-xs uppercase tracking-widest"
          >
            Aufgaben Generieren
          </button>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-grow overflow-y-auto p-12 relative flex flex-col items-center gap-8 no-scrollbar bg-gray-200 main-content">
        <div className="fixed top-6 right-10 z-50 flex items-center gap-6 no-print bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl border border-white">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-tighter">Mathe Meister Arbeitsblatt</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-bold uppercase">Zoom</span>
              <input 
                type="range" min="0.3" max="1" step="0.05" 
                value={previewScale} 
                onChange={e => setPreviewScale(parseFloat(e.target.value))}
                className="w-16 accent-indigo-600 h-1"
              />
            </div>
          </div>
          
          <div className="h-8 w-px bg-gray-200"></div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">PDF:</span>
            <button 
              onClick={handlePrint}
              className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 shadow-sm uppercase tracking-wider"
            >
              🖨️ Drucken
            </button>
            <button 
              onClick={handleDownload}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 shadow-sm uppercase tracking-wider"
            >
              💾 Download
            </button>
          </div>
        </div>

        <div 
          className="flex flex-col gap-16 transition-transform duration-300 ease-out origin-top print-container"
          style={{ transform: `scale(${previewScale})` }}
        >
          {pages.length > 0 ? (
            <>
              {pages.map((problems, pageIdx) => (
                <div key={`page-${pageIdx}`} className="page-break bg-white shadow-2xl printable-page">
                  <Worksheet problems={problems} settings={settings} pageNumber={pageIdx + 1} />
                </div>
              ))}
              
              {settings.generateAnswerKey && pages.map((problems, pageIdx) => (
                <div key={`answer-page-${pageIdx}`} className="page-break bg-white shadow-2xl printable-page">
                  <Worksheet problems={problems} settings={settings} isAnswerKey pageNumber={pageIdx + 1} />
                </div>
              ))}
            </>
          ) : (
            <div className="bg-white p-20 rounded-3xl shadow-xl text-center border-4 border-dashed border-gray-100 flex flex-col items-center justify-center min-h-[800px] w-[210mm]">
              <div className="text-6xl mb-6">📚</div>
              <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest">Warten auf Aufgaben...</h2>
              <p className="text-gray-300 mt-2">Wähle links die gewünschten Aufgaben aus.</p>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .app-container {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            position: relative !important;
          }
          .main-content {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .print-container {
            transform: none !important;
            display: block !important;
            width: 100% !important;
            gap: 0 !important; /* Remove preview gaps between pages for printing */
          }
          .printable-page {
            box-shadow: none !important;
            margin: 0 !important;
            border: none !important;
            width: 210mm !important;
            height: 297mm !important;
            display: block !important;
          }
          /* Prevent blank pages by only breaking AFTER non-last pages */
          .printable-page:not(:last-child) {
            page-break-after: always !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
