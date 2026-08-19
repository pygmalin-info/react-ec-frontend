import { useEffect, useRef } from 'react'

type ModalProps = {
  isOpen: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

/**
 * ■ なぜ Modal 自身が「開いているかどうか」を持たないのか
 *   開閉のきっかけを持っているのは呼び出し側（削除ボタンなど）。
 *   Modal が自分で state を持つと、外から閉じることができなくなる。
 *   「state は、それを変える理由を知っている側が持つ」という原則の例。
 *   開閉状態の作り方は shared/lib/useDisclosure.ts にある。
 */
export function Modal({ isOpen, title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  return (
    <dialog ref={dialogRef} className="modal" onCancel={onClose} onClose={onClose} aria-label={title}>
      <h2 className="modal__title">{title}</h2>
      <div className="modal__body">{children}</div>
    </dialog>
  )
}
