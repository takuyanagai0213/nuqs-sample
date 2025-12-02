"use client";

/**
 * useZodUrlForm 使用例
 *
 * Zodスキーマ1つで:
 * - react-hook-formの型とバリデーション
 * - nuqsのURLパラメータ管理
 * を両方カバー
 *
 * ポイント:
 * - 日付はフラット化（dateFrom, dateTo）してISO文字列で管理
 * - Calendarなど Date型を期待するUIには渡すときだけ変換
 */

import { z } from "zod";
import { Controller } from "react-hook-form";
import { startOfMonth } from "date-fns";
import { useSearchForm } from "../hooks/useSearchForm";

// =============================================================================
// 1. Zodスキーマ定義（URLに適したフラットな構造）
// =============================================================================

const DEVICES = ["DESKTOP", "MOBILE"] as const;
const REFERENCE_DATE_TYPES = ["CONVERSION_DATE", "APPROVAL_DATE"] as const;

/**
 * URL同期用のスキーマ
 * - 日付はフラット化（date.from → dateFrom）
 * - Date型ではなくstring型（ISO文字列）
 */
export const reportFormSchema = z.object({
  // セレクトボックス（"ALL"は空文字列として扱う）
  programId: z.string().optional(),
  mediaPropertyId: z.string().optional(),

  // 日付（フラット化してISO文字列で管理）
  dateFrom: z.string(),
  dateTo: z.string(),

  // Enum配列（複数選択）
  devices: z.array(z.enum(DEVICES)),

  // Enum（単一選択）
  referenceDateType: z.enum(REFERENCE_DATE_TYPES),
});

// 型は自動推論
export type ReportFormValues = z.infer<typeof reportFormSchema>;

// =============================================================================
// 2. デフォルト値
// =============================================================================

const toDateString = (date: Date): string => {
  return date.toISOString().split("T")[0]!;
};

const getDefaultValues = (): ReportFormValues => ({
  programId: "",
  mediaPropertyId: "",
  dateFrom: toDateString(startOfMonth(new Date())),
  dateTo: toDateString(new Date()),
  devices: [...DEVICES],
  referenceDateType: "CONVERSION_DATE",
});

// =============================================================================
// 3. 使用例コンポーネント
// =============================================================================

/**
 * 実際のプロジェクトに近い形のレポートフォーム
 *
 * ポイント:
 * - 日付はstring型で管理（URLと同じ）
 * - Calendarコンポーネントに渡すときだけDate型に変換
 */
export const ReportPageWithZodForm = () => {
  const { form, search, clearFilters } = useSearchForm(reportFormSchema, {
    defaultValues: getDefaultValues(),
  });
  const { control, watch, setValue } = form;

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">
        レポートフォーム（Zod + react-hook-form + nuqs）
      </h1>

      <form onSubmit={search} className="space-y-4 rounded-lg border p-4">
        {/* プログラムID（実際はセレクトボックス） */}
        <Controller
          name="programId"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block font-bold">プロモーション</label>
              <select {...field} className="w-64 rounded border p-2">
                <option value="">全てのプロモーション</option>
                <option value="PRG-001">プログラム1</option>
                <option value="PRG-002">プログラム2</option>
              </select>
            </div>
          )}
        />

        {/* メディアプロパティID */}
        <Controller
          name="mediaPropertyId"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block font-bold">サイト</label>
              <select {...field} className="w-64 rounded border p-2">
                <option value="">全てのサイト</option>
                <option value="SITE-001">サイト1</option>
                <option value="SITE-002">サイト2</option>
              </select>
            </div>
          )}
        />

        {/* 日付範囲 */}
        <div>
          <label className="block font-bold">期間</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={watch("dateFrom")}
              onChange={(e) => setValue("dateFrom", e.target.value)}
              className="rounded border p-2"
            />
            <span>〜</span>
            <input
              type="date"
              value={watch("dateTo")}
              onChange={(e) => setValue("dateTo", e.target.value)}
              className="rounded border p-2"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            ※ Calendarコンポーネントを使う場合は new Date(watch(&quot;dateFrom&quot;)) で変換
          </p>
        </div>

        {/* 基準日（単一選択） */}
        <Controller
          name="referenceDateType"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block font-bold">基準日</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="CONVERSION_DATE"
                    checked={field.value === "CONVERSION_DATE"}
                    onChange={() => field.onChange("CONVERSION_DATE")}
                  />
                  成果発生日
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="APPROVAL_DATE"
                    checked={field.value === "APPROVAL_DATE"}
                    onChange={() => field.onChange("APPROVAL_DATE")}
                  />
                  成果承認日
                </label>
              </div>
            </div>
          )}
        />

        {/* デバイス（複数選択） */}
        <Controller
          name="devices"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block font-bold">デバイス</label>
              <div className="flex gap-4">
                {DEVICES.map((device) => (
                  <label key={device} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.value.includes(device)}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? [...field.value, device]
                          : field.value.filter((d) => d !== device);
                        field.onChange(newValue);
                      }}
                    />
                    {device === "DESKTOP" ? "PC" : "Mobile"}
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
        <h2 className="font-bold">フォーム状態 / URL パラメータ</h2>
        <pre className="mt-2 overflow-auto rounded bg-white p-2 text-sm">
          {JSON.stringify(watch(), null, 2)}
        </pre>
        <p className="mt-2 text-sm text-gray-600">
          検索ボタンを押すとURLが更新されます。URLをコピーして共有できます。
        </p>
      </div>
    </div>
  );
};
