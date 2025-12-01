import styles from '../styles/page.module.css'

interface ToggleButtonGroupProps<T extends string> {
  label: string
  options: readonly T[]
  selected: T[]
  onToggle: (value: T) => void
}

export function ToggleButtonGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: ToggleButtonGroupProps<T>) {
  return (
    <div className={styles.filterGroup}>
      <label className={styles.filterLabel}>{label}</label>
      <div className={styles.buttonGroup}>
        {options.map((option) => {
          const isActive = selected.includes(option)
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              className={`${styles.toggleButton} ${isActive ? styles.toggleButtonActive : ''}`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
