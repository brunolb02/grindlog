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
        <path d="M6.5 8.5H3.5C3.22 8.5 3 8.72 3 9v6c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5V9c0-.28-.22-.5-.5-.5Z" fill="currentColor"/>
        <path d="M20.5 8.5h-3c-.28 0-.5.22-.5.5v6c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5V9c0-.28-.22-.5-.5-.5Z" fill="currentColor"/>
        <path d="M7 11.5h10M7 12.5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M2 11.5h1.5M20.5 11.5H22M2 12.5h1.5M20.5 12.5H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 3C8.5 3 5 6 5 10c0 3 1.5 5.5 4 7v2.5c0 .83.67 1.5 1.5 1.5h3c.83 0 1.5-.67 1.5-1.5V17c2.5-1.5 4-4 4-7 0-4-3.5-7-7-7Z" fill="currentColor" opacity="0.85"/>
        <path d="M9.5 3.5C9.5 5 9 6.5 8 7.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: 'library',
    label: 'Library',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="6" height="16" rx="1.5" fill="currentColor" opacity="0.9"/>
        <rect x="12" y="4" width="3" height="16" rx="1.5" fill="currentColor" opacity="0.7"/>
        <rect x="17" y="4" width="3" height="16" rx="1.5" fill="currentColor" opacity="0.5"/>
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
