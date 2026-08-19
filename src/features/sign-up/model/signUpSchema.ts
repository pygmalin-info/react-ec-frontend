import { z } from 'zod'
import { userFields } from '@/entities/user'

/**
 * 会員登録フォームの検証ルール。
 *
 * features/sign-in/model/signInSchema.ts と読み比べてほしい。
 * 同じ email / password を扱っているのに、集める項目も password のルールも違う。
 * 「項目の制約は entity、項目の組み合わせと操作固有のルールは feature」という分け方の理由がここにある。
 */
export const signUpSchema = z.object({
  name: userFields.name,
  email: userFields.email,
  // 新規登録では強度ルール（8文字以上）を適用する
  password: userFields.password,
})

export type SignUpFormValues = z.infer<typeof signUpSchema>
