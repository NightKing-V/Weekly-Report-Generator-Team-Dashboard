import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, AlertTriangle, CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';

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
      // Fallback if clipboard API fails
    }
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900 shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/90 border-b border-slate-700/60 text-[10px] text-slate-400 font-mono">
        <span className="uppercase tracking-wider font-semibold text-slate-300">
          {language || 'text'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
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

  // Pre-process special status pills and critical issue tokens to standard markdown or badge hooks
  const processedContent = content
    // Normalize critical issue flags
    .replace(/⚠️\s*\[CRITICAL\s+KEY\s+ISSUE\]/gi, '`CRITICAL_KEY_ISSUE_BADGE`')
    .replace(/\[CRITICAL\s+KEY\s+ISSUE\]/gi, '`CRITICAL_KEY_ISSUE_BADGE`');

  return (
    <div className="chat-markdown text-xs text-slate-800 leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-700">
              {children}
            </em>
          ),
          del: ({ children }) => (
            <del className="line-through text-slate-400">
              {children}
            </del>
          ),
          h1: ({ children }) => (
            <h1 className="text-sm font-bold text-slate-900 border-b border-slate-200/80 pb-1 mt-2.5 mb-1.5 first:mt-0 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mt-2.5 mb-1 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-slate-900 mt-2 mb-1 first:mt-0 flex items-center gap-1.5">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-medium text-slate-800 mt-1.5 mb-0.5 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed text-slate-800">
              {children}
            </p>
          ),
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
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-3 border-indigo-500 bg-indigo-50/60 pl-3 py-1 rounded-r-lg text-slate-700 italic text-[11px]">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="my-2.5 border-t border-slate-200/90" />
          ),
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
          table: ({ children }) => (
            <div className="my-2.5 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="min-w-full divide-y divide-slate-200 text-[11px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100/90 text-slate-700 font-semibold">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100 bg-white">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-indigo-50/30 transition-colors even:bg-slate-50/40">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-2.5 py-1.5 text-left font-semibold text-slate-800 whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2.5 py-1.5 text-slate-700 align-top">
              {children}
            </td>
          ),
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className || '');
            const rawText = String(children).replace(/\n$/, '');

            // Check for our custom pre-processed badge token
            if (rawText === 'CRITICAL_KEY_ISSUE_BADGE') {
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs shrink-0 align-middle">
                  <AlertTriangle className="h-3 w-3 text-rose-600 animate-pulse shrink-0" />
                  <span>CRITICAL KEY ISSUE</span>
                </span>
              );
            }

            // Detect workflow status tags
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

            // Fenced code block check
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
