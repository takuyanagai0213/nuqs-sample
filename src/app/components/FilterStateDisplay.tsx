import styles from '../styles/page.module.css'

interface FilterStateDisplayProps {
  state: Record<string, unknown>
}

export function FilterStateDisplay({ state }: FilterStateDisplayProps) {
  return (
    <div className={styles.stateCard}>
      <h2>現在のフィルター状態</h2>
      <pre className={styles.stateCode}>
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  )
}
