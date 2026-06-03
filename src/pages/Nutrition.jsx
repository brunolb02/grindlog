import { useState, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'
import { FormField, TextInput, NumberInput, PrimaryButton } from '../components/FormField'
import { getMeals, saveMeals, getNutritionLog, saveNutritionLog, getAiSettings, generateId, todayKey } from '../utils/storage'
import { fetchMacros } from '../utils/ai'
import { MEAL_CATEGORIES } from './Library'
import './Nutrition.css'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function defaultCategory() {
  const hour = new Date().getHours()
  if (hour < 10) return 'Breakfast'
  if (hour < 15) return 'Lunch'
  if (hour < 19) return 'Snack'
  return 'Dinner'
}

function emptyMealForm(category) {
  return { name: '', aiDescription: '', calories: '', carbs: '', protein: '', fat: '', category: category || defaultCategory() }
}

function MealRow({ meal, onAdd }) {
  return (
    <button className="list-item meal-item" onClick={() => onAdd(meal)}>
      <div className="list-item-left meal-info">
        <span className="list-item-name">{meal.name}</span>
        <span className="meal-macros">{meal.calories} kcal · P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g</span>
      </div>
      <span className="log-add-icon">+</span>
    </button>
  )
}

export default function Nutrition() {
  const [log, setLog] = useState(getNutritionLog)
  const [meals, setMeals] = useState(getMeals)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetView, setSheetView] = useState('list') // 'list' | 'create'
  const [selectedDate] = useState(todayKey())

  const [activeCategory, setActiveCategory] = useState(defaultCategory)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [mealForm, setMealForm] = useState(() => emptyMealForm())
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const aiSettings = getAiSettings()
  const activeProvider = aiSettings.active
  const activeProviderSettings = aiSettings[activeProvider]
  const hasAiKey = !!activeProviderSettings?.key

  const todayEntries = useMemo(
    () => log.filter(e => e.date === selectedDate).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [log, selectedDate]
  )

  const mealFrequency = useMemo(() => {
    const freq = {}
    for (const e of log) freq[e.mealId] = (freq[e.mealId] || 0) + 1
    return freq
  }, [log])

  const categoryMeals = useMemo(() =>
    meals
      .filter(m => (m.category || 'Breakfast') === activeCategory)
      .sort((a, b) => (mealFrequency[b.id] || 0) - (mealFrequency[a.id] || 0) || a.name.localeCompare(b.name)),
    [meals, activeCategory, mealFrequency]
  )

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return meals
      .filter(m => m.name.toLowerCase().includes(q))
      .sort((a, b) => (mealFrequency[b.id] || 0) - (mealFrequency[a.id] || 0) || a.name.localeCompare(b.name))
  }, [searchQuery, meals, mealFrequency])

  function openSheet() {
    setSheetView('list')
    setActiveCategory(defaultCategory())
    setSearchOpen(false)
    setSearchQuery('')
    setSheetOpen(true)
  }

  function addMeal(meal) {
    const entry = {
      id: generateId(),
      mealId: meal.id,
      mealName: meal.name,
      calories: meal.calories,
      carbs: meal.carbs,
      protein: meal.protein,
      fat: meal.fat,
      date: selectedDate,
      timestamp: new Date().toISOString(),
    }
    const updated = [...log, entry]
    setLog(updated)
    saveNutritionLog(updated)
    setSheetOpen(false)
  }

  function removeEntry(id) {
    const updated = log.filter(e => e.id !== id)
    setLog(updated)
    saveNutritionLog(updated)
  }

  async function fillWithAi() {
    setAiLoading(true)
    setAiError(null)
    try {
      const macros = await fetchMacros(
        mealForm.aiDescription.trim() || mealForm.name,
        activeProvider,
        activeProviderSettings.key,
        activeProviderSettings.model
      )
      setMealForm(f => ({
        ...f,
        calories: String(macros.calories),
        carbs: String(macros.carbs),
        protein: String(macros.protein),
        fat: String(macros.fat),
      }))
    } catch (e) {
      setAiError(e.message || 'Failed to fetch macros')
    } finally {
      setAiLoading(false)
    }
  }

  function openCreateView() {
    setMealForm(emptyMealForm(activeCategory))
    setAiError(null)
    setSheetView('create')
  }

  function createAndLog() {
    const newMeal = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      name: mealForm.name,
      calories: Number(mealForm.calories),
      carbs: Number(mealForm.carbs),
      protein: Number(mealForm.protein),
      fat: Number(mealForm.fat),
      category: mealForm.category,
    }
    const updatedMeals = [...meals, newMeal]
    setMeals(updatedMeals)
    saveMeals(updatedMeals)
    addMeal(newMeal)
  }

  const totals = todayEntries.reduce(
    (acc, e) => ({ calories: acc.calories + e.calories, carbs: acc.carbs + e.carbs, protein: acc.protein + e.protein, fat: acc.fat + e.fat }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  )

  const sheetHeaderContent = sheetView === 'list' ? (
    <div className="log-sheet-controls">
      {searchOpen ? (
        <input
          className="log-search-input"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search meals…"
          autoFocus
        />
      ) : (
        <div className="log-sheet-tabs">
          {MEAL_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`log-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >{cat}</button>
          ))}
        </div>
      )}
      <button
        className="log-search-toggle"
        onClick={() => { setSearchOpen(s => !s); setSearchQuery('') }}
      >
        {searchOpen ? '✕' : '⌕'}
      </button>
    </div>
  ) : null

  return (
    <div className="page">
      <PageHeader
        title="Nutrition"
        action={<button className="add-btn" onClick={openSheet}>+ Add</button>}
      />
      <div className="page-body scroll-area">
        <div className="nutrition-summary">
          <div className="summary-cal">
            <span className="cal-value">{totals.calories}</span>
            <span className="cal-label">kcal today</span>
          </div>
          <div className="macro-pills">
            <div className="macro-pill carbs">
              <span className="macro-val">{totals.carbs}g</span>
              <span className="macro-name">Carbs</span>
            </div>
            <div className="macro-pill protein">
              <span className="macro-val">{totals.protein}g</span>
              <span className="macro-name">Protein</span>
            </div>
            <div className="macro-pill fat">
              <span className="macro-val">{totals.fat}g</span>
              <span className="macro-name">Fat</span>
            </div>
          </div>
        </div>

        {todayEntries.length === 0 ? (
          <div className="empty-state">
            <p>No meals logged today</p>
            <p className="empty-hint">Tap + Add to log a meal</p>
          </div>
        ) : (
          <div className="item-list">
            {todayEntries.map(entry => (
              <div key={entry.id} className="meal-entry">
                <div className="meal-entry-info">
                  <span className="meal-entry-name">{entry.mealName}</span>
                  <span className="meal-entry-macros">{entry.calories} kcal · P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g</span>
                  <span className="meal-entry-time">{formatTime(entry.timestamp)}</span>
                </div>
                <button className="remove-btn" onClick={() => removeEntry(entry.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={sheetView === 'create' ? 'New Meal' : 'Log a Meal'}
        headerContent={sheetHeaderContent}
      >
        {sheetView === 'list' ? (
          <>
            {searchOpen ? (
              searchQuery.trim() === '' ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <p className="empty-hint">Type to search meals…</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <p className="empty-hint">No meals found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="item-list">
                  {searchResults.map(meal => (
                    <MealRow key={meal.id} meal={meal} onAdd={addMeal} />
                  ))}
                </div>
              )
            ) : (
              categoryMeals.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <p className="empty-hint">No {activeCategory.toLowerCase()} meals yet</p>
                </div>
              ) : (
                <div className="item-list">
                  {categoryMeals.map(meal => (
                    <MealRow key={meal.id} meal={meal} onAdd={addMeal} />
                  ))}
                </div>
              )
            )}
            <button className="create-meal-btn" onClick={openCreateView}>
              + New Meal
            </button>
          </>
        ) : (
          <>
            <button className="back-btn" onClick={() => setSheetView('list')}>← Back</button>
            <FormField label="Meal Name">
              <TextInput value={mealForm.name} onChange={v => setMealForm(f => ({ ...f, name: v }))} placeholder="e.g. Chicken & Rice" />
            </FormField>
            {hasAiKey && (
              <FormField label="AI Description (optional)">
                <TextInput
                  value={mealForm.aiDescription}
                  onChange={v => setMealForm(f => ({ ...f, aiDescription: v }))}
                  placeholder="e.g. 6 magic toast Lev de cacau"
                />
              </FormField>
            )}
            {hasAiKey ? (
              <div className="ai-fill-row">
                <button
                  className="ai-fill-btn"
                  onClick={fillWithAi}
                  disabled={!mealForm.name.trim() || aiLoading}
                >
                  {aiLoading ? 'Filling…' : '✦ Fill macros with AI'}
                </button>
                {aiError && <span className="ai-fill-error">{aiError}</span>}
              </div>
            ) : (
              <p className="ai-setup-hint">
                ✦ Set up a free Gemini API key in <strong>Dashboard → ⚙</strong> to auto-fill macros with AI
              </p>
            )}
            <FormField label="Category">
              <div className="muscle-picker">
                {MEAL_CATEGORIES.map(c => (
                  <button
                    key={c}
                    className={`muscle-chip ${mealForm.category === c ? 'active' : ''}`}
                    onClick={() => setMealForm(f => ({ ...f, category: c }))}
                  >{c}</button>
                ))}
              </div>
            </FormField>
            <FormField label="Calories (kcal)">
              <NumberInput value={mealForm.calories} onChange={v => setMealForm(f => ({ ...f, calories: v }))} placeholder="0" min="0" />
            </FormField>
            <div className="macro-row">
              <FormField label="Carbs (g)">
                <NumberInput value={mealForm.carbs} onChange={v => setMealForm(f => ({ ...f, carbs: v }))} placeholder="0" min="0" />
              </FormField>
              <FormField label="Protein (g)">
                <NumberInput value={mealForm.protein} onChange={v => setMealForm(f => ({ ...f, protein: v }))} placeholder="0" min="0" />
              </FormField>
              <FormField label="Fat (g)">
                <NumberInput value={mealForm.fat} onChange={v => setMealForm(f => ({ ...f, fat: v }))} placeholder="0" min="0" />
              </FormField>
            </div>
            <PrimaryButton onClick={createAndLog} disabled={!mealForm.name.trim() || !mealForm.calories}>
              Add & Log Now
            </PrimaryButton>
          </>
        )}
      </Sheet>
    </div>
  )
}
