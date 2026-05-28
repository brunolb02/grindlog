export const PROVIDERS = {
  openrouter: {
    name: 'OpenRouter',
    format: 'openai',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    models: [
      { id: 'google/gemini-flash-1.5:free', label: 'Gemini 1.5 Flash (free)' },
      { id: 'google/gemini-flash-1.5-8b:free', label: 'Gemini 1.5 Flash 8B (free)' },
      { id: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (free)' },
      { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (free)' },
      { id: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B (free)' },
    ],
    defaultModel: 'google/gemini-flash-1.5:free',
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
