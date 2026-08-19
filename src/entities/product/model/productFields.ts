import { z } from 'zod'

/**
 * 「商品として正しい値とは何か」を定義する。
 *
 * ■ なぜ features ではなく entities にあるのか
 *   「商品名は100文字以内」は、新規登録フォームの都合ではなく商品というドメインの制約。
 *   features/create-product に置くと、features/update-product が
 *   同じ制約を使うために feature をまたいで import することになり、依存ルールに違反する。
 *   「2つの feature が同じものを欲しがったら、それは entity の知識だった」の実例。
 */

const priceMax = 10_000_000

/**
 * 入力は string（<input> は必ず文字列を返す）、出力は number。
 *
 * ■ ここが Form Input 型と API Request 型を分けている場所
 *   z.input<> がフォームの型、z.output<> が送信用の型になる。
 *   「同じ値なのに型が違う」ことを、変換関数ではなく schema 自体で表現している。
 *   別途 Mapper を書かずに済むので、意味のない Mapper が増えない。
 */
const integerStringField = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label}は必須です`)
    .regex(/^\d+$/, `${label}は0以上の整数で入力してください`)
    .transform(Number)
    .refine((value) => value <= max, `${label}は${max.toLocaleString('ja-JP')}以下で入力してください`)

export const productFields = {
  name: z.string().trim().min(1, '商品名は必須です').max(100, '商品名は100文字以内で入力してください'),
  description: z.string().trim().max(1000, '説明は1000文字以内で入力してください'),
  price: integerStringField('価格', priceMax),
  stock: integerStringField('在庫数', 99_999),
  categoryId: z.string().min(1, 'カテゴリを選択してください'),
  isPublished: z.boolean(),
}

/**
 * 商品の「書き込みできる項目」の集合。
 * 新規登録と編集で書き込める項目が同じなので、schema も1つで足りる。
 * （もし編集ではカテゴリを変更できない、といった差が出たら、そのときに分ければよい）
 */
export const productWritableSchema = z.object(productFields)

/** フォームが扱う型。数値項目は string のまま */
export type ProductFormValues = z.input<typeof productWritableSchema>

/** バリデーション通過後の型。数値項目は number */
export type ProductInput = z.output<typeof productWritableSchema>
