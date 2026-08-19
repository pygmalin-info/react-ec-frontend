import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
  /** 送信中など。true の間は自動で disabled になる */
  isLoading?: boolean
}

/**
 * ■ なぜ isLoading を Button が持っているのか
 *   「送信中はボタンを押せない」は全画面で同じ振る舞いなので、
 *   各画面で disabled={isPending || ...} と書くより、ここで一度決めたほうが漏れない。
 *   ただし isLoading の値そのものは呼び出し側（＝mutation を持つ側）が所有する。
 *   このコンポーネントは「受け取って見た目に反映する」だけで、状態は持たない。
 */
export function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={['button', `button--${variant}`, className].filter(Boolean).join(' ')}
      disabled={disabled === true || isLoading}
    >
      {isLoading ? '処理中…' : children}
    </button>
  )
}
