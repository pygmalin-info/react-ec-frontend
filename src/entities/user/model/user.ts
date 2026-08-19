/**
 * 権限。
 *
 * string のままにすると `role === 'admin'`（小文字）のような書き間違いに気付けない。
 * 閉じた union にしておけば、比較する値が違った時点でコンパイルエラーになる。
 */
export type UserRole = 'USER' | 'ADMIN'

/**
 * ログイン中のユーザー。
 *
 * ■ この型が localStorage に保存されない理由
 *   保存すると「トークンは有効なのに、保存されたユーザー情報が古い」という状態が作れてしまう。
 *   （権限が変わった、退会した、など）
 *   保持するのはトークンだけにして、ユーザー情報は毎回サーバーに聞く。
 */
export type AuthUser = {
  id: string
  email: string
  name: string
  role: UserRole
}

export function isAdmin(user: AuthUser): boolean {
  return user.role === 'ADMIN'
}
