import { MathOperation, ProblemSubtype, MathProblem } from '../types';

export function generateProblem(
  subtype: ProblemSubtype,
  options: { 
    allowNegatives: boolean; 
    wholeNumberDivision: boolean; 
    longMulti: { m1: number; m2: number };
  }
): MathProblem {
  let n1 = 0, n2 = 0, ans: number | string = 0, rem: number | undefined;

  const range = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  switch (subtype.operation) {
    case MathOperation.ADDITION:
      n1 = range(Math.pow(10, subtype.digitsTop - 1), Math.pow(10, subtype.digitsTop) - 1);
      n2 = range(Math.pow(10, subtype.digitsBottom - 1), Math.pow(10, subtype.digitsBottom) - 1);
      ans = n1 + n2;
      break;

    case MathOperation.SUBTRACTION:
      n1 = range(Math.pow(10, subtype.digitsTop - 1), Math.pow(10, subtype.digitsTop) - 1);
      n2 = range(Math.pow(10, subtype.digitsBottom - 1), Math.pow(10, subtype.digitsBottom) - 1);
      if (!options.allowNegatives && n1 < n2) [n1, n2] = [n2, n1];
      ans = n1 - n2;
      break;

    case MathOperation.MULTIPLICATION:
      if (subtype.id === 'mul_1') {
        n1 = range(2, 5);
        n2 = range(2, 5);
      } else if (subtype.id === 'mul_2') {
        n1 = range(2, 12);
        n2 = range(2, 12);
      } else if (subtype.id === 'mul_long') {
        n1 = range(Math.pow(10, options.longMulti.m1 - 1), Math.pow(10, options.longMulti.m1) - 1);
        n2 = range(Math.pow(10, options.longMulti.m2 - 1), Math.pow(10, options.longMulti.m2) - 1);
      } else {
        n1 = range(2, 12);
        n2 = range(2, 12);
      }
      ans = n1 * n2;
      break;

    case MathOperation.DIVISION:
      n2 = range(Math.max(2, Math.pow(10, subtype.digitsBottom - 1)), Math.pow(10, subtype.digitsBottom) - 1);
      if (options.wholeNumberDivision) {
        const result = range(2, Math.floor((Math.pow(10, subtype.digitsTop) - 1) / n2));
        n1 = n2 * result;
        ans = result;
      } else {
        n1 = range(Math.pow(10, subtype.digitsTop - 1), Math.pow(10, subtype.digitsTop) - 1);
        ans = Math.floor(n1 / n2);
        rem = n1 % n2;
      }
      break;
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    num1: n1,
    num2: n2,
    operation: subtype.operation,
    answer: ans,
    remainder: rem,
    subtype: subtype.id
  };
}