import axios, { AxiosError } from 'axios'
import { env } from '@/shared/config/env'
import { authToken } from './authToken'
import { ApiError, normalizeApiError } from './apiError'

/**
 * アプリで唯一の axios インスタンス。
 *
 * ■ なぜ axios を import できるのをこのファイルだけに制限しているのか（eslint.config.js 参照）
 *   axios をどこからでも呼べると、
 *     - トークンの付け忘れ
 *     - エラー処理の書き方が画面ごとにバラバラ
 *     - ベースURLの指定漏れ
 *   が起きる。この3つを「1箇所で必ず通る道」に集約するのが interceptor の役割。
 */
export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

/* ---------------------------------------------------------------------------
 * リクエスト時：トークンを載せる
 * ------------------------------------------------------------------------- */
httpClient.interceptors.request.use((config) => {
  const token = authToken.get()
  if (token !== null) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/* ---------------------------------------------------------------------------
 * レスポンス時：エラーを ApiError に統一する
 *
 * ここを通ったあと、アプリ側が受け取るエラーは必ず ApiError になる。
 * 「この catch に来る error は何型なのか？」を各画面で考えなくてよくなる。
 * ------------------------------------------------------------------------- */
httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)

    // 401 を受けたらトークンを捨てる。
    //
    // ただし「メールアドレスかパスワードが違う」だけは例外。
    // ログインしていない人のトークンを消しても意味がなく、
    // 画面に「認証情報が正しくありません」と出したいだけだから。
    if (apiError.kind === 'unauthorized' && apiError.code !== 'INVALID_CREDENTIALS') {
      authToken.clear()
      // ここでは画面遷移もキャッシュ破棄も行わない。
      // トークンが消えたことは app/providers/AuthSessionProvider が購読していて、
      // そちらが Query キャッシュの破棄を、RequireAuth が画面遷移を担当する。
      // 「React の外」で React の処理をやり始めると、途端に追跡できなくなる。
    }

    return Promise.reject(apiError)
  },
)

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (error instanceof AxiosError) {
    // response が無い = サーバーに届かなかった（オフライン・タイムアウト・CORS）
    const response = error.response
    return normalizeApiError(response ? { status: response.status, body: response.data } : null)
  }

  return new ApiError({
    kind: 'unexpected',
    message: error instanceof Error ? error.message : '予期しないエラーが発生しました。',
  })
}
