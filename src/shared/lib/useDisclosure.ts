import { useCallback, useState } from 'react'

/**
 * 「開いている / 閉じている」だけを扱う状態。
 *
 * ■ なぜこれは custom hook にしてよいのか
 *   モーダル・確認ダイアログ・アコーディオンなど、複数箇所で同じ振る舞いを再利用するから。
 *   「コンポーネントが長くなったから移した」ではなく、「再利用可能な振る舞い」に名前を付けている。
 *
 * ■ なぜこれは Client State なのか
 *   サーバーは「あなたのモーダルが開いているか」を知らないし、知る必要もない。
 *   リロードしたら閉じていて当然。だから useState で持つのが正しい。
 */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return { isOpen, open, close }
}
