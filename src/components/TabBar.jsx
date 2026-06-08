import './TabBar.css'

const TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.9"/>
        <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.9"/>
        <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.9"/>
        <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.9"/>
      </svg>
    ),
  },
  {
    id: 'workout',
    label: 'Workout',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="13" cy="4" r="2" fill="currentColor"/>
        <path d="M12.5 6L11 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 9L9 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M12 9L15.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M11 12L8.5 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M11 12L15 15L13 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="5.5" y="3" width="1.5" height="7" rx="0.75" fill="currentColor"/>
        <rect x="8.25" y="3" width="1.5" height="7" rx="0.75" fill="currentColor"/>
        <rect x="11" y="3" width="1.5" height="7" rx="0.75" fill="currentColor"/>
        <rect x="8.25" y="9" width="1.5" height="12" rx="0.75" fill="currentColor"/>
        <path d="M15 3H17C18 4 18.5 7 17 10H15Z" fill="currentColor"/>
        <rect x="15" y="10" width="2" height="11" rx="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <polyline points="3,17 8,11 13,14 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="3" cy="17" r="1.5" fill="currentColor"/>
        <circle cx="8" cy="11" r="1.5" fill="currentColor"/>
        <circle cx="13" cy="14" r="1.5" fill="currentColor"/>
        <circle cx="21" cy="6" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'library',
    label: 'Exercises',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="10.5" y="11" width="3" height="2" rx="0.5" fill="currentColor"/>
        <rect x="2" y="9.5" width="4" height="5" rx="1.5" fill="currentColor" opacity="0.9"/>
        <rect x="18" y="9.5" width="4" height="5" rx="1.5" fill="currentColor" opacity="0.9"/>
        <rect x="5.5" y="8" width="3" height="8" rx="1" fill="currentColor"/>
        <rect x="15.5" y="8" width="3" height="8" rx="1" fill="currentColor"/>
        <rect x="8" y="10.5" width="2.5" height="3" rx="0.5" fill="currentColor" opacity="0.7"/>
        <rect x="13.5" y="10.5" width="2.5" height="3" rx="0.5" fill="currentColor" opacity="0.7"/>
      </svg>
    ),
  },
]

export default function TabBar({ active, onSelect }) {
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab-item ${active === tab.id ? 'active' : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
