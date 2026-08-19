import { http, HttpResponse } from 'msw'
import { env } from '@/shared/config/env'
import { db } from '../db'
import { currentToken, currentUser, errorResponse, unauthorized, validationError } from '../respond'

const base = env.apiBaseUrl

function toUserResponse(user: { id: string; email: string; name: string; role: string }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

export const authHandlers = [
  http.post(`${base}/auth/sign-up`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string; name?: string }

    const fieldErrors: { field: string; message: string }[] = []
    if (!body.email) fieldErrors.push({ field: 'email', message: 'メールアドレスは必須です' })
    if (!body.password) fieldErrors.push({ field: 'password', message: 'パスワードは必須です' })
    if (!body.name) fieldErrors.push({ field: 'name', message: 'お名前は必須です' })
    if (fieldErrors.length > 0) return validationError(fieldErrors)

    if (db.findUserByEmail(body.email as string)) {
      // 409 + fieldErrors。フォームの該当項目にそのまま出せるようにしている
      return errorResponse(409, 'DUPLICATE_EMAIL', 'このメールアドレスは既に登録されています。', [
        { field: 'email', message: 'このメールアドレスは既に登録されています' },
      ])
    }

    const user = db.createUser({
      email: body.email as string,
      password: body.password as string,
      name: body.name as string,
    })
    return HttpResponse.json({ token: db.createSession(user.id), user: toUserResponse(user) }, { status: 201 })
  }),

  http.post(`${base}/auth/sign-in`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string }

    const fieldErrors: { field: string; message: string }[] = []
    if (!body.email) fieldErrors.push({ field: 'email', message: 'メールアドレスは必須です' })
    if (!body.password) fieldErrors.push({ field: 'password', message: 'パスワードは必須です' })
    if (fieldErrors.length > 0) return validationError(fieldErrors)

    const user = db.findUserByEmail(body.email as string)
    if (user === undefined || user.password !== body.password) {
      // 401 だが、これはトークンが無効なのではなく「認証情報が違う」。
      // フロント側の interceptor は、この code のときだけ自動ログアウトを行わない。
      return errorResponse(401, 'INVALID_CREDENTIALS', 'メールアドレスまたはパスワードが正しくありません。')
    }

    return HttpResponse.json({ token: db.createSession(user.id), user: toUserResponse(user) })
  }),

  http.post(`${base}/auth/sign-out`, ({ request }) => {
    const token = currentToken(request)
    if (token === null || currentUser(request) === undefined) return unauthorized()

    db.deleteSession(token)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${base}/auth/me`, ({ request }) => {
    const user = currentUser(request)
    if (user === undefined) return unauthorized()

    return HttpResponse.json(toUserResponse(user))
  }),
]
