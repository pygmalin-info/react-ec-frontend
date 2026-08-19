import { Link, useLocation } from 'react-router-dom'
import { SignInForm } from '@/features/sign-in'
import { routes } from '@/shared/config/routes'

/**
 * ログイン画面（PDF Q2）。
 *
 * ■ このページに書かれていないこと
 *   バリデーション、API 呼び出し、トークンの保存、エラー表示、ログイン後の遷移。
 *   すべて features/sign-in が持っている。
 *   ページを読んで分かるのは「この画面はログインフォームでできている」という構成だけ。
 *   それがページの責務。
 */
export function SignInPage() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  return (
    <>
      <h1>ログイン</h1>

      <SignInForm redirectTo={from} />

      <p>
        アカウントをお持ちでない場合は <Link to={routes.signUp}>会員登録</Link>
      </p>

      <p className="status-text">
        動作確認用: user@example.com / admin@example.com（パスワードはどちらも Password1）
      </p>
    </>
  )
}
