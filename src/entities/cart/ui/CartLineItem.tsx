import { Link } from 'react-router-dom'
import { routes } from '@/shared/config/routes'
import { formatYen } from '@/shared/lib/format'
import type { CartLine } from '../model/cart'
import { calcLineSubtotal } from '../lib/calcCartTotal'

type CartLineItemProps = {
  line: CartLine
  /** 数量変更や削除の操作を差し込む口。操作そのものは features が持つ */
  actions?: React.ReactNode
}

export function CartLineItem({ line, actions }: CartLineItemProps) {
  return (
    <li className="cart-line">
      <img className="cart-line__image" src={line.product.imageUrl} alt="" />
      <div>
        <Link to={routes.productDetail(line.product.id)}>{line.product.name}</Link>
        <p className="product-card__meta">
          {formatYen(line.product.price)} × {line.quantity} 点
        </p>
        <p className="product-card__price">{formatYen(calcLineSubtotal(line))}</p>
      </div>
      <div>{actions}</div>
    </li>
  )
}
