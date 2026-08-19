/**
 * entities/product の公開API。
 *
 * 外から使ってよいものだけをここに並べる。
 * 逆に、ここに無いもの（例: toRequestBody）は entity の内部事情であり、
 * 外から呼ばれることを想定していない。
 */
export type { Product, ProductId } from './model/product'
export { toProductId } from './model/product'

export { productFields, productWritableSchema } from './model/productFields'
export type { ProductFormValues, ProductInput } from './model/productFields'

export { isPurchasable } from './lib/isPurchasable'
export { toProductFormValues } from './lib/toProductFormValues'

export {
  createProduct,
  deleteProduct,
  fetchProduct,
  fetchProducts,
  toProduct,
  updateProduct,
} from './api/productApi'
export type { ProductListParams, ProductResponse } from './api/productApi'

export { productKeys, useProduct, useProducts } from './api/productQueries'

export { ProductCard } from './ui/ProductCard'
export { ProductFormFields } from './ui/ProductFormFields'
