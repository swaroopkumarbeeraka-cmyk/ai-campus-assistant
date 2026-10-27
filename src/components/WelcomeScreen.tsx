import React from 'react';
import { Sparkles, BookOpen, HelpCircle } from 'lucide-react';
import { SUGGESTION_CHIPS } from '../config';

interface WelcomeScreenProps {
  onSelectSuggestion: (question: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectSuggestion }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-2xl mx-auto my-auto animate-fade-in">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)] mb-4 shadow-sm">
        <BookOpen className="w-7 h-7" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] mb-1">
        Namaskaram!
      </h2>
      <p className="text-sm text-[var(--text-muted)] max-w-md mb-6 leading-relaxed">
        I am your VLITS Campus Assistant for <strong className="text-[var(--text-main)] font-semibold">B.Tech R23 Regulations</strong>, course structure, grading policy, and first-year syllabus.
      </p>

      <div className="w-full text-left">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] mb-3 px-1 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span>Frequently Asked Questions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SUGGESTION_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSuggestion(chip)}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-subtle)] border border-[var(--border)] text-left text-xs sm:text-sm text-[var(--text-main)] transition-all hover:border-[var(--primary-border)] hover:shadow-xs group"
            >
              <HelpCircle className="w-4 h-4 text-[var(--primary)] mt-0.5 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="leading-snug">{chip}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
