import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateMessage,
  prepareChatHistory,
  formatForGemini,
  extractQueryParam,
  saveFeedbackLog,
  getFeedbackLogs,
  ChatMessage,
} from './chatUtils';

test('validateMessage rejects empty and whitespace-only strings', () => {
  assert.equal(validateMessage('').isValid, false);
  assert.equal(validateMessage('   \n  \t ').isValid, false);
});

test('validateMessage accepts valid string within limit', () => {
  const result = validateMessage('How are mid marks calculated?', 2000);
  assert.equal(result.isValid, true);
  assert.equal(result.sanitized, 'How are mid marks calculated?');
});

test('validateMessage flags strings exceeding character limit', () => {
  const longString = 'a'.repeat(2005);
  const result = validateMessage(longString, 2000);
  assert.equal(result.isValid, false);
  assert.equal(result.sanitized.length, 2000);
  assert.match(result.error || '', /maximum 2000 characters/i);
});

test('prepareChatHistory slices strictly to last N messages', () => {
  const messages: Array<Pick<ChatMessage, 'role' | 'content'>> = [
    { role: 'user', content: 'm1' },
    { role: 'assistant', content: 'm2' },
    { role: 'user', content: 'm3' },
    { role: 'assistant', content: 'm4' },
    { role: 'user', content: 'm5' },
    { role: 'assistant', content: 'm6' },
    { role: 'user', content: 'm7' },
    { role: 'assistant', content: 'm8' },
    { role: 'user', content: 'm9' },
    { role: 'assistant', content: 'm10' },
  ];

  const sliced = prepareChatHistory(messages, 8);
  assert.equal(sliced.length, 8);
  assert.equal(sliced[0].content, 'm3');
  assert.equal(sliced[7].content, 'm10');
});

test('prepareChatHistory filters empty items and preserves order when < 8', () => {
  const messages: Array<Pick<ChatMessage, 'role' | 'content'>> = [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: ' ' },
    { role: 'user', content: 'What is R23?' },
  ];
  const sliced = prepareChatHistory(messages, 8);
  assert.equal(sliced.length, 2);
  assert.equal(sliced[0].content, 'Hello');
  assert.equal(sliced[1].content, 'What is R23?');
});

test('formatForGemini converts role "assistant" to "model" with parts array', () => {
  const messages: Array<Pick<ChatMessage, 'role' | 'content'>> = [
    { role: 'user', content: 'Hi' },
    { role: 'assistant', content: 'Hello from VLITS Assistant' },
  ];
  const formatted = formatForGemini(messages);
  assert.deepEqual(formatted, [
    { role: 'user', parts: [{ text: 'Hi' }] },
    { role: 'model', parts: [{ text: 'Hello from VLITS Assistant' }] },
  ]);
});

test('extractQueryParam correctly parses ?q= parameter', () => {
  assert.equal(extractQueryParam('?q=Attendance+rules'), 'Attendance rules');
  assert.equal(extractQueryParam('?other=123&q=Syllabus%20details'), 'Syllabus details');
  assert.equal(extractQueryParam('?other=123'), null);
  assert.equal(extractQueryParam(''), null);
});

test('saveFeedbackLog and getFeedbackLogs handle storage serialization', () => {
  const store: Record<string, string> = {};
  const mockStorage: Storage = {
    length: 0,
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    getItem: (key: string) => store[key] ?? null,
    key: (index: number) => Object.keys(store)[index] ?? null,
    removeItem: (key: string) => { delete store[key]; },
    setItem: (key: string, value: string) => { store[key] = value; },
  };

  const entry1 = { question: 'Q1', answer: 'A1', timestamp: '2026-10-26T10:00:00Z' };
  const entry2 = { question: 'Q2', answer: 'A2', timestamp: '2026-10-26T10:05:00Z' };

  assert.equal(saveFeedbackLog(mockStorage, entry1), true);
  assert.equal(saveFeedbackLog(mockStorage, entry2), true);

  const logs = getFeedbackLogs(mockStorage);
  assert.equal(logs.length, 2);
  assert.deepEqual(logs[0], entry1);
  assert.deepEqual(logs[1], entry2);
});
