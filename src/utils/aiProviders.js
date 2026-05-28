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
}

export const PROVIDER_IDS = Object.keys(PROVIDERS)
