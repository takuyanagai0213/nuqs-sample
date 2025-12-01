'use client'

/**
 * useFilters 使用サンプル（シンプル版）
 *
 * react-hook-form を使わず、useFilters のみでURL同期を実現する例
 */

import { useFilters, type FilterSchema } from '../hooks/useFilters'

// =============================================================================
// 1. 型定義
// =============================================================================

export const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const
export const CATEGORIES = ['TYPE_A', 'TYPE_B'] as const
export const DATE_TYPES = ['CREATED_DATE', 'UPDATED_DATE'] as const

// =============================================================================
// 2. フィルタースキーマ定義
// =============================================================================

// スキーマを定義するだけで、URL同期が自動的に行われる
const reportFilterSchema = {
  // 単一選択（セレクトボックス）
  keyword: { type: 'string' },

  // 日付範囲（ISO形式の文字列で管理）
  dateFrom: { type: 'string' },
  dateTo: { type: 'string' },

  // 単一選択（ラジオボタン）
  dateType: { type: 'stringLiteral', options: DATE_TYPES },

  // 複数選択（チェックボックス）
  statuses: { type: 'stringLiteralArray', options: STATUSES },
  categories: { type: 'stringLiteralArray', options: CATEGORIES },

  // ページネーション
  page: { type: 'integer' },
  pageSize: { type: 'integer' },
} as const satisfies FilterSchema

// =============================================================================
// 3. カスタムフック（ドメイン固有のロジックをラップ）
// =============================================================================

export const useReportFilters = () => {
  const {
    filters,
    setFilter,
    toggleArrayItem,
    clearFilters,
    clearFilter,
  } = useFilters(reportFilterSchema)

  // デフォルト値の適用（nullの場合のフォールバック）
  const filtersWithDefaults = {
    keyword: filters.keyword ?? '',
    dateFrom: filters.dateFrom ?? getDefaultDateFrom(),
    dateTo: filters.dateTo ?? getDefaultDateTo(),
    dateType: filters.dateType ?? 'CREATED_DATE',
    statuses: filters.statuses.length > 0
      ? filters.statuses
      : [...STATUSES], // デフォルトは全選択
    categories: filters.categories.length > 0
      ? filters.categories
      : [...CATEGORIES], // デフォルトは全選択
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 50,
  }

  // 日付範囲を設定するヘルパー
  const setDateRange = (from: Date, to: Date) => {
    setFilter('dateFrom', from.toISOString().split('T')[0])
    setFilter('dateTo', to.toISOString().split('T')[0])
  }

  // ページを変更
  const setPage = (page: number) => {
    setFilter('page', page)
  }

  // API呼び出し用にフィルターを変換
  const toApiParams = () => ({
    keyword: filtersWithDefaults.keyword || undefined,
    dateFrom: filtersWithDefaults.dateFrom,
    dateTo: filtersWithDefaults.dateTo,
    dateType: filtersWithDefaults.dateType,
    statuses: filtersWithDefaults.statuses,
    categories: filtersWithDefaults.categories,
    page: filtersWithDefaults.page,
    pageSize: filtersWithDefaults.pageSize,
  })

  return {
    // 状態
    filters: filtersWithDefaults,
    rawFilters: filters,

    // アクション
    setFilter,
    toggleArrayItem,
    clearFilters,
    clearFilter,
    setDateRange,
    setPage,

    // ユーティリティ
    toApiParams,
  }
}

// ヘルパー関数
const getDefaultDateFrom = (): string => {
  const date = new Date()
  date.setDate(1) // 月初
  return date.toISOString().split('T')[0]!
}

const getDefaultDateTo = (): string => {
  return new Date().toISOString().split('T')[0]!
}

// =============================================================================
// 4. 使用例（ページコンポーネント）
// =============================================================================

/**
 * useFilters を使った実装:
 * - フィルター変更が即座にURLに反映
 * - URLを共有してフィルター状態を共有可能
 * - ページリロードでもフィルターが維持される
 * - ブラウザの戻る/進むでフィルター履歴をナビゲート可能
 */

export const ReportPageExample = () => {
  const {
    filters,
    setFilter,
    toggleArrayItem,
    setPage,
    clearFilters,
    toApiParams,
  } = useReportFilters()

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">レポート検索</h1>

      {/* フィルターセクション */}
      <div className="space-y-4 rounded-lg border p-4">
        {/* キーワード検索 */}
        <div>
          <label className="block font-bold">キーワード</label>
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => setFilter('keyword', e.target.value || null)}
            placeholder="検索キーワード"
            className="w-64 rounded border p-2"
          />
        </div>

        {/* 日付範囲 */}
        <div className="flex gap-4">
          <div>
            <label className="block font-bold">開始日</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilter('dateFrom', e.target.value || null)}
              className="rounded border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">終了日</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilter('dateTo', e.target.value || null)}
              className="rounded border p-2"
            />
          </div>
        </div>

        {/* 日付タイプ */}
        <div>
          <label className="block font-bold">日付タイプ</label>
          <div className="flex gap-4">
            {DATE_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dateType"
                  checked={filters.dateType === type}
                  onChange={() => setFilter('dateType', type)}
                />
                {type === 'CREATED_DATE' ? '作成日' : '更新日'}
              </label>
            ))}
          </div>
        </div>

        {/* ステータス（複数選択） */}
        <div>
          <label className="block font-bold">ステータス</label>
          <div className="flex gap-4">
            {STATUSES.map((status) => (
              <label key={status} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.statuses.includes(status)}
                  onChange={() => toggleArrayItem('statuses', status)}
                />
                {status}
              </label>
            ))}
          </div>
        </div>

        {/* カテゴリ（複数選択） */}
        <div>
          <label className="block font-bold">カテゴリ</label>
          <div className="flex gap-4">
            {CATEGORIES.map((category) => (
              <label key={category} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => toggleArrayItem('categories', category)}
                />
                {category}
              </label>
            ))}
          </div>
        </div>

        {/* クリアボタン */}
        <button
          onClick={clearFilters}
          className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          フィルターをクリア
        </button>
      </div>

      {/* 現在のURL状態を表示（デバッグ用） */}
      <div className="rounded-lg bg-gray-100 p-4">
        <h2 className="font-bold">現在のフィルター状態（URLに同期）</h2>
        <pre className="mt-2 overflow-auto rounded bg-white p-2 text-sm">
          {JSON.stringify(filters, null, 2)}
        </pre>
        <p className="mt-2 text-sm text-gray-600">
          ※ このURLを共有すると、同じフィルター状態でページを開けます
        </p>
      </div>

      {/* API パラメータ確認（デバッグ用） */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h2 className="font-bold">API呼び出しパラメータ</h2>
        <pre className="mt-2 overflow-auto rounded bg-white p-2 text-sm">
          {JSON.stringify(toApiParams(), null, 2)}
        </pre>
      </div>

      {/* ページネーション例 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(Math.max(1, filters.page - 1))}
          disabled={filters.page <= 1}
          className="rounded border px-3 py-1 disabled:opacity-50"
        >
          前へ
        </button>
        <span>ページ {filters.page}</span>
        <button
          onClick={() => setPage(filters.page + 1)}
          className="rounded border px-3 py-1"
        >
          次へ
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// 5. URL例
// =============================================================================

/**
 * 生成されるURL例:
 *
 * /reports?keyword=test&dateFrom=2024-01-01&dateTo=2024-01-31&dateType=CREATED_DATE&statuses=PENDING&statuses=APPROVED&categories=TYPE_A&page=1&pageSize=50
 *
 * このURLを他の人に共有すると、同じフィルター状態でページを開ける
 */
