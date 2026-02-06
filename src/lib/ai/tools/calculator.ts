import { Tool } from '../types';

export const calculatorTool: Tool = {
  name: 'calculator',
  description:
    'Perform mathematical calculations. Use this for precise arithmetic, unit conversions, and mathematical operations.',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description:
          'The mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "15% of 200")',
      },
    },
    required: ['expression'],
  },
  execute: async (args: Record<string, unknown>): Promise<string> => {
    const expression = args.expression as string;

    try {
      // Safe math evaluation - only allow numbers, operators, and math functions
      const sanitized = expression
        .replace(/\s+/g, '')
        .replace(/(\d+)%\s*of\s*(\d+)/gi, '($1/100)*$2')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/pow\(/g, 'Math.pow(')
        .replace(/round\(/g, 'Math.round(')
        .replace(/ceil\(/g, 'Math.ceil(')
        .replace(/floor\(/g, 'Math.floor(')
        .replace(/log\(/g, 'Math.log(')
        .replace(/log10\(/g, 'Math.log10(')
        .replace(/PI/g, 'Math.PI')
        .replace(/E(?![a-z])/g, 'Math.E');

      // Validate: only allow safe characters
      if (!/^[0-9+\-*/().,%Math.sqrtabspowroundceilfloorlogPI\sE]+$/.test(sanitized)) {
        return `Invalid expression. Only mathematical operations are allowed.`;
      }

      // Use Function constructor for safe eval
      const fn = new Function(`"use strict"; return (${sanitized});`);
      const result = fn();

      if (typeof result !== 'number' || !isFinite(result)) {
        return `Result is not a valid number: ${result}`;
      }

      return `${expression} = ${result}`;
    } catch (error) {
      return `Calculation error: ${error instanceof Error ? error.message : 'Invalid expression'}`;
    }
  },
};
