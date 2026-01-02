
import { MathOperation, ProblemSubtype } from './types';

export const SUBTYPES: ProblemSubtype[] = [
  // Addition
  { id: 'add_1', name: 'Addition: 1-stellig', operation: MathOperation.ADDITION, digitsTop: 1, digitsBottom: 1 },
  { id: 'add_2', name: 'Addition: 2-stellig', operation: MathOperation.ADDITION, digitsTop: 2, digitsBottom: 2 },
  { id: 'add_3', name: 'Addition: 3-stellig', operation: MathOperation.ADDITION, digitsTop: 3, digitsBottom: 3 },
  // Subtraction
  { id: 'sub_1', name: 'Subtraktion: 1-stellig', operation: MathOperation.SUBTRACTION, digitsTop: 1, digitsBottom: 1 },
  { id: 'sub_2', name: 'Subtraktion: 2-stellig', operation: MathOperation.SUBTRACTION, digitsTop: 2, digitsBottom: 2 },
  { id: 'sub_3', name: 'Subtraktion: 3-stellig', operation: MathOperation.SUBTRACTION, digitsTop: 3, digitsBottom: 3 },
  // Multiplication
  { id: 'mul_1', name: 'Multiplikation: Einfach (2-5)', operation: MathOperation.MULTIPLICATION, digitsTop: 1, digitsBottom: 1 },
  { id: 'mul_2', name: 'Multiplikation: Mittel (2-12)', operation: MathOperation.MULTIPLICATION, digitsTop: 1, digitsBottom: 1 },
  { id: 'mul_long', name: 'Schriftliche Multiplikation', operation: MathOperation.MULTIPLICATION, digitsTop: 4, digitsBottom: 2 },
  // Division
  { id: 'div_1', name: 'Division: Einfach (1-stelliger Divisor)', operation: MathOperation.DIVISION, digitsTop: 2, digitsBottom: 1 },
  { id: 'div_2', name: 'Division: Mittel (2-stelliger Divisor)', operation: MathOperation.DIVISION, digitsTop: 3, digitsBottom: 2 },
];
