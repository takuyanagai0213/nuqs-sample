"use client";

/**
 * useFilters + react-hook-form 統合サンプル
 *
 * 既存のreact-hook-formベースのUIコンポーネントをそのまま使いつつ、
 * フィルター状態をURLに同期する実装例
 */

import { useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useFilters, type FilterSchema } from "../hooks/useFilters";

// =============================================================================
// 1. 型定義
// =============================================================================

export const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export const CATEGORIES = ["TYPE_A", "TYPE_B"] as const;
export const DATE_TYPES = ["CREATED_DATE", "UPDATED_DATE"] as const;

type Status = (typeof STATUSES)[number];
type Category = (typeof CATEGORIES)[number];
type DateType = (typeof DATE_TYPES)[number];

// react-hook-form用のフォーム型
interface SearchFormValues {
  keyword: string;
  dateFrom: string;
  dateTo: string;
  dateType: DateType;
  statuses: Status[];
  categories: Category[];
}

// =============================================================================
// 2. フィルタースキーマ定義
// =============================================================================

const searchFilterSchema = {
  keyword: { type: "string" },
  dateFrom: { type: "string" },
  dateTo: { type: "string" },
  dateType: { type: "stringLiteral", options: DATE_TYPES },
  statuses: { type: "stringLiteralArray", options: STATUSES },
  categories: { type: "stringLiteralArray", options: CATEGORIES },
} as const satisfies FilterSchema;

// =============================================================================
// 3. useFilters + react-hook-form 統合フック
// =============================================================================

/**
 * nuqsとreact-hook-formを統合するカスタムフック
 *
 * - URLの状態をreact-hook-formの初期値として使用
 * - フォームの変更をURLに同期（個別フィールドのonChangeで更新）
 * - 既存のFormField, FormControlコンポーネントがそのまま使える
 *
 * ※ useWatchは全フィールドを監視するため負荷が高い
 *   代わりに個別のonChangeハンドラーでURLを更新する
 */
