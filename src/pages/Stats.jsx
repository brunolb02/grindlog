import { useState, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import { getNutritionLog, getSessions, getExerciseLogs, getExercises, getProfile, todayKey } from '../utils/storage'
import { MUSCLE_GROUPS } from './Library'
import './Stats.css'

function getDaySlots(n) {
  const slots = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    slots.push(d.toISOString().slice(0, 10))
  }
  return slots
}

function getMaxWeight(log) {
  if (log.type === 'cluster') return Number(log.sets?.weight) || 0
  if (!Array.isArray(log.sets) || log.sets.length === 0) return 0
  return Math.max(0, ...log.sets.map(s => Number(s.weight) || 0))
}

// ── Bar chart ────────────────────────────────────────────────────────────────

function BarChart({ slots, getValue, color, targetValue }) {
  // Aggregate into weekly buckets if dataset is too wide to read bar-per-day
  const aggregate = slots.length > 60
  let bars
  if (aggregate) {
    bars = []
    for (let i = 0; i < slots.length; i += 7) {
      const chunk = slots.slice(i, i + 7)
      bars.push({ label: chunk[0], value: chunk.reduce((s, d) => s + getValue(d), 0) })
    }
  } else {
    bars = slots.map(d => ({ label: d, value: getValue(d) }))
  }

  const maxVal = Math.max(...bars.map(b => b.value), targetValue || 0, 1)
  const W = 320, H = 120
  const padL = 34, padB = 18, padT = 8, padR = 4
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const n = bars.length
  const slotW = chartW / n
  const barW = Math.max(Math.min(slotW * 0.72, 22), 2)
  const yLabel = v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <text x={padL - 4} y={padT + 6} textAnchor="end" fontSize="9" fill="var(--text-tertiary)">{yLabel(maxVal)}</text>
      <text x={padL - 4} y={padT + chartH} textAnchor="end" fontSize="9" fill="var(--text-tertiary)">0</text>

      {targetValue > 0 && !aggregate && (() => {
        const ty = padT + chartH - (targetValue / maxVal) * chartH
        return (
          <line x1={padL} x2={W - padR} y1={ty} y2={ty}
            stroke={color} strokeWidth="1" strokeDasharray="4,3" opacity="0.45" />
        )
      })()}

      {bars.map((bar, i) => {
        const barH = (bar.value / maxVal) * chartH
        const drawn = Math.max(barH, bar.value > 0 ? 2 : 0)
        const x = padL + i * slotW + (slotW - barW) / 2
        const y = padT + chartH - drawn
        return (
          <rect key={bar.label} x={x} y={y} width={barW} height={drawn}
            rx={Math.min(barW / 3, 3)} fill={color} opacity={bar.value > 0 ? 0.85 : 0.1} />
        )
      })}

      {bars.map((bar, i) => {
        const show = n <= 7 ? true
          : n <= 31 ? (i % 7 === 0 || i === n - 1)
          : (i % Math.ceil(n / 6) === 0 || i === n - 1)
        if (!show) return null
        const d = new Date(bar.label + 'T12:00:00')
        const label = n <= 7
          ? d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const cx = padL + i * slotW + slotW / 2
        const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'
        return (
          <text key={bar.label} x={cx} y={H - 2} textAnchor={anchor} fontSize="8.5" fill="var(--text-tertiary)">{label}</text>
        )
      })}
    </svg>
  )
}

// ── Progressive overload line graph ──────────────────────────────────────────

