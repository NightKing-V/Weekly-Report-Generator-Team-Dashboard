import React, { useState, useRef, useEffect } from 'react';
import { useReports } from '../../context/ReportContext';
import { apiClient } from '../../services/api';
import { Sparkles, Send, Bot, User as UserIcon, RefreshCw, X, Minus } from 'lucide-react';
import type { AiAssistantPanelProps } from '../../props';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AiAssistantModal: React.FC<AiAssistantPanelProps> = ({ isOpen, onClose }) => {
  const { selectedWeek } = useReports();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Hello! I'm your AI Team Assistant connected to the backend reporting API. Ask me to generate an executive summary for **${selectedWeek}**, identify unresolved blockers, or check progress across team members.`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Auto-scroll to bottom of chat history on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  const suggestedPrompts = [
    'Generate executive summary for this week',
    'What are the key blockers and risks across the team?',
    'What did the frontend team deliver?',
    'Summarize team workload and hours distribution',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputQuery;
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${crypto.randomUUID()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsThinking(true);

    try {
      const response = await apiClient.chat.ask(text.trim(), selectedWeek);
      const botMessage: ChatMessage = {
        id: `msg-${crypto.randomUUID()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: `msg-${crypto.randomUUID()}`,
        sender: 'assistant',
        text: 'Unable to reach the backend AI assistant service. Please verify that the API server is running.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="complementary"
      aria-label="AI Team Assistant"
      className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-5.5rem)] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-6 duration-200"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white tracking-wide truncate">
                AI Team Assistant
              </h3>
              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                Online
              </span>
            </div>
            <p className="text-[10px] text-indigo-200 truncate max-w-[210px]">
              Analyzing reports for {selectedWeek}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Close Panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-3 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-thin">
        {suggestedPrompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleSend(p)}
            className="text-[10px] font-medium text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
          >
            <Sparkles className="h-2.5 w-2.5 text-indigo-500 shrink-0" />
            <span className="truncate max-w-[150px]">{p}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${
              m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs'
              }`}
            >
              {m.sender === 'user' ? (
                <UserIcon className="h-3.5 w-3.5" />
              ) : (
                <Bot className="h-3.5 w-3.5" />
              )}
            </div>

            <div
              className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                  : 'bg-white text-slate-800 rounded-tl-xs whitespace-pre-line border border-slate-200/80 shadow-xs'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            </div>
            <div className="p-3 bg-white rounded-2xl text-xs text-slate-500 italic border border-slate-200/80 shadow-xs">
              Querying backend intelligence...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          placeholder="Ask AI about blockers, summaries..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isThinking}
          className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-xs cursor-pointer shrink-0"
          title="Send query"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};
