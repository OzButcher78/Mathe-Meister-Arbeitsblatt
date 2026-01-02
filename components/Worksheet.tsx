
import React from 'react';
import { MathProblem, WorksheetSettings, MathOperation } from '../types';
import ProblemRenderer from './ProblemRenderer';

interface WorksheetProps {
  problems: MathProblem[];
  settings: WorksheetSettings;
  isAnswerKey?: boolean;
  pageNumber: number;
  totalProblems?: number;
}

const SmileyHappy = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const SmileyNeutral = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="15" x2="16" y2="15" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const SmileySad = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
    <circle cx="12" cy="12" r="10" />
    <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const Worksheet: React.FC<WorksheetProps> = ({ problems, settings, isAnswerKey = false, pageNumber }) => {
  
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

  return (
    <div 
      className="bg-white mx-auto overflow-hidden flex flex-col relative box-border worksheet-page" 
      style={{ 
        width: '210mm', 
        height: '297mm', 
        padding: '10mm 15mm',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-4">
        <div className="flex-grow">
          <h1 className="text-2xl font-bold text-black math-font mb-1">
            {isAnswerKey 
              ? (settings.title ? `Lösungen: ${settings.title}` : 'Lösungsschlüssel') 
              : (settings.title || 'Matheübung')}
          </h1>
          {!isAnswerKey && (
            <div className="flex gap-8 text-sm text-black mt-2 math-font">
              <p>Name: __________________________</p>
              <p>Datum: __________________________</p>
            </div>
          )}
          {isAnswerKey && (
            <p className="text-xs text-gray-600 font-bold math-font mt-1 uppercase tracking-wide">
              Alle Aufgaben der Seiten 1 bis {settings.pageCount}
            </p>
          )}
        </div>
        <div className="text-right flex flex-col items-end justify-between self-stretch">
           <div className="text-[9px] font-bold uppercase tracking-widest text-black whitespace-nowrap mb-1">Mathe Arbeitsblätter v1.0</div>
           <div className="text-[9px] text-gray-500 font-medium">
             {isAnswerKey ? 'Lösungsblatt' : `Seite ${pageNumber}`}
           </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow">
        {isAnswerKey ? (
          <div className="grid grid-cols-3 gap-x-8 gap-y-2 mt-2 math-font text-xs">
            {problems.map((p, idx) => (
              <div key={p.id} className="flex items-center border-b border-gray-100 pb-1">
                <span className="font-bold text-gray-400 mr-2 min-w-[20px] text-right">{idx + 1})</span>
                <span className="text-black whitespace-nowrap">
                  {formatProblemInline(p)} = <span className="text-blue-700 font-bold">{p.answer}{p.remainder ? ` R${p.remainder}` : ''}</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-y-6 gap-x-12">
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
        <div className="mt-2 border-t-2 border-black pt-4 flex flex-col math-font text-black">
          <div className="grid grid-cols-2 gap-4 items-start">
            <div className="space-y-3">
               <p className="text-[10px] font-bold border-l-4 border-black pl-2 uppercase tracking-wide">Wie fandest du dieses Blatt?</p>
               <div className="flex gap-6 items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black rounded-sm"></div>
                    <SmileyHappy />
                    <span className="text-[9px] font-bold uppercase">Super!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black rounded-sm"></div>
                    <SmileyNeutral />
                    <span className="text-[9px] font-bold uppercase">O.K.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black rounded-sm"></div>
                    <SmileySad />
                    <span className="text-[9px] font-bold uppercase">Schwer</span>
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-4 items-end">
              <div className="text-xs font-bold text-right">
                Bewertung: ____________________
              </div>
              <div className="text-right">
                <p className="whitespace-nowrap font-bold text-xs">Unterschrift: __________________________</p>
              </div>
            </div>
          </div>
          <div className="mt-4 text-[8px] text-gray-400 text-left opacity-50 uppercase tracking-widest italic">
            © 2025 Dieter Balmer
          </div>
        </div>
      )}

      {isAnswerKey && (
        <div className="mt-auto border-t border-gray-200 pt-2 flex flex-col gap-1">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">
            Zusammenfassung aller Lösungen für dieses Set
          </p>
          <p className="text-[8px] text-gray-400 opacity-50 uppercase tracking-widest italic text-left">
            © 2025 Dieter Balmer
          </p>
        </div>
      )}
    </div>
  );
};

export default Worksheet;
