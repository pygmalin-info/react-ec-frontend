/**
 * 開発用モックバックエンドの「データベース」。
 *
 * ■ なぜ mocks は shared でも entities でもなく src/mocks なのか
 *   ここには「在庫を超えたら 400 を返す」「同じ商品はカートで数量を加算する」といった
 *   ドメインの知識が入っている。shared の条件（ドメインを知らない）に反する。
 *   かといってフロントの entities でもない。これはバックエンドの代役だから。
 *
 * ■ なぜフロントの型（Product など）を import していないのか
 *   バックエンドはフロントの都合を知らない、という関係を崩さないため。
 *   ここで entities/product の型を使ってしまうと、
 *   「フロントが期待している形」と「サーバーが実際に返す形」が同じものになってしまい、
 *   Mapper が存在する意味がテストで検証できなくなる。
 */

export type MockUser = {
  id: string
  email: string
  password: string
  name: string
  role: 'USER' | 'ADMIN'
}

export type MockProduct = {
  id: string
  name: string
  description: string
  priceInclTax: number
  imagePath: string
  stock: number
  categoryId: string
  isPublished: boolean
  publishedAt: string
  updatedAt: string
}

export type MockCartItem = {
  id: string
  userId: string
  productId: string
  quantity: number
}

export type MockCategory = { id: string; name: string }

const categories: MockCategory[] = [
  { id: 'c_01', name: 'キッチン' },
  { id: 'c_02', name: 'ステーショナリー' },
  { id: 'c_03', name: 'インテリア' },
]

const users: MockUser[] = [
  { id: 'u_01', email: 'user@example.com', password: 'Password1', name: '研修 太郎', role: 'USER' },
  { id: 'u_02', email: 'admin@example.com', password: 'Password1', name: '管理 花子', role: 'ADMIN' },
]

function product(
  id: string,
  name: string,
  priceInclTax: number,
  stock: number,
  categoryId: string,
  description: string,
): MockProduct {
  return {
    id,
    name,
    description,
    priceInclTax,
    // 相対パス。フロント側の Mapper で絶対URLに変換される
    imagePath: `/images/${id}.svg`,
    stock,
    categoryId,
    isPublished: true,
    publishedAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-20T09:30:00.000Z',
  }
}

const products: MockProduct[] = [
  product('p_01', 'ステンレスマグカップ', 1980, 12, 'c_01', '保温・保冷に優れた二重構造のマグカップです。'),
  product('p_02', '木製カッティングボード', 3480, 5, 'c_01', 'オリーブウッドを使用したカッティングボード。'),
  product('p_03', '耐熱ガラスポット', 4200, 0, 'c_01', '直火にかけられる耐熱ガラス製のポットです。'),
  product('p_04', '万年筆（細字）', 6800, 8, 'c_02', '書き味なめらかな細字の万年筆。'),
  product('p_05', 'リングノート A5', 680, 40, 'c_02', '方眼罫のリングノート。開いたまま置けます。'),
  product('p_06', '真鍮のブックマーク', 1200, 25, 'c_02', '使い込むほど味が出る真鍮製のしおり。'),
  product('p_07', 'リネンクッションカバー', 2900, 14, 'c_03', '洗うほど柔らかくなるリネン100%のカバー。'),
  product('p_08', 'アロマディフューザー', 5600, 3, 'c_03', '静音設計の超音波式ディフューザー。'),
]

const cartItems: MockCartItem[] = []

/** token → userId */
const sessions = new Map<string, string>()

let sequence = 100
function nextId(prefix: string): string {
  sequence += 1
  return `${prefix}_${sequence}`
}

