import { z } from 'zod'

/**
 * ユーザーの入力項目に対する制約。
 *
 * ■ なぜ features/sign-in ではなく entities/user にあるのか
 *   sign-in と sign-up の両方が email と password を扱う。
 *   どちらかの feature に置くと、もう一方が feature をまたいで import することになる。
 *
 * ■ 一方で、schema そのものは feature 側にある
 *   sign-in は { email, password }、sign-up は { email, password, name } と、
 *   「どの項目を集めるか」は操作ごとに違うから。
 *   項目の制約は entity、項目の組み合わせは feature、という分け方をしている。
 *   （商品側は書き込む項目が新規登録と編集で同じだったので、組み合わせまで entity に置いてある。
 *     entities/product/model/productFields.ts と読み比べると違いが分かる）
 */
export const userFields = {
  email: z
    .string()
    .trim()
    .min(1, 'メールアドレスは必須です')
    .email('メールアドレスの形式が正しくありません'),

  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(64, 'パスワードは64文字以内で入力してください'),

  name: z.string().trim().min(1, 'お名前は必須です').max(50, 'お名前は50文字以内で入力してください'),
}
