import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { routes } from '@/shared/config/routes'
import { applyServerFieldErrors } from '@/shared/lib/applyServerFieldErrors'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'
import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/fields'
import { signUpSchema, type SignUpFormValues } from '../model/signUpSchema'
import { useSignUp } from '../api/useSignUp'

export function SignUpForm() {
  const navigate = useNavigate()
  const signUpMutation = useSignUp()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const onSubmit = handleSubmit((values) => {
    signUpMutation.mutate(values, {
      onSuccess: () => navigate(routes.products, { replace: true }),
      // メールアドレス重複（409）は fieldErrors 付きで返ってくるので、email 欄に表示される。
      // フロントのバリデーションでは絶対に検出できないエラーの例。
      onError: (error) => applyServerFieldErrors(setError, error),
    })
  })

  const formError =
    signUpMutation.error && Object.keys(signUpMutation.error.fieldErrors).length === 0
      ? signUpMutation.error
      : null

  return (
    <form onSubmit={onSubmit} noValidate>
      {formError ? <ApiErrorMessage error={formError} /> : null}

      <TextField label="お名前" autoComplete="name" error={errors.name?.message} {...register('name')} />

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
        autoComplete="new-password"
        hint="8文字以上"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="form-actions">
        <Button type="submit" isLoading={signUpMutation.isPending}>
          登録する
        </Button>
      </div>
    </form>
  )
}
