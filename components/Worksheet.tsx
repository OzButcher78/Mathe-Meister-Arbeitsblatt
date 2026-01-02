
import React from 'react';
import { MathProblem, WorksheetSettings, MathOperation, Language } from '../types';
import ProblemRenderer from './ProblemRenderer';

interface WorksheetProps {
  problems: MathProblem[];
  settings: WorksheetSettings;
  isAnswerKey?: boolean;
  pageNumber: number;
  totalProblems?: number;
}

const SmileyHappy = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
    <circle cx="12" cy="12" r="10" />
    <path d="M7 13c1.5 4 8.5 4 10 0" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const SmileyNeutral = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 15.5c1 1 5 1 6 0" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const SmileySad = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
    <circle cx="12" cy="12" r="10" />
    <path d="M16 16.5c-1.5-2-6.5-2-8 0" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const Worksheet: React.FC<WorksheetProps> = ({ problems, settings, isAnswerKey = false, pageNumber }) => {
  const lang = settings.language;
  
  const t = (de: string, en: string) => lang === 'de' ? de : en;

  const getSymbol = (op: MathOperation) => {
    switch (op) {
      case MathOperation.ADDITION: return '+';
      case MathOperation.SUBTRACTION: return '-';
      case MathOperation.MULTIPLICATION: return '×';
      case MathOperation.DIVISION: return '÷';
      default: return '';
    }
  };

  const formatProblemInline = (p: MathProblem) => {
    const symbol = getSymbol(p.operation);
    return `${p.num1} ${symbol} ${p.num2}`;
  };

  const copyrightText = "© 2026 Sappy.ch - Dieter Balmer";

  return (
    <div 
      className="bg-white mx-auto overflow-hidden flex flex-col relative box-border worksheet-page" 
      style={{ 
        width: '210mm', 
        height: '297mm', 
        padding: '12mm 15mm',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-8">
        <div className="flex-grow">
          <h1 className="text-3xl font-bold text-black math-font mb-1">
            {isAnswerKey 
              ? (settings.title ? `${t('Lösungen', 'Solutions')}: ${settings.title}` : t('Lösungsschlüssel', 'Answer Key')) 
              : (settings.title || t('Matheübung', 'Math Exercise'))}
          </h1>
          {!isAnswerKey && (
            <div className="flex gap-10 text-base text-black mt-3 math-font">
              <p>{t('Name', 'Name')}: __________________________</p>
              <p>{t('Datum', 'Date')}: __________________________</p>
            </div>
          )}
          {isAnswerKey && (
            <p className="text-sm text-gray-600 font-bold math-font mt-1 uppercase tracking-wide">
              {t(`Alle Aufgaben der Seiten 1 bis ${settings.pageCount}`, `All problems from pages 1 to ${settings.pageCount}`)}
            </p>
          )}
        </div>
        <div className="text-right flex flex-col items-end justify-between self-stretch">
           <div className="text-[10px] font-bold uppercase tracking-widest text-black whitespace-nowrap mb-1">
             {t('Mathe Arbeitsblätter v1.0', 'Math Worksheets v1.0')}
           </div>
           <div className="text-[10px] text-gray-500 font-medium">
             {isAnswerKey ? t('Lösungsblatt', 'Answer Sheet') : `${t('Seite', 'Page')} ${pageNumber}`}
           </div>
        </div>
      </div>

      {/* Content Area - Maintain high gap-y to fill the page */}
      <div className="flex-grow">
        {isAnswerKey ? (
          <div className="grid grid-cols-3 gap-x-8 gap-y-3 mt-4 math-font text-sm">
            {problems.map((p, idx) => (
              <div key={p.id} className="flex items-center border-b border-gray-100 pb-1">
                <span className="font-bold text-gray-400 mr-2 min-w-[24px] text-right">{idx + 1})</span>
                <span className="text-black whitespace-nowrap">
                  {formatProblemInline(p)} = <span className="text-blue-700 font-bold">{p.answer}{p.remainder ? ` R${p.remainder}` : ''}</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-y-24 gap-x-12 mt-4">
            {problems.map((p, idx) => (
              <div key={p.id} className="flex justify-center">
                <ProblemRenderer problem={p} showAnswer={false} index={idx + (pageNumber - 1) * 12} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Area */}
      {!isAnswerKey && (
        <div className="mt-8 border-t-2 border-black pt-6 flex flex-col math-font text-black">
          <div className="grid grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
               <p className="text-xs font-bold border-l-4 border-black pl-2 uppercase tracking-wide">
                 {t('Wie fandest du dieses Blatt?', 'How did you find this sheet?')}
               </p>
               <div className="flex gap-10 items-center pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-black rounded-sm"></div>
                    <div className="flex flex-col items-center">
                      <SmileyHappy />
                      <span className="text-[9px] font-bold uppercase mt-1">{t('Super!', 'Great!')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-black rounded-sm"></div>
                    <div className="flex flex-col items-center">
                      <SmileyNeutral />
                      <span className="text-[9px] font-bold uppercase mt-1">O.K.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-black rounded-sm"></div>
                    <div className="flex flex-col items-center">
                      <SmileySad />
                      <span className="text-[9px] font-bold uppercase mt-1">{t('Schwer', 'Hard')}</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-12 items-end pt-1">
              <div className="text-sm font-bold text-right flex items-center gap-2">
                {t('Bewertung', 'Rating')}: <span className="inline-block w-32 border-b-2 border-black h-5"></span>
              </div>
              <div className="text-right">
                <p className="whitespace-nowrap font-bold text-sm">{t('Unterschrift', 'Signature')}: __________________________</p>
              </div>
            </div>
          </div>
          <div className="mt-6 text-[8px] text-gray-400 text-left opacity-60 uppercase tracking-widest italic font-bold">
            {copyrightText}
          </div>
        </div>
      )}

      {isAnswerKey && (
        <div className="mt-auto border-t border-gray-200 pt-4 flex flex-col gap-1">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
            {t('Zusammenfassung aller Lösungen für dieses Set', 'Summary of all solutions for this set')}
          </p>
          <p className="text-[9px] text-gray-400 opacity-60 uppercase tracking-widest italic text-left font-bold">
            {copyrightText}
          </p>
        </div>
      )}
    </div>
  );
};

export default Worksheet;
