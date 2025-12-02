"use client";

/**
 * レポートページ - useSearchForm 使用例
 *
 * 実際のプロジェクトを想定した構造:
 * - form-schema.ts: Zodスキーマとデフォルト値
 * - report-form.tsx: フォームUI（Presentational）
 * - page.tsx: useSearchFormでURL同期（Container）
 */

import { useSearchForm } from "../../hooks/useSearchForm";
import { reportFormSchema, getDefaultValues } from "./form-schema";
import { ReportForm } from "./report-form";

// サンプル用のオプションデータ
const programOptions = [
  { label: "プログラムA", value: "PRG-001" },
  { label: "プログラムB", value: "PRG-002" },
  { label: "プログラムC", value: "PRG-003" },
];

const mediaPropertyOptions = [
  { label: "サイトA", value: "SITE-001" },
  { label: "サイトB", value: "SITE-002" },
];

export default function ReportPage() {
  // useSearchForm でフォームとURL同期を統合
  const { form, search, clearFilters } = useSearchForm(reportFormSchema, {
    defaultValues: getDefaultValues(),
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">
          レポート（useSearchForm 使用例）
        </h1>

        {/* フォーム */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <ReportForm
            form={form}
            onSubmit={search}
            onClear={clearFilters}
            programOptions={programOptions}
            mediaPropertyOptions={mediaPropertyOptions}
          />
        </div>

        {/* 現在の状態表示 */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 font-bold">フォーム状態 / URLパラメータ</h2>
          <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
            {JSON.stringify(form.watch(), null, 2)}
          </pre>
          <p className="mt-4 text-sm text-gray-600">
            検索ボタンを押すとURLが更新されます。URLをコピーして共有できます。
          </p>
        </div>

        {/* 使い方説明 */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 font-bold text-blue-800">使い方</h3>
          <ol className="list-inside list-decimal space-y-1 text-sm text-blue-700">
            <li>フォームで条件を設定</li>
            <li>検索ボタンを押すとURLが更新される</li>
            <li>URLをコピーして他の人に共有</li>
            <li>共有されたURLを開くと同じ条件で表示される</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