export const db = {
  categories,
  users,
  products,
  cartItems,

  findUserByEmail(email: string): MockUser | undefined {
    return users.find((user) => user.email === email)
  },

  createUser(input: { email: string; password: string; name: string }): MockUser {
    const user: MockUser = { id: nextId('u'), role: 'USER', ...input }
    users.push(user)
    return user
  },

  createSession(userId: string): string {
    const token = `mock-token-${nextId('t')}`
    sessions.set(token, userId)
    return token
  },

  deleteSession(token: string): void {
    sessions.delete(token)
  },

  findUserByToken(token: string | null): MockUser | undefined {
    if (token === null) return undefined
    const userId = sessions.get(token)
    if (userId === undefined) return undefined
    return users.find((user) => user.id === userId)
  },

  findProduct(productId: string): MockProduct | undefined {
    return products.find((item) => item.id === productId)
  },

  createProduct(input: Omit<MockProduct, 'id' | 'publishedAt' | 'updatedAt'>): MockProduct {
    const now = new Date('2026-07-31T00:00:00.000Z').toISOString()
    const created: MockProduct = { id: nextId('p'), publishedAt: now, updatedAt: now, ...input }
    products.unshift(created)
    return created
  },

  updateProduct(productId: string, input: Omit<MockProduct, 'id' | 'publishedAt' | 'updatedAt'>): MockProduct | undefined {
    const index = products.findIndex((item) => item.id === productId)
    const current = products[index]
    if (current === undefined) return undefined

    const updated: MockProduct = { ...current, ...input, updatedAt: new Date('2026-07-31T00:00:00.000Z').toISOString() }
    products.splice(index, 1, updated)
    return updated
  },

  deleteProduct(productId: string): boolean {
    const index = products.findIndex((item) => item.id === productId)
    if (index < 0) return false
    products.splice(index, 1)
    return true
  },

  isProductInAnyCart(productId: string): boolean {
    return cartItems.some((item) => item.productId === productId)
  },

  listCartItems(userId: string): MockCartItem[] {
    return cartItems.filter((item) => item.userId === userId)
  },

  findCartItem(userId: string, productId: string): MockCartItem | undefined {
    return cartItems.find((item) => item.userId === userId && item.productId === productId)
  },

  findCartItemById(userId: string, cartItemId: string): MockCartItem | undefined {
    return cartItems.find((item) => item.userId === userId && item.id === cartItemId)
  },

  /**
   * 同じ商品が既にある場合は行を増やさず数量を加算する。
   * ここがサーバー側にあることが、フロントの「カート追加は invalidate するだけ」に繋がっている。
   */
  addCartItem(userId: string, productId: string, quantity: number): MockCartItem {
    const existing = db.findCartItem(userId, productId)
    if (existing) {
      existing.quantity += quantity
      return existing
    }
    const created: MockCartItem = { id: nextId('ci'), userId, productId, quantity }
    cartItems.push(created)
    return created
  },

  updateCartItemQuantity(item: MockCartItem, quantity: number): MockCartItem {
    item.quantity = quantity
    return item
  },

  removeCartItem(cartItemId: string): boolean {
    const index = cartItems.findIndex((item) => item.id === cartItemId)
    if (index < 0) return false
    cartItems.splice(index, 1)
    return true
  },

  /** テストで状態を初期化するために使う */
  reset(): void {
    cartItems.length = 0
    sessions.clear()
    users.length = 0
    users.push(
      { id: 'u_01', email: 'user@example.com', password: 'Password1', name: '研修 太郎', role: 'USER' },
      { id: 'u_02', email: 'admin@example.com', password: 'Password1', name: '管理 花子', role: 'ADMIN' },
    )
    products.length = 0
    products.push(
      product('p_01', 'ステンレスマグカップ', 1980, 12, 'c_01', '保温・保冷に優れた二重構造のマグカップです。'),
      product('p_02', '木製カッティングボード', 3480, 5, 'c_01', 'オリーブウッドを使用したカッティングボード。'),
      product('p_03', '耐熱ガラスポット', 4200, 0, 'c_01', '直火にかけられる耐熱ガラス製のポットです。'),
      product('p_04', '万年筆（細字）', 6800, 8, 'c_02', '書き味なめらかな細字の万年筆。'),
      product('p_05', 'リングノート A5', 680, 40, 'c_02', '方眼罫のリングノート。開いたまま置けます。'),
      product('p_06', '真鍮のブックマーク', 1200, 25, 'c_02', '使い込むほど味が出る真鍮製のしおり。'),
      product('p_07', 'リネンクッションカバー', 2900, 14, 'c_03', '洗うほど柔らかくなるリネン100%のカバー。'),
      product('p_08', 'アロマディフューザー', 5600, 3, 'c_03', '静音設計の超音波式ディフューザー。'),
    )
  },
}
