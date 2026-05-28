import { PROVIDERS } from './aiProviders'

const SYSTEM_PROMPT = `You are a precise nutrition expert with knowledge of food brand labels worldwide, including Brazilian brands.

Rules:
1. If a specific brand or product is mentioned, use that brand's actual nutrition label data.
2. If a quantity is specified (e.g. "6 toasts", "2 scoops"), find the per-unit macros first, then multiply by the exact quantity.
3. Never over-estimate. Prefer the conservative, label-accurate value.
4. Always respond with a brief reasoning line, then a JSON object on its own line.`

const USER_PROMPT = (meal) =>
  `Calculate the total macronutrients for: "${meal}"

Think step by step (one line), then output the JSON on the next line:
{"calories":<integer kcal>,"carbs":<integer grams>,"protein":<integer grams>,"fat":<integer grams>}`

function parseJson(text) {
  // Extract JSON from the last line or find the JSON object in the response
  const lines = text.trim().split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim().replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
    if (line.startsWith('{')) {
      const result = JSON.parse(line)
      return {
        calories: Math.round(result.calories),
        carbs: Math.round(result.carbs),
        protein: Math.round(result.protein),
        fat: Math.round(result.fat),
      }
    }
  }
  // Fallback: try to parse the whole text
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

  const userPrompt = USER_PROMPT(mealDescription)
  let text

  if (provider.format === 'openai') {
    const res = await fetch(provider.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
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
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0 },
        }),
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
