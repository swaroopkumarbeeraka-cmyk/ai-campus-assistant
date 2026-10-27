/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatMessageBubble } from './components/ChatMessageBubble';
import { ChatInput } from './components/ChatInput';
import { Toast } from './components/Toast';
import { SERVER_BUSY_MESSAGE } from './config';
import {
  type ChatMessage,
  validateMessage,
  extractQueryParam,
  saveFeedbackLog,
} from './utils/chatUtils';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vlits_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasHandledQueryRef = useRef(false);

  // Apply dark mode class to root document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vlits_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vlits_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Toast notification helper
  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  // Smooth auto-scroll to bottom of conversation
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isStreaming, scrollToBottom]);

  // Handle negative feedback (Thumbs Down)
  const handleFeedbackDown = useCallback(
    (question: string, answer: string) => {
      saveFeedbackLog(window.localStorage, {
        question: question || 'Direct query',
        answer,
        timestamp: new Date().toISOString(),
      });
      showToast('Thanks, noted');
    },
    [showToast]
  );

  // Stop currently streaming generation
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Core send message logic
  const handleSend = useCallback(
    async (text: string) => {
      const validation = validateMessage(text);
      if (!validation.isValid) return;

      const userText = validation.sanitized;
      const userMessageId = `user_${Date.now()}`;
      const botMessageId = `bot_${Date.now()}`;

      const userMessage: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: userText,
        timestamp: Date.now(),
      };

      const initialBotMessage: ChatMessage = {
        id: botMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      // Update state with user message and placeholder for bot reply
      setMessages((prev) => [...prev, userMessage, initialBotMessage]);
      setInput('');
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Construct history turns for request payload
      // Note: We include previous valid messages plus current user message
      const historyTurns = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: historyTurns }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(SERVER_BUSY_MESSAGE);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body stream');
        }

        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataPayload = trimmed.slice(6);
              try {
                const parsed = JSON.parse(dataPayload);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMessageId ? { ...msg, content: accumulatedText } : msg
                    )
                  );
                }
              } catch (parseErr: any) {
                if (parseErr.message === SERVER_BUSY_MESSAGE) {
                  throw parseErr;
                }
                // Skip invalid intermediate JSON
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Stopped intentionally by user
          return;
        }

        console.error('Chat error:', err);
        // Show friendly error message with retry
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? {
                  ...msg,
                  isError: true,
                  content: SERVER_BUSY_MESSAGE,
                }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [messages]
  );

  // Retry sending the last user message
  const handleRetry = useCallback(() => {
    // Find last user message
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualIndex = messages.length - 1 - lastUserIndex;
    const lastUserMessage = messages[actualIndex];

    // Remove the failed bot message and subsequent turns, then re-send
    setMessages((prev) => prev.slice(0, actualIndex));
    handleSend(lastUserMessage.content);
  }, [messages, handleSend]);

  // Clear conversation (New Chat)
  const handleNewChat = useCallback(() => {
    if (isStreaming) {
      handleStop();
    }
    setMessages([]);
    setInput('');
  }, [isStreaming, handleStop]);

  // Support ?q=... optional URL parameter for auto-sending on load
  useEffect(() => {
    if (hasHandledQueryRef.current) return;
    hasHandledQueryRef.current = true;

    if (typeof window !== 'undefined') {
      const queryQuestion = extractQueryParam(window.location.search, 'q');
      if (queryQuestion) {
        // Clean URL parameter without reloading page
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        // Auto-send query question
        handleSend(queryQuestion);
      }
    }
  }, [handleSend]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg)] text-[var(--text-main)] font-sans">
      {/* Toast popup */}
      <Toast message={toastMessage} />

      {/* Header */}
      <Header
        onNewChat={handleNewChat}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        isStreaming={isStreaming}
      />

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 flex flex-col justify-start">
        {messages.length === 0 ? (
          <WelcomeScreen onSelectSuggestion={(q) => handleSend(q)} />
        ) : (
          <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-start pb-4">
            {messages.map((msg, index) => {
              // Find previous user message for feedback tracking
              let prevUserText = '';
              if (msg.role === 'assistant') {
                for (let i = index - 1; i >= 0; i--) {
                  if (messages[i].role === 'user') {
                    prevUserText = messages[i].content;
                    break;
                  }
                }
              }

              return (
                <ChatMessageBubble
                  key={msg.id}
                  message={msg}
                  previousUserMessage={prevUserText}
                  isStreaming={isStreaming && index === messages.length - 1}
                  onRetry={msg.isError ? handleRetry : undefined}
                  onFeedbackDown={handleFeedbackDown}
                  onShowToast={showToast}
                />
              );
            })}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </main>

      {/* Fixed bottom input bar */}
      <footer className="sticky bottom-0 z-20 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm">
        <ChatInput
          input={input}
          onChange={setInput}
          onSend={handleSend}
          onStop={handleStop}
          isStreaming={isStreaming}
        />
      </footer>
    </div>
  );
}
