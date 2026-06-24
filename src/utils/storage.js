const KEYS = {
  exercises: 'gl_exercises',
  sessions: 'gl_sessions',       // workout activity sessions
  exerciseLogs: 'gl_exercise_logs', // sets/reps logs per exercise
  meals: 'gl_meals',
  nutritionLog: 'gl_nutrition_log',
  waterLog: 'gl_water_log',
  profile: 'gl_profile',
  aiSettings: 'gl_ai_settings',
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
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Storage save failed:', key, e)
  }
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

// Water log: { 'YYYY-MM-DD': glasses }
export function getWaterLog() {
  return load(KEYS.waterLog) || {}
}
export function saveWaterLog(log) {
  save(KEYS.waterLog, log)
}

// User profile (BMR, NEAT, water goal)
const DEFAULT_PROFILE = { bmr: 1880, neat: 350, waterGoal: 0 }
export function getProfile() {
  return { ...DEFAULT_PROFILE, ...(load(KEYS.profile) || {}) }
}
export function saveProfile(profile) {
  save(KEYS.profile, profile)
}

// Export / Import
export function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises: load(KEYS.exercises) || [],
    sessions: load(KEYS.sessions) || [],
    exerciseLogs: load(KEYS.exerciseLogs) || [],
    meals: load(KEYS.meals) || [],
    nutritionLog: load(KEYS.nutritionLog) || [],
    waterLog: load(KEYS.waterLog) || {},
    profile: load(KEYS.profile) || {},
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `grindlog-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(json) {
  const data = JSON.parse(json)
  if (data.exercises !== undefined) save(KEYS.exercises, data.exercises)
  if (data.sessions !== undefined) save(KEYS.sessions, data.sessions)
  if (data.exerciseLogs !== undefined) save(KEYS.exerciseLogs, data.exerciseLogs)
  if (data.meals !== undefined) save(KEYS.meals, data.meals)
  if (data.nutritionLog !== undefined) save(KEYS.nutritionLog, data.nutritionLog)
  if (data.waterLog !== undefined) save(KEYS.waterLog, data.waterLog)
  if (data.profile !== undefined) save(KEYS.profile, data.profile)
}

// AI provider settings
const DEFAULT_AI_SETTINGS = {
  active: 'gemini',
  gemini: { key: '', model: 'gemini-2.5-flash' },
  openai: { key: '', model: 'gpt-4o-mini' },
}

export function getAiSettings() {
  const stored = load(KEYS.aiSettings)
  // migrate old single gemini key if present
  const legacyKey = localStorage.getItem('gl_gemini_key')
  if (!stored && legacyKey) {
    const migrated = { ...DEFAULT_AI_SETTINGS, gemini: { key: legacyKey, model: 'gemini-2.5-flash' } }
    save(KEYS.aiSettings, migrated)
    localStorage.removeItem('gl_gemini_key')
    return migrated
  }
  const merged = { ...DEFAULT_AI_SETTINGS, ...stored }
  // ensure openai defaults exist for users upgrading from older storage
  if (!merged.openai) merged.openai = { key: '', model: 'gpt-4o-mini' }
  // update deprecated gemini model IDs
  if (!merged.gemini?.model?.startsWith('gemini-2.5')) {
    merged.gemini = { ...merged.gemini, model: 'gemini-2.5-flash' }
  }
  return merged
}

export function saveAiSettings(settings) {
  save(KEYS.aiSettings, settings)
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
