'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Mic,
  Image,
  Sparkles,
  Globe,
  ChevronDown,
  StopCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  initialValue?: string;
  placeholder?: string;
}

const models = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', isPro: true },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5', provider: 'OpenAI', isPro: false },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5', provider: 'Anthropic', isPro: true },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', isPro: true },
];

export function ChatInput({
  onSend,
  isLoading = false,
  initialValue = '',
  placeholder = 'Digite sua mensagem...',
}: ChatInputProps) {
  const [message, setMessage] = useState(initialValue);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [webSearch, setWebSearch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue) {
      setMessage(initialValue);
      textareaRef.current?.focus();
    }
  }, [initialValue]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative max-w-4xl mx-auto px-4 pb-4">
        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl overflow-hidden shadow-xl">
          {/* Top bar - Model selector and options */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-700/50">
            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setIsModelOpen(!isModelOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-300 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4 text-primary-400" />
                <span>{selectedModel.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {isModelOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsModelOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-0 top-full mt-2 w-56 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      {models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model);
                            setIsModelOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-3 text-sm transition-colors',
                            selectedModel.id === model.id
                              ? 'bg-primary-500/10 text-primary-400'
                              : 'text-neutral-300 hover:bg-neutral-700'
                          )}
                        >
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs text-neutral-500">{model.provider}</div>
                          </div>
                          {model.isPro && (
                            <span className="px-2 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded">
                              Pro
                            </span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Options */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setWebSearch(!webSearch)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      webSearch
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
                    )}
                  >
                    <Globe className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {webSearch ? 'Busca na web ativada' : 'Ativar busca na web'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Input area */}
          <div className="flex items-end gap-2 p-4">
            {/* Attachment button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="shrink-0">
                  <Paperclip className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Anexar arquivo</TooltipContent>
            </Tooltip>

            {/* Image button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="shrink-0">
                  <Image className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Enviar imagem</TooltipContent>
            </Tooltip>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-neutral-500 resize-none focus:outline-none max-h-[200px]"
            />

            {/* Voice button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="shrink-0">
                  <Mic className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Entrada de voz</TooltipContent>
            </Tooltip>

            {/* Send/Stop button */}
            {isLoading ? (
              <Button variant="danger" size="icon" className="shrink-0">
                <StopCircle className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!message.trim()}
                size="icon"
                className="shrink-0"
              >
                <Send className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-neutral-500 mt-2">
          SE AI pode cometer erros. Verifique informacoes importantes.
        </p>
      </div>
    </TooltipProvider>
  );
}
