import { httpClient } from '@/shared/api/httpClient'
import type { AuthUser, UserRole } from '../model/user'

type UserResponse = {
  id: string
  email: string
  name: string
  role: string
}

type AuthResponse = {
  token: string
  user: UserResponse
}

/**
 * UserResponse → AuthUser。
 *
 * 項目名も構造も同じなので、本来なら Mapper は不要。
 * それでも関数を1つ挟んでいるのは、role だけは事情が違うため。
 * サーバーからは string で届くが、フロントでは 'USER' | 'ADMIN' として扱いたい。
 * 「信用できない文字列を、閉じた型に変える」場所がここ。
 *
 * 逆に entities/category には Mapper を作っていない（構造が同じで、変換すべき理由が無いため）。
 * 「Mapper を作る/作らない」の判断基準を、この2つを見比べて考えてほしい。
 */
function toAuthUser(response: UserResponse): AuthUser {
  const role: UserRole = response.role === 'ADMIN' ? 'ADMIN' : 'USER'
  return { id: response.id, email: response.email, name: response.name, role }
}

export type SignInInput = {
  email: string
  password: string
}

export type SignUpInput = SignInInput & {
  name: string
}

export type SignInResult = {
  token: string
  user: AuthUser
}

export async function signIn(input: SignInInput): Promise<SignInResult> {
  const { data } = await httpClient.post<AuthResponse>('/auth/sign-in', input)
  return { token: data.token, user: toAuthUser(data.user) }
}

export async function signUp(input: SignUpInput): Promise<SignInResult> {
  const { data } = await httpClient.post<AuthResponse>('/auth/sign-up', input)
  return { token: data.token, user: toAuthUser(data.user) }
}

export async function signOut(): Promise<void> {
  await httpClient.post('/auth/sign-out')
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await httpClient.get<UserResponse>('/auth/me')
  return toAuthUser(data)
}
