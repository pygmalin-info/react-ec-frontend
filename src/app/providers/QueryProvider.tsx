import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import '@/shared/api/reactQueryTypes'

/**
 * TanStack Query の設定。
 *
 * ■ なぜ QueryClient を useState の初期化関数で作るのか
 *   モジュールのトップレベルで new すると、テストごとにキャッシュが共有されてしまい、
 *   前のテストの結果が次のテストに漏れる。
 *   コンポーネントの中で作れば「Provider 1つにつき QueryClient 1つ」になる。
 *
 * ■ retry の方針
 *   ネットワークの一時的な失敗はやり直す価値がある。
 *   一方、401（未認証）・403（権限なし）・404（存在しない）・400（入力不正）は
 *   何度やっても同じ結果なので、やり直さない。
 *   ApiError の kind で分類してあるので、この判定が1行で書ける。
 *   （ステータスコードのまま持ち回っていたら、ここで番号の羅列を書くことになる）
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: (failureCount, error) => {
              if (error.kind !== 'network' && error.kind !== 'unexpected') return false
              return failureCount < 2
            },
          },
          mutations: {
            // 送信をやり直すと二重登録になりうるので、mutation は再試行しない
            retry: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/*
        画面左下のアイコンから Query Cache の中身を見られる（開発時のみ）。
        「どの queryKey に何が入っているか」「いつ stale になったか」が目で見えるので、
        Mutation のあとに画面が更新される仕組みを追いかけるときに使う。
        docs/READING_GUIDE.md を参照。
      */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
