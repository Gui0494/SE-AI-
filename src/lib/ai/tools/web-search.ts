import { Tool } from '../types';

export const webSearchTool: Tool = {
  name: 'web_search',
  description:
    'Search the web for current information. Use this when the user asks about recent events, current data, or anything that requires up-to-date information.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
    },
    required: ['query'],
  },
  execute: async (args: Record<string, unknown>): Promise<string> => {
    const query = args.query as string;

    // Tavily API integration
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return 'Web search is not configured. Please set the TAVILY_API_KEY environment variable.';
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: 'basic',
          max_results: 5,
          include_answer: true,
        }),
      });

      if (!response.ok) {
        return `Search failed with status ${response.status}`;
      }

      const data = await response.json();
      const results: string[] = [];

      if (data.answer) {
        results.push(`**Answer:** ${data.answer}\n`);
      }

      if (data.results) {
        for (const result of data.results.slice(0, 5)) {
          results.push(`- **${result.title}**\n  ${result.url}\n  ${result.content?.substring(0, 200) || ''}`);
        }
      }

      return results.join('\n\n') || 'No results found.';
    } catch (error) {
      return `Search error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};
