export enum MathOperation {
  ADDITION = 'ADDITION',
  SUBTRACTION = 'SUBTRACTION',
  MULTIPLICATION = 'MULTIPLICATION',
  DIVISION = 'DIVISION'
}

export interface ProblemSubtype {
  id: string;
  name: string;
  operation: MathOperation;
  digitsTop: number;
  digitsBottom: number;
  description?: string;
}

export interface WorksheetSettings {
  title: string;
  enabledSubtypes: string[];
  allowNegatives: boolean;
  wholeNumberDivisionOnly: boolean;
  generateAnswerKey: boolean;
  pageCount: number;
  longMultiplication: {
    multiplicandDigits: number;
    multiplierDigits: number;
  };
}

export interface MathProblem {
  id: string;
  num1: number;
  num2: number;
  operation: MathOperation;
  answer: number | string;
  remainder?: number;
  subtype: string;
}