import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { routes } from '@/shared/config/routes'
import { applyServerFieldErrors } from '@/shared/lib/applyServerFieldErrors'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'
import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/fields'
import { signInSchema, type SignInFormValues } from '../model/signInSchema'
import { useSignIn } from '../api/useSignIn'

type SignInFormProps = {
  /** ログイン後に戻る先。指定が無ければ商品一覧へ */
  redirectTo?: string | undefined
}

/**
 * ログインフォーム（PDF Q2）。
 *
 * このコンポーネントが持っている責務:
 *   - 入力UI
 *   - フォームの状態（React Hook Form が管理）
 *   - フロント側バリデーション（Zod schema を resolver 経由で適用）
 *   - 送信と、サーバーエラーの画面への反映
 *
 * 持っていない責務:
 *   - 通信そのもの（entities/user/api）
 *   - トークンの保存（useSignIn の onSuccess）
 *   - エラーの分類（shared/api/apiError）
 */
export function SignInForm({ redirectTo }: SignInFormProps) {
  const navigate = useNavigate()
  const signInMutation = useSignIn()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit((values) => {
    signInMutation.mutate(values, {
      onSuccess: () => {
        // ログイン成功後の遷移は「ログインする」という操作の一部なので feature が持つ。
        // replace: true にしているのは、戻るボタンでログイン画面に戻らせないため。
        navigate(redirectTo ?? routes.products, { replace: true })
      },
      onError: (error) => {
        // 400 で項目別エラーが返ってきた場合は、各入力欄の下に表示する
        applyServerFieldErrors(setError, error)
      },
    })
  })

  // 項目に紐付かないエラー（401 INVALID_CREDENTIALS、通信エラー、500 など）はフォーム全体に出す
  const formError =
    signInMutation.error && Object.keys(signInMutation.error.fieldErrors).length === 0
      ? signInMutation.error
      : null

  return (
    <form onSubmit={onSubmit} noValidate>
      {formError ? <ApiErrorMessage error={formError} /> : null}

      <TextField
        label="メールアドレス"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <TextField
        label="パスワード"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="form-actions">
        <Button type="submit" isLoading={signInMutation.isPending}>
          ログイン
        </Button>
      </div>
    </form>
  )
}
