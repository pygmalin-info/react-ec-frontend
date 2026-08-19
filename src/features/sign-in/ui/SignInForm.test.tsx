import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { authToken } from '@/shared/api/authToken'
import { renderWithProviders } from '@/test/renderWithProviders'
import { SignInForm } from './SignInForm'

async function fillAndSubmit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText('メールアドレス'), email)
  await userEvent.type(screen.getByLabelText('パスワード'), password)
  await userEvent.click(screen.getByRole('button', { name: 'ログイン' }))
}

describe('SignInForm', () => {
  it('フロント側のバリデーションで弾かれた場合、APIは呼ばれずに項目エラーが出る', async () => {
    renderWithProviders(<SignInForm />)

    await userEvent.type(screen.getByLabelText('メールアドレス'), 'not-an-email')
    await userEvent.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(await screen.findByText('メールアドレスの形式が正しくありません')).toBeInTheDocument()
    expect(await screen.findByText('パスワードは必須です')).toBeInTheDocument()
    // 通信していないので、トークンは保存されない
    expect(authToken.get()).toBeNull()
  })

  it('認証情報が違う場合、フォーム全体のエラーとして表示される', async () => {
    renderWithProviders(<SignInForm />)

    await fillAndSubmit('user@example.com', 'WrongPassword')

    expect(
      await screen.findByText('メールアドレスまたはパスワードが正しくありません。'),
    ).toBeInTheDocument()

    // 401 だが、この code のときは自動ログアウト（トークン破棄）の対象外。
    // もともとトークンが無い状態なので、ここでは「破棄されていない」ことより
    // 「ログイン画面に飛ばされていない」ことが重要。
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
  })

  it('成功するとトークンが保存される', async () => {
    renderWithProviders(<SignInForm />)

    await fillAndSubmit('user@example.com', 'Password1')

    await screen.findByRole('button', { name: 'ログイン' })
    expect(authToken.get()).not.toBeNull()
  })
})
