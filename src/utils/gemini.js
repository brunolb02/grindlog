const MODEL = 'gemini-2.0-flash'

export async function fetchMacros(mealDescription, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Estimate the macronutrients for this meal: "${mealDescription}"\n\nReply with only a valid JSON object, no markdown, no explanation:\n{"calories":<integer kcal>,"carbs":<integer grams>,"protein":<integer grams>,"fat":<integer grams>}`
          }]
        }]
      })
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }
  const data = await res.json()
  const raw = data.candidates[0].content.parts[0].text.trim()
  const clean = raw.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
  const result = JSON.parse(clean)
  return {
    calories: Math.round(result.calories),
    carbs: Math.round(result.carbs),
    protein: Math.round(result.protein),
    fat: Math.round(result.fat),
  }
}
