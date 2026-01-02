
import React from 'react';
import { MathProblem, MathOperation } from '../types';

interface ProblemProps {
  problem: MathProblem;
  showAnswer?: boolean;
  index: number;
}

const ProblemRenderer: React.FC<ProblemProps> = ({ problem, showAnswer, index }) => {
  const getSymbol = (op: MathOperation) => {
    switch (op) {
      case MathOperation.ADDITION: return '+';
      case MathOperation.SUBTRACTION: return '-';
      case MathOperation.MULTIPLICATION: return '×';
      case MathOperation.DIVISION: return '÷';
      default: return '';
    }
  };

  if (problem.operation === MathOperation.DIVISION) {
    return (
      <div className="flex flex-col items-start p-4 math-font text-2xl relative w-full">
        <span className="absolute top-0 left-0 w-6 h-6 flex items-center justify-center border border-gray-300 rounded-full text-[10px] text-gray-500 no-print font-sans">
          {index + 1}
        </span>
        <div className="flex items-end mt-6 text-black">
          <span className="mr-1">{problem.num2}</span>
          <div className="relative border-l-2 border-t-2 border-black pl-3 pr-6 pt-1 rounded-tl-lg min-w-[80px]">
            {showAnswer && (
              <div className="absolute -top-9 left-3 text-blue-700 font-bold text-xl">
                {problem.answer}{problem.remainder ? ` r${problem.remainder}` : ''}
              </div>
            )}
            <span className="tracking-widest">{problem.num1}</span>
          </div>
        </div>
      </div>
    );
  }

  const n1Str = problem.num1.toString();
  const n2Str = problem.num2.toString();

  return (
    <div className="flex flex-col items-end p-4 math-font text-2xl relative text-black w-full">
      <span className="absolute top-0 left-0 w-6 h-6 flex items-center justify-center border border-gray-300 rounded-full text-[10px] text-gray-500 no-print font-sans">
        {index + 1}
      </span>
      
      {/* Top Number */}
      <div className="tracking-widest pr-2 pt-2">
        {n1Str}
      </div>
      
      {/* Bottom Number with Operator */}
      <div className="flex justify-between w-full border-b-2 border-black pb-1 mt-1 min-w-[100px]">
        <span className="pl-1 font-bold">{getSymbol(problem.operation)}</span>
        <span className="tracking-widest pr-2">{n2Str}</span>
      </div>

      {/* Answer Area */}
      <div className="flex justify-start w-full mt-2 relative min-h-[1.5rem]">
        <span className="text-xl font-bold absolute -left-1 top-0">=</span>
        <div className="w-full text-right pr-2">
          {showAnswer && <span className="text-blue-700 font-bold">{problem.answer}</span>}
        </div>
      </div>
    </div>
  );
};

export default ProblemRenderer;
