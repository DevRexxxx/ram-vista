/**
 * Cloudflare Pages Function: /api/generate
 * Handles server-side Gemini API requests to keep API key secure
 */

interface Env {
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  AI_PROVIDER?: 'gemini' | 'groq'; // Defaults to 'groq' for better rate limits and free tier
}

interface GenerateRequest {
  model: string;
  systemInstruction?: string;
  userPrompt: string;
  isComplex?: boolean;
  stream?: boolean;
  history?: Array<{ role: string; parts: Array<{ text: string }> }>;
  newMessage?: string;
}

interface GeminiRequestBody {
  contents: Array<{
    role?: string;
    parts: Array<{ text: string }>;
  }>;
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
  generationConfig?: {
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
  };
}

interface GroqRequestBody {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Whitelist of allowed Gemini models for security
const ALLOWED_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

// Map Gemini models to equivalent Groq models
function mapGeminiModelToGroq(geminiModel: string): string {
  const modelMap: Record<string, string> = {
    'gemini-flash-lite-latest': 'llama-3.1-8b-instant',
    'gemini-3-flash-preview': 'llama-3.1-70b-versatile',
    'gemini-3-pro-preview': 'llama-3.1-70b-versatile',
    'gemini-1.5-flash': 'llama-3.1-70b-versatile',
    'gemini-1.5-pro': 'mixtral-8x7b-32768',
  };
  return modelMap[geminiModel] || 'llama-3.1-70b-versatile';
}

function isValidModel(model: string): boolean {
  return ALLOWED_MODELS.includes(model);
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Determine which provider to use
  const provider = env.AI_PROVIDER || 'groq';
  
  // Check if the required API key is configured and get the value
  let apiKey: string;
  
  if (provider === 'groq') {
    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: 'Groq API Key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    apiKey = env.GROQ_API_KEY;
  } else {
    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Gemini API Key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    apiKey = env.GEMINI_API_KEY;
  }

  try {
    const body: GenerateRequest = await request.json();
    const { model, systemInstruction, userPrompt, isComplex, stream, history, newMessage } = body;

    // Validate model against whitelist
    if (!isValidModel(model)) {
      return new Response(
        JSON.stringify({ error: 'Invalid model specified' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle streaming chat requests
    if (stream && history && newMessage) {
      if (provider === 'groq') {
        return handleGroqStreamingChat(apiKey, model, systemInstruction, history, newMessage);
      } else {
        return handleStreamingChat(apiKey, model, systemInstruction, history, newMessage);
      }
    }

    // Handle regular content generation
    if (provider === 'groq') {
      return handleGroqGeneration(apiKey, model, systemInstruction, userPrompt, isComplex);
    } else {
      return handleGeneration(apiKey, model, systemInstruction, userPrompt, isComplex);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error processing request', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleGeneration(
  apiKey: string,
  model: string,
  systemInstruction: string | undefined,
  userPrompt: string,
  isComplex: boolean | undefined
): Promise<Response> {
  // Build request body for Gemini API
  const requestBody: GeminiRequestBody = {
    contents: [
      {
        parts: [{ text: userPrompt }]
      }
    ]
  };

  // Add system instruction if provided
  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  // Add generation config for complex reasoning
  if (isComplex) {
    requestBody.generationConfig = {
      temperature: 1.0,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    };
  }

  // Call Gemini API (model is already validated)
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  
  const geminiResponse = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    console.error('Gemini API error:', errorText);
    return new Response(
      JSON.stringify({ 
        error: 'Gemini API error', 
        provider: 'gemini',
        status: geminiResponse.status,
        details: errorText 
      }),
      {
        status: geminiResponse.status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const data = await geminiResponse.json();
  
  // Extract text from response
  let text = '';
  if (data.candidates && data.candidates[0]?.content?.parts) {
    text = data.candidates[0].content.parts
      .map((part: any) => part.text || '')
      .join('');
  }

  return new Response(JSON.stringify({ text }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleStreamingChat(
  apiKey: string,
  model: string,
  systemInstruction: string | undefined,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  newMessage: string
): Promise<Response> {
  // Build request body with history
  const contents = [
    ...history.map(msg => ({
      role: msg.role,
      parts: msg.parts
    })),
    {
      role: 'user',
      parts: [{ text: newMessage }]
    }
  ];

  const requestBody: GeminiRequestBody = {
    contents
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  // Call Gemini streaming API (model is already validated)
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
  
  const geminiResponse = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    return new Response(
      JSON.stringify({ error: 'Gemini API error', provider: 'gemini', details: errorText }),
      {
        status: geminiResponse.status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Stream the response back to the client
  return new Response(geminiResponse.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function handleGroqGeneration(
  apiKey: string,
  model: string,
  systemInstruction: string | undefined,
  userPrompt: string,
  isComplex: boolean | undefined
): Promise<Response> {
  const groqModel = mapGeminiModelToGroq(model);
  
  // Build messages array
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: userPrompt });
  
  // Build request body for Groq API
  const requestBody: GroqRequestBody = {
    model: groqModel,
    messages: messages,
    temperature: isComplex ? 1.0 : 0.7,
    max_tokens: isComplex ? 8192 : 4096,
  };
  
  // Call Groq API
  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  if (!groqResponse.ok) {
    const errorText = await groqResponse.text();
    console.error('Groq API error:', errorText);
    return new Response(
      JSON.stringify({ 
        error: 'Groq API error',
        provider: 'groq',
        status: groqResponse.status,
        details: errorText 
      }),
      {
        status: groqResponse.status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  const data = await groqResponse.json();
  
  // Extract text from Groq response (OpenAI-compatible format)
  const text = data.choices?.[0]?.message?.content || '';
  
  return new Response(JSON.stringify({ text }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleGroqStreamingChat(
  apiKey: string,
  model: string,
  systemInstruction: string | undefined,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  newMessage: string
): Promise<Response> {
  const groqModel = mapGeminiModelToGroq(model);
  
  // Build messages array from history
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  
  // Convert Gemini history format to Groq format
  for (const msg of history) {
    const role = msg.role === 'model' ? 'assistant' : (msg.role === 'user' ? 'user' : 'assistant');
    const content = msg.parts.map(p => p.text).join('');
    messages.push({ role, content });
  }
  
  // Add new user message
  messages.push({ role: 'user', content: newMessage });
  
  // Build request body for Groq streaming API
  const requestBody: GroqRequestBody = {
    model: groqModel,
    messages: messages,
    temperature: 0.7,
    stream: true,
  };
  
  // Call Groq streaming API
  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  if (!groqResponse.ok) {
    const errorText = await groqResponse.text();
    return new Response(
      JSON.stringify({ error: 'Groq API error', provider: 'groq', details: errorText }),
      {
        status: groqResponse.status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Transform Groq's OpenAI-compatible SSE format to Gemini format
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  
  // Process the stream in the background
  (async () => {
    try {
      const reader = groqResponse.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        await writer.close();
        return;
      }
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data.trim() === '[DONE]') {
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                // Convert to Gemini-compatible format
                const geminiFormat = {
                  candidates: [{
                    content: {
                      parts: [{ text: content }]
                    }
                  }]
                };
                
                await writer.write(encoder.encode(`data: ${JSON.stringify(geminiFormat)}\n\n`));
              }
            } catch (e) {
              // Skip invalid JSON, but log for debugging
              console.debug('Failed to parse Groq stream data:', data, e);
            }
          }
        }
      }
      
      await writer.close();
    } catch (error) {
      console.error('Streaming error:', error);
      await writer.abort(error);
    }
  })();
  
  // Return the transformed stream
  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
