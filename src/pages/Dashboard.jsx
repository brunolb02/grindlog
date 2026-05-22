import { useState, useMemo, useRef } from 'react'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'
import { FormField, NumberInput, PrimaryButton } from '../components/FormField'
import { getNutritionLog, getSessions, getProfile, saveProfile, exportData, importData, todayKey } from '../utils/storage'
import './Dashboard.css'

function formatDate(key) {
  return new Date(key + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function Dashboard() {
  const [log] = useState(getNutritionLog)
  const [sessions] = useState(getSessions)
  const [profile, setProfile] = useState(getProfile)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileForm, setProfileForm] = useState(() => {
    const p = getProfile()
    return { bmr: String(p.bmr), neat: String(p.neat) }
  })
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const importRef = useRef()

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

  const exerciseCalories = useMemo(
    () => sessions.filter(s => s.date === selectedDate).reduce((sum, s) => sum + s.calories, 0),
    [sessions, selectedDate]
  )

  const totalBurn = profile.bmr + profile.neat + exerciseCalories
  const net = totals.calories - totalBurn
  const totalMacroG = totals.carbs + totals.protein + totals.fat

  function macroPercent(g) {
    if (totalMacroG === 0) return 0
    return Math.round((g / totalMacroG) * 100)
  }

  function saveSettings() {
    const updated = { bmr: Number(profileForm.bmr), neat: Number(profileForm.neat) }
    saveProfile(updated)
    setProfile(updated)
    setSettingsOpen(false)
  }

  const canSaveSettings = profileForm.bmr !== '' && profileForm.neat !== ''

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    setImportError(null)
    setImportSuccess(false)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        importData(ev.target.result)
        setImportSuccess(true)
        setTimeout(() => window.location.reload(), 800)
      } catch {
        setImportError('Invalid backup file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        action={
          <button className="settings-btn" onClick={() => setSettingsOpen(true)}>⚙</button>
        }
      />
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
                <span className="cal-meta-label">Total Burned</span>
                <span className="cal-meta-val burned">{totalBurn}</span>
              </div>
              <div className="cal-burn-breakdown">
                <span className="cal-breakdown-item">BMR {profile.bmr}</span>
                <span className="cal-breakdown-sep">·</span>
                <span className="cal-breakdown-item">NEAT {profile.neat}</span>
                {exerciseCalories > 0 && (
                  <>
                    <span className="cal-breakdown-sep">·</span>
                    <span className="cal-breakdown-item">Exercise {exerciseCalories}</span>
                  </>
                )}
              </div>
              <div className="cal-meta-divider" />
              <div className="cal-meta-row">
                <span className="cal-meta-label">Balance</span>
                <span className={`cal-meta-val net ${net > 0 ? 'positive' : net < 0 ? 'negative' : ''}`}>
                  {net > 0 ? '+' : ''}{net}
                </span>
              </div>
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

        {/* Today's workouts */}
        {sessions.filter(s => s.date === selectedDate).length > 0 && (
          <div className="dash-card">
            <div className="dash-card-title">Today's Workouts</div>
            {sessions.filter(s => s.date === selectedDate).map(s => (
              <div key={s.id} className="dash-meal-row">
                <span className="dash-meal-name">{s.name}</span>
                <span className="dash-meal-cal" style={{ color: 'var(--accent-red)' }}>{s.calories} kcal</span>
              </div>
            ))}
          </div>
        )}

        {/* Today's meals */}
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

      {/* Settings sheet */}
      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Profile">
        <FormField label="BMR — Basal Metabolic Rate (kcal/day)">
          <NumberInput
            value={profileForm.bmr}
            onChange={v => setProfileForm(f => ({ ...f, bmr: v }))}
            placeholder="e.g. 1880"
            min="0"
          />
        </FormField>
        <FormField label="NEAT — Non-Exercise Activity (kcal/day)">
          <NumberInput
            value={profileForm.neat}
            onChange={v => setProfileForm(f => ({ ...f, neat: v }))}
            placeholder="e.g. 350"
            min="0"
          />
        </FormField>
        <PrimaryButton onClick={saveSettings} disabled={!canSaveSettings}>
          Save
        </PrimaryButton>

        <div className="settings-section-title">Data Backup</div>
        <button className="settings-action-btn" onClick={exportData}>
          Export data
          <span className="settings-action-hint">Downloads a JSON file with all your data</span>
        </button>
        <button className="settings-action-btn" onClick={() => importRef.current.click()}>
          Import data
          <span className="settings-action-hint">Restore from a previous backup file</span>
        </button>
        <input ref={importRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImport} />
        {importSuccess && <p className="import-success">Restored! Reloading…</p>}
        {importError && <p className="import-error">{importError}</p>}
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
