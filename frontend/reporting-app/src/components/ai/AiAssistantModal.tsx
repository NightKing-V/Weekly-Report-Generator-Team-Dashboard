import React, { useState } from 'react';
import { useReports } from '../../context/ReportContext';
import { Modal } from '../common/Modal';
import { apiClient } from '../../services/api';
import { Sparkles, Send, Bot, User as UserIcon, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

import type { AiAssistantModalProps } from '../../props';

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { selectedWeek } = useReports();

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Team Intelligence Assistant"
      subtitle={`Connected to API • Analyzing reports for ${selectedWeek}`}
      maxWidth="3xl"
    >
      <div className="flex flex-col h-[520px]">
        {/* Suggested Prompt Chips */}
        <div className="flex flex-wrap gap-1.5 pb-3 border-b border-slate-100">
          {suggestedPrompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleSend(p)}
              className="text-[11px] font-medium text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-indigo-600" />
              <span>{p}</span>
            </button>
          ))}
        </div>

        {/* Chat message history */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs'
                }`}
              >
                {m.sender === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-slate-100 text-slate-800 rounded-tl-xs whitespace-pre-line border border-slate-200/60'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
              <div className="p-3 bg-slate-100 rounded-2xl text-xs text-slate-500 italic">
                Querying backend intelligence and analyzing reports...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="pt-3 border-t border-slate-100 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about team progress, blockers, or deliverables..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isThinking}
            className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </Modal>
  );
};
