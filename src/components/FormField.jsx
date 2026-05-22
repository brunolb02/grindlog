import './FormField.css'

export function FormField({ label, children }) {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      {children}
    </div>
  )
}

export function TextInput({ value, onChange, placeholder, type = 'text', ...props }) {
  return (
    <input
      className="text-input"
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      {...props}
    />
  )
}

export function NumberInput({ value, onChange, placeholder, min, step, ...props }) {
  return (
    <input
      className="text-input number-input"
      type="number"
      inputMode="decimal"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      step={step}
      {...props}
    />
  )
}

export function PrimaryButton({ children, onClick, disabled, style }) {
  return (
    <button
      className="primary-btn"
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  )
}

export function DestructiveButton({ children, onClick }) {
  return (
    <button className="destructive-btn" onClick={onClick}>
      {children}
    </button>
  )
}
