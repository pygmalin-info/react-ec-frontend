import { useQuery } from '@tanstack/react-query'
import { httpClient } from '@/shared/api/httpClient'

/**
 * カテゴリ。
 *
 * ■ なぜ1ファイルなのか
 *   他の entity のように model / api / ui に分けると、中身が数行のファイルが3つできる。
 *   分割は「読む場所を減らすため」に行うもので、分けること自体が目的ではない。
 *   ここは取得して選択肢に使うだけなので、1ファイルに収めている。
 *
 * ■ なぜ Mapper が無いのか
 *   レスポンスとフロントのモデルが完全に同じ形だから。
 *   構造が同じなのに変換関数を挟むと、読む人に「何か変換されている」と誤解させる。
 *   変換が必要になった時点で作ればよい。
 *   （変換の理由がある例は entities/product/api/productApi.ts の toProduct を参照）
 *
 * ■ なぜ entity なのか
 *   商品の新規登録フォームと編集フォームの両方が使う。
 *   どちらかの feature に置くと、もう一方が feature をまたいで import することになる。
 */
export type Category = {
  id: string
  name: string
}

type CategoryListResponse = {
  items: Category[]
}

export const categoryKeys = {
  all: ['categories'] as const,
}

async function fetchCategories(): Promise<Category[]> {
  const { data } = await httpClient.get<CategoryListResponse>('/categories')
  return data.items
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: fetchCategories,
    // カテゴリはほとんど変わらないので、毎回取り直す必要がない
    staleTime: 30 * 60 * 1000,
  })
}
