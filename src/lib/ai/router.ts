import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamChunk,
  AIProvider,
} from './types';
import { getModelById } from './types';
import * as openai from './providers/openai';
import * as anthropic from './providers/anthropic';

export class AIRouter {
  private static getProvider(modelId: string): AIProvider {
    const model = getModelById(modelId);
    if (!model) {
      throw new Error(`Unknown model: ${modelId}`);
    }
    return model.provider;
  }

  static async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const provider = this.getProvider(request.model);

    switch (provider) {
      case 'openai':
        return openai.createChatCompletion(request);
      case 'anthropic':
        return anthropic.createChatCompletion(request);
      case 'google':
        // TODO: Implement Google Gemini provider
        throw new Error('Google provider not yet implemented');
      case 'groq':
        // TODO: Implement Groq provider
        throw new Error('Groq provider not yet implemented');
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  static async *chatStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<StreamChunk> {
    const provider = this.getProvider(request.model);

    switch (provider) {
      case 'openai':
        yield* openai.createChatCompletionStream(request);
        break;
      case 'anthropic':
        yield* anthropic.createChatCompletionStream(request);
        break;
      case 'google':
        throw new Error('Google provider not yet implemented');
      case 'groq':
        throw new Error('Groq provider not yet implemented');
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  static async generateImage(
    prompt: string,
    options?: {
      model?: 'dall-e-2' | 'dall-e-3';
      size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
      quality?: 'standard' | 'hd';
      style?: 'vivid' | 'natural';
    }
  ): Promise<string> {
    return openai.createImageGeneration(prompt, options);
  }

  static async createEmbedding(text: string): Promise<number[]> {
    return openai.createEmbedding(text);
  }
}

// Default system prompts for different styles
export const SYSTEM_PROMPTS = {
  default: `Voce e o SE AI, um assistente de IA avancado criado para ajudar usuarios com diversas tarefas.
Seja util, preciso e amigavel em suas respostas.
Responda em portugues brasileiro a menos que o usuario fale em outro idioma.
Use formatacao markdown quando apropriado.`,

  concise: `Voce e o SE AI. Seja extremamente conciso e direto.
Responda de forma breve, sem explicacoes desnecessarias.
Use bullet points quando possivel.`,

  detailed: `Voce e o SE AI. Forneca respostas detalhadas e abrangentes.
Inclua exemplos, contexto e explicacoes aprofundadas.
Organize suas respostas com headers e secoes quando apropriado.`,

  creative: `Voce e o SE AI em modo criativo.
Seja imaginativo, use metaforas e analogias interessantes.
Pense fora da caixa e ofereca perspectivas unicas.`,

  technical: `Voce e o SE AI em modo tecnico.
Forneca respostas precisas e tecnicamente corretas.
Inclua codigo, formulas ou diagramas quando relevante.
Cite fontes e melhores praticas da industria.`,

  friendly: `Voce e o SE AI, um assistente super amigavel!
Use um tom casual e acolhedor.
Sinta-se livre para usar expressoes e ser mais informal.
Torne a conversa agradavel e engajante.`,

  professional: `Voce e o SE AI em modo profissional.
Mantenha um tom formal e executivo.
Seja objetivo e focado em resultados.
Estruture respostas de forma clara e profissional.`,

  teacher: `Voce e o SE AI em modo professor.
Explique conceitos de forma didatica e gradual.
Use exemplos praticos e analogias.
Verifique o entendimento e ofereca exercicios quando apropriado.`,
};

export type StyleKey = keyof typeof SYSTEM_PROMPTS;

export function getSystemPrompt(style: StyleKey = 'default'): string {
  return SYSTEM_PROMPTS[style] || SYSTEM_PROMPTS.default;
}
