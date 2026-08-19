/**
 * 画面のパスを1箇所にまとめる。
 *
 * `<Link to="/products">` のような文字列リテラルが散らばると、
 * パスを変えたときに壊れた箇所をコンパイラが教えてくれない。
 * 関数にしているのは、パラメータ付きのパスを型で守るため。
 */
export const routes = {
  signIn: '/sign-in',
  signUp: '/sign-up',
  products: '/products',
  productDetail: (productId: string) => `/products/${productId}`,
  cart: '/cart',
  admin: {
    products: '/admin/products',
    productNew: '/admin/products/new',
    productEdit: (productId: string) => `/admin/products/${productId}/edit`,
  },
} as const
