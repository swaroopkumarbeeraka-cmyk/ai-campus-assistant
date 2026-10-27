import React from 'react';
import { GraduationCap, RotateCcw, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  onNewChat: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isStreaming: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNewChat,
  isDarkMode,
  onToggleTheme,
  isStreaming,
}) => {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)] text-white shadow-sm flex-shrink-0">
          <GraduationCap className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-main)] truncate">
              Campus Assistant
            </h1>
            <span className="hidden xs:inline-flex text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--badge-bg)] text-[var(--badge-text)]">
              R23
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] truncate">
            VLITS R23 Academic Rules
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={onNewChat}
          disabled={isStreaming}
          aria-label="Start new chat"
          title="Start new chat"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-[var(--text-main)] hover:bg-[var(--surface-subtle)] border border-[var(--border)] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="hidden sm:inline">New chat</span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-subtle)] border border-[var(--border)] transition"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
};
