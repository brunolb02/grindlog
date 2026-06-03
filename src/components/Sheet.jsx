import { useEffect } from 'react'
import './Sheet.css'

export default function Sheet({ open, onClose, title, headerContent, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-panel" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        {title && (
          <div className="sheet-title">
            {title}
            <button className="sheet-close-btn" onClick={onClose}>×</button>
          </div>
        )}
        {headerContent && <div className="sheet-header-content">{headerContent}</div>}
        <div className="sheet-body scroll-area">
          {children}
        </div>
      </div>
    </div>
  )
}
