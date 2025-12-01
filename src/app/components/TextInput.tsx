import styles from '../styles/page.module.css'

interface TextInputProps {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
}

export function TextInput({ label, value, onChange, placeholder }: TextInputProps) {
  return (
    <div className={styles.filterGroup}>
      <label className={styles.filterLabel}>{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={placeholder}
        className={styles.textInput}
      />
    </div>
  )
}
