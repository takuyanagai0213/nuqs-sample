"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import {
  type ReportFormValues,
  DEVICES,
  REFERENCE_DATE_TYPES,
  toDateRange,
  fromDateRange,
} from "./form-schema";

// =============================================================================
// 型定義
// =============================================================================

type SelectOption = {
  label: string;
  value: string;
};

type ReportFormProps = {
  form: UseFormReturn<ReportFormValues>;
  onSubmit: () => void;
  onClear: () => void;
  programOptions: SelectOption[];
  mediaPropertyOptions: SelectOption[];
};

// =============================================================================
// コンポーネント
// =============================================================================

/**
 * レポートフォーム
 *
 * 実際のプロジェクトでは:
 * - @onetag/ui の Form, FormField, Calendar, Checkbox 等を使用
 * - SearchSelectField でプログラム/サイトを選択
 * - Popover + Calendar で日付範囲を選択
 *
 * このサンプルでは標準HTMLで代替
 */
export const ReportForm = ({
  form,
  onSubmit,
  onClear,
  programOptions,
  mediaPropertyOptions,
}: ReportFormProps) => {
  const { control, watch, setValue } = form;

  // 日付範囲の表示用
  const dateFrom = watch("dateFrom");
  const dateTo = watch("dateTo");
  const dateRange = toDateRange(dateFrom, dateTo);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* プログラム・サイト選択 */}
      <div className="flex flex-wrap gap-4">
        <Controller
          name="programId"
          control={control}
          render={({ field }) => (
            <div className="w-72">
              <label className="mb-1 block text-sm font-bold">
                プロモーション
              </label>
              <select
                {...field}
                className="w-full rounded border border-gray-300 p-2"
              >
                <option value="">全てのプロモーション</option>
                {programOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        />

        <Controller
          name="mediaPropertyId"
          control={control}
          render={({ field }) => (
            <div className="w-72">
              <label className="mb-1 block text-sm font-bold">サイト</label>
              <select
                {...field}
                className="w-full rounded border border-gray-300 p-2"
              >
                <option value="">全てのサイト</option>
                {mediaPropertyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        />
      </div>

      {/* 日付範囲・基準日 */}
      <div className="flex flex-wrap items-end gap-4">
        {/* 日付範囲 */}
        <div className="w-72">
          <label className="mb-1 block text-sm font-bold">期間</label>
          <div className="flex items-center gap-2 rounded border border-gray-300 bg-white p-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setValue("dateFrom", e.target.value)}
              className="flex-1 border-none outline-none"
            />
            <span className="text-gray-400">〜</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setValue("dateTo", e.target.value)}
              className="flex-1 border-none outline-none"
            />
          </div>
          {/* 実際のプロジェクトでは Popover + Calendar を使用 */}
          <p className="mt-1 text-xs text-gray-500">
            現在: {format(dateRange.from, "yyyy/MM/dd")}
            {dateRange.to && ` - ${format(dateRange.to, "yyyy/MM/dd")}`}
          </p>
        </div>

        {/* 基準日 */}
        <Controller
          name="referenceDateType"
          control={control}
          render={({ field }) => (
            <div>
              <label className="mb-1 block text-sm font-bold">基準日</label>
              <div className="flex gap-4">
                {REFERENCE_DATE_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`flex cursor-pointer items-center gap-2 rounded border p-2 ${
                      field.value === type
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value={type}
                      checked={field.value === type}
                      onChange={() => field.onChange(type)}
                      className="sr-only"
                    />
                    {type === "CONVERSION_DATE" ? "成果発生日" : "成果承認日"}
                  </label>
                ))}
              </div>
            </div>
          )}
        />
      </div>

      {/* デバイス・検索ボタン */}
      <div className="flex flex-wrap items-end gap-4">
        {/* デバイス */}
        <Controller
          name="devices"
          control={control}
          render={({ field }) => (
            <div>
              <label className="mb-1 block text-sm font-bold">デバイス</label>
              <div className="flex gap-4 rounded bg-gray-100 p-2">
                {DEVICES.map((device) => (
                  <label
                    key={device}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={field.value.includes(device)}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? [...field.value, device]
                          : field.value.filter((d) => d !== device);
                        field.onChange(newValue);
                      }}
                      className="h-4 w-4"
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
            className="rounded bg-blue-500 px-6 py-2 font-bold text-white hover:bg-blue-600"
          >
            検索
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            クリア
          </button>
        </div>
      </div>
    </form>
  );
};
