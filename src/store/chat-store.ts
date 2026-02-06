import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  model?: string;
  cost?: number;
  toolCalls?: unknown[];
  createdAt: string;
}

interface Chat {
  id: string;
  title: string;
  model: string;
  style: string;
  updatedAt: string;
  createdAt: string;
  _count?: { messages: number };
}

interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  selectedModel: string;
  sidebarOpen: boolean;
  error: string | null;

  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  removeChat: (id: string) => void;
  setCurrentChatId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (content: string) => void;
  setSelectedModel: (model: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  currentChatId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  selectedModel: 'gpt-4.1-mini',
  sidebarOpen: true,
  error: null,

  setChats: (chats) => set({ chats }),
  addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
  removeChat: (id) =>
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== id),
      currentChatId: state.currentChatId === id ? null : state.currentChatId,
    })),
  setCurrentChatId: (id) => set({ currentChatId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setStreamingContent: (streamingContent) => set({ streamingContent }),
  appendStreamingContent: (content) =>
    set((state) => ({ streamingContent: state.streamingContent + content })),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      currentChatId: null,
      messages: [],
      isLoading: false,
      isStreaming: false,
      streamingContent: '',
      error: null,
    }),
}));
