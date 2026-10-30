import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODEL, FALLBACK_MODELS, TEMPERATURE, MAX_HISTORY_MESSAGES, SERVER_BUSY_MESSAGE } from '../config.ts';
import { prepareChatHistory, formatForGemini, type ChatMessage } from '../utils/chatUtils.ts';

let cachedAi: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!cachedAi) {
    const apiKey = process.env.GEMINI_API_KEY;
    cachedAi = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAi;
}

/**
 * Loads the raw system prompt text from src/prompts/system.txt at runtime.
 * Never shortens, summarizes, rewrites or hardcodes its contents.
 */
export async function loadSystemPrompt(): Promise<string> {
  const promptPath = path.resolve(process.cwd(), 'src', 'prompts', 'system.txt');
  try {
    const raw = await fs.promises.readFile(promptPath, 'utf-8');
    // Calculate estimated tokens (~4 chars per token for typical text)
    const estTokens = Math.round(raw.length / 4);
    console.log(`[Campus Assistant] System prompt loaded: ${raw.length.toLocaleString()} chars (~${estTokens.toLocaleString()} tokens). Supported up to 1,000,000 tokens.`);
    return raw;
  } catch (err) {
    console.warn(`[Campus Assistant] Could not read ${promptPath}, falling back to placeholder`, err);
    return 'PASTE SYSTEM PROMPT HERE';
  }
}

/**
 * Handles incoming streaming chat requests.
 */
export async function handleChatStream(
  req: IncomingMessage,
  res: ServerResponse,
  bodyData?: { messages: Array<Pick<ChatMessage, 'role' | 'content'>> }
) {
  // If client terminates connection early
  let isAborted = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      isAborted = true;
    }
  });

  try {
    let payload = bodyData || (req as any).body;
    if (!payload) {
      payload = await new Promise<{ messages: Array<Pick<ChatMessage, 'role' | 'content'>> }>((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => {
          data += chunk;
          // Allow up to 50MB payloads for massive multi-turn conversation and context
          if (data.length > 50 * 1024 * 1024) {
            reject(new Error('Payload too large'));
          }
        });
        req.on('end', () => {
          try {
            resolve(JSON.parse(data || '{}'));
          } catch (e) {
            reject(e);
          }
        });
        req.on('error', reject);
      });
    }

    const messages = payload?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Valid messages array is required' }));
      return;
    }

    // Send only the last 8 messages of chat history with each request
    const recentHistory = prepareChatHistory(messages, MAX_HISTORY_MESSAGES);
    const geminiContents = formatForGemini(recentHistory);

    // Load system prompt dynamically as-is from disk
    const systemPrompt = await loadSystemPrompt();

    // Prepare Gemini SDK client
    const ai = getGeminiClient();

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx/proxies
    });

    // Flush headers if supported
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    // Try configured model, and automatically fall back to alternative models if quota (429) or demand (503) is hit
    const candidateModels = Array.from(new Set([GEMINI_MODEL, ...(FALLBACK_MODELS || [])]));
    let responseStream: any = null;
    let lastError: any = null;

    for (const modelToTry of candidateModels) {
      if (isAborted) break;
      try {
        responseStream = await ai.models.generateContentStream({
          model: modelToTry,
          contents: geminiContents,
          config: {
            systemInstruction: systemPrompt,
            temperature: TEMPERATURE,
          },
        });
        // Succeeded connecting to stream
        break;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err);
        const isQuotaOrDemand =
          err?.status === 429 ||
          err?.status === 503 ||
          errStr.includes('429') ||
          errStr.includes('503') ||
          errStr.includes('quota') ||
          errStr.includes('RESOURCE_EXHAUSTED') ||
          errStr.includes('high demand');

        if (isQuotaOrDemand) {
          console.warn(`[Campus Assistant] Model ${modelToTry} hit quota/demand limits, trying fallback...`);
          continue;
        } else {
          throw err;
        }
      }
    }

    if (!responseStream) {
      throw lastError || new Error('No available model stream');
    }

    for await (const chunk of responseStream) {
      if (isAborted) break;
      const chunkText = chunk.text;
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      }
    }

    if (!isAborted) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    }
    res.end();
  } catch (error: any) {
    console.error('[Campus Assistant] Gemini streaming error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: SERVER_BUSY_MESSAGE, details: error?.message || String(error) }));
    } else {
      res.write(`data: ${JSON.stringify({ error: SERVER_BUSY_MESSAGE })}\n\n`);
      res.end();
    }
  }
}