function ExerciseGraph({ logs }) {
  const points = logs
    .map(log => ({ ts: log.timestamp, w: getMaxWeight(log) }))
    .filter(p => p.w > 0)

  if (points.length === 0) return <p className="stats-empty-hint" style={{ padding: '6px 0 2px' }}>No weight data in these logs</p>

  const W = 320, H = 90
  const padL = 34, padR = 8, padT = 10, padB = 20
  const chartW = W - padL - padR
  const chartH = H - padT - padB

  const ws = points.map(p => p.w)
  const minW = Math.min(...ws), maxW = Math.max(...ws)
  const spread = maxW - minW || maxW * 0.1 || 1
  const yLo = minW - spread * 0.15
  const yHi = maxW + spread * 0.15
  const ySpan = yHi - yLo

  const sx = i => points.length === 1 ? padL + chartW / 2 : padL + (i / (points.length - 1)) * chartW
  const sy = w => padT + chartH - ((w - yLo) / ySpan) * chartH

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(p.w).toFixed(1)}`).join(' ')

  const labelIdx = points.length <= 3
    ? points.map((_, i) => i)
    : [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])]

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <text x={padL - 4} y={padT + 5} textAnchor="end" fontSize="9" fill="var(--text-tertiary)">{maxW}kg</text>
      <text x={padL - 4} y={padT + chartH} textAnchor="end" fontSize="9" fill="var(--text-tertiary)">{minW}kg</text>
      <line x1={padL} x2={W - padR} y1={padT + chartH} y2={padT + chartH} stroke="var(--separator)" strokeWidth="1" />

      {points.length > 1 && (
        <path d={pathD} stroke="var(--accent-purple)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {points.map((p, i) => (
        <circle key={i} cx={sx(i)} cy={sy(p.w)} r="3.5" fill="var(--accent-purple)" />
      ))}

      {labelIdx.map(i => {
        const anchor = i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'
        return (
          <text key={i} x={sx(i)} y={H - 3} textAnchor={anchor} fontSize="8.5" fill="var(--text-tertiary)">
            {new Date(points[i].ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        )
      })}
    </svg>
  )
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({ label, value, color }) {
  return (
    <div className="stat-chip">
      <span className="stat-chip-val" style={{ color }}>{value}</span>
      <span className="stat-chip-label">{label}</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Stats() {
  const [period, setPeriod] = useState('7')
  const [activeMuscle, setActiveMuscle] = useState(MUSCLE_GROUPS[0])
  const [expandedEx, setExpandedEx] = useState(null)

  const [nutritionLog] = useState(getNutritionLog)
  const [sessions] = useState(getSessions)
  const [exerciseLogs] = useState(getExerciseLogs)
  const [exercises] = useState(getExercises)
  const [profile] = useState(getProfile)

  const daySlots = useMemo(() => {
    if (period === '7') return getDaySlots(7)
    if (period === '30') return getDaySlots(30)
    const allDates = [
      ...nutritionLog.map(e => e.date),
      ...sessions.map(s => s.date),
    ].filter(Boolean).sort()
    if (allDates.length === 0) return getDaySlots(7)
    const slots = []
    const cur = new Date(allDates[0] + 'T12:00:00')
    const end = new Date(todayKey() + 'T12:00:00')
    while (cur <= end) {
      slots.push(cur.toISOString().slice(0, 10))
      cur.setDate(cur.getDate() + 1)
    }
    return slots
  }, [period, nutritionLog, sessions])

  const nutritionByDay = useMemo(() => {
    const map = {}
    for (const e of nutritionLog) {
      if (!map[e.date]) map[e.date] = { calories: 0, carbs: 0, protein: 0, fat: 0 }
      map[e.date].calories += e.calories
      map[e.date].carbs += e.carbs
      map[e.date].protein += e.protein
      map[e.date].fat += e.fat
    }
    return map
  }, [nutritionLog])

  const sessionsByDay = useMemo(() => {
    const map = {}
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = { calories: 0, count: 0 }
      map[s.date].calories += s.calories
      map[s.date].count++
    }
    return map
  }, [sessions])

  const nutritionStats = useMemo(() => {
    const active = daySlots.filter(d => nutritionByDay[d])
    if (active.length === 0) return null
    const sum = active.reduce(
      (acc, d) => {
        const e = nutritionByDay[d]
        return { cal: acc.cal + e.calories, carbs: acc.carbs + e.carbs, protein: acc.protein + e.protein, fat: acc.fat + e.fat }
      },
      { cal: 0, carbs: 0, protein: 0, fat: 0 }
    )
    const n = active.length
    return {
      avgCal: Math.round(sum.cal / n),
      avgCarbs: Math.round(sum.carbs / n),
      avgProtein: Math.round(sum.protein / n),
      avgFat: Math.round(sum.fat / n),
    }
  }, [daySlots, nutritionByDay])

  const workoutStats = useMemo(() => {
    const active = daySlots.filter(d => sessionsByDay[d])
    if (active.length === 0) return null
    const totalSessions = active.reduce((s, d) => s + sessionsByDay[d].count, 0)
    const totalCal = active.reduce((s, d) => s + sessionsByDay[d].calories, 0)
    return { totalSessions, avgCal: Math.round(totalCal / totalSessions) }
  }, [daySlots, sessionsByDay])

  const muscleExercises = useMemo(
    () => exercises.filter(e => (e.muscleGroup || 'Other') === activeMuscle),
    [exercises, activeMuscle]
  )

  const logsByExercise = useMemo(() => {
    const map = {}
    for (const l of exerciseLogs) {
      if (!map[l.exerciseId]) map[l.exerciseId] = []
      map[l.exerciseId].push(l)
    }
    for (const id in map) map[id].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    return map
  }, [exerciseLogs])

  const target = profile.bmr + profile.neat

  return (
    <div className="page">
      <PageHeader title="Stats" />
      <div className="page-body scroll-area">

        <div className="period-picker">
          {[['7', '7 days'], ['30', '30 days'], ['all', 'All time']].map(([val, label]) => (
            <button
              key={val}
              className={`period-btn ${period === val ? 'active' : ''}`}
              onClick={() => setPeriod(val)}
            >{label}</button>
          ))}
        </div>

        {/* ── Nutrition card ── */}
        <div className="stats-card">
          <div className="stats-card-title">Nutrition</div>
          <BarChart
            slots={daySlots}
            getValue={d => nutritionByDay[d]?.calories || 0}
            color="var(--accent-orange)"
            targetValue={target}
          />
          {nutritionStats ? (
            <div className="stats-chips">
              <StatChip label="Avg Calories" value={`${nutritionStats.avgCal} kcal`} color="var(--accent-orange)" />
              <StatChip label="Avg Protein" value={`${nutritionStats.avgProtein}g`} color="var(--accent-green)" />
              <StatChip label="Avg Carbs" value={`${nutritionStats.avgCarbs}g`} color="var(--accent-orange)" />
              <StatChip label="Avg Fat" value={`${nutritionStats.avgFat}g`} color="var(--accent-purple)" />
            </div>
          ) : (
            <p className="stats-empty-hint">No nutrition data for this period</p>
          )}
        </div>

        {/* ── Workouts card ── */}
        <div className="stats-card">
          <div className="stats-card-title">Workouts</div>
          <BarChart
            slots={daySlots}
            getValue={d => sessionsByDay[d]?.calories || 0}
            color="var(--accent-red)"
          />
          {workoutStats ? (
            <div className="stats-chips">
              <StatChip label="Sessions" value={String(workoutStats.totalSessions)} color="var(--accent-red)" />
              <StatChip label="Avg Burned" value={`${workoutStats.avgCal} kcal`} color="var(--accent-red)" />
            </div>
          ) : (
            <p className="stats-empty-hint">No workout data for this period</p>
          )}
        </div>

        {/* ── Progressive overload card ── */}
        <div className="stats-card">
          <div className="stats-card-title">Progressive Overload</div>
          <div className="muscle-picker" style={{ marginBottom: 14 }}>
            {MUSCLE_GROUPS.map(g => (
              <button
                key={g}
                className={`muscle-chip ${activeMuscle === g ? 'active' : ''}`}
                onClick={() => { setActiveMuscle(g); setExpandedEx(null) }}
              >{g}</button>
            ))}
          </div>

          {muscleExercises.length === 0 ? (
            <p className="stats-empty-hint">No exercises in {activeMuscle}</p>
          ) : (
            <div className="overload-list">
              {muscleExercises.map(ex => {
                const logs = logsByExercise[ex.id] || []
                const isExpanded = expandedEx === ex.id
                const lastMax = logs.length > 0 ? getMaxWeight(logs[logs.length - 1]) : null

                return (
                  <div key={ex.id} className="overload-item">
                    <button className="overload-header" onClick={() => setExpandedEx(isExpanded ? null : ex.id)}>
                      <div className="overload-ex-info">
                        <span className="overload-ex-name">{ex.name}</span>
                        <span className="overload-ex-sub">
                          {logs.length === 0
                            ? 'No logs yet'
                            : `${logs.length} session${logs.length !== 1 ? 's' : ''}${lastMax ? ` · last: ${lastMax}kg` : ''}`}
                        </span>
                      </div>
                      <span className={`overload-chevron ${isExpanded ? 'open' : ''}`}>›</span>
                    </button>

                    {isExpanded && (
                      <div className="overload-detail">
                        {logs.length === 0 ? (
                          <p className="stats-empty-hint">No logs yet for this exercise</p>
                        ) : (
                          <>
                            <ExerciseGraph logs={logs} />
                            <div className="overload-sessions">
                              {[...logs].reverse().slice(0, 5).map(log => (
                                <div key={log.id} className="overload-session-row">
                                  <span className="overload-session-date">
                                    {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                  <span className="overload-session-sets">
                                    {log.type === 'cluster'
                                      ? `${log.sets.blocks}×4 @ ${log.sets.weight}kg${log.sets.failReps ? ` +1×${log.sets.failReps}` : ''}`
                                      : log.sets.map(s => `${s.weight}×${s.reps}`).join(' · ')}
                                  </span>
                                  <span className="overload-session-max">{getMaxWeight(log)}kg</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
