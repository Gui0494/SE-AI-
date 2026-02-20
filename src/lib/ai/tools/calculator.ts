import { Tool } from '../types';
import { evaluate } from 'mathjs';

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
          'The mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "15% of 200", "sin(pi/4)")',
      },
    },
    required: ['expression'],
  },
  execute: async (args: Record<string, unknown>): Promise<string> => {
    const expression = args.expression as string;

    try {
      // Preprocess natural language patterns
      const normalized = expression
        .replace(/(\d+)\s*%\s*of\s*(\d+)/gi, '($1/100)*$2');

      const result = evaluate(normalized);

      if (typeof result === 'number') {
        if (!isFinite(result)) {
          return `Result is not a finite number for: ${expression}`;
        }
        return `${expression} = ${result}`;
      }

      // mathjs can return matrices, units, etc.
      return `${expression} = ${result.toString()}`;
    } catch (error) {
      return `Calculation error: ${error instanceof Error ? error.message : 'Invalid expression'}`;
    }
  },
};
