declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string
    readonly VITE_USE_MOCK?: string
  }
}

/**
 * 環境変数の読み取りをここ1箇所に閉じ込める。
 *
 * import.meta.env をアプリのあちこちで直接読むと、
 * 「どの環境変数が必要なのか」がコードを全部読まないと分からなくなる。
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  /** true のとき MSW（開発用のモックバックエンド）を起動する */
  useMock: import.meta.env.VITE_USE_MOCK !== 'false',
} as const
