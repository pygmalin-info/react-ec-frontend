/**
 * バックエンドが返すエラーの「生の形」。
 * 詳細は docs/API_DESIGN.md を参照。
 */
type RawErrorBody = {
  code?: unknown
  message?: unknown
  fieldErrors?: unknown
}

/** 項目名 → エラーメッセージ。フォームに流し込みやすい形にしてある */
export type FieldErrors = Record<string, string>

/**
 * フロントエンドが扱うエラーの種類。
 *
 * HTTP ステータスコードのまま持ち回らないのは、
 * 「401 のときどうする？」ではなく「未認証のときどうする？」で考えたいから。
 * ステータスコードは通信の都合、kind はアプリの都合。
 */
export type ApiErrorKind =
  /** 未認証・トークン不正/期限切れ。ログインし直せば解決する */
  | 'unauthorized'
  /** 権限不足。ログインし直しても解決しない */
  | 'forbidden'
  /** 対象が存在しない */
  | 'notFound'
  /** 入力値の不正。項目ごとのエラーがある */
  | 'validation'
  /** 業務上のエラー（在庫切れ、カートに入っている商品は削除できない 等） */
  | 'business'
  /** サーバーに届かなかった（オフライン、タイムアウト） */
  | 'network'
  /** 想定外（500、パースできないレスポンス 等） */
  | 'unexpected'

/**
 * アプリ全体で唯一のエラー型。
 *
 * ■ なぜ Error を継承しているのか
 *   TanStack Query や ErrorBoundary は Error を前提に動く。
 *   プレーンなオブジェクトを throw すると、スタックトレースも出ず、
 *   `error instanceof Error` を期待している既存のコードと噛み合わない。
 *
 * ■ なぜ kind を持たせているのか
 *   呼び出し側で switch を書いたときに、網羅漏れをコンパイラに検出させるため。
 *   （使用例は shared/ui/ApiErrorMessage.tsx を参照）
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  /** HTTP ステータス。通信自体が失敗した場合は null */
  readonly status: number | null
  /** バックエンドが返した業務コード。無い場合は null */
  readonly code: string | null
  /** validation 以外では常に空オブジェクト */
  readonly fieldErrors: FieldErrors

  constructor(params: {
    kind: ApiErrorKind
    message: string
    status?: number | null
    code?: string | null
    fieldErrors?: FieldErrors
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.kind = params.kind
    this.status = params.status ?? null
    this.code = params.code ?? null
    this.fieldErrors = params.fieldErrors ?? {}
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  unauthorized: 'ログインが必要です。',
  forbidden: 'この操作を行う権限がありません。',
  notFound: '対象が見つかりませんでした。',
  validation: '入力内容を確認してください。',
  business: '処理を完了できませんでした。',
  network: '通信に失敗しました。接続を確認してもう一度お試しください。',
  unexpected: '予期しないエラーが発生しました。時間をおいて再度お試しください。',
}

function toFieldErrors(raw: unknown): FieldErrors {
  if (!Array.isArray(raw)) return {}

  const result: FieldErrors = {}
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const { field, message } = item as { field?: unknown; message?: unknown }
    // 同じ項目に複数のエラーが来た場合は最初のものを採用する。
    // フォームの1項目に表示できるメッセージは1つだから。
    if (typeof field === 'string' && typeof message === 'string' && !(field in result)) {
      result[field] = message
    }
  }
  return result
}

function kindFromStatus(status: number, hasFieldErrors: boolean): ApiErrorKind {
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'notFound'
  // 400 でも fieldErrors が無ければ「入力ミス」ではなく業務エラー（例: 在庫切れ）
  if (status === 400) return hasFieldErrors ? 'validation' : 'business'
  if (status === 409 || status === 422) return hasFieldErrors ? 'validation' : 'business'
  return 'unexpected'
}

/**
 * バックエンドのエラーレスポンスを ApiError に変換する。
 *
 * ■ なぜ axios に依存しない形にしているのか
 *   この関数はアプリで最も分岐が多く、最もテストしたい場所。
 *   引数を `{ status, body }` という素朴な形にしておけば、
 *   axios のモックを組み立てずに単体テストが書ける。
 *   axios 固有の事情（AxiosError の形）は httpClient.ts 側に閉じ込める。
 *
 * @param response サーバーからの応答。応答が無かった場合（通信失敗）は null
 */
export function normalizeApiError(response: { status: number; body: unknown } | null): ApiError {
  if (response === null) {
    return new ApiError({ kind: 'network', message: DEFAULT_MESSAGES.network })
  }

  const body: RawErrorBody =
    typeof response.body === 'object' && response.body !== null ? (response.body as RawErrorBody) : {}

  const fieldErrors = toFieldErrors(body.fieldErrors)
  const kind = kindFromStatus(response.status, Object.keys(fieldErrors).length > 0)
  const code = typeof body.code === 'string' ? body.code : null

  // サーバーのメッセージをそのまま画面に出すのは validation / business / unauthorized のみ。
  // 500 系のメッセージは実装詳細（スタックトレース等）が混ざりうるので採用しない。
  const serverMessage = typeof body.message === 'string' && body.message.length > 0 ? body.message : null
  const message = kind === 'unexpected' ? DEFAULT_MESSAGES.unexpected : (serverMessage ?? DEFAULT_MESSAGES[kind])

  return new ApiError({ kind, message, status: response.status, code, fieldErrors })
}
