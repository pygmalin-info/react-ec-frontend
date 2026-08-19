import { HttpResponse } from 'msw'
import { db, type MockUser } from './db'

/** docs/API_DESIGN.md で定義したエラーレスポンスの形 */
export function errorResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors?: { field: string; message: string }[],
) {
  return HttpResponse.json(
    fieldErrors ? { code, message, fieldErrors } : { code, message },
    { status },
  )
}

export function unauthorized() {
  return errorResponse(401, 'UNAUTHORIZED', '認証情報が無効です。再度ログインしてください。')
}

export function forbidden() {
  return errorResponse(403, 'FORBIDDEN', 'この操作を行う権限がありません。')
}

export function notFound() {
  return errorResponse(404, 'NOT_FOUND', '対象が見つかりませんでした。')
}

export function validationError(fieldErrors: { field: string; message: string }[]) {
  return errorResponse(400, 'VALIDATION_ERROR', '入力内容を確認してください。', fieldErrors)
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  if (header === null || !header.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length)
}

/** 認証済みユーザーを取り出す。取り出せない場合は undefined */
export function currentUser(request: Request): MockUser | undefined {
  return db.findUserByToken(bearerToken(request))
}

export function currentToken(request: Request): string | null {
  return bearerToken(request)
}
