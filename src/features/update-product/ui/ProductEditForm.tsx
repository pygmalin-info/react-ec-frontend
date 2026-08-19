import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  ProductFormFields,
  productWritableSchema,
  toProductFormValues,
  type Product,
  type ProductFormValues,
  type ProductInput,
} from '@/entities/product'
import { useCategories } from '@/entities/category'
import { routes } from '@/shared/config/routes'
import { applyServerFieldErrors } from '@/shared/lib/applyServerFieldErrors'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'
import { Button } from '@/shared/ui/Button'
import { useUpdateProduct } from '../api/useUpdateProduct'

type ProductEditFormProps = {
  /**
   * 編集対象。
   *
   * ■ なぜこのコンポーネント自身が useProduct で取得しないのか
   *   取得すると「読み込み中」「見つからない」の分岐がフォームの中に入り込み、
   *   フォームの責務がぼやける。
   *   取得はページが行い、取得できた Product だけをここに渡す。
   *   結果としてこのコンポーネントは「必ず商品がある」前提で書ける。
   */
  product: Product
}

export function ProductEditForm({ product }: ProductEditFormProps) {
  const navigate = useNavigate()
  const updateProductMutation = useUpdateProduct(product.id)
  const categoriesQuery = useCategories()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProductFormValues, unknown, ProductInput>({
    resolver: zodResolver(productWritableSchema),
    // サーバーから来た Product をフォームの型（すべて string）に変換して初期値にする
    defaultValues: toProductFormValues(product),
  })

  const onSubmit = handleSubmit((input) => {
    updateProductMutation.mutate(input, {
      onSuccess: () => navigate(routes.admin.products),
      onError: (error) => applyServerFieldErrors(setError, error),
    })
  })

  const formError =
    updateProductMutation.error && Object.keys(updateProductMutation.error.fieldErrors).length === 0
      ? updateProductMutation.error
      : null

  return (
    <form onSubmit={onSubmit} noValidate>
      {formError ? <ApiErrorMessage error={formError} /> : null}

      <ProductFormFields
        register={register}
        errors={errors}
        categoryOptions={(categoriesQuery.data ?? []).map((category) => ({
          value: category.id,
          label: category.name,
        }))}
      />

      <div className="form-actions">
        <Button type="submit" isLoading={updateProductMutation.isPending}>
          更新する
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate(routes.admin.products)}>
          キャンセル
        </Button>
      </div>
    </form>
  )
}
