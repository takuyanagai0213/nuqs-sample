'use client'

import { useFilters, type FilterSchema } from './hooks/useFilters'
import { TextInput, ToggleButtonGroup, FilterStateDisplay } from './components'
import { APPROVAL_STATUSES, DEVICES } from './types'
import styles from './styles/page.module.css'

// フィルタースキーマを定義するだけ！
// 新しいフィルターを追加したい場合はここに追加するだけ
const filterSchema = {
  programId: { type: 'string' },
  statuses: { type: 'stringLiteralArray', options: APPROVAL_STATUSES },
  devices: { type: 'stringLiteralArray', options: DEVICES },
} as const satisfies FilterSchema

export default function Demo() {
  const { filters, setFilter, toggleArrayItem, clearFilters } =
    useFilters(filterSchema)

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>nuqs Sample - URLフィルター同期</h1>
      <p className={styles.description}>
        フィルターを変更するとURLが自動更新されます。URLをコピーして共有できます。
      </p>

      <div className={styles.filtersContainer}>
        <TextInput
          label="プログラムID"
          value={filters.programId}
          onChange={(v) => setFilter('programId', v)}
          placeholder="例: PRG-001"
        />

        <ToggleButtonGroup
          label="承認ステータス"
          options={APPROVAL_STATUSES}
          selected={filters.statuses}
          onToggle={(status) => toggleArrayItem('statuses', status)}
        />

        <ToggleButtonGroup
          label="デバイス"
          options={DEVICES}
          selected={filters.devices}
          onToggle={(device) => toggleArrayItem('devices', device)}
        />

        <div>
          <button onClick={clearFilters} className={styles.clearButton}>
            フィルターをクリア
          </button>
        </div>
      </div>

      <FilterStateDisplay state={filters} />

      <div className={styles.infoCard}>
        <h2>使い方</h2>
        <p>
          ブラウザのアドレスバーのURLをコピーして他の人に共有すると、同じフィルター状態で開けます
        </p>
      </div>
    </main>
  )
}
