import { z } from 'zod'
import { userFields } from '@/entities/user'

/**
 * ログインフォームの検証ルール。
 *
 * ■ email は entity の制約をそのまま使う
 *   「メールアドレスの形式」は、ログインでも新規登録でも同じ。
 *
 * ■ password だけ entity の制約を使わない
 *   userFields.password は「8文字以上」という新規登録時の強度ルール。
 *   ログイン画面で同じルールを課すと、ルールを変更する前に登録した既存ユーザーが
 *   「パスワードは8文字以上で入力してください」と言われてログインできなくなる。
 *   ログイン時に確認したいのは「入力されているか」だけ。正しさの判定はサーバーの仕事。
 *
 *   → 同じ項目でも、操作（feature）が違えば必要な検証は違う。
 *     だから schema は feature 側にあり、項目の制約だけが entity 側にある。
 */
export const signInSchema = z.object({
  email: userFields.email,
  password: z.string().min(1, 'パスワードは必須です'),
})

export type SignInFormValues = z.infer<typeof signInSchema>
