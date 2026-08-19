import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ApiError } from '@/shared/api/apiError'

/**
 * サーバーが返した項目別エラーを、React Hook Form のエラーに流し込む。
 *
 * ■ なぜフロントで検証しているのにこの処理が必要なのか
 *   フロントのバリデーションは「早く気付かせるため」、
 *   サーバーのバリデーションは「最後の砦」。目的が違うので、両方ある。
 *   そしてフロントを通ってもサーバーが弾くケースは必ず存在する（例: メールアドレスの重複）。
 *
 * @returns 1件でもフォームの項目に結び付けられたら true。
 *          false のときは項目に紐付かないエラーなので、呼び出し側でフォーム全体のメッセージとして出す。
 */
export function applyServerFieldErrors<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  error: ApiError,
): boolean {
  const entries = Object.entries(error.fieldErrors)
  if (entries.length === 0) return false

  for (const [field, message] of entries) {
    setError(field as Path<TFieldValues>, { type: 'server', message })
  }
  return true
}
