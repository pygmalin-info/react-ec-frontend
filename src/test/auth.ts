import { authToken } from '@/shared/api/authToken'
import { db } from '@/mocks/db'

/**
 * テスト用にログイン状態を作る。
 *
 * ログインフォームを操作する代わりに、モックバックエンドで直接セッションを作って
 * トークンを保存する。検証したいのがログイン処理そのものでない場合は、こちらのほうが速く、
 * テストの意図（何を検証しているか）もはっきりする。
 */
export function signInAsUser(userId = 'u_01') {
  authToken.set(db.createSession(userId))
}

export function signInAsAdmin() {
  signInAsUser('u_02')
}
