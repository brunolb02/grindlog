Build me a Progressive Web App (PWA) for personal fitness tracking. The app will be used on iPhone via Safari (added to home screen). Use React with a mobile-first design — it should feel like a native iOS app.

## Tech stack
- React (Vite)
- Local storage for all data persistence (no backend needed)
- Mobile-first, clean and minimal UI
- PWA manifest + service worker for offline support and home screen install

---

## Features

### 1. Exercise library
- User can create custom exercises with a name and an optional photo (uploaded from device)
- No pre-filled exercise database — the user builds their own library
- Exercises can be edited or deleted

### 2. Workout log
Each exercise log entry supports two set types, selectable via a toggle:

**Normal Set**
- Fixed structure: 3 series per exercise
- Each series: weight (kg) + reps

**Cluster Set**
- Structure: N full blocks × 4 reps + 1 optional final block × custom reps (to failure)
- Fields: number of full blocks, weight, and reps for the final failure block
- Example display: "4×4 + 1×3 @ 80kg"

The user should be able to log multiple exercises per workout session, with date/time recorded automatically.

### 3. Meal library
- User creates custom meals with: name, calories, carbs (g), protein (g), fat (g)
- No pre-filled database — the user builds their own meal library
- Meals can be edited or deleted

### 4. Daily nutrition log
- User logs meals consumed each day
- When adding a meal, the user can:
  - Pick from their meal library
  - Or quickly repeat a meal from a previous day (shown as recent suggestions)
- The log should be as frictionless as possible — tapping a saved meal adds it instantly
- Multiple meals per day, with timestamps

### 5. Daily metrics dashboard
Show a summary for the selected day:
- Total calories consumed
- Macros breakdown: carbs / protein / fat (in grams and % of total)
- Calories burned from training (user manually enters this value, sourced from their smartwatch)
- Net calories (consumed minus burned)

---

## UX guidelines
- Bottom tab navigation: Dashboard / Workout / Nutrition / Library
- Dark mode support
- Smooth transitions between views
- All data stored locally (localStorage), no login required
- The app is for personal use only — no multi-user support needed