"use client";

import { useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsBoolean,
  parseAsStringLiteral,
  parseAsArrayOf,
} from "nuqs";
import { z, type ZodObject, type ZodRawShape, type ZodTypeAny } from "zod";

// =============================================================================
// 型定義
// =============================================================================

type ParserConfig =
  | ReturnType<typeof parseAsString>
  | ReturnType<typeof parseAsInteger>
  | ReturnType<typeof parseAsBoolean>
  | ReturnType<typeof parseAsStringLiteral>
  | ReturnType<typeof parseAsArrayOf>;

// =============================================================================
// Zodスキーマからnuqsパーサーを生成
// =============================================================================

/**
 * Zodの型からnuqsのパーサーを生成
 */
function zodToNuqsParser(zodType: ZodTypeAny): ParserConfig {
  const typeName = zodType._def.typeName;

  // Optional/Nullableの場合は内部の型を取得
  if (typeName === "ZodOptional" || typeName === "ZodNullable") {
    return zodToNuqsParser(zodType._def.innerType);
  }

  // Default値がある場合
  if (typeName === "ZodDefault") {
    return zodToNuqsParser(zodType._def.innerType);
  }

  switch (typeName) {
    case "ZodString":
      return parseAsString;

    case "ZodNumber":
      return parseAsInteger;

    case "ZodBoolean":
      return parseAsBoolean;

    case "ZodEnum": {
      const options = zodType._def.values as readonly string[];
      return parseAsStringLiteral(options);
    }

    case "ZodArray": {
      const elementType = zodType._def.type;
      const elementTypeName = elementType._def.typeName;

      if (elementTypeName === "ZodEnum") {
        const options = elementType._def.values as readonly string[];
        return parseAsArrayOf(parseAsStringLiteral(options)).withDefault([]);
      }
      // 文字列配列の場合
      return parseAsArrayOf(parseAsString).withDefault([]);
    }

    default:
      // フォールバック: 文字列として扱う
      return parseAsString;
  }
}

/**
 * Zodオブジェクトスキーマからnuqsのパーサーオブジェクトを生成
 */
function createParsersFromZodSchema<T extends ZodRawShape>(
  schema: ZodObject<T>
): Record<string, ParserConfig> {
  const shape = schema.shape;
  const parsers: Record<string, ParserConfig> = {};

  for (const [key, zodType] of Object.entries(shape)) {
    parsers[key] = zodToNuqsParser(zodType as ZodTypeAny);
  }

  return parsers;
}

// =============================================================================
// useSearchForm フック
// =============================================================================

type UseSearchFormOptions<T> = {
  defaultValues: T;
};

/**
 * Zodスキーマを使ってnuqsとreact-hook-formを統合するフック
 *
 * @param schema - Zodオブジェクトスキーマ
 * @param options - オプション（defaultValues必須）
 *
 * @example
 * const { form, search, clearFilters } = useSearchForm(formSchema, {
 *   defaultValues: { keyword: "", status: "ACTIVE" },
 * });
 */
export function useSearchForm<T extends ZodRawShape>(
  schema: ZodObject<T>,
  options: UseSearchFormOptions<z.infer<ZodObject<T>>>
) {
  type FormValues = z.infer<ZodObject<T>>;
  const { defaultValues } = options;

  // Zodスキーマからnuqsパーサーを生成
  const parsers = createParsersFromZodSchema(schema);

  // nuqsでURL状態を管理
  const [urlState, setUrlState] = useQueryStates(parsers);

  // URLの値とデフォルト値をマージして初期値を作成
  const initialValues = Object.keys(defaultValues).reduce(
    (acc, key) => {
      const urlValue = urlState[key];
      const defaultValue = (defaultValues as Record<string, unknown>)[key];

      if (Array.isArray(defaultValue)) {
        // 配列の場合: URLの配列が空でなければ使用
        acc[key] =
          (urlValue as unknown[])?.length > 0 ? urlValue : defaultValue;
      } else {
        // スカラーの場合: URLの値がnullでなければ使用
        acc[key] = urlValue ?? defaultValue;
      }
      return acc;
    },
    {} as Record<string, unknown>
  ) as FormValues;

  // react-hook-formを初期化（zodResolverでバリデーション）
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues as DefaultValues<FormValues>,
  });

  // 検索実行: フォームの値をURLに反映
  const search = form.handleSubmit((data) => {
    const urlParams = Object.keys(data as Record<string, unknown>).reduce(
      (acc, key) => {
        const value = (data as Record<string, unknown>)[key];
        // 空文字列はnullに変換（URLから削除）
        acc[key] = value === "" ? null : value;
        return acc;
      },
      {} as Record<string, unknown>
    );
    setUrlState(urlParams);
  });

  // フィルターをクリア
  const clearFilters = () => {
    form.reset(defaultValues as DefaultValues<FormValues>);
    const urlParams = Object.keys(defaultValues as Record<string, unknown>).reduce(
      (acc, key) => {
        const value = (defaultValues as Record<string, unknown>)[key];
        acc[key] = value === "" ? null : value;
        return acc;
      },
      {} as Record<string, unknown>
    );
    setUrlState(urlParams);
  };

  return {
    form,
    search,
    clearFilters,
    /** 現在のURL状態（読み取り専用） */
    urlState,
  };
}
