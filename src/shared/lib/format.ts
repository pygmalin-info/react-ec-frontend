const yenFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
})

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * 金額の表示整形。
 *
 * ■ なぜこれは shared にあるのか
 *   「数値を日本円の文字列にする」だけで、商品もカートも知らない。
 *   Product が絡んだ瞬間（例: 税率を商品から取り出す）に entities へ移すべき処理になる。
 */
export function formatYen(amount: number): string {
  return yenFormatter.format(amount)
}

export function formatDate(date: Date): string {
  return dateFormatter.format(date)
}
