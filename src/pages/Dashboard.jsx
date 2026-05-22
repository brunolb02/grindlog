import { useState, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'
import { FormField, NumberInput, PrimaryButton } from '../components/FormField'
import { getNutritionLog, getDailyMetrics, saveDailyMetrics, todayKey } from '../utils/storage'
import './Dashboard.css'

function formatDate(key) {
  return new Date(key + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function Dashboard() {
  const [log] = useState(getNutritionLog)
  const [metricsMap, setMetricsMap] = useState(getDailyMetrics)
  const [burnSheet, setBurnSheet] = useState(false)
  const [burnInput, setBurnInput] = useState('')

  const selectedDate = todayKey()

  const todayEntries = useMemo(
    () => log.filter(e => e.date === selectedDate),
    [log, selectedDate]
  )

  const totals = todayEntries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      carbs: acc.carbs + e.carbs,
      protein: acc.protein + e.protein,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  )

  const burned = metricsMap[selectedDate]?.burned || 0
  const net = totals.calories - burned

  const totalMacroG = totals.carbs + totals.protein + totals.fat

  function macroPercent(g) {
    if (totalMacroG === 0) return 0
    return Math.round((g / totalMacroG) * 100)
  }

  function saveBurned() {
    const updated = { ...metricsMap, [selectedDate]: { burned: Number(burnInput) } }
    setMetricsMap(updated)
    saveDailyMetrics(updated)
    setBurnSheet(false)
    setBurnInput('')
  }

  return (
    <div className="page">
      <PageHeader title="Dashboard" />
      <div className="page-body scroll-area">
        <div className="date-chip">{formatDate(selectedDate)}</div>

        {/* Calories card */}
        <div className="dash-card">
          <div className="dash-card-title">Calories</div>
          <div className="cal-ring-row">
            <div className="cal-circle">
              <span className="cal-big">{totals.calories}</span>
              <span className="cal-label">consumed</span>
            </div>
            <div className="cal-meta">
              <div className="cal-meta-row">
                <span className="cal-meta-label">Burned</span>
                <span className="cal-meta-val burned">{burned}</span>
              </div>
              <div className="cal-meta-divider" />
              <div className="cal-meta-row">
                <span className="cal-meta-label">Net</span>
                <span className={`cal-meta-val net ${net > 0 ? 'positive' : net < 0 ? 'negative' : ''}`}>{net > 0 ? '+' : ''}{net}</span>
              </div>
              <button className="edit-burned-btn" onClick={() => { setBurnInput(String(burned || '')); setBurnSheet(true) }}>
                {burned ? 'Edit burned' : 'Log burned'}
              </button>
            </div>
          </div>
        </div>

        {/* Macros card */}
        <div className="dash-card">
          <div className="dash-card-title">Macros</div>
          <div className="macro-bars">
            <MacroBar label="Carbs" value={totals.carbs} pct={macroPercent(totals.carbs)} color="var(--accent-orange)" />
            <MacroBar label="Protein" value={totals.protein} pct={macroPercent(totals.protein)} color="var(--accent-green)" />
            <MacroBar label="Fat" value={totals.fat} pct={macroPercent(totals.fat)} color="var(--accent-purple)" />
          </div>
        </div>

        {/* Meals list */}
        {todayEntries.length > 0 && (
          <div className="dash-card">
            <div className="dash-card-title">Today's Meals</div>
            {todayEntries.map(e => (
              <div key={e.id} className="dash-meal-row">
                <span className="dash-meal-name">{e.mealName}</span>
                <span className="dash-meal-cal">{e.calories} kcal</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={burnSheet} onClose={() => setBurnSheet(false)} title="Calories Burned">
        <p className="burn-hint">Enter the calories burned from your smartwatch or fitness tracker.</p>
        <FormField label="Calories Burned">
          <NumberInput
            value={burnInput}
            onChange={setBurnInput}
            placeholder="e.g. 420"
            min="0"
          />
        </FormField>
        <PrimaryButton onClick={saveBurned} disabled={burnInput === ''}>Save</PrimaryButton>
      </Sheet>
    </div>
  )
}

function MacroBar({ label, value, pct, color }) {
  return (
    <div className="macro-bar-row">
      <div className="macro-bar-label">
        <span style={{ color }}>{label}</span>
        <span className="macro-bar-val">{value}g <span className="macro-pct">({pct}%)</span></span>
      </div>
      <div className="macro-bar-track">
        <div className="macro-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
