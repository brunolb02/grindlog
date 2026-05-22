import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'
import { FormField, NumberInput, PrimaryButton } from '../components/FormField'
import { getExercises, getWorkouts, saveWorkouts, generateId, dateKey } from '../utils/storage'
import './Workout.css'

function today() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function emptyNormalSets() {
  return [
    { weight: '', reps: '' },
    { weight: '', reps: '' },
    { weight: '', reps: '' },
  ]
}

function emptyClusterSet() {
  return { blocks: '', weight: '', failReps: '' }
}

export default function Workout() {
  const [workouts, setWorkouts] = useState(getWorkouts)
  const [exercises] = useState(getExercises)

  // Active workout session
  const [session, setSession] = useState(null)

  // Sheet states
  const [pickExSheet, setPickExSheet] = useState(false)
  const [logSheet, setLogSheet] = useState(false)
  const [currentEx, setCurrentEx] = useState(null)
  const [setType, setSetType] = useState('normal')
  const [normalSets, setNormalSets] = useState(emptyNormalSets)
  const [clusterSet, setClusterSet] = useState(emptyClusterSet)

  function startWorkout() {
    setSession({ id: generateId(), date: new Date().toISOString(), entries: [] })
  }

  function finishWorkout() {
    if (!session) return
    const updated = [session, ...workouts]
    setWorkouts(updated)
    saveWorkouts(updated)
    setSession(null)
  }

  function discardWorkout() {
    setSession(null)
  }

  function openPickExercise() {
    setPickExSheet(true)
  }

  function selectExercise(ex) {
    setCurrentEx(ex)
    setSetType('normal')
    setNormalSets(emptyNormalSets())
    setClusterSet(emptyClusterSet())
    setPickExSheet(false)
    setLogSheet(true)
  }

  function logExercise() {
    const entry = {
      id: generateId(),
      exerciseId: currentEx.id,
      exerciseName: currentEx.name,
      exercisePhoto: currentEx.photo || null,
      type: setType,
      sets: setType === 'normal'
        ? normalSets.map(s => ({ weight: Number(s.weight), reps: Number(s.reps) }))
        : {
            blocks: Number(clusterSet.blocks),
            weight: Number(clusterSet.weight),
            failReps: clusterSet.failReps !== '' ? Number(clusterSet.failReps) : null,
          },
    }
    setSession(s => ({ ...s, entries: [...s.entries, entry] }))
    setLogSheet(false)
  }

  function canLogNormal() {
    return normalSets.every(s => s.weight !== '' && s.reps !== '')
  }

  function canLogCluster() {
    return clusterSet.blocks !== '' && clusterSet.weight !== ''
  }

  function formatCluster(sets) {
    const base = `${sets.blocks}×4`
    const fail = sets.failReps != null ? ` + 1×${sets.failReps}` : ''
    return `${base}${fail} @ ${sets.weight}kg`
  }

  // Group past workouts by date for display
  const grouped = workouts.reduce((acc, w) => {
    const key = dateKey(w.date)
    if (!acc[key]) acc[key] = []
    acc[key].push(w)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="page">
      <PageHeader title="Workout" />
      <div className="page-body scroll-area">
        {/* Active session */}
        {session ? (
          <div className="active-session">
            <div className="session-header">
              <span className="session-label">Active Workout</span>
              <span className="session-time">{today()}</span>
            </div>
            <div className="session-entries">
              {session.entries.map(entry => (
                <div key={entry.id} className="session-entry">
                  <div className="entry-left">
                    {entry.exercisePhoto
                      ? <img src={entry.exercisePhoto} className="entry-thumb" alt="" />
                      : <div className="entry-thumb entry-thumb-ph">💪</div>
                    }
                    <div className="entry-info">
                      <span className="entry-name">{entry.exerciseName}</span>
                      {entry.type === 'normal'
                        ? entry.sets.map((s, i) => (
                          <span key={i} className="entry-set">Set {i + 1}: {s.weight}kg × {s.reps}</span>
                        ))
                        : <span className="entry-set cluster">{formatCluster(entry.sets)}</span>
                      }
                    </div>
                  </div>
                </div>
              ))}
              {session.entries.length === 0 && (
                <p className="empty-hint" style={{ padding: '12px 0' }}>No exercises logged yet</p>
              )}
            </div>
            <button className="add-exercise-btn" onClick={openPickExercise}>+ Add Exercise</button>
            <div className="session-actions">
              <button className="finish-btn" onClick={finishWorkout}>Finish Workout</button>
              <button className="discard-btn" onClick={discardWorkout}>Discard</button>
            </div>
          </div>
        ) : (
          <button className="start-workout-btn" onClick={startWorkout}>
            <span>+ Start Workout</span>
          </button>
        )}

        {/* Past workouts */}
        {sortedDates.length > 0 && (
          <div className="history-section">
            <h2 className="section-title">History</h2>
            {sortedDates.map(date => (
              <div key={date} className="history-day">
                <div className="history-date">{new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                {grouped[date].flatMap(w => w.entries).map(entry => (
                  <div key={entry.id} className="history-entry">
                    <div className="entry-left">
                      {entry.exercisePhoto
                        ? <img src={entry.exercisePhoto} className="entry-thumb" alt="" />
                        : <div className="entry-thumb entry-thumb-ph">💪</div>
                      }
                      <div className="entry-info">
                        <span className="entry-name">{entry.exerciseName}</span>
                        {entry.type === 'normal'
                          ? entry.sets.map((s, i) => (
                            <span key={i} className="entry-set">Set {i + 1}: {s.weight}kg × {s.reps}</span>
                          ))
                          : <span className="entry-set cluster">{formatCluster(entry.sets)}</span>
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pick exercise sheet */}
      <Sheet open={pickExSheet} onClose={() => setPickExSheet(false)} title="Choose Exercise">
        {exercises.length === 0 ? (
          <div className="empty-state">
            <p>No exercises in library</p>
            <p className="empty-hint">Add exercises in the Library tab first</p>
          </div>
        ) : (
          <div className="item-list">
            {exercises.map(ex => (
              <button key={ex.id} className="list-item" onClick={() => selectExercise(ex)}>
                <div className="list-item-left">
                  {ex.photo
                    ? <img src={ex.photo} className="ex-thumb" alt="" />
                    : <div className="ex-thumb ex-thumb-placeholder">💪</div>
                  }
                  <span className="list-item-name">{ex.name}</span>
                </div>
                <span className="chevron">›</span>
              </button>
            ))}
          </div>
        )}
      </Sheet>

      {/* Log exercise sheet */}
      <Sheet open={logSheet} onClose={() => setLogSheet(false)} title={currentEx?.name}>
        <div className="set-type-toggle">
          <button
            className={setType === 'normal' ? 'active' : ''}
            onClick={() => setSetType('normal')}
          >Normal Set</button>
          <button
            className={setType === 'cluster' ? 'active' : ''}
            onClick={() => setSetType('cluster')}
          >Cluster Set</button>
        </div>

        {setType === 'normal' && (
          <div className="normal-sets">
            {normalSets.map((s, i) => (
              <div key={i} className="set-row">
                <span className="set-number">Set {i + 1}</span>
                <div className="set-inputs">
                  <NumberInput
                    value={s.weight}
                    onChange={v => setNormalSets(sets => sets.map((s2, j) => j === i ? { ...s2, weight: v } : s2))}
                    placeholder="kg"
                    step="0.5"
                  />
                  <NumberInput
                    value={s.reps}
                    onChange={v => setNormalSets(sets => sets.map((s2, j) => j === i ? { ...s2, reps: v } : s2))}
                    placeholder="reps"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {setType === 'cluster' && (
          <div className="cluster-form">
            <div className="cluster-preview">
              {clusterSet.blocks
                ? <span className="cluster-display">{formatCluster({ blocks: clusterSet.blocks, weight: clusterSet.weight || '?', failReps: clusterSet.failReps !== '' ? clusterSet.failReps : null })}</span>
                : <span className="cluster-display-empty">Fill fields to preview</span>
              }
            </div>
            <FormField label="Full Blocks (×4 reps each)">
              <NumberInput value={clusterSet.blocks} onChange={v => setClusterSet(s => ({ ...s, blocks: v }))} placeholder="e.g. 4" min="1" />
            </FormField>
            <FormField label="Weight (kg)">
              <NumberInput value={clusterSet.weight} onChange={v => setClusterSet(s => ({ ...s, weight: v }))} placeholder="e.g. 80" step="0.5" />
            </FormField>
            <FormField label="Final block reps (to failure — optional)">
              <NumberInput value={clusterSet.failReps} onChange={v => setClusterSet(s => ({ ...s, failReps: v }))} placeholder="e.g. 3" min="1" />
            </FormField>
          </div>
        )}

        <PrimaryButton
          onClick={logExercise}
          disabled={setType === 'normal' ? !canLogNormal() : !canLogCluster()}
          style={{ marginTop: 12 }}
        >
          Log Exercise
        </PrimaryButton>
      </Sheet>
    </div>
  )
}
