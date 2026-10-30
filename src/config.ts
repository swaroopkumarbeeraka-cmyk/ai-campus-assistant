/**
 * Campus Assistant Configuration
 * Vignan's Lara Institute of Technology & Science (VLITS), Vadlamudi
 * B.Tech R23 Academic Regulations Assistant
 */

// Model selection: Gemini Flash models natively support up to 1,048,576 tokens (1M tokens) context window.
// Both gemini-3.1-flash-lite and gemini-3.8-flash have 1M token context capacity.
export const GEMINI_MODEL = 'gemini-3.1-flash-lite';

// Maximum supported context tokens (1 Million tokens)
export const MAX_CONTEXT_TOKENS = 1048576; // 1M tokens

// Fallback models if primary model hits quota limit (429) or high demand (503)
// All fallback models also support 1M context tokens.
export const FALLBACK_MODELS: readonly string[] = ['gemini-flash-latest', 'gemini-3.8-flash'];

// Low temperature for factual, deterministic regulation answers
export const TEMPERATURE = 0.1;

// Maximum message history turns sent with each API request (last 8 messages)
export const MAX_HISTORY_MESSAGES = 8;

// Maximum character limit for user questions
export const MAX_MESSAGE_LENGTH = 2000;

// Default error message when API fails or quota is exhausted
export const SERVER_BUSY_MESSAGE = 'Server busy, konchem sepu tarvata try cheyyandi';

// Disclaimer displayed at the footer
export const FOOTER_DISCLAIMER = 'AI answers can be wrong. Verify official decisions with your HOD / exam section.';

// Suggested questions on initial load
export const SUGGESTION_CHIPS: readonly string[] = [
  'Attendance shortage unte em avtundi?',
  'Mid marks ela calculate chestaru?',
  'SGPA calculate cheyyi',
  'Honors ki eligibility enti?',
  'Pass avvadaniki minimum marks?',
  'I year syllabus chupinchu',
];
