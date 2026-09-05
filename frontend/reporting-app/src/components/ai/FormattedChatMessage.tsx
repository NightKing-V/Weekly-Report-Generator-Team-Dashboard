import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Check,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Users,
  Calendar,
  MessageSquareQuote,
  TrendingUp,
  ShieldAlert,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

interface FormattedChatMessageProps {
  content: string;
  isUser?: boolean;
}

interface CodeBlockProps {
  language?: string;
  children: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-slate-700/70 bg-slate-900 shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/95 border-b border-slate-700/70 text-[10px] text-slate-400 font-mono">
        <span className="uppercase tracking-wider font-semibold text-indigo-300 flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-indigo-400" />
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 text-[11px] font-mono leading-relaxed text-slate-100 overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
};

export const FormattedChatMessage: React.FC<FormattedChatMessageProps> = ({ content, isUser = false }) => {
  if (isUser) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  // Pre-process special status pills, blockers, percentages, deliverables, and version tags
  const processedContent = content
    // 1. Critical blocker tags (with or without emoji)
    .replace(/⚠️\s*\[CRITICAL\s+KEY\s+ISSUE\]/gi, '`BADGE:CRITICAL`')
    .replace(/\[CRITICAL\s+KEY\s+ISSUE\]/gi, '`BADGE:CRITICAL`')
    .replace(/CRITICAL\s+KEY\s+ISSUE/gi, '`BADGE:CRITICAL`')
    // 2. Workflow status tags: Status: **Needs Correction** / Status: Needs Correction
    .replace(/Status:\s*\*\*(Needs\s+Correction)\*\*/gi, 'Status: `BADGE:STATUS:Needs Correction`')
    .replace(/Status:\s*(Needs\s+Correction)/gi, 'Status: `BADGE:STATUS:Needs Correction`')
    .replace(/Status:\s*\*\*(Approved)\*\*/gi, 'Status: `BADGE:STATUS:Approved`')
    .replace(/Status:\s*(Approved)/gi, 'Status: `BADGE:STATUS:Approved`')
    .replace(/Status:\s*\*\*(Submitted)\*\*/gi, 'Status: `BADGE:STATUS:Submitted`')
    .replace(/Status:\s*(Submitted)/gi, 'Status: `BADGE:STATUS:Submitted`')
    .replace(/Status:\s*\*\*(Draft)\*\*/gi, 'Status: `BADGE:STATUS:Draft`')
    .replace(/Status:\s*(Draft)/gi, 'Status: `BADGE:STATUS:Draft`')
    // Standalone bold status tokens
    .replace(/\*\*(Approved)\*\*/g, '`BADGE:STATUS:Approved`')
    .replace(/\*\*(Needs\s+Correction)\*\*/g, '`BADGE:STATUS:Needs Correction`')
    .replace(/\*\*(Submitted)\*\*/g, '`BADGE:STATUS:Submitted`')
    // 3. Deliverables: [Deliverable: Output Name]
    .replace(/\[Deliverable:\s*([^\]]+)\]/gi, '`BADGE:DELIVERABLE:$1`')
    // 4. Version tokens: (v1), (v2), (v3)
    .replace(/\((v\d+)\)/gi, '`BADGE:VERSION:$1`')
    // 5. Completion percentages: (100%), (85%)
    .replace(/\((\d{1,3}%)\)/gi, '`BADGE:PERCENT:$1`');

  return (
    <div className="chat-markdown text-xs text-slate-800 leading-relaxed break-words space-y-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Strong bold styling
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900">
              {children}
            </strong>
          ),

          // Italic styling
          em: ({ children }) => (
            <em className="italic text-slate-700">
              {children}
            </em>
          ),

          // Strikethrough
          del: ({ children }) => (
            <del className="line-through text-slate-400">
              {children}
            </del>
          ),

          // Headings with semantic icon decoration
          h1: ({ children }) => (
            <h1 className="text-sm font-bold text-slate-900 border-b border-slate-200/90 pb-1 mt-3 mb-1.5 first:mt-0 tracking-tight flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>{children}</span>
            </h1>
          ),

          h2: ({ children }) => {
            const headingStr = String(children).toLowerCase();
            const isMetrics = headingStr.includes('metric') || headingStr.includes('kpi');
            const isSubmissions = headingStr.includes('submission') || headingStr.includes('contributor');
            const isWeek = headingStr.includes('week');

            return (
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mt-3 mb-1.5 first:mt-0 flex items-center gap-1.5 bg-indigo-50/70 px-2 py-1 rounded-lg border border-indigo-100/70">
                {isMetrics && <TrendingUp className="h-3 w-3 text-indigo-600 shrink-0" />}
                {isSubmissions && <Users className="h-3 w-3 text-indigo-600 shrink-0" />}
                {isWeek && <Calendar className="h-3 w-3 text-indigo-600 shrink-0" />}
                {!isMetrics && !isSubmissions && !isWeek && <Layers className="h-3 w-3 text-indigo-600 shrink-0" />}
                <span>{children}</span>
              </h2>
            );
          },

          h3: ({ children }) => {
            const headingStr = String(children).toLowerCase();
            const isMetrics = headingStr.includes('metric') || headingStr.includes('kpi');
            const isSubmissions = headingStr.includes('submission') || headingStr.includes('contributor');
            const isWeek = headingStr.includes('week') || headingStr.includes('reporting');

            return (
              <h3 className="text-xs font-semibold text-slate-900 mt-2.5 mb-1 first:mt-0 flex items-center gap-1.5">
                {isMetrics && <TrendingUp className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                {isSubmissions && <Users className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                {isWeek && <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                <span>{children}</span>
              </h3>
            );
          },

          h4: ({ children }) => (
            <h4 className="text-xs font-medium text-slate-800 mt-2 mb-0.5 first:mt-0">
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed text-slate-800">
              {children}
            </p>
          ),

          // Lists with nested bullet variations
          ul: ({ children }) => (
            <ul className="list-disc pl-4 space-y-1 mb-2 text-slate-800 marker:text-indigo-500 [&_ul]:list-[circle] [&_ul]:pl-3.5 [&_ul]:space-y-0.5 [&_ul]:mt-0.5 [&_ul]:mb-0.5 [&_ul_ul]:list-[square]">
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol className="list-decimal pl-4 space-y-1 mb-2 text-slate-800 marker:text-indigo-600 font-medium [&_ol]:pl-3.5 [&_ol]:space-y-0.5 [&_ol]:mt-0.5 [&_ol]:mb-0.5">
              {children}
            </ol>
          ),

          li: ({ children }) => {
            // Check if this list item is a Manager Feedback quote
            const liString = String(React.Children.toArray(children).map(c => typeof c === 'string' ? c : '').join(''));
            if (liString.includes('Manager Feedback:') || liString.includes('Manager Comment:')) {
              return (
                <li className="leading-relaxed list-none -ml-4 my-1.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-[11px] flex items-start gap-2 shadow-2xs">
                  <MessageSquareQuote className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{children}</div>
                </li>
              );
            }

            // Check if this list item is a Critical Blocker
            if (liString.includes('CRITICAL KEY ISSUE') || liString.includes('BADGE:CRITICAL')) {
              return (
                <li className="leading-relaxed list-none -ml-4 my-1.5 p-2 rounded-xl bg-rose-50/70 border border-rose-200/80 text-rose-900 text-[11px] flex items-start gap-2 shadow-2xs">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1">{children}</div>
                </li>
              );
            }

            return (
              <li className="leading-relaxed">
                {children}
              </li>
            );
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-3 border-indigo-500 bg-indigo-50/60 pl-3 py-1.5 rounded-r-xl text-slate-700 italic text-[11px] flex items-start gap-2">
              <MessageSquareQuote className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="flex-1 not-italic">{children}</div>
            </blockquote>
          ),

          // Horizontal divider
          hr: () => (
            <hr className="my-3 border-t border-slate-200" />
          ),

          // Anchor links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 transition-colors inline-flex items-center gap-0.5"
            >
              {children}
            </a>
          ),

          // Responsive Markdown Table
          table: ({ children }) => (
            <div className="my-2.5 overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
              <table className="min-w-full divide-y divide-slate-200 text-[11px]">
                {children}
              </table>
            </div>
          ),

          thead: ({ children }) => (
            <thead className="bg-slate-100/95 text-slate-700 font-semibold">
              {children}
            </thead>
          ),

          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100 bg-white">
              {children}
            </tbody>
          ),

          tr: ({ children }) => (
            <tr className="hover:bg-indigo-50/40 transition-colors even:bg-slate-50/40">
              {children}
            </tr>
          ),

          th: ({ children }) => (
            <th className="px-3 py-1.5 text-left font-semibold text-slate-800 whitespace-nowrap">
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td className="px-3 py-1.5 text-slate-700 align-top">
              {children}
            </td>
          ),

          // Code block & custom inline badge router
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className || '');
            const rawText = String(children).replace(/\n$/, '');

            // 1. Critical key issue badge
            if (rawText === 'BADGE:CRITICAL' || rawText === 'CRITICAL_KEY_ISSUE_BADGE') {
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs shrink-0 align-middle">
                  <ShieldAlert className="h-3 w-3 text-rose-600 animate-pulse shrink-0" />
                  <span>CRITICAL KEY ISSUE</span>
                </span>
              );
            }

            // 2. Workflow status badges
            if (rawText.startsWith('BADGE:STATUS:')) {
              const status = rawText.replace('BADGE:STATUS:', '').trim();
              if (status === 'Approved') {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs align-middle">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                    <span>Approved</span>
                  </span>
                );
              }
              if (status === 'Needs Correction') {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs align-middle">
                    <AlertCircle className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                    <span>Needs Correction</span>
                  </span>
                );
              }
              if (status === 'Submitted') {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs align-middle">
                    <Clock className="h-2.5 w-2.5 text-blue-600 shrink-0" />
                    <span>Submitted</span>
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs align-middle">
                  <FileText className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                  <span>{status}</span>
                </span>
              );
            }

            // 3. Deliverable tag: BADGE:DELIVERABLE:...
            if (rawText.startsWith('BADGE:DELIVERABLE:')) {
              const deliverableName = rawText.replace('BADGE:DELIVERABLE:', '').trim();
              return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200/90 shadow-2xs align-middle">
                  <Package className="h-3 w-3 text-purple-600 shrink-0" />
                  <span className="font-semibold">Deliverable:</span>
                  <span>{deliverableName}</span>
                </span>
              );
            }

            // 4. Version tag: BADGE:VERSION:...
            if (rawText.startsWith('BADGE:VERSION:')) {
              const ver = rawText.replace('BADGE:VERSION:', '').trim();
              return (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs align-middle">
                  {ver}
                </span>
              );
            }

            // 5. Completion percentage: BADGE:PERCENT:...
            if (rawText.startsWith('BADGE:PERCENT:')) {
              const pct = rawText.replace('BADGE:PERCENT:', '').trim();
              const is100 = pct === '100%';
              return (
                <span
                  className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold shadow-2xs align-middle ${
                    is100
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {pct}
                </span>
              );
            }

            // 6. Direct status match
            const trimmed = rawText.trim();
            if (trimmed === 'Approved') {
              return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                  <span>Approved</span>
                </span>
              );
            }
            if (trimmed === 'Needs Correction') {
              return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                  <AlertCircle className="h-2.5 w-2.5 text-amber-600" />
                  <span>Needs Correction</span>
                </span>
              );
            }
            if (trimmed === 'Submitted') {
              return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs">
                  <Clock className="h-2.5 w-2.5 text-blue-600" />
                  <span>Submitted</span>
                </span>
              );
            }
            if (trimmed === 'Draft') {
              return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
                  <FileText className="h-2.5 w-2.5 text-slate-500" />
                  <span>Draft</span>
                </span>
              );
            }

            // Fenced multi-line code block
            const isMultiLine = rawText.includes('\n');
            if (match || isMultiLine) {
              return <CodeBlock language={match ? match[1] : undefined}>{rawText}</CodeBlock>;
            }

            // Standard inline code
            return (
              <code className="font-mono text-[11px] px-1.5 py-0.5 rounded-md bg-indigo-50/80 text-indigo-800 border border-indigo-200/70 font-medium">
                {children}
              </code>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
