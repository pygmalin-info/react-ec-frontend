import { Link } from 'react-router-dom'
import { SignUpForm } from '@/features/sign-up'
import { routes } from '@/shared/config/routes'

export function SignUpPage() {
  return (
    <>
      <h1>会員登録</h1>

      <SignUpForm />

      <p>
        すでにアカウントをお持ちの場合は <Link to={routes.signIn}>ログイン</Link>
      </p>
    </>
  )
}
