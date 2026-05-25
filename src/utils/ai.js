import { PROVIDERS } from './aiProviders'

const PROMPT = (meal) =>
  `Estimate the macronutrients for this meal: "${meal}"\n\nReply with only a valid JSON object, no markdown, no explanation:\n{"calories":<integer kcal>,"carbs":<integer grams>,"protein":<integer grams>,"fat":<integer grams>}`

function parseJson(text) {
  const clean = text.trim().replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
  const result = JSON.parse(clean)
  return {
    calories: Math.round(result.calories),
    carbs: Math.round(result.carbs),
    protein: Math.round(result.protein),
    fat: Math.round(result.fat),
  }
}

export async function fetchMacros(mealDescription, providerId, apiKey, model) {
  const provider = PROVIDERS[providerId]
  if (!provider) throw new Error('Unknown provider')

  const prompt = PROMPT(mealDescription)
  let text

  if (provider.format === 'openai') {
    const res = await fetch(provider.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `API error ${res.status}`)
    }
    const data = await res.json()
    text = data.choices[0].message.content
  } else {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `API error ${res.status}`)
    }
    const data = await res.json()
    text = data.candidates[0].content.parts[0].text
  }

  return parseJson(text)
}
