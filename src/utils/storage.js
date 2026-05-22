const KEYS = {
  exercises: 'gl_exercises',
  sessions: 'gl_sessions',       // workout activity sessions
  exerciseLogs: 'gl_exercise_logs', // sets/reps logs per exercise
  meals: 'gl_meals',
  nutritionLog: 'gl_nutrition_log',
  profile: 'gl_profile',
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

// Workout sessions (activity-level: Gym, Cardio, etc.)
export function getSessions() {
  return load(KEYS.sessions) || []
}
export function saveSessions(list) {
  save(KEYS.sessions, list)
}

// Exercise logs (sets/reps per exercise)
export function getExerciseLogs() {
  return load(KEYS.exerciseLogs) || []
}
export function saveExerciseLogs(list) {
  save(KEYS.exerciseLogs, list)
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

// User profile (BMR, NEAT)
const DEFAULT_PROFILE = { bmr: 1880, neat: 350 }
export function getProfile() {
  return { ...DEFAULT_PROFILE, ...(load(KEYS.profile) || {}) }
}
export function saveProfile(profile) {
  save(KEYS.profile, profile)
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
