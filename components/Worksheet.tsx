
import React from 'react';
import { MathProblem, WorksheetSettings, MathOperation } from '../types';
import ProblemRenderer from './ProblemRenderer';

interface WorksheetProps {
  problems: MathProblem[];
  settings: WorksheetSettings;
  isAnswerKey?: boolean;
  pageNumber: number;
  totalProblems?: number; // Optional: used for global indexing in answer key
}

const Worksheet: React.FC<WorksheetProps> = ({ problems, settings, isAnswerKey = false, pageNumber, totalProblems }) => {
  
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
    if (p.operation === MathOperation.DIVISION) {
        // Traditional inline division format
        return `${p.num1} ${symbol} ${p.num2}`;
    }
    return `${p.num1} ${symbol} ${p.num2}`;
  };

  return (
    <div 
      className="bg-white mx-auto overflow-hidden flex flex-col relative box-border worksheet-page" 
      style={{ 
        width: '210mm', 
        height: '297mm', 
        padding: '15mm',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8">
        <div className="flex-grow">
          <h1 className="text-3xl font-bold text-black math-font mb-2">
            {isAnswerKey 
              ? (settings.title ? `Lösungen: ${settings.title}` : 'Lösungsschlüssel') 
              : (settings.title || 'Matheübung')}
          </h1>
          {!isAnswerKey && (
            <div className="flex gap-10 text-base text-black mt-4 math-font">
              <p>Name: __________________________</p>
              <p>Datum: __________________________</p>
            </div>
          )}
          {isAnswerKey && (
            <p className="text-sm text-gray-600 font-bold math-font mt-2 uppercase tracking-wide">
              Alle Aufgaben der Seiten 1 bis {settings.pageCount}
            </p>
          )}
        </div>
        <div className="text-right flex flex-col items-end justify-between self-stretch">
           <div className="text-[10px] font-bold uppercase tracking-widest text-black whitespace-nowrap mb-1">Mathe Arbeitsblätter v1.0</div>
           <div className="text-[10px] text-gray-500 font-medium">
             {isAnswerKey ? 'Lösungsblatt' : `Seite ${pageNumber}`}
           </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow">
        {isAnswerKey ? (
          /* Compact Answer Key List */
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
          /* Standard Problem Grid */
          <div className="grid grid-cols-3 gap-y-16 gap-x-12">
            {problems.map((p, idx) => (
              <div key={p.id} className="flex justify-center">
                <ProblemRenderer problem={p} showAnswer={false} index={idx + (pageNumber - 1) * 12} />
              </div>
            ))}

            {/* Fill remaining slots up to 12 if problems < 12 */}
            {problems.length < 12 && Array.from({ length: 12 - problems.length }).map((_, i) => (
              <div key={`empty-${i}`} className="h-32"></div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Area - Only displayed on the worksheet, not on the answer key */}
      {!isAnswerKey && (
        <div className="mt-4 border-t-2 border-black pt-8 flex flex-col math-font text-black">
          <div className="grid grid-cols-2 gap-8 items-end">
            <div className="space-y-6">
               <p className="text-sm font-bold border-l-4 border-black pl-2 uppercase tracking-wide">Wie fandest du dieses Blatt?</p>
               <div className="flex gap-10 items-center pt-2">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-7 h-7 border-2 border-black rounded-full flex items-center justify-center"></div>
                    <span className="text-2xl">😃</span>
                    <span className="text-[10px] font-bold uppercase">Super!</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-7 h-7 border-2 border-black rounded-full flex items-center justify-center"></div>
                    <span className="text-2xl">😐</span>
                    <span className="text-[10px] font-bold uppercase">O.K.</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-7 h-7 border-2 border-black rounded-full flex items-center justify-center"></div>
                    <span className="text-2xl">😟</span>
                    <span className="text-[10px] font-bold uppercase">Schwer</span>
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-10 items-end">
              <div className="flex items-center gap-4 text-sm font-bold">
                Bewertung: 
                <span className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-6 h-6 border-2 border-black rounded-full"></div>
                  ))}
                </span>
              </div>
              <div className="text-right">
                <p className="whitespace-nowrap font-bold text-base">Unterschrift: __________________________</p>
              </div>
            </div>
          </div>
          <div className="mt-6 text-[8px] text-gray-400 text-left opacity-50 uppercase tracking-widest italic">
            © 2025 Dieter Balmer
          </div>
        </div>
      )}

      {isAnswerKey && (
        <div className="mt-auto border-t border-gray-200 pt-4 flex flex-col gap-1">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
            Zusammenfassung aller Lösungen für dieses Set
          </p>
          <p className="text-[10px] text-gray-400 opacity-50 uppercase tracking-widest italic text-left">
            © 2025 Dieter Balmer
          </p>
        </div>
      )}
    </div>
  );
};

export default Worksheet;
