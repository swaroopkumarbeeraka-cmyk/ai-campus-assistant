import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw, GraduationCap } from 'lucide-react';
import type { ChatMessage } from '../utils/chatUtils';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  previousUserMessage?: string;
  isStreaming?: boolean;
  onRetry?: () => void;
  onFeedbackDown: (question: string, answer: string) => void;
  onShowToast: (msg: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  previousUserMessage = '',
  isStreaming = false,
  onRetry,
  onFeedbackDown,
  onShowToast,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      onShowToast('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is constrained
      const textArea = document.createElement('textarea');
      textArea.value = message.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      onShowToast('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleThumbsUp = () => {
    if (feedback === 'up') return;
    setFeedback('up');
    onShowToast('Thanks for your feedback!');
  };

  const handleThumbsDown = () => {
    if (feedback === 'down') return;
    setFeedback('down');
    onFeedbackDown(previousUserMessage, message.content);
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-2 px-3 sm:px-4">
        <div
          className="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-xs text-sm sm:text-base leading-relaxed text-[var(--bubble-user-text)] bg-[var(--bubble-user)] break-words"
          style={{ backgroundColor: 'var(--bubble-user)', color: 'var(--bubble-user-text)' }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant bubble
  return (
    <div className="flex gap-2.5 sm:gap-3 my-3 px-3 sm:px-4 max-w-full">
      {/* Bot Avatar */}
      <div className="w-8 h-8 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
        <GraduationCap className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 max-w-[92%] sm:max-w-[85%]">
        {/* Main Content Box */}
        <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-[var(--bubble-bot)] text-[var(--bubble-bot-text)] border border-[var(--bubble-bot-border)] shadow-xs">
          {message.isError ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {message.content}
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          ) : message.content === '' && isStreaming ? (
            /* Typing indicator: three animated dots */
            <div className="flex items-center gap-1.5 py-1 px-0.5" aria-label="Typing reply">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ node, ...props }) => (
                    <div className="markdown-table-wrapper">
                      <table {...props} />
                    </div>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action buttons under assistant reply (when not streaming and not error) */}
        {!message.isError && message.content !== '' && (
          <div className="flex items-center gap-1 mt-1.5 ml-1 text-xs text-[var(--text-muted)]">
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy answer"
              title="Copy answer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[var(--surface-subtle)] hover:text-[var(--text-main)] transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] text-emerald-600 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>

            <span className="text-[var(--border)]">|</span>

            <button
              type="button"
              onClick={handleThumbsUp}
              aria-label="Helpful answer"
              title="Helpful"
              className={`p-1.5 rounded-md hover:bg-[var(--surface-subtle)] transition ${
                feedback === 'up'
                  ? 'text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/40'
                  : 'hover:text-[var(--text-main)]'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleThumbsDown}
              aria-label="Unhelpful answer"
              title="Report issue or unhelpful"
              className={`p-1.5 rounded-md hover:bg-[var(--surface-subtle)] transition ${
                feedback === 'down'
                  ? 'text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/40'
                  : 'hover:text-[var(--text-main)]'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
