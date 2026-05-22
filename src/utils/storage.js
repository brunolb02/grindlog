const KEYS = {
  exercises: 'gl_exercises',
  workouts: 'gl_workouts',
  meals: 'gl_meals',
  nutritionLog: 'gl_nutrition_log',
  dailyMetrics: 'gl_daily_metrics',
}

function load(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// Exercises
export function getExercises() {
  return load(KEYS.exercises) || []
}
export function saveExercises(list) {
  save(KEYS.exercises, list)
}

// Workouts
export function getWorkouts() {
  return load(KEYS.workouts) || []
}
export function saveWorkouts(list) {
  save(KEYS.workouts, list)
}

// Meals
export function getMeals() {
  return load(KEYS.meals) || []
}
export function saveMeals(list) {
  save(KEYS.meals, list)
}

// Nutrition log
export function getNutritionLog() {
  return load(KEYS.nutritionLog) || []
}
export function saveNutritionLog(list) {
  save(KEYS.nutritionLog, list)
}

// Daily metrics (calories burned per day)
export function getDailyMetrics() {
  return load(KEYS.dailyMetrics) || {}
}
export function saveDailyMetrics(map) {
  save(KEYS.dailyMetrics, map)
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function dateKey(date) {
  return new Date(date).toISOString().slice(0, 10)
}
