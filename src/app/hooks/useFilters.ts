'use client'

import {
  useQueryStates,
  parseAsString,
  parseAsArrayOf,
  parseAsStringLiteral,
  parseAsInteger,
  parseAsBoolean,
} from 'nuqs'

// パーサータイプの定義
type ParserType =
  | { type: 'string' }
  | { type: 'integer' }
  | { type: 'boolean' }
  | { type: 'stringLiteral'; options: readonly string[] }
  | { type: 'stringArray' }
  | { type: 'stringLiteralArray'; options: readonly string[] }

// スキーマ定義の型
export type FilterSchema = Record<string, ParserType>

// スキーマからパーサーを生成（型をanyで回避）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createParser(config: ParserType): any {
  switch (config.type) {
    case 'string':
      return parseAsString
    case 'integer':
      return parseAsInteger
    case 'boolean':
      return parseAsBoolean
    case 'stringLiteral':
      return parseAsStringLiteral(config.options as readonly string[])
    case 'stringArray':
      return parseAsArrayOf(parseAsString).withDefault([])
    case 'stringLiteralArray':
      return parseAsArrayOf(
        parseAsStringLiteral(config.options as readonly string[])
      ).withDefault([])
    default:
      return parseAsString
  }
}

// スキーマから値の型を推論
type InferValue<T extends ParserType> = T extends { type: 'string' }
  ? string | null
  : T extends { type: 'integer' }
    ? number | null
    : T extends { type: 'boolean' }
      ? boolean | null
      : T extends { type: 'stringLiteral'; options: readonly (infer U)[] }
        ? U | null
        : T extends { type: 'stringArray' }
          ? string[]
          : T extends { type: 'stringLiteralArray'; options: readonly (infer U)[] }
            ? U[]
            : never

// スキーマから全体の状態型を推論
export type InferState<S extends FilterSchema> = {
  [K in keyof S]: InferValue<S[K]>
}

// フック戻り値の型
type UseFiltersReturn<S extends FilterSchema> = {
  filters: InferState<S>
  setFilter: <K extends keyof S>(key: K, value: InferValue<S[K]>) => void
  setFilters: (values: Partial<InferState<S>>) => void
  toggleArrayItem: <K extends keyof S>(
    key: K,
    item: S[K] extends { type: 'stringArray' | 'stringLiteralArray' }
      ? InferValue<S[K]> extends (infer U)[]
        ? U
        : never
      : never
  ) => void
  clearFilters: () => void
  clearFilter: <K extends keyof S>(key: K) => void
}

/**
 * 汎用フィルターフック
 * スキーマを定義するだけでURLクエリパラメータと同期したフィルター状態を管理
 *
 * @example
 * const schema = {
 *   search: { type: 'string' },
 *   page: { type: 'integer' },
 *   statuses: { type: 'stringLiteralArray', options: ['PENDING', 'APPROVED'] as const },
 * } as const satisfies FilterSchema
 *
 * const { filters, setFilter, toggleArrayItem, clearFilters } = useFilters(schema)
 */
export function useFilters<S extends FilterSchema>(
  schema: S
): UseFiltersReturn<S> {
  // スキーマからパーサーオブジェクトを生成
  const parsers = Object.fromEntries(
    Object.entries(schema).map(([key, config]) => [key, createParser(config)])
  )

  const [state, setState] = useQueryStates(parsers)

  // 単一のフィルターを設定
  const setFilter = <K extends keyof S>(key: K, value: InferValue<S[K]>) => {
    setState({ [key]: value } as Partial<typeof state>)
  }

  // 複数のフィルターを一括設定
  const setFilters = (values: Partial<InferState<S>>) => {
    setState(values as Partial<typeof state>)
  }

  // 配列フィルターのトグル
  const toggleArrayItem = <K extends keyof S>(key: K, item: unknown) => {
    const currentValue = state[key as string]
    if (!Array.isArray(currentValue)) return

    const newValue = currentValue.includes(item)
      ? currentValue.filter((v) => v !== item)
      : [...currentValue, item]

    setState({ [key]: newValue } as Partial<typeof state>)
  }

  // 全フィルターをクリア
  const clearFilters = () => {
    const cleared = Object.fromEntries(
      Object.entries(schema).map(([key, config]) => [
        key,
        config.type === 'stringArray' || config.type === 'stringLiteralArray'
          ? []
          : null,
      ])
    ) as typeof state
    setState(cleared)
  }

  // 単一フィルターをクリア
  const clearFilter = <K extends keyof S>(key: K) => {
    const config = schema[key]
    const defaultValue =
      config.type === 'stringArray' || config.type === 'stringLiteralArray'
        ? []
        : null
    setState({ [key]: defaultValue } as Partial<typeof state>)
  }

  return {
    filters: state as InferState<S>,
    setFilter,
    setFilters,
    toggleArrayItem,
    clearFilters,
    clearFilter,
  }
}
