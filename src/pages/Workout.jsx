import { useState, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'
import { FormField, TextInput, NumberInput, PrimaryButton, DestructiveButton } from '../components/FormField'
import { getSessions, saveSessions, generateId, todayKey, dateKey } from '../utils/storage'
import './Workout.css'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDuration(min) {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function emptyForm() {
  return { activityType: 'Gym', customName: '', duration: '', calories: '' }
}

export default function Workout() {
  const [sessions, setSessions] = useState(getSessions)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editSession, setEditSession] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const today = todayKey()

  const todaySessions = useMemo(
    () => sessions.filter(s => s.date === today).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [sessions, today]
  )

  const totalBurned = todaySessions.reduce((sum, s) => sum + s.calories, 0)

  // Group past sessions by date
  const pastSessions = useMemo(() => {
    const past = sessions.filter(s => s.date !== today)
    return past.reduce((acc, s) => {
      if (!acc[s.date]) acc[s.date] = []
      acc[s.date].push(s)
      return acc
    }, {})
  }, [sessions, today])

  const sortedPastDates = Object.keys(pastSessions).sort((a, b) => b.localeCompare(a))

  function openAdd() {
    setEditSession(null)
    setForm(emptyForm())
    setSheetOpen(true)
  }

  function openEdit(session) {
    setEditSession(session)
    const isPreset = session.name === 'Gym' || session.name === 'Cardio'
    setForm({
      activityType: isPreset ? session.name : 'Other',
      customName: isPreset ? '' : session.name,
      duration: String(session.duration),
      calories: String(session.calories),
    })
    setSheetOpen(true)
  }

  function saveSession() {
    const entry = {
      name: form.activityType === 'Other' ? form.customName.trim() : form.activityType,
      duration: Number(form.duration),
      calories: Number(form.calories),
    }
    let updated
    if (editSession) {
      updated = sessions.map(s => s.id === editSession.id ? { ...s, ...entry } : s)
    } else {
      updated = [...sessions, { id: generateId(), date: today, timestamp: new Date().toISOString(), ...entry }]
    }
    setSessions(updated)
    saveSessions(updated)
    setSheetOpen(false)
  }

  function deleteSession() {
    const updated = sessions.filter(s => s.id !== editSession.id)
    setSessions(updated)
    saveSessions(updated)
    setSheetOpen(false)
  }

  const nameValid = form.activityType !== 'Other' || form.customName.trim() !== ''
  const canSave = nameValid && form.duration !== '' && form.calories !== ''

  return (
    <div className="page">
      <PageHeader
        title="Workout"
        action={<button className="add-btn" onClick={openAdd}>+ Log</button>}
      />
      <div className="page-body scroll-area">

        {/* Today */}
        <div className="section-label">Today</div>
        {todaySessions.length === 0 ? (
          <div className="empty-card">
            <p>No sessions logged today</p>
            <p className="empty-hint">Tap + Log to add a workout</p>
          </div>
        ) : (
          <div className="sessions-card">
            {todaySessions.map((s, i) => (
              <button key={s.id} className="session-row" onClick={() => openEdit(s)}>
                <span className="session-time">{formatTime(s.timestamp)}</span>
                <div className="session-info">
                  <span className="session-name">{s.name}</span>
                  <span className="session-meta">{formatDuration(s.duration)}</span>
                </div>
                <span className="session-cal">{s.calories} kcal</span>
              </button>
            ))}
            <div className="sessions-total">
              <span>Total burned</span>
              <span className="total-val">{totalBurned} kcal</span>
            </div>
          </div>
        )}

        {/* History */}
        {sortedPastDates.length > 0 && (
          <>
            <div className="section-label" style={{ marginTop: 24 }}>History</div>
            {sortedPastDates.map(date => {
              const daySessions = pastSessions[date].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
              const dayTotal = daySessions.reduce((sum, s) => sum + s.calories, 0)
              return (
                <div key={date} className="history-day-card">
                  <div className="history-date">
                    {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    <span className="history-day-total">{dayTotal} kcal</span>
                  </div>
                  {daySessions.map(s => (
                    <button key={s.id} className="session-row history" onClick={() => openEdit(s)}>
                      <span className="session-time">{formatTime(s.timestamp)}</span>
                      <div className="session-info">
                        <span className="session-name">{s.name}</span>
                        <span className="session-meta">{formatDuration(s.duration)}</span>
                      </div>
                      <span className="session-cal">{s.calories} kcal</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </>
        )}
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editSession ? 'Edit Session' : 'Log Session'}>
        <FormField label="Activity">
          <div className="activity-picker">
            {['Gym', 'Cardio', 'Other'].map(type => (
              <button
                key={type}
                type="button"
                className={`activity-pill${form.activityType === type ? ' active' : ''}`}
                onClick={() => setForm(f => ({ ...f, activityType: type }))}
              >
                {type}
              </button>
            ))}
          </div>
        </FormField>
        {form.activityType === 'Other' && (
          <FormField>
            <TextInput
              value={form.customName}
              onChange={v => setForm(f => ({ ...f, customName: v }))}
              placeholder="Describe your activity…"
              autoFocus
            />
          </FormField>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <FormField label="Duration (min)">
            <NumberInput value={form.duration} onChange={v => setForm(f => ({ ...f, duration: v }))} placeholder="e.g. 80" min="1" />
          </FormField>
          <FormField label="Calories burned">
            <NumberInput value={form.calories} onChange={v => setForm(f => ({ ...f, calories: v }))} placeholder="e.g. 700" min="0" />
          </FormField>
        </div>
        <PrimaryButton onClick={saveSession} disabled={!canSave}>
          {editSession ? 'Save Changes' : 'Log Session'}
        </PrimaryButton>
        {editSession && <DestructiveButton onClick={deleteSession}>Delete Session</DestructiveButton>}
      </Sheet>
    </div>
  )
}
