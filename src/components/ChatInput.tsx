import React, { useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import { MAX_MESSAGE_LENGTH, FOOTER_DISCLAIMER } from '../config';

interface ChatInputProps {
  input: string;
  onChange: (val: string) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  onChange,
  onSend,
  onStop,
  isStreaming,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Clamp between min 44px and max 180px
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 44), 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isStreaming) return;
    const trimmed = input.trim();
    if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return;
    onSend(trimmed);
  };

  const charCount = input.length;
  const isTooLong = charCount > MAX_MESSAGE_LENGTH;
  const isNearLimit = charCount >= 1800;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-3 pt-1">
      <div className="relative flex flex-col bg-[var(--surface)] border border-[var(--border)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-2xl shadow-sm transition-all">
        <div className="flex items-end px-3 py-2 gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about VLITS R23 rules, syllabus, grading..."
            disabled={disabled}
            aria-label="Ask about VLITS R23 rules, syllabus, grading"
            maxLength={MAX_MESSAGE_LENGTH + 50} // slight buffer so user sees warning if pasted
            className="flex-1 bg-transparent border-0 outline-hidden resize-none text-sm sm:text-base text-[var(--text-main)] placeholder:text-[var(--text-muted)] py-1 max-h-44 leading-relaxed"
          />

          {/* Action button: Stop if streaming, else Send */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
              title="Stop generating"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition flex-shrink-0 shadow-xs active:scale-95"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim() || isTooLong || disabled}
              aria-label="Send question"
              title="Send"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-xs active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Character counter (shows when near limit) */}
        {isNearLimit && (
          <div className="flex justify-end px-3 pb-1 text-[11px]">
            <span className={isTooLong ? 'text-rose-500 font-semibold' : 'text-[var(--text-muted)]'}>
              {charCount} / {MAX_MESSAGE_LENGTH}
            </span>
          </div>
        )}
      </div>

      {/* Footer disclaimer */}
      <p className="mt-2 text-center text-[11px] sm:text-xs text-[var(--text-muted)] leading-tight px-2">
        {FOOTER_DISCLAIMER}
      </p>
    </div>
  );
};
