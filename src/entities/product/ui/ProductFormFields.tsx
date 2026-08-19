import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { SelectField, TextAreaField, TextField } from '@/shared/ui/fields'
import type { ProductFormValues } from '../model/productFields'

type ProductFormFieldsProps = {
  register: UseFormRegister<ProductFormValues>
  errors: FieldErrors<ProductFormValues>
  /**
   * 選択肢は「値とラベル」の形で受け取る。
   *
   * ■ なぜ Category 型で受け取らないのか
   *   受け取ってしまうと entities/product が entities/category を知ることになる。
   *   このコンポーネントに必要なのは「選択肢のリスト」だけで、
   *   それがカテゴリなのかどうかは本当はどうでもよい。必要な分だけ受け取る。
   */
  categoryOptions: { value: string; label: string }[]
}

/**
 * 商品フォームの入力項目。
 *
 * ■ なぜ features ではなく entities/product/ui にあるのか
 *   新規登録（features/create-product）と編集（features/update-product）で
 *   まったく同じ入力項目を使う。どちらかの feature に置くと、
 *   もう一方が feature をまたいで import することになる。
 *   「商品の入力項目の見た目」は商品というドメインの知識なので entity に置く。
 *
 * ■ このコンポーネントが持っていないもの
 *   送信処理、mutation、成功時の遷移。これらは feature の責務。
 *   ここは「見た目」と「React Hook Form への接続」だけを担当する。
 */
export function ProductFormFields({ register, errors, categoryOptions }: ProductFormFieldsProps) {
  return (
    <>
      <TextField label="商品名" error={errors.name?.message} {...register('name')} />

      <TextAreaField label="説明" rows={4} error={errors.description?.message} {...register('description')} />

      <TextField
        label="価格（税込・円）"
        inputMode="numeric"
        hint="0以上の整数で入力してください"
        error={errors.price?.message}
        {...register('price')}
      />

      <TextField label="在庫数" inputMode="numeric" error={errors.stock?.message} {...register('stock')} />

      <SelectField label="カテゴリ" error={errors.categoryId?.message} {...register('categoryId')}>
        <option value="">選択してください</option>
        {categoryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      {/* 画像はこの教材の対象外。アップロードを入れると本題（設計）から離れるため、
          モックバックエンド側で既定の画像を割り当てている。 */}

      <label className="field">
        <span className="field__label">
          <input type="checkbox" {...register('isPublished')} /> 公開する
        </span>
      </label>
    </>
  )
}
