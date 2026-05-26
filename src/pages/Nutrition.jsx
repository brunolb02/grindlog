import { useState, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'
import { PrimaryButton } from '../components/FormField'
import { getMeals, getNutritionLog, saveNutritionLog, generateId, todayKey, dateKey } from '../utils/storage'
import { MEAL_CATEGORIES } from './Library'
import './Nutrition.css'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function Nutrition() {
  const [log, setLog] = useState(getNutritionLog)
  const [meals] = useState(getMeals)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedDate] = useState(todayKey())

  const todayEntries = useMemo(
    () => log.filter(e => e.date === selectedDate).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [log, selectedDate]
  )

  // Recent meals: meals logged in past days, deduplicated, most recent first
  const recentMealIds = useMemo(() => {
    const past = log.filter(e => e.date !== selectedDate)
    const seen = new Set()
    const result = []
    for (const e of [...past].reverse()) {
      if (!seen.has(e.mealId) && meals.find(m => m.id === e.mealId)) {
        seen.add(e.mealId)
        result.push(e.mealId)
      }
    }
    return result.slice(0, 5)
  }, [log, selectedDate, meals])

  const recentMeals = recentMealIds.map(id => meals.find(m => m.id === id)).filter(Boolean)

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

  const totals = todayEntries.reduce(
    (acc, e) => ({ calories: acc.calories + e.calories, carbs: acc.carbs + e.carbs, protein: acc.protein + e.protein, fat: acc.fat + e.fat }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  )

  return (
    <div className="page">
      <PageHeader
        title="Nutrition"
        action={
          <button className="add-btn" onClick={() => setSheetOpen(true)}>+ Add</button>
        }
      />
      <div className="page-body scroll-area">
        {/* Daily summary strip */}
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

        {/* Meal entries */}
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

      {/* Add meal sheet */}
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Log a Meal">
        {recentMeals.length > 0 && (
          <>
            <div className="sheet-section-label">Recent</div>
            <div className="item-list" style={{ marginBottom: 16 }}>
              {recentMeals.map(meal => (
                <button key={meal.id} className="list-item meal-item" onClick={() => addMeal(meal)}>
                  <div className="list-item-left meal-info">
                    <span className="list-item-name">{meal.name}</span>
                    <span className="meal-macros">{meal.calories} kcal · P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g</span>
                  </div>
                  <span style={{ color: 'var(--accent)', fontSize: 22 }}>+</span>
                </button>
              ))}
            </div>
          </>
        )}

        {meals.length === 0 ? (
          <div className="empty-state">
            <p>No meals in library</p>
            <p className="empty-hint">Add meals in the Library tab first</p>
          </div>
        ) : (
          MEAL_CATEGORIES.map(cat => {
            const catMeals = meals
              .filter(m => (m.category || 'Breakfast') === cat)
              .sort((a, b) => (b.createdAt || b.id).localeCompare(a.createdAt || a.id))
            if (catMeals.length === 0) return null
            return (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div className="sheet-section-label">{cat}</div>
                <div className="item-list">
                  {catMeals.map(meal => (
                    <button key={meal.id} className="list-item meal-item" onClick={() => addMeal(meal)}>
                      <div className="list-item-left meal-info">
                        <span className="list-item-name">{meal.name}</span>
                        <span className="meal-macros">{meal.calories} kcal · P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g</span>
                      </div>
                      <span style={{ color: 'var(--accent)', fontSize: 22 }}>+</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </Sheet>
    </div>
  )
}
