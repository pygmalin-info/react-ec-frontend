import { Link } from 'react-router-dom'
import type { ApiError } from '@/shared/api/apiError'
import { routes } from '@/shared/config/routes'
import { Alert } from './Alert'
import { Button } from './Button'

type ApiErrorMessageProps = {
  error: ApiError
  /** 再試行できる場面（一覧の取得失敗など）でのみ渡す */
  onRetry?: (() => void) | undefined
}

/**
 * エラーの「種類」に応じた出し分けを1箇所に集める。
 *
 * ■ ここが switch になっている理由
 *   ApiErrorKind に新しい種類を足すと、この switch がコンパイルエラーになる。
 *   （最下部の `never` への代入がそれを保証している）
 *   つまり「エラーの種類を増やしたのに画面の対応を忘れる」がコンパイル時に分かる。
 *
 * ■ 出し分けの方針
 *   - やり直せるもの（network）      → 再試行ボタン
 *   - ログインで解決するもの（401）  → ログイン画面への導線
 *   - 解決しないもの（403 / 404）    → 説明のみ
 *   - 入力の問題（validation）       → 本来はフォームの各項目に出す。ここは保険
 */
export function ApiErrorMessage({ error, onRetry }: ApiErrorMessageProps) {
  switch (error.kind) {
    case 'network':
      return (
        <Alert>
          <p>{error.message}</p>
          {onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              再試行
            </Button>
          ) : null}
        </Alert>
      )

    case 'unauthorized':
      return (
        <Alert>
          <p>{error.message}</p>
          <Link to={routes.signIn}>ログイン画面へ</Link>
        </Alert>
      )

    case 'forbidden':
    case 'notFound':
    case 'business':
    case 'validation':
      return <Alert>{error.message}</Alert>

    case 'unexpected':
      return (
        <Alert>
          <p>{error.message}</p>
          {onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              再試行
            </Button>
          ) : null}
        </Alert>
      )

    default: {
      // ApiErrorKind に種類が増えたのに case を書き忘れると、ここでコンパイルエラーになる
      const exhaustiveCheck: never = error.kind
      return <Alert>{String(exhaustiveCheck)}</Alert>
    }
  }
}
