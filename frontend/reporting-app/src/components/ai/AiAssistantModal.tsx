import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useReports } from '../../context/ReportContext';
import { Sparkles, Send, Bot, User as UserIcon, RefreshCw } from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { reports, selectedWeek, projects } = useReports();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: `👋 Hello! I am your **WeeklyPulse AI Assistant**. I can analyze team submissions, summarize completed deliverables, highlight recurring blockers, and answer questions across all reports for **${selectedWeek}**.\n\nTry clicking one of the suggested prompts below or ask any question!`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const suggestedPrompts = [
    'Generate executive summary for this week',
    'What are the key blockers and risks across the team?',
    'What did the frontend and design team deliver?',
    'Summarize team workload and hours distribution',
  ];

  const generateAiResponse = (query: string): string => {
    const q = query.toLowerCase();
    const weekReports = reports.filter((r) => r.weekLabel === selectedWeek);

    if (q.includes('summary') || q.includes('executive')) {
      const completedTasks = weekReports.flatMap((r) => r.tasksCompleted || []);
      const totalDevHours = weekReports.reduce((s, r) => s + (r.hoursWorked?.development || 0), 0);
      const totalTestingHours = weekReports.reduce((s, r) => s + (r.hoursWorked?.testing || 0), 0);
      const blockersCount = weekReports.reduce((s, r) => s + (r.blockers?.length || 0), 0);

      return `### 📊 Executive Team Summary — ${selectedWeek}

**Key Highlights:**
- **Reports Submitted:** ${weekReports.length} team members active this cycle.
- **Tasks Delivered:** ${completedTasks.filter((t) => t.status === 'Completed').length} completed deliverables across ${projects.length} key projects.
- **Engineering Effort:** Logged **${totalDevHours} hours** of development and **${totalTestingHours} hours** of QA & testing.

**Major Deliverables:**
- **Sarah Chen:** Merged Executive Summary Widget (PR #142) and achieved 0 Axe-core accessibility violations.
- **Priya Patel:** Vector embeddings & MongoDB Atlas Search integration prototype stood up in under 3 days.
- **Michael Scott:** MongoDB replica set automated healthcheck configured; JWT Ed25519 token migration in progress.

**Current Attention Points:**
- **${blockersCount} open blockers** identified. Key issue flagged: Staging API latency spikes affecting demo runs.`;
    }

    if (q.includes('blocker') || q.includes('risk')) {
      const allBlockers = weekReports.flatMap((r) =>
        (r.blockers || []).map((b) => ({ ...b, member: r.userName, project: r.projectName }))
      );

      if (allBlockers.length === 0) {
        return `✅ **Good news!** No blockers or critical impediments are currently reported for **${selectedWeek}**.`;
      }

      const keyBlockers = allBlockers.filter((b) => b.isKeyIssue);
      const normalBlockers = allBlockers.filter((b) => !b.isKeyIssue);

      let response = `### 🚨 Team Blockers & Risk Analysis — ${selectedWeek}\n\n`;
      if (keyBlockers.length > 0) {
        response += `**Critical Key Issues Flagged:**\n`;
        keyBlockers.forEach((b) => {
          response += `- **${b.member} (${b.project}):** ${b.description} ${b.impact ? `*(Impact: ${b.impact})*` : ''}\n`;
        });
      }
      if (normalBlockers.length > 0) {
        response += `\n**Other Active Impediments:**\n`;
        normalBlockers.forEach((b) => {
          response += `- **${b.member}:** ${b.description}\n`;
        });
      }
      return response;
    }

    if (q.includes('frontend') || q.includes('design') || q.includes('sarah')) {
      const sarahReport = weekReports.find((r) => r.userName.includes('Sarah'));
      if (sarahReport) {
        return `### 🎨 Frontend & Design Update (${sarahReport.weekLabel})\n\n**Sarah Chen** worked on **${sarahReport.projectName}**:\n- **Executive Summary Widget:** 100% completed (PR #142 merged with 100% test coverage).\n- **Responsive Table Filtering:** In progress (90% completed).\n- **Performance Win:** Reduced initial bundle size by 38% via dynamic route chunking!\n- **Next Week:** Finalize CSV/PDF exports and polish mobile navigation drawers.`;
      }
    }

    if (q.includes('hours') || q.includes('workload')) {
      const totalHours = weekReports.reduce(
        (acc, r) => ({
          dev: acc.dev + (r.hoursWorked?.development || 0),
          test: acc.test + (r.hoursWorked?.testing || 0),
          meetings: acc.meetings + (r.hoursWorked?.meetings || 0),
          docs: acc.docs + (r.hoursWorked?.documentation || 0),
        }),
        { dev: 0, test: 0, meetings: 0, docs: 0 }
      );

      return `### ⏱️ Team Hours & Allocation Breakdown — ${selectedWeek}\n\n- **Development:** ${totalHours.dev} hrs\n- **QA & Testing:** ${totalHours.test} hrs\n- **Meetings & Syncs:** ${totalHours.meetings} hrs\n- **Documentation:** ${totalHours.docs} hrs\n\n**Total Team Effort:** **${
        totalHours.dev + totalHours.test + totalHours.meetings + totalHours.docs
      } hours**. Development comprises the majority (${Math.round(
        (totalHours.dev /
          (totalHours.dev + totalHours.test + totalHours.meetings + totalHours.docs || 1)) *
          100
      )}%) of productive time.`;
    }

    return `Based on reports for **${selectedWeek}**, the team has submitted **${weekReports.length} reports**. ${
      weekReports.filter((r) => r.status === 'Approved').length
    } are approved, and ${weekReports.filter((r) => r.status === 'Needs Correction').length} require revisions. Let me know if you would like an executive summary, list of blockers, or specific contributor progress!`;
  };

  const handleSend = (textToSend?: string) => {
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

    setTimeout(() => {
      const reply = generateAiResponse(text);
      const botMessage: ChatMessage = {
        id: `msg-${crypto.randomUUID()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsThinking(false);
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Team Intelligence Assistant"
      subtitle={`Synthesizing data from ${reports.length} reports across ${selectedWeek}`}
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
              className="text-[11px] font-medium text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
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
                Synthesizing reports and computing insights...
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
            className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </Modal>
  );
};
