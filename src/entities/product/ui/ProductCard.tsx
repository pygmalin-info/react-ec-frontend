import { Link } from 'react-router-dom'
import { formatYen } from '@/shared/lib/format'
import { routes } from '@/shared/config/routes'
import type { Product } from '../model/product'
import { isPurchasable } from '../lib/isPurchasable'

type ProductCardProps = {
  product: Product
  /**
   * カード内に置きたい操作（カート追加ボタンなど）を差し込む口。
   *
   * ■ なぜ ProductCard が直接カート追加ボタンを持たないのか
   *   持たせると entities/product が features/add-to-cart を知ることになり、依存方向が逆になる。
   *   「商品の見た目」と「商品に対して何ができるか」は別の関心事なので、
   *   後者は使う側（pages / features）が差し込む。
   */
  action?: React.ReactNode
}

/**
 * 商品1件の表示。
 *
 * ■ なぜ ProductName / ProductPrice まで分割していないのか
 *   単独で再利用されることがなく、分けても読む場所が増えるだけだから。
 *   分割の基準は「粒度の小ささ」ではなく「別々に使われるかどうか」。
 */
export function ProductCard({ product, action }: ProductCardProps) {
  return (
    <article className="product-card">
      <img className="product-card__image" src={product.imageUrl} alt="" />
      <h3 className="product-card__name">
        <Link to={routes.productDetail(product.id)}>{product.name}</Link>
      </h3>
      <p className="product-card__meta">{product.category.name}</p>
      <p className="product-card__price">{formatYen(product.price)}</p>
      {isPurchasable(product) ? null : <p className="badge-soldout">在庫切れ</p>}
      {action}
    </article>
  )
}
