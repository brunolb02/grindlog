export const PROVIDERS = {
  gemini: {
    name: 'Gemini',
    format: 'gemini',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    ],
    defaultModel: 'gemini-2.5-flash',
  },
  openai: {
    name: 'ChatGPT',
    format: 'openai',
    url: 'https://api.openai.com/v1/chat/completions',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o mini (cheapest)' },
      { id: 'gpt-4o', label: 'GPT-4o' },
    ],
    defaultModel: 'gpt-4o-mini',
  },
}

export const PROVIDER_IDS = Object.keys(PROVIDERS)
