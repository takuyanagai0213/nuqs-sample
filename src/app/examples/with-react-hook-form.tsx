"use client";

/**
 * useUrlForm - nuqs + react-hook-form 汎用統合フック
 *
 * シンプルなアプローチ:
 * - URLの状態をreact-hook-formの初期値として使用
 * - 検索ボタン押下時にURLを更新
 */

import { useForm, Controller, type DefaultValues } from "react-hook-form";
import {
  useFilters,
  type FilterSchema,
  type InferState,
} from "../hooks/useFilters";

// =============================================================================
// 1. 汎用 useUrlForm フック
// =============================================================================

/**
 * フォームの値をURL用の値に変換する型
 * - 空文字列 → null
 * - その他 → そのまま
 */
type ToUrlValue<T> = T extends string ? T | null : T;
type ToUrlParams<T> = { [K in keyof T]: ToUrlValue<T[K]> };

/**
 * nuqsとreact-hook-formを統合する汎用フック
 *
 * @param schema - nuqsのフィルタースキーマ
 * @param defaultValues - フォームのデフォルト値（URLに値がない場合に使用）
 *
 * @example
 * const { form, search, clearFilters } = useUrlForm(
 *   { keyword: { type: "string" }, status: { type: "stringLiteral", options: STATUSES } },
 *   { keyword: "", status: "PENDING" }
 * );
 */
export const useUrlForm = <
  S extends FilterSchema,
  T extends Record<string, unknown>,
>(
  schema: S,
  defaultValues: T & DefaultValues<T>
) => {
  const { filters, setFilters } = useFilters(schema);

  // URLの値とデフォルト値をマージして初期値を作成
  const initialValues = Object.keys(defaultValues).reduce(
    (acc, key) => {
      const urlValue = filters[key];
      const defaultValue = defaultValues[key];

      // URLに値があればそれを使用、なければデフォルト値
      if (Array.isArray(defaultValue)) {
        // 配列の場合: URLの配列が空でなければ使用
        acc[key] = (urlValue as unknown[])?.length > 0 ? urlValue : defaultValue;
      } else {
        // スカラーの場合: URLの値がnullでなければ使用
        acc[key] = urlValue ?? defaultValue;
      }
      return acc;
    },
    {} as Record<string, unknown>
  ) as T;

  const form = useForm<T>({ defaultValues: initialValues as DefaultValues<T> });

  // 検索実行: フォームの値をURLに反映
  const search = form.handleSubmit((data) => {
    const urlParams = Object.keys(data).reduce(
      (acc, key) => {
        const value = data[key];
        // 空文字列はnullに変換（URLから削除）
        acc[key] = value === "" ? null : value;
        return acc;
      },
      {} as Record<string, unknown>
    );
    setFilters(urlParams as Partial<InferState<S>>);
  });

  // フィルターをクリア
  const clearFilters = () => {
    form.reset(defaultValues);
    const urlParams = Object.keys(defaultValues).reduce(
      (acc, key) => {
        const value = defaultValues[key];
        acc[key] = value === "" ? null : value;
        return acc;
      },
      {} as Record<string, unknown>
    );
    setFilters(urlParams as Partial<InferState<S>>);
  };

  return { form, search, clearFilters, filters };
};

// =============================================================================
// 2. 使用例: 検索フォーム
// =============================================================================

export const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export const CATEGORIES = ["TYPE_A", "TYPE_B"] as const;
export const DATE_TYPES = ["CREATED_DATE", "UPDATED_DATE"] as const;

type Status = (typeof STATUSES)[number];
type Category = (typeof CATEGORIES)[number];
type DateType = (typeof DATE_TYPES)[number];

// フィルタースキーマ
const searchFilterSchema = {
  keyword: { type: "string" },
  dateFrom: { type: "string" },
  dateTo: { type: "string" },
  dateType: { type: "stringLiteral", options: DATE_TYPES },
  statuses: { type: "stringLiteralArray", options: STATUSES },
  categories: { type: "stringLiteralArray", options: CATEGORIES },
} as const satisfies FilterSchema;

// フォームの型
interface SearchFormValues {
  keyword: string;
  dateFrom: string;
  dateTo: string;
  dateType: DateType;
  statuses: Status[];
  categories: Category[];
}

// デフォルト値
const getDefaultValues = (): SearchFormValues => ({
  keyword: "",
  dateFrom: getDefaultDateFrom(),
  dateTo: getDefaultDateTo(),
  dateType: "CREATED_DATE",
  statuses: [...STATUSES],
  categories: [...CATEGORIES],
});

