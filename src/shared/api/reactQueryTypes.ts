import type { ApiError } from './apiError'

/**
 * TanStack Query が扱うエラーの型を ApiError に固定する。
 *
 * これを書かないと `const { error } = useQuery(...)` の error は `Error` 型になり、
 * 画面側で `error.kind` を見ようとすると毎回キャストが必要になる。
 *
 * この宣言が「嘘」にならないのは、shared/api/httpClient.ts の interceptor が
 * 必ず ApiError にしてから reject しているから。
 * つまり ESLint の axios 制限とこの型宣言は 1 セットで意味を持つ。
 */
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError
  }
}

export {}
