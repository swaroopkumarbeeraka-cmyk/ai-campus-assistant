/**
 * Pure utility functions for Campus Assistant chat logic
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isError?: boolean;
}

export interface GeminiContentPart {
  text: string;
}

export interface GeminiContentTurn {
  role: 'user' | 'model';
  parts: GeminiContentPart[];
}

export interface FeedbackEntry {
  question: string;
  answer: string;
  timestamp: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized: string;
}

/**
 * Validates and sanitizes a user message before sending.
 */
export function validateMessage(content: string, maxLength = 2000): ValidationResult {
  if (!content || typeof content !== 'string') {
    return { isValid: false, error: 'Message cannot be empty', sanitized: '' };
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Message cannot be empty', sanitized: '' };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `Message is too long (maximum ${maxLength} characters)`,
      sanitized: trimmed.slice(0, maxLength),
    };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Truncates chat history to the last N messages to fit prompt budget.
 */
export function prepareChatHistory(
  messages: Array<Pick<ChatMessage, 'role' | 'content'>>,
  maxMessages = 8
): Array<Pick<ChatMessage, 'role' | 'content'>> {
  if (!Array.isArray(messages)) return [];
  // Filter out any messages with empty content or errors
  const valid = messages.filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0);
  return valid.slice(-maxMessages);
}

/**
 * Converts internal chat messages into the Gemini contents payload format.
 * Maps 'assistant' role to 'model'.
 */
export function formatForGemini(
  messages: Array<Pick<ChatMessage, 'role' | 'content'>>
): GeminiContentTurn[] {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

/**
 * Parses query parameter from URL search string (e.g. ?q=Attendance+rules).
 */
export function extractQueryParam(search: string, param = 'q'): string | null {
  if (!search) return null;
  try {
    const params = new URLSearchParams(search);
    const value = params.get(param);
    return value ? value.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Stores negative feedback in localStorage under key 'feedback_log'.
 */
export function saveFeedbackLog(
  storage: Storage | null,
  entry: FeedbackEntry,
  storageKey = 'feedback_log'
): boolean {
  if (!storage) return false;
  try {
    const existingRaw = storage.getItem(storageKey);
    let logs: FeedbackEntry[] = [];
    if (existingRaw) {
      try {
        const parsed = JSON.parse(existingRaw);
        if (Array.isArray(parsed)) {
          logs = parsed;
        }
      } catch {
        logs = [];
      }
    }
    logs.push(entry);
    storage.setItem(storageKey, JSON.stringify(logs));
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves feedback logs from localStorage.
 */
export function getFeedbackLogs(
  storage: Storage | null,
  storageKey = 'feedback_log'
): FeedbackEntry[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
