import { useState, useMemo, useRef } from 'react'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'
import { FormField, TextInput, NumberInput, PrimaryButton, DestructiveButton } from '../components/FormField'
import {
  getExercises, saveExercises,
  getMeals, saveMeals,
  getExerciseLogs, saveExerciseLogs,
  getAiSettings,
  generateId, todayKey,
} from '../utils/storage'
import { fetchMacros } from '../utils/ai'
import './Library.css'

export const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Other']
export const MEAL_CATEGORIES = ['Breakfast', 'Lunch', 'Snack', 'Dinner']

function emptyExercise() {
  return { name: '', muscleGroup: 'Chest', photo: null }
}

function emptyMeal() {
  return { name: '', aiDescription: '', calories: '', carbs: '', protein: '', fat: '', category: 'Breakfast' }
}

function emptyNormalSets() {
  return [{ weight: '', reps: '' }]
}

function emptyClusterSet() {
  return { blocks: '', weight: '', failReps: '' }
}

function formatCluster(sets) {
  const base = `${sets.blocks}×4`
  const fail = sets.failReps != null && sets.failReps !== '' ? ` + 1×${sets.failReps}` : ''
  return `${base}${fail} @ ${sets.weight}kg`
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Library() {
  const [tab, setTab] = useState('exercises')
  const [exercises, setExercises] = useState(getExercises)
  const [meals, setMeals] = useState(getMeals)
  const [exerciseLogs, setExerciseLogs] = useState(getExerciseLogs)

  // Exercise CRUD sheet
  const [exSheet, setExSheet] = useState(false)
  const [editEx, setEditEx] = useState(null)
  const [exForm, setExForm] = useState(emptyExercise)
  const photoRef = useRef()

  // Exercise log sheet (sets/reps for a specific exercise)
  const [logSheet, setLogSheet] = useState(false)
  const [activeEx, setActiveEx] = useState(null)
  const [setType, setSetType] = useState('normal')
  const [normalSets, setNormalSets] = useState(emptyNormalSets)
  const [clusterSet, setClusterSet] = useState(emptyClusterSet)

  // Meal CRUD sheet
  const [mealSheet, setMealSheet] = useState(false)
  const [editMeal, setEditMeal] = useState(null)
  const [mealForm, setMealForm] = useState(emptyMeal)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const aiSettings = getAiSettings()
  const activeProvider = aiSettings.active
  const activeProviderSettings = aiSettings[activeProvider]
  const hasAiKey = !!activeProviderSettings?.key

  // Collapsed muscle groups
  const [collapsed, setCollapsed] = useState({})

  // ─── Exercises grouped by muscle group ───────────────────────────────────
  const grouped = useMemo(() => {
    return MUSCLE_GROUPS.reduce((acc, g) => {
      acc[g] = exercises.filter(e => (e.muscleGroup || 'Other') === g)
      return acc
    }, {})
  }, [exercises])

  function toggleGroup(g) {
    setCollapsed(c => ({ ...c, [g]: !c[g] }))
  }

  // ─── Exercise CRUD ────────────────────────────────────────────────────────
  function openNewExercise(muscleGroup) {
    setEditEx(null)
    setExForm({ ...emptyExercise(), muscleGroup })
    setExSheet(true)
  }

  function openEditExercise(ex) {
    setEditEx(ex)
    setExForm({ name: ex.name, muscleGroup: ex.muscleGroup || 'Other', photo: ex.photo || null })
    setExSheet(true)
  }

  function saveExercise() {
    const updated = editEx
      ? exercises.map(e => e.id === editEx.id ? { ...e, ...exForm } : e)
      : [...exercises, { id: generateId(), ...exForm }]
    setExercises(updated)
    saveExercises(updated)
    setExSheet(false)
  }

  function deleteExercise() {
    const updated = exercises.filter(e => e.id !== editEx.id)
    setExercises(updated)
    saveExercises(updated)
    setExSheet(false)
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setExForm(f => ({ ...f, photo: ev.target.result }))
    reader.readAsDataURL(file)
  }

  // ─── Exercise log ─────────────────────────────────────────────────────────
  function openLog(ex) {
    setActiveEx(ex)
    setSetType('normal')
    setNormalSets(emptyNormalSets())
    setClusterSet(emptyClusterSet())
    setLogSheet(true)
  }

  function logSets() {
    const entry = {
      id: generateId(),
      exerciseId: activeEx.id,
      exerciseName: activeEx.name,
      date: todayKey(),
      timestamp: new Date().toISOString(),
      type: setType,
      sets: setType === 'normal'
        ? normalSets.map(s => ({ weight: Number(s.weight), reps: Number(s.reps) }))
        : { blocks: Number(clusterSet.blocks), weight: Number(clusterSet.weight), failReps: clusterSet.failReps !== '' ? Number(clusterSet.failReps) : null },
    }
    const updated = [...exerciseLogs, entry]
    setExerciseLogs(updated)
    saveExerciseLogs(updated)
    setLogSheet(false)
  }

  function canLogNormal() {
    return normalSets.every(s => s.weight !== '' && s.reps !== '')
  }

  function canLogCluster() {
    return clusterSet.blocks !== '' && clusterSet.weight !== ''
  }

  function logsForExercise(exId) {
    return exerciseLogs
      .filter(l => l.exerciseId === exId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 5)
  }

  // ─── Meal CRUD ────────────────────────────────────────────────────────────
  async function fillWithAi() {
    setAiLoading(true)
    setAiError(null)
    try {
      const macros = await fetchMacros(mealForm.aiDescription.trim() || mealForm.name, activeProvider, activeProviderSettings.key, activeProviderSettings.model)
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

  function openNewMeal() {
    setEditMeal(null)
    setMealForm(emptyMeal())
    setAiError(null)
    setMealSheet(true)
  }

  function openEditMeal(meal) {
    setEditMeal(meal)
    setMealForm({ name: meal.name, aiDescription: '', calories: String(meal.calories), carbs: String(meal.carbs), protein: String(meal.protein), fat: String(meal.fat), category: meal.category || 'Breakfast' })
    setAiError(null)
    setMealSheet(true)
  }

  function saveMeal() {
    const entry = { name: mealForm.name, calories: Number(mealForm.calories), carbs: Number(mealForm.carbs), protein: Number(mealForm.protein), fat: Number(mealForm.fat), category: mealForm.category  }
    const updated = editMeal
      ? meals.map(m => m.id === editMeal.id ? { ...m, ...entry } : m)
      : [...meals, { id: generateId(), createdAt: new Date().toISOString(), ...entry }]
    setMeals(updated)
    saveMeals(updated)
    setMealSheet(false)
  }

  function deleteMeal() {
    const updated = meals.filter(m => m.id !== editMeal.id)
    setMeals(updated)
    saveMeals(updated)
    setMealSheet(false)
  }

  return (
    <div className="page">
      <PageHeader
        title="Library"
        action={
          tab === 'meals'
            ? <button className="add-btn" onClick={openNewMeal}>+ Add</button>
            : null
        }
      />

      <div className="seg-control">
        <button className={tab === 'exercises' ? 'active' : ''} onClick={() => setTab('exercises')}>Exercises</button>
        <button className={tab === 'meals' ? 'active' : ''} onClick={() => setTab('meals')}>Meals</button>
      </div>

      <div className="page-body scroll-area">

        {/* ── EXERCISES ── */}
        {tab === 'exercises' && (
          <div className="muscle-groups">
            {MUSCLE_GROUPS.map(group => {
              const exList = grouped[group]
              const isCollapsed = collapsed[group]
              return (
                <div key={group} className="muscle-group">
                  <button className="group-header" onClick={() => toggleGroup(group)}>
                    <span className="group-title">{group}</span>
                    <div className="group-header-right">
                      <span className="group-count">{exList.length}</span>
                      <span className={`group-chevron ${isCollapsed ? '' : 'open'}`}>›</span>
                    </div>
                  </button>
                  {!isCollapsed && (
                    <div className="group-body">
                      {exList.map(ex => (
                        <div key={ex.id} className="ex-row">
                          <button className="ex-main" onClick={() => openLog(ex)}>
                            {ex.photo
                              ? <img src={ex.photo} className="ex-thumb" alt="" />
                              : <div className="ex-thumb ex-thumb-ph">💪</div>
                            }
                            <span className="ex-name">{ex.name}</span>
                          </button>
                          <button className="ex-edit-btn" onClick={() => openEditExercise(ex)}>···</button>
                        </div>
                      ))}
                      <button className="add-ex-row" onClick={() => openNewExercise(group)}>
                        + Add {group} exercise
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── MEALS ── */}
        {tab === 'meals' && (
          <>
            {meals.length === 0 && (
              <div className="empty-state">
                <p>No meals yet</p>
                <p className="empty-hint">Tap + Add to create your first meal</p>
              </div>
            )}
            {MEAL_CATEGORIES.map(cat => {
              const catMeals = meals.filter(m => (m.category || 'Breakfast') === cat)
              if (catMeals.length === 0) return null
              return (
                <div key={cat} className="meal-category-group">
                  <div className="sheet-section-label">{cat}</div>
                  <div className="item-list">
                    {catMeals.map(meal => (
                      <button key={meal.id} className="list-item meal-item" onClick={() => openEditMeal(meal)}>
                        <div className="meal-info">
                          <span className="list-item-name">{meal.name}</span>
                          <span className="meal-macros">{meal.calories} kcal · P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g</span>
                        </div>
                        <span className="chevron">›</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* ── Exercise CRUD sheet ── */}
      <Sheet open={exSheet} onClose={() => setExSheet(false)} title={editEx ? 'Edit Exercise' : 'New Exercise'}>
        <div className="photo-picker" onClick={() => photoRef.current.click()}>
          {exForm.photo
            ? <img src={exForm.photo} className="photo-preview" alt="" />
            : <div className="photo-placeholder"><span>📷</span><span>Add Photo</span></div>
          }
          <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
        </div>
        <FormField label="Exercise Name">
          <TextInput value={exForm.name} onChange={v => setExForm(f => ({ ...f, name: v }))} placeholder="e.g. Bench Press" />
        </FormField>
        <FormField label="Muscle Group">
          <div className="muscle-picker">
            {MUSCLE_GROUPS.map(g => (
              <button
                key={g}
                className={`muscle-chip ${exForm.muscleGroup === g ? 'active' : ''}`}
                onClick={() => setExForm(f => ({ ...f, muscleGroup: g }))}
              >{g}</button>
            ))}
          </div>
        </FormField>
        <PrimaryButton onClick={saveExercise} disabled={!exForm.name.trim()}>
          {editEx ? 'Save Changes' : 'Add Exercise'}
        </PrimaryButton>
        {editEx && <DestructiveButton onClick={deleteExercise}>Delete Exercise</DestructiveButton>}
      </Sheet>

      {/* ── Exercise log sheet ── */}
      <Sheet open={logSheet} onClose={() => setLogSheet(false)} title={activeEx?.name}>
        {/* Recent logs for this exercise */}
        {activeEx && logsForExercise(activeEx.id).length > 0 && (
          <div className="recent-logs">
            <div className="recent-logs-title">Recent</div>
            {logsForExercise(activeEx.id).map(log => (
              <div key={log.id} className="log-entry">
                <span className="log-date">{formatDate(log.timestamp)}</span>
                <div className="log-sets">
                  {log.type === 'normal'
                    ? log.sets.map((s, i) => <span key={i} className="log-set">Set {i+1}: {s.weight}kg × {s.reps}</span>)
                    : <span className="log-set cluster">{formatCluster(log.sets)}</span>
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Set type toggle */}
        <div className="set-type-toggle">
          <button className={setType === 'normal' ? 'active' : ''} onClick={() => setSetType('normal')}>Normal Set</button>
          <button className={setType === 'cluster' ? 'active' : ''} onClick={() => setSetType('cluster')}>Cluster Set</button>
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
                {normalSets.length > 1 && (
                  <button
                    className="remove-set-btn"
                    onClick={() => setNormalSets(sets => sets.filter((_, j) => j !== i))}
                  >×</button>
                )}
              </div>
            ))}
            <button
              className="add-set-btn"
              onClick={() => setNormalSets(sets => [...sets, { weight: '', reps: '' }])}
            >+ Add Set</button>
          </div>
        )}

        {setType === 'cluster' && (
          <div className="cluster-form">
            <div className="cluster-preview">
              {clusterSet.blocks && clusterSet.weight
                ? <span className="cluster-display">{formatCluster(clusterSet)}</span>
                : <span className="cluster-display-empty">Fill fields to preview</span>
              }
            </div>
            <FormField label="Full Blocks (×4 reps each)">
              <NumberInput value={clusterSet.blocks} onChange={v => setClusterSet(s => ({ ...s, blocks: v }))} placeholder="e.g. 4" min="1" />
            </FormField>
            <FormField label="Weight (kg)">
              <NumberInput value={clusterSet.weight} onChange={v => setClusterSet(s => ({ ...s, weight: v }))} placeholder="e.g. 80" step="0.5" />
            </FormField>
            <FormField label="Final block reps (optional)">
              <NumberInput value={clusterSet.failReps} onChange={v => setClusterSet(s => ({ ...s, failReps: v }))} placeholder="e.g. 3" min="1" />
            </FormField>
          </div>
        )}

        <PrimaryButton
          onClick={logSets}
          disabled={setType === 'normal' ? !canLogNormal() : !canLogCluster()}
          style={{ marginTop: 12 }}
        >
          Log Sets
        </PrimaryButton>
      </Sheet>

      {/* ── Meal CRUD sheet ── */}
      <Sheet open={mealSheet} onClose={() => setMealSheet(false)} title={editMeal ? 'Edit Meal' : 'New Meal'}>
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
        <PrimaryButton onClick={saveMeal} disabled={!mealForm.name.trim() || !mealForm.calories}>
          {editMeal ? 'Save Changes' : 'Add Meal'}
        </PrimaryButton>
        {editMeal && <DestructiveButton onClick={deleteMeal}>Delete Meal</DestructiveButton>}
      </Sheet>
    </div>
  )
}
