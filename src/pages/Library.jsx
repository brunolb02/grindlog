import { useState, useRef } from 'react'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'
import { FormField, TextInput, NumberInput, PrimaryButton, DestructiveButton } from '../components/FormField'
import { getExercises, saveExercises, getMeals, saveMeals, generateId } from '../utils/storage'
import './Library.css'

function emptyExercise() {
  return { name: '', photo: null }
}

function emptyMeal() {
  return { name: '', calories: '', carbs: '', protein: '', fat: '' }
}

export default function Library() {
  const [tab, setTab] = useState('exercises')
  const [exercises, setExercises] = useState(getExercises)
  const [meals, setMeals] = useState(getMeals)
  const [exSheet, setExSheet] = useState(false)
  const [mealSheet, setMealSheet] = useState(false)
  const [editEx, setEditEx] = useState(null)
  const [editMeal, setEditMeal] = useState(null)
  const [exForm, setExForm] = useState(emptyExercise)
  const [mealForm, setMealForm] = useState(emptyMeal)
  const photoRef = useRef()

  function openNewExercise() {
    setEditEx(null)
    setExForm(emptyExercise())
    setExSheet(true)
  }

  function openEditExercise(ex) {
    setEditEx(ex)
    setExForm({ name: ex.name, photo: ex.photo || null })
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

  function openNewMeal() {
    setEditMeal(null)
    setMealForm(emptyMeal())
    setMealSheet(true)
  }

  function openEditMeal(meal) {
    setEditMeal(meal)
    setMealForm({ name: meal.name, calories: String(meal.calories), carbs: String(meal.carbs), protein: String(meal.protein), fat: String(meal.fat) })
    setMealSheet(true)
  }

  function saveMeal() {
    const entry = {
      name: mealForm.name,
      calories: Number(mealForm.calories),
      carbs: Number(mealForm.carbs),
      protein: Number(mealForm.protein),
      fat: Number(mealForm.fat),
    }
    const updated = editMeal
      ? meals.map(m => m.id === editMeal.id ? { ...m, ...entry } : m)
      : [...meals, { id: generateId(), ...entry }]
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
          <button
            className="add-btn"
            onClick={tab === 'exercises' ? openNewExercise : openNewMeal}
          >
            + Add
          </button>
        }
      />

      <div className="seg-control">
        <button className={tab === 'exercises' ? 'active' : ''} onClick={() => setTab('exercises')}>Exercises</button>
        <button className={tab === 'meals' ? 'active' : ''} onClick={() => setTab('meals')}>Meals</button>
      </div>

      <div className="page-body scroll-area">
        {tab === 'exercises' && (
          <>
            {exercises.length === 0 && (
              <div className="empty-state">
                <p>No exercises yet</p>
                <p className="empty-hint">Tap + Add to create your first exercise</p>
              </div>
            )}
            <div className="item-list">
              {exercises.map(ex => (
                <button key={ex.id} className="list-item" onClick={() => openEditExercise(ex)}>
                  <div className="list-item-left">
                    {ex.photo
                      ? <img src={ex.photo} className="ex-thumb" alt="" />
                      : <div className="ex-thumb ex-thumb-placeholder"><span>💪</span></div>
                    }
                    <span className="list-item-name">{ex.name}</span>
                  </div>
                  <span className="chevron">›</span>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === 'meals' && (
          <>
            {meals.length === 0 && (
              <div className="empty-state">
                <p>No meals yet</p>
                <p className="empty-hint">Tap + Add to create your first meal</p>
              </div>
            )}
            <div className="item-list">
              {meals.map(meal => (
                <button key={meal.id} className="list-item meal-item" onClick={() => openEditMeal(meal)}>
                  <div className="list-item-left meal-info">
                    <span className="list-item-name">{meal.name}</span>
                    <span className="meal-macros">{meal.calories} kcal · P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g</span>
                  </div>
                  <span className="chevron">›</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Exercise sheet */}
      <Sheet open={exSheet} onClose={() => setExSheet(false)} title={editEx ? 'Edit Exercise' : 'New Exercise'}>
        <div className="photo-picker" onClick={() => photoRef.current.click()}>
          {exForm.photo
            ? <img src={exForm.photo} className="photo-preview" alt="" />
            : <div className="photo-placeholder"><span>📷</span><span>Add Photo</span></div>
          }
          <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
        </div>
        <FormField label="Exercise Name">
          <TextInput
            value={exForm.name}
            onChange={v => setExForm(f => ({ ...f, name: v }))}
            placeholder="e.g. Bench Press"
          />
        </FormField>
        <PrimaryButton onClick={saveExercise} disabled={!exForm.name.trim()}>
          {editEx ? 'Save Changes' : 'Add Exercise'}
        </PrimaryButton>
        {editEx && <DestructiveButton onClick={deleteExercise}>Delete Exercise</DestructiveButton>}
      </Sheet>

      {/* Meal sheet */}
      <Sheet open={mealSheet} onClose={() => setMealSheet(false)} title={editMeal ? 'Edit Meal' : 'New Meal'}>
        <FormField label="Meal Name">
          <TextInput
            value={mealForm.name}
            onChange={v => setMealForm(f => ({ ...f, name: v }))}
            placeholder="e.g. Chicken & Rice"
          />
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