export const useSearchForm = () => {
  // 1. nuqsでURL状態を管理
  const { filters, setFilter } = useFilters(searchFilterSchema);
  const { keyword, dateFrom, dateTo, dateType, statuses, categories } = filters;

  // 2. デフォルト値を計算（URL未設定時のフォールバック）
  const defaultValues = useMemo<SearchFormValues>(
    () => ({
      keyword: keyword ?? "",
      dateFrom: dateFrom ?? getDefaultDateFrom(),
      dateTo: dateTo ?? getDefaultDateTo(),
      dateType: dateType ?? "CREATED_DATE",
      statuses: statuses.length > 0 ? statuses : [...STATUSES],
      categories: categories.length > 0 ? categories : [...CATEGORIES],
    }),
    // 初期レンダリング時のみ使用するため、依存配列は空
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // 3. react-hook-formを初期化（URLからの値を初期値として使用）
  const form = useForm<SearchFormValues>({
    defaultValues,
  });

  // 4. URLからフォームを再同期（ブラウザの戻る/進むボタン対応）
  useEffect(() => {
    const handlePopState = () => {
      form.reset({
        keyword: keyword ?? "",
        dateFrom: dateFrom ?? getDefaultDateFrom(),
        dateTo: dateTo ?? getDefaultDateTo(),
        dateType: dateType ?? "CREATED_DATE",
        statuses: statuses.length > 0 ? statuses : [...STATUSES],
        categories: categories.length > 0 ? categories : [...CATEGORIES],
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [keyword, dateFrom, dateTo, dateType, statuses, categories, form]);

  // 5. フィールドごとのURL同期ハンドラー
  const updateKeyword = useCallback(
    (value: string) => {
      setFilter("keyword", value || null);
    },
    [setFilter],
  );

  const updateDateFrom = useCallback(
    (value: string) => {
      setFilter("dateFrom", value || null);
    },
    [setFilter],
  );

  const updateDateTo = useCallback(
    (value: string) => {
      setFilter("dateTo", value || null);
    },
    [setFilter],
  );

  const updateDateType = useCallback(
    (value: DateType) => {
      setFilter("dateType", value);
    },
    [setFilter],
  );

  const updateStatuses = useCallback(
    (value: Status[]) => {
      setFilter("statuses", value);
    },
    [setFilter],
  );

  const updateCategories = useCallback(
    (value: Category[]) => {
      setFilter("categories", value);
    },
    [setFilter],
  );

  // 6. フィルターをクリア
  const clearFilters = useCallback(() => {
    const resetValues: SearchFormValues = {
      keyword: "",
      dateFrom: getDefaultDateFrom(),
      dateTo: getDefaultDateTo(),
      dateType: "CREATED_DATE",
      statuses: [...STATUSES],
      categories: [...CATEGORIES],
    };
    form.reset(resetValues);

    // URLもクリア
    setFilter("keyword", null);
    setFilter("dateFrom", resetValues.dateFrom);
    setFilter("dateTo", resetValues.dateTo);
    setFilter("dateType", "CREATED_DATE");
    setFilter("statuses", [...STATUSES]);
    setFilter("categories", [...CATEGORIES]);
  }, [form, setFilter]);

  return {
    form,
    control: form.control,
    // 個別のURL更新関数
    updateKeyword,
    updateDateFrom,
    updateDateTo,
    updateDateType,
    updateStatuses,
    updateCategories,
    clearFilters,
  };
};

// ヘルパー関数
const getDefaultDateFrom = (): string => {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().split("T")[0]!;
};

const getDefaultDateTo = (): string => {
  return new Date().toISOString().split("T")[0]!;
};

// =============================================================================
// 4. 使用例
// =============================================================================

/**
 * react-hook-form + URL同期の実装例
 *
 * 既存のフォームコンポーネントを少し修正するだけで、
 * URL同期機能を追加できる
 */
export const SearchPageWithForm = () => {
  const {
    form,
    updateKeyword,
    updateDateFrom,
    updateDateTo,
    updateDateType,
    updateStatuses,
    updateCategories,
    clearFilters,
  } = useSearchForm();

  // チェックボックスのトグル処理
  const toggleStatus = (status: Status, checked: boolean) => {
    const current = form.getValues("statuses");
    const newValues = checked
      ? [...current, status]
      : current.filter((s) => s !== status);
    form.setValue("statuses", newValues);
    updateStatuses(newValues);
  };

  const toggleCategory = (category: Category, checked: boolean) => {
    const current = form.getValues("categories");
    const newValues = checked
      ? [...current, category]
      : current.filter((c) => c !== category);
    form.setValue("categories", newValues);
    updateCategories(newValues);
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">
        検索フォーム（react-hook-form + URL同期）
      </h1>

      <form className="space-y-4 rounded-lg border p-4">
        {/* キーワード検索 */}
        <div>
          <label className="block font-bold">キーワード</label>
          <input
            type="text"
            value={form.watch("keyword")}
            onChange={(e) => {
              form.setValue("keyword", e.target.value);
              updateKeyword(e.target.value);
            }}
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
              value={form.watch("dateFrom")}
              onChange={(e) => {
                form.setValue("dateFrom", e.target.value);
                updateDateFrom(e.target.value);
              }}
              className="rounded border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">終了日</label>
            <input
              type="date"
              value={form.watch("dateTo")}
              onChange={(e) => {
                form.setValue("dateTo", e.target.value);
                updateDateTo(e.target.value);
              }}
              className="rounded border p-2"
            />
          </div>
        </div>

        {/* 日付タイプ - ラジオボタン */}
        <div>
          <label className="block font-bold">日付タイプ</label>
          <div className="flex gap-4">
            {DATE_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="radio"
                  value={type}
                  checked={form.watch("dateType") === type}
                  onChange={() => {
                    form.setValue("dateType", type);
                    updateDateType(type);
                  }}
                />
                {type === "CREATED_DATE" ? "作成日" : "更新日"}
              </label>
            ))}
          </div>
        </div>

        {/* ステータス - チェックボックス */}
        <div>
          <label className="block font-bold">ステータス</label>
          <div className="flex gap-4">
            {STATUSES.map((status) => (
              <label key={status} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.watch("statuses").includes(status)}
                  onChange={(e) => toggleStatus(status, e.target.checked)}
                />
                {status}
              </label>
            ))}
          </div>
        </div>

        {/* カテゴリ - チェックボックス */}
        <div>
          <label className="block font-bold">カテゴリ</label>
          <div className="flex gap-4">
            {CATEGORIES.map((category) => (
              <label key={category} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.watch("categories").includes(category)}
                  onChange={(e) => toggleCategory(category, e.target.checked)}
                />
                {category}
              </label>
            ))}
          </div>
        </div>

        {/* クリアボタン */}
        <button
          type="button"
          onClick={clearFilters}
          className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          フィルターをクリア
        </button>
      </form>

      {/* 現在の状態表示 */}
      <div className="rounded-lg bg-gray-100 p-4">
        <h2 className="font-bold">現在のフォーム状態（URLに同期）</h2>
        <pre className="mt-2 overflow-auto rounded bg-white p-2 text-sm">
          {JSON.stringify(form.watch(), null, 2)}
        </pre>
        <p className="mt-2 text-sm text-gray-600">
          ※ フォームを変更すると即座にURLが更新されます
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// 5. 既存フォームとの統合例
// =============================================================================

/**
 * 既存のreact-hook-formを使ったフォームにURL同期を追加する場合
 *
 * Before:
 * ```tsx
 * const form = useForm<FormSchema>({
 *   defaultValues: initialValues,
 * })
 * ```
 *
 * After:
 * ```tsx
 * const { form, control, updateXxx } = useSearchForm()
 * // 既存のFormField, FormControlはcontrolをそのまま渡せばOK
 * // onChangeでupdateXxxを呼び出してURLを更新
 * ```
 *
 * 変更点:
 * 1. useForm → useSearchForm に置き換え
 * 2. 各フィールドのonChangeでURL更新関数を呼び出し
 * 3. 残りのUIコードはそのまま使える
 */
