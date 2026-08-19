const STORAGE_KEY = 'training-ec.authToken'

type Listener = () => void

const listeners = new Set<Listener>()

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    // プライベートブラウジング等で localStorage が使えない場合
    return null
  }
}

/**
 * getSnapshot（useSyncExternalStore）は「同じ値なら同一参照」を返す必要がある。
 * localStorage を毎回読むと文字列は毎回同じでも、読み取り自体のコストと
 * 例外の可能性があるため、メモリ上にキャッシュを持つ。
 */
let snapshot: string | null = readStorage()

function emit() {
  for (const listener of listeners) listener()
}

/**
 * 認証トークンの唯一の保管場所。
 *
 * ■ なぜ React の state ではなく localStorage なのか
 *   画面をリロードすると React の state は消えるが、ログイン状態は続いてほしい。
 *   （PDF Q17「リロードした際の懸念」への答えがここにある）
 *
 * ■ なぜ React state に「コピー」しないのか
 *   コピーすると真実が2つになる。axios の interceptor は React の外で動くので、
 *   React state を読むことができず、結局 localStorage を読むことになる。
 *   そのとき React state 側が古いままだと、画面とリクエストで食い違いが起きる。
 *
 * ■ どうやって React に伝えるのか
 *   subscribe/getSnapshot を用意し、React 側は useSyncExternalStore で「購読」する。
 *   複製ではなく購読なので、真実は常に1つ。
 */
export const authToken = {
  get(): string | null {
    return snapshot
  },

  set(token: string): void {
    snapshot = token
    try {
      localStorage.setItem(STORAGE_KEY, token)
    } catch {
      // 保存できなくてもメモリ上のトークンでセッションは続行できる
    }
    emit()
  },

  clear(): void {
    snapshot = null
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 何もしない
    }
    emit()
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  getSnapshot(): string | null {
    return snapshot
  },
}

/**
 * 別タブでログアウトされたら、このタブでも気付けるようにする。
 * 「真実は localStorage 1つ」という設計にしたからこそ、この対応が数行で済む。
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    snapshot = readStorage()
    emit()
  })
}
