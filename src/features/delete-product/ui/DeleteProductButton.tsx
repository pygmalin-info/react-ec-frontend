import type { ProductId } from '@/entities/product'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { ApiErrorMessage } from '@/shared/ui/ApiErrorMessage'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { useDeleteProduct } from '../api/useDeleteProduct'

type DeleteProductButtonProps = {
  productId: ProductId
  productName: string
}

/**
 * 商品削除ボタン（PDF Q14）。
 *
 * ■ このコンポーネントには2種類の状態がある
 *   - 確認モーダルが開いているか  → Client State（useDisclosure / useState）
 *   - 削除が成功したか            → Server State（mutation と Query Cache）
 *   前者はリロードしたら閉じていて当然。後者はサーバーに反映されている必要がある。
 *   「この state は誰が所有すべきか」を考えるとき、この違いが判断基準になる。
 *
 * ■ 入力フォームが無いのにエラー表示があるのはなぜか
 *   「カートに入っている商品は削除できない」（409 PRODUCT_IN_CART）のような
 *   業務エラーは、入力とは関係なく起きる。
 *   バリデーションエラーだけがエラーではない、という例。
 */
export function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const confirmDialog = useDisclosure()
  const deleteProductMutation = useDeleteProduct()

  return (
    <>
      <Button variant="danger" onClick={confirmDialog.open}>
        削除
      </Button>

      <Modal isOpen={confirmDialog.isOpen} title="商品の削除" onClose={confirmDialog.close}>
        <p>「{productName}」を削除します。よろしいですか？</p>

        {deleteProductMutation.error ? <ApiErrorMessage error={deleteProductMutation.error} /> : null}

        <div className="form-actions">
          <Button
            variant="danger"
            isLoading={deleteProductMutation.isPending}
            onClick={() => {
              deleteProductMutation.mutate(productId, {
                // 失敗したときはモーダルを開いたままにして、理由を読ませる
                onSuccess: () => confirmDialog.close(),
              })
            }}
          >
            削除する
          </Button>
          <Button variant="secondary" onClick={confirmDialog.close}>
            キャンセル
          </Button>
        </div>
      </Modal>
    </>
  )
}
