import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  ProductFormFields,
  productWritableSchema,
  type ProductFormValues,
  type ProductInput,
} from '@/entities/product'
import { useCategories } from '@/entities/category'
import { routes } from '@/shared/config/routes'
import { applyServerFieldErrors } from '@/shared/lib/applyServerFieldErrors'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'
import { Button } from '@/shared/ui/Button'
import { useCreateProduct } from '../api/useCreateProduct'

/**
 * 商品新規登録フォーム（PDF Q12）。
 *
 * ■ useForm の型引数が3つある理由
 *   useForm<入力の型, コンテキスト, 変換後の型>
 *   価格や在庫は <input> から string で入ってくるが、
 *   Zod の transform を通ったあとは number になる。
 *   handleSubmit のコールバックが受け取るのは変換後（ProductInput）。
 *   「フォームの型」と「送信する型」が別物であることが、型として表れている。
 */
export function ProductCreateForm() {
  const navigate = useNavigate()
  const createProductMutation = useCreateProduct()
  const categoriesQuery = useCategories()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProductFormValues, unknown, ProductInput>({
    resolver: zodResolver(productWritableSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      stock: '',
      categoryId: '',
      isPublished: true,
    },
  })

  const onSubmit = handleSubmit((input) => {
    createProductMutation.mutate(input, {
      onSuccess: () => navigate(routes.admin.products),
      onError: (error) => applyServerFieldErrors(setError, error),
    })
  })

  const formError =
    createProductMutation.error && Object.keys(createProductMutation.error.fieldErrors).length === 0
      ? createProductMutation.error
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
        <Button type="submit" isLoading={createProductMutation.isPending}>
          登録する
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate(routes.admin.products)}>
          キャンセル
        </Button>
      </div>
    </form>
  )
}
