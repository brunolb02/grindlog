export const PROVIDERS = {
  groq: {
    name: 'Groq',
    format: 'openai',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
      { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    ],
    defaultModel: 'llama-3.3-70b-versatile',
  },
  openrouter: {
    name: 'OpenRouter',
    format: 'openai',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    models: [
      { id: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (free)' },
      { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (free)' },
      { id: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B (free)' },
    ],
    defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
  },
  gemini: {
    name: 'Gemini',
    format: 'gemini',
    models: [
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    ],
    defaultModel: 'gemini-1.5-flash',
  },
}

export const PROVIDER_IDS = Object.keys(PROVIDERS)
