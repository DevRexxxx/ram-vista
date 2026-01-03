import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { GEMINI_MODELS } from "../constants.ts";

// Initialize AI using process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Custom error class for Gemini API errors
export class GeminiError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
  }
}

// Error code constants
export const ERROR_CODES = {
  API_KEY_MISSING: 'API_KEY_MISSING',
  INVALID_API_KEY: 'INVALID_API_KEY',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  ACCESS_FORBIDDEN: 'ACCESS_FORBIDDEN',
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Parse Gemini API errors to user-friendly messages
export const parseGeminiError = (error: any): GeminiError => {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorStatus = error?.status || error?.code;
  
  // Check for missing API key
  if (!process.env.API_KEY) {
    return new GeminiError(
      'API Key is missing. Please add your Gemini API key to the environment variables.',
      ERROR_CODES.API_KEY_MISSING
    );
  }
  
  // Check for invalid API key (401 or "invalid api key")
  if (errorStatus === 401 || errorMessage.includes('invalid api key') || errorMessage.includes('api key not valid')) {
    return new GeminiError(
      'Invalid API Key. Please check that your Gemini API key is correct.',
      ERROR_CODES.INVALID_API_KEY
    );
  }
  
  // Check for quota exceeded (429 or "quota")
  if (errorStatus === 429 || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
    return new GeminiError(
      'API quota exceeded. Please wait a moment and try again, or check your Gemini API usage limits.',
      ERROR_CODES.QUOTA_EXCEEDED
    );
  }
  
  // Check for access forbidden (403)
  if (errorStatus === 403) {
    return new GeminiError(
      'Access forbidden. Your API key may not have permission to use this model.',
      ERROR_CODES.ACCESS_FORBIDDEN
    );
  }
  
  // Check for model not found
  if (errorMessage.includes('model') && errorMessage.includes('not found')) {
    return new GeminiError(
      'Model not available. The requested Gemini model may have been deprecated or renamed.',
      ERROR_CODES.MODEL_NOT_FOUND
    );
  }
  
  // Check for network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connect')) {
    return new GeminiError(
      'Network error. Please check your internet connection and try again.',
      ERROR_CODES.NETWORK_ERROR
    );
  }
  
  // Default unknown error with original message
  return new GeminiError(
    `Generation failed: ${error?.message || 'Unknown error occurred'}`,
    ERROR_CODES.UNKNOWN_ERROR
  );
};

export const checkApiKey = (): boolean => {
  return !!process.env.API_KEY;
};

export const generateQuickResponse = async (prompt: string): Promise<string> => {
   if (!process.env.API_KEY) {
     throw parseGeminiError(new Error('API Key missing'));
   }
   
   try {
     const response = await ai.models.generateContent({
       model: GEMINI_MODELS.FAST,
       contents: prompt
     });
     // Access the text property directly on the response object.
     return response.text || "";
   } catch (error) {
     console.error("Gemini Quick Response Error", error);
     throw parseGeminiError(error);
   }
};

export const generateArtifact = async (
  model: string,
  systemInstruction: string,
  userPrompt: string,
  isComplex: boolean
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw parseGeminiError(new Error('API Key missing'));
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        // Set thinking budget for reasoning capabilities in Pro models.
        thinkingConfig: isComplex ? { thinkingBudget: 4000 } : undefined
      }
    });
    // Access the text property directly on the response object.
    return response.text || "";
  } catch (error) {
    console.error("Gemini Artifact Generation Error", error);
    throw parseGeminiError(error);
  }
};

export const streamChatResponse = async function* (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string
): AsyncGenerator<string, void, unknown> {
  if (!process.env.API_KEY) {
    yield "❌ API Key missing in environment variables.";
    return;
  }

  try {
    // Correctly using Chat type and chats.create method.
    const chat: Chat = ai.chats.create({
      model: GEMINI_MODELS.STANDARD,
      history: history,
      config: {
        systemInstruction: "You are a helpful assistant for the 'RAM Vista' project. You help the user understand memory virtualization, Linux kernels, and Redis.",
      }
    });

    const result = await chat.sendMessageStream({ message: newMessage });

    for await (const chunk of result) {
      const response = chunk as GenerateContentResponse;
      // Access the text property on the response chunk during streaming.
      if (response.text) {
        yield response.text;
      }
    }
  } catch (error) {
    console.error("Chat Stream Error:", error);
    const geminiError = parseGeminiError(error);
    yield `❌ ${geminiError.message}`;
  }
};