
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { WorksheetSettings, MathProblem } from './types';
import { SUBTYPES } from './constants';
import { generateProblem } from './utils/mathUtils';
import Worksheet from './components/Worksheet';

const PROBLEMS_PER_PAGE = 12;
const A4_WIDTH_PX = 794; // Roughly 210mm at 96dpi

type LegalType = 'impressum' | 'datenschutz' | 'nutzung' | null;

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
  const [activeLegal, setActiveLegal] = useState<LegalType>(null);
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
      filename: `Mathe_Arbeitsblaetter_v1_0_${settings.title.replace(/\s+/g, '_') || 'Arbeitsblatt'}.pdf`,
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

  const allProblemsFlat = useMemo(() => pages.flat(), [pages]);

  const renderLegalContent = () => {
    switch (activeLegal) {
      case 'impressum':
        return (
          <>
            <h3 className="text-xl font-bold mb-4">Impressum</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <p><strong>Betreiber der Website</strong></p>
              <p>Dieter Balmer<br />Schweiz</p>
              <p><strong>Kontakt</strong><br />E-Mail: info@sappy.ch</p>
              <p><strong>Haftungsausschluss</strong><br />Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden.</p>
              <p>Diese Website kann Links zu externen Websites Dritter enthalten. Auf deren Inhalte haben wir keinen Einfluss. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Betreiber oder Anbieter verantwortlich.</p>
            </div>
          </>
        );
      case 'datenschutz':
        return (
          <>
            <h3 className="text-xl font-bold mb-4">Datenschutz</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <p><strong>Allgemeiner Hinweis</strong><br />Der Schutz Ihrer persönlichen Daten ist uns wichtig. Diese Anwendung kann grundsätzlich genutzt werden, ohne dass personenbezogene Daten angegeben werden müssen.</p>
              <p><strong>Datenverarbeitung</strong><br />Die Erstellung der Arbeitsblätter erfolgt entweder direkt in Ihrem Browser oder – sofern KI-Funktionen aktiviert sind – über externe KI-Dienste (z. B. Google Gemini). Dabei werden die eingegebenen Inhalte ausschließlich zur Generierung der Arbeitsblätter verwendet.</p>
              <p>Es erfolgt keine dauerhafte Speicherung Ihrer Eingaben oder der generierten Aufgaben auf unseren eigenen Servern.</p>
              <p>Bitte beachten Sie, dass bei Nutzung externer KI-Dienste deren jeweilige Datenschutzbestimmungen gelten.</p>
              <p><strong>Cookies und lokale Speicherung</strong><br />Diese Anwendung verwendet keine Tracking-Cookies und keine externen Analyse-Tools. Technisch notwendige Einstellungen (z. B. Sprache oder Layout) können im lokalen Speicher Ihres Browsers (LocalStorage) abgelegt werden. Diese Daten verbleiben ausschließlich auf Ihrem Endgerät.</p>
            </div>
          </>
        );
      case 'nutzung':
        return (
          <>
            <h3 className="text-xl font-bold mb-4">Nutzungsbedingungen</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <p><strong>1. Geltungsbereich</strong><br />Diese Nutzungsbedingungen regeln die Nutzung des Mathe-Arbeitsblätter-Generators.</p>
              <p><strong>2. Nutzung der Arbeitsblätter</strong><br />Die mit dieser Anwendung erstellten Arbeitsblätter dürfen kostenfrei für private, schulische und pädagogische Zwecke genutzt, ausgedruckt und weitergegeben werden.</p>
              <p><strong>3. Einschränkungen</strong><br />Ein kommerzieller Weiterverkauf der generierten Arbeitsblätter oder der PDFs ist ohne ausdrückliche schriftliche Zustimmung des Betreibers nicht gestattet. Ebenso ist die Nutzung der Anwendung oder ihrer Bestandteile zu kommerziellen Zwecken (z. B. als Teil eines kostenpflichtigen Angebots) ohne Genehmigung untersagt.</p>
              <p><strong>4. Urheberrecht</strong><br />Das Design der Anwendung sowie der Name „Mathe Arbeitsblätter v1.0“ sind urheberrechtlich geschützt. Die generierten Rechenaufgaben selbst gelten als allgemein gebräuchliche Inhalte und unterliegen in der Regel keinem urheberrechtlichen Schutz, sofern keine besondere schöpferische Leistung vorliegt.</p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 app-container font-inter">
      {/* Legal Modal */}
      {activeLegal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 overflow-y-auto no-scrollbar">
              {renderLegalContent()}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setActiveLegal(null)}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar / Settings Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl overflow-y-auto no-print border-r border-gray-200 flex flex-col 
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 bg-indigo-600 text-white flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold leading-tight">Mathe Arbeitsblätter</h1>
            <p className="text-xs opacity-80 mt-1 uppercase tracking-widest font-semibold">v1.0 Generator</p>
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

        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
          <button 
            onClick={generate}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <span>🔄</span> Aufgaben Generieren
          </button>
          
          <div className="pt-2 text-[10px] text-gray-400 font-medium space-y-2">
            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center uppercase tracking-tighter">
              <button onClick={() => setActiveLegal('impressum')} className="hover:text-indigo-600 hover:underline">Impressum</button>
              <button onClick={() => setActiveLegal('datenschutz')} className="hover:text-indigo-600 hover:underline">Datenschutz</button>
              <button onClick={() => setActiveLegal('nutzung')} className="hover:text-indigo-600 hover:underline">Nutzungsbedingungen</button>
            </div>
            <p className="text-center opacity-70">© 2025 Dieter Balmer</p>
          </div>
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
              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-tighter block leading-none mb-1">Mathe Arbeitsblätter v1.0</span>
              <h2 className="text-sm font-bold text-gray-800 leading-none">Vorschau</h2>
            </div>
            <div className="sm:hidden text-indigo-600 font-bold text-sm">Mathe Arbeitsblätter v1.0</div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload}
              className="p-2 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm uppercase tracking-wider"
              title="Download PDF"
            >
              <span className="hidden sm:inline">💾 Download PDF</span>
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
                {pages.map((problems, pageIdx) => (
                  <div key={`page-${pageIdx}`} className="bg-white shadow-2xl printable-page ring-1 ring-black/5">
                    <Worksheet problems={problems} settings={settings} pageNumber={pageIdx + 1} />
                  </div>
                ))}
                
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