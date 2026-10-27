import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300">
      <div className="px-3.5 py-1.5 rounded-full bg-[var(--toast-bg)] text-[var(--toast-text)] text-xs font-medium shadow-lg border border-[var(--border)] animate-fade-in">
        {message}
      </div>
    </div>
  );
};