// ヘルパー関数
const getDefaultDateFrom = (): string => {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().split("T")[0]!;
};

const getDefaultDateTo = (): string => {
  return new Date().toISOString().split("T")[0]!;
};

/**
 * useUrlFormを使った検索フォーム用フック
 */
export const useSearchForm = () => {
  return useUrlForm(searchFilterSchema, getDefaultValues());
};

// =============================================================================
// 3. 使用例コンポーネント
// =============================================================================

/**
 * useUrlFormを使った検索フォームの実装例
 */
export const SearchPageWithForm = () => {
  const { form, search, clearFilters } = useSearchForm();
  const { control, watch } = form;

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">
        検索フォーム（react-hook-form + URL同期）
      </h1>

      <form onSubmit={search} className="space-y-4 rounded-lg border p-4">
        {/* キーワード検索 */}
        <Controller
          name="keyword"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block font-bold">キーワード</label>
              <input
                type="text"
                {...field}
                placeholder="検索キーワード"
                className="w-64 rounded border p-2"
              />
            </div>
          )}
        />

        {/* 日付範囲 */}
        <div className="flex gap-4">
          <Controller
            name="dateFrom"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block font-bold">開始日</label>
                <input type="date" {...field} className="rounded border p-2" />
              </div>
            )}
          />
          <Controller
            name="dateTo"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block font-bold">終了日</label>
                <input type="date" {...field} className="rounded border p-2" />
              </div>
            )}
          />
        </div>

        {/* 日付タイプ - ラジオボタン */}
        <Controller
          name="dateType"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block font-bold">日付タイプ</label>
              <div className="flex gap-4">
                {DATE_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="radio"
                      value={type}
                      checked={field.value === type}
                      onChange={() => field.onChange(type)}
                    />
                    {type === "CREATED_DATE" ? "作成日" : "更新日"}
                  </label>
                ))}
              </div>
            </div>
          )}
        />

        {/* ステータス - チェックボックス */}
        <Controller
          name="statuses"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block font-bold">ステータス</label>
              <div className="flex gap-4">
                {STATUSES.map((status) => (
                  <label key={status} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.value.includes(status)}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? [...field.value, status]
                          : field.value.filter((s) => s !== status);
                        field.onChange(newValue);
                      }}
                    />
                    {status}
                  </label>
                ))}
              </div>
            </div>
          )}
        />

        {/* カテゴリ - チェックボックス */}
        <Controller
          name="categories"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block font-bold">カテゴリ</label>
              <div className="flex gap-4">
                {CATEGORIES.map((category) => (
                  <label key={category} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.value.includes(category)}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? [...field.value, category]
                          : field.value.filter((c) => c !== category);
                        field.onChange(newValue);
                      }}
                    />
                    {category}
                  </label>
                ))}
              </div>
            </div>
          )}
        />

        {/* ボタン */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            検索
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
          >
            クリア
          </button>
        </div>
      </form>

      {/* 現在の状態表示 */}
      <div className="rounded-lg bg-gray-100 p-4">
        <h2 className="font-bold">現在のフォーム状態</h2>
        <pre className="mt-2 overflow-auto rounded bg-white p-2 text-sm">
          {JSON.stringify(watch(), null, 2)}
        </pre>
        <p className="mt-2 text-sm text-gray-600">
          ※ 検索ボタンを押すとURLが更新され、共有可能になります
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// 4. 使い方ドキュメント
// =============================================================================

/**
 * useUrlFormの使い方
 *
 * 1. スキーマとデフォルト値を定義:
 * ```tsx
 * const schema = {
 *   keyword: { type: "string" },
 *   status: { type: "stringLiteral", options: ["ACTIVE", "INACTIVE"] },
 * } as const satisfies FilterSchema;
 *
 * const defaultValues = { keyword: "", status: "ACTIVE" };
 * ```
 *
 * 2. useUrlFormを使用:
 * ```tsx
 * const { form, search, clearFilters } = useUrlForm(schema, defaultValues);
 * ```
 *
 * 3. フォームを実装:
 * ```tsx
 * <form onSubmit={search}>
 *   <Controller
 *     name="keyword"
 *     control={form.control}
 *     render={({ field }) => <Input {...field} />}
 *   />
 *   <button type="submit">検索</button>
 *   <button type="button" onClick={clearFilters}>クリア</button>
 * </form>
 * ```
 *
 * 特徴:
 * - スキーマとデフォルト値を渡すだけで使える
 * - フォームの型は自動推論される
 * - 空文字列は自動的にURLから削除される
 * - URLを共有すれば同じ条件で検索可能
 */
