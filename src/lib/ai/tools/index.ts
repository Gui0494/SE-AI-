import { Tool } from '../types';
import { webSearchTool } from './web-search';
import { calculatorTool } from './calculator';
import { urlFetchTool } from './url-fetch';

export const ALL_TOOLS: Tool[] = [webSearchTool, calculatorTool, urlFetchTool];

export function getToolsForPlan(plan: string): Tool[] {
  if (plan === 'FREE') {
    return [calculatorTool]; // Free users only get calculator
  }
  return ALL_TOOLS; // Pro and Enterprise get all tools
}

export function getToolByName(name: string): Tool | undefined {
  return ALL_TOOLS.find((t) => t.name === name);
}

export { webSearchTool, calculatorTool, urlFetchTool };
