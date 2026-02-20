import { Tool } from '../types';

export const urlFetchTool: Tool = {
  name: 'url_fetch',
  description:
    'Fetch and extract the main content from a URL. Use this when the user provides a link and wants you to read or analyze its content.',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch content from',
      },
    },
    required: ['url'],
  },
  execute: async (args: Record<string, unknown>): Promise<string> => {
    const url = args.url as string;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SE-AI-Bot/1.0',
          Accept: 'text/html,application/json,text/plain',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return `Failed to fetch URL: HTTP ${response.status}`;
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      if (contentType.includes('application/json')) {
        return `JSON content from ${url}:\n\`\`\`json\n${text.substring(0, 5000)}\n\`\`\``;
      }

      // Simple HTML to text conversion
      const cleaned = text
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();

      const content = cleaned.substring(0, 5000);
      return `Content from ${url}:\n\n${content}${cleaned.length > 5000 ? '\n\n[Content truncated]' : ''}`;
    } catch (error) {
      return `Fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};
