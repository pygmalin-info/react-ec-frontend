import { Link } from 'react-router-dom'
import { routes } from '@/shared/config/routes'

export function NotFoundPage() {
  return (
    <>
      <h1>ページが見つかりません</h1>
      <p>
        <Link to={routes.products}>商品一覧へ戻る</Link>
      </p>
    </>
  )
}
