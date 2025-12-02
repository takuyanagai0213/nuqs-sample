import { z } from "zod";
import { startOfMonth } from "date-fns";

// =============================================================================
// 定数
// =============================================================================

export const DEVICES = ["DESKTOP", "MOBILE"] as const;
export const REFERENCE_DATE_TYPES = ["CONVERSION_DATE", "APPROVAL_DATE"] as const;

// =============================================================================
// Zodスキーマ（URL同期用 - フラットな構造）
// =============================================================================

/**
 * レポートフォームのスキーマ
 *
 * ポイント:
 * - 日付はフラット化（date.from → dateFrom）
 * - Date型ではなくstring型（ISO文字列）
 * - transformは使わない（URL同期のため）
 */
export const reportFormSchema = z.object({
  // セレクトボックス
  programId: z.string().optional(),
  mediaPropertyId: z.string().optional(),

  // 日付（ISO文字列: "2024-01-01"）
  dateFrom: z.string(),
  dateTo: z.string(),

  // デバイス（複数選択）
  devices: z.array(z.enum(DEVICES)),

  // 基準日（単一選択）
  referenceDateType: z.enum(REFERENCE_DATE_TYPES),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;

// =============================================================================
// デフォルト値
// =============================================================================

const toDateString = (date: Date): string => {
  return date.toISOString().split("T")[0]!;
};

export const getDefaultValues = (): ReportFormValues => ({
  programId: "",
  mediaPropertyId: "",
  dateFrom: toDateString(startOfMonth(new Date())),
  dateTo: toDateString(new Date()),
  devices: [...DEVICES],
  referenceDateType: "CONVERSION_DATE",
});

// =============================================================================
// ヘルパー関数（Date変換用）
// =============================================================================

/**
 * フォームの日付文字列をDateオブジェクトに変換
 * Calendarコンポーネントに渡す際に使用
 */
export const toDateRange = (
  dateFrom: string,
  dateTo: string
): { from: Date; to: Date | undefined } => ({
  from: new Date(dateFrom),
  to: dateTo ? new Date(dateTo) : undefined,
});

/**
 * DateRangeをフォームの日付文字列に変換
 * CalendarのonSelectで使用
 */
export const fromDateRange = (
  range: { from?: Date; to?: Date } | undefined
): { dateFrom: string; dateTo: string } => ({
  dateFrom: range?.from ? toDateString(range.from) : "",
  dateTo: range?.to ? toDateString(range.to) : "",
});
