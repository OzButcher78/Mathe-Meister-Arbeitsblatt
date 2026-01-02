
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { WorksheetSettings, MathProblem, Language } from './types';
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
    language: 'de',
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

  const t = (de: string, en: string) => settings.language === 'de' ? de : en;

  // Auto-fit scale logic for responsive preview
  const updateScale = useCallback(() => {
    if (mainContentRef.current) {
      const padding = window.innerWidth < 640 ? 32 : 96; 
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
      alert(t("Bitte wählen Sie mindestens einen Aufgabentyp aus.", "Please select at least one problem type."));
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
      alert(t("Bitte klicken Sie zuerst auf 'Aufgaben Generieren'.", "Please click 'Generate Problems' first."));
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
      filename: `${t('Mathe_Arbeitsblaetter', 'Math_Worksheets')}_2026_${settings.title.replace(/\s+/g, '_') || 'Worksheet'}.pdf`,
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
      alert(t("PDF-Bibliothek lädt noch...", "PDF library is still loading..."));
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
            <h3 className="text-xl font-bold mb-4">{t('Impressum', 'Imprint')}</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <p><strong>{t('Betreiber der Website', 'Website Operator')}</strong></p>
              <p>Dieter Balmer<br />{t('Schweiz', 'Switzerland')}</p>
              <p><strong>{t('Kontakt', 'Contact')}</strong><br />E-Mail: info@sappy.ch</p>
              <p><strong>{t('Haftungsausschluss', 'Disclaimer')}</strong><br />{t('Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Die Nutzung der Inhalte der Website erfolgt auf eigene Gefahr des Nutzers.', 'The contents of this website were created with the greatest possible care. However, we cannot guarantee the accuracy, completeness, and timeliness of the content. Use of the website\'s content is at the user\'s own risk.')}</p>
              <p><strong>{t('Urheberrecht', 'Copyright')}</strong><br />{t('Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem schweizerischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung.', 'The content and works created by the site operators on these pages are subject to Swiss copyright law. Reproduction, editing, distribution, and any kind of exploitation outside the limits of copyright law require written consent.')}</p>
            </div>
          </>
        );
      case 'datenschutz':
        return (
          <>
            <h3 className="text-xl font-bold mb-4">{t('Datenschutz', 'Privacy Policy')}</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <p><strong>{t('Allgemeiner Hinweis', 'General Information')}</strong><br />{t('Der Schutz Ihrer persönlichen Daten ist uns wichtig. Diese Anwendung generiert PDF-Dateien lokal in Ihrem Browser. Es werden keine persönlichen Rechendaten auf unseren Servern gespeichert.', 'The protection of your personal data is very important to us. This application generates PDF files locally in your browser. No personal calculation data is stored on our servers.')}</p>
              <p><strong>{t('Server-Log-Files', 'Server Log Files')}</strong><br />{t('Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Files, die Ihr Browser automatisch an uns übermittelt (Browsertyp, Betriebssystem, Referrer URL, Hostname des zugreifenden Rechners, Uhrzeit der Serveranfrage).', 'The provider of the pages automatically collects and stores information in so-called server log files, which your browser automatically transmits to us (browser type, operating system, referrer URL, host name of the accessing computer, time of server request).')}</p>
              <p><strong>{t('Rechte des Nutzers', 'User Rights')}</strong><br />{t('Sie haben das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten sowie ein Recht auf Berichtigung oder Löschung dieser Daten.', 'You have the right to free information about your stored personal data as well as a right to correction or deletion of this data.')}</p>
            </div>
          </>
        );
      case 'nutzung':
        return (
          <>
            <h3 className="text-xl font-bold mb-4">{t('Nutzungsbedingungen', 'Terms of Use')}</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <p><strong>1. {t('Geltungsbereich', 'Scope')}</strong><br />{t('Diese Nutzungsbedingungen regeln die Nutzung der Web-Applikation "Mathe Arbeitsblätter".', 'These terms of use govern the use of the "Math Worksheets" web application.')}</p>
              <p><strong>2. {t('Nutzungsrechte', 'Usage Rights')}</strong><br />{t('Die generierten Arbeitsblätter dürfen für persönliche, nicht-kommerzielle und pädagogische Zwecke (z.B. in Schulen oder für das Homeschooling) verwendet werden. Eine weitergehende Verbreitung oder ein kommerzieller Verkauf der Software selbst ist untersagt.', 'The generated worksheets may be used for personal, non-commercial, and educational purposes (e.g., in schools or for homeschooling). Further distribution or commercial sale of the software itself is prohibited.')}</p>
              <p><strong>3. {t('Gewährleistung', 'Warranty')}</strong><br />{t('Die Software wird "wie besehen" ohne jegliche Gewährleistung zur Verfügung gestellt. Wir übernehmen keine Haftung für Schäden, die aus der Nutzung der Applikation entstehen.', 'The software is provided "as is" without any warranty of any kind. We assume no liability for damages resulting from the use of the application.')}</p>
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
                {t('Schließen', 'Close')}
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
            <h1 className="text-xl font-semibold leading-tight">{t('Mathe Arbeitsblätter', 'Math Worksheets')}</h1>
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
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">{t('Arbeitsblatt Titel', 'Worksheet Title')}</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none mb-4 bg-gray-50"
              placeholder={t("z.B. Kopfrechnen Übung", "e.g. Mental Math Practice")}
              value={settings.title}
              onChange={e => setSettings({...settings, title: e.target.value})}
            />
            
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">{t('Seitenanzahl', 'Page Count')}</label>
            <input 
              type="number" min="1" max="10"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 font-bold"
              value={settings.pageCount}
              onChange={e => setSettings({...settings, pageCount: parseInt(e.target.value) || 1})}
            />
          </section>

          <section>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-3">{t('Aufgabentypen', 'Problem Types')}</label>
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
              <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-600 transition-colors">{t('Lösungsblatt', 'Answer Key')}</span>
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
              <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-600 transition-colors">{t('Neg. Zahlen', 'Neg. Numbers')}</span>
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
            <span>🔄</span> {t('Aufgaben Generieren', 'Generate Problems')}
          </button>
          
          {/* Language Switcher */}
          <div className="flex justify-center gap-2">
            <button 
              onClick={() => setSettings(s => ({...s, language: 'en'}))}
              className={`px-3 py-1 text-[10px] font-bold rounded-md border transition-colors ${settings.language === 'en' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setSettings(s => ({...s, language: 'de'}))}
              className={`px-3 py-1 text-[10px] font-bold rounded-md border transition-colors ${settings.language === 'de' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200'}`}
            >
              DE
            </button>
          </div>
          
          <div className="pt-2 text-[10px] text-gray-400 font-medium space-y-2">
            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center uppercase tracking-tighter">
              <button onClick={() => setActiveLegal('impressum')} className="hover:text-indigo-600 hover:underline">{t('Impressum', 'Imprint')}</button>
              <button onClick={() => setActiveLegal('datenschutz')} className="hover:text-indigo-600 hover:underline">{t('Datenschutz', 'Privacy')}</button>
              <button onClick={() => setActiveLegal('nutzung')} className="hover:text-indigo-600 hover:underline">{t('Nutzungsbedingungen', 'Terms')}</button>
            </div>
            <p className="text-center opacity-70">© 2026 Sappy.ch - Dieter Balmer</p>
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
              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-tighter block leading-none mb-1">{t('Mathe Arbeitsblätter v1.0', 'Math Worksheets v1.0')}</span>
              <h2 className="text-sm font-bold text-gray-800 leading-none">{t('Vorschau', 'Preview')}</h2>
            </div>
            <div className="sm:hidden text-indigo-600 font-bold text-sm">Mathe Arbeitsblätter v1.0</div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload}
              className="p-2 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm uppercase tracking-wider"
              title={t("PDF Herunterladen", "Download PDF")}
            >
              <span className="hidden sm:inline">💾 {t('PDF Herunterladen', 'Download PDF')}</span>
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
                <h2 className="text-base sm:text-xl font-bold text-gray-400 uppercase tracking-widest">{t('Warten auf Aufgaben...', 'Waiting for problems...')}</h2>
                <p className="text-gray-300 mt-2 text-xs sm:text-sm">{t('Wähle links die Aufgaben aus und klicke auf Generieren.', 'Choose tasks on the left and click Generate.')}</p>
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
