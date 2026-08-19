# バグ改修演習：解答（講師用）

> **研修生に渡さないでください。**
> 問題は [DEBUG_EXERCISES.md](./DEBUG_EXERCISES.md) にあります。

「直せたか」ではなく、**「設計の言葉で説明できたか」** を評価してください。
各問題の「合格ライン」を見てください。

| # | テストで検出 | 直す場所 |
|---|---|---|
| 01 | ✅ 2件失敗 | `src/features/add-to-cart/api/useAddToCart.ts` |
| 02 | ❌ 検出されない | `src/features/delete-product/api/useDeleteProduct.ts` |
| 03 | ✅ 1件失敗 | `src/entities/product/api/productApi.ts` |
| 04 | ❌ 検出されない | `src/app/layouts/ShopLayout.tsx` |
| 05 | ✅ 1件失敗 | `src/pages/ProductListPage.tsx` |
| 06 | ✅ 1件失敗 | `src/entities/product/model/productFields.ts` |
| 07 | ❌ 検出されない | `src/features/sign-up/ui/SignUpForm.tsx` |
| 08 | ❌ 検出されない | `src/features/sign-out/api/useSignOut.ts` |
| 09 | ❌ 検出されない | `src/features/sign-out/api/useSignOut.ts` |
| 10 | ❌ 検出されない | `src/shared/api/httpClient.ts` |
| 11 | ✅ 1件失敗 | `src/app/router/AppRouter.tsx` |
| 12 | ❌ 検出されない | `src/features/update-cart-item-quantity/ui/CartItemQuantitySelect.tsx` |

「❌ 検出されない」の7件は、**テストが無い領域**です。
仕上げの課題（テストを1つ書く）は、ここから選ばせてください。

---

## #01 カートに追加してもヘッダの数字が増えない

**仕込み**: `invalidateQueries` のキーを `[...cartKeys.all, 'items']` に変えている。

**原因**: 無効化しているキーと、`useCart` / `useCartItemCount` が読んでいるキー（`cartKeys.all`）が違う。
TanStack Query はキーの前方一致で無効化するため、より深いキーを指定しても親は無効化されない。

**合格ライン**
「離れたコンポーネント同士は queryKey を通じて繋がっている。キーがズレると繋がりが切れる」
と説明できること。「invalidate を書き忘れた」ではなく「キーが違う」と言えるかを見てください。

**発展の問い**: なぜ `cartKeys` のようなオブジェクトでキーを組み立てているのか（＝文字列直書きだとどうなるか）

---

## #02 商品を削除しても一覧から消えない

**仕込み**: `invalidateQueries({ queryKey: productKeys.lists() })` の行を消している。

**原因**: 詳細のキャッシュは `removeQueries` で消えているが、一覧のキャッシュが古いまま。

**合格ライン**
`removeQueries` と `invalidateQueries` の役割の違いを説明できること。
- `removeQueries`: もう取り直す意味がない（削除済みなので 404 になる）→ 捨てる
- `invalidateQueries`: 内容が変わったので取り直す

**発展の問い**: `useCreateProduct` は `productKeys.lists()` だけ、`useUpdateProduct` は `setQueryData` と `invalidateQueries` の両方。この使い分けの基準は何か

---

## #03 カテゴリ名が「c_01」と表示される

**仕込み**: `toProduct` で `name: response.categoryName` を `name: response.categoryId` にしている。

**原因**: Mapper の変換ミス。サーバーは `categoryName` を正しく返している。

**合格ライン**
- 「全画面で同じように壊れている＝画面より上流に原因がある」と推論できたか
- Network タブでサーバーのレスポンスを確認し、**フロント側の問題だと切り分けた**か

**発展の問い**: `ProductResponse` が `entities/product/api/` の外に出てこないことを確認させる。
`grep -rn "ProductResponse" src/` を実行させると早い。

---

## #04 ヘッダのカート数が常に 0 のまま

**仕込み**: `const [cartItemCount] = useState(cartItemCountQuery.data ?? 0)` を追加し、バッジがそれを見るようにしている。

**原因**: Server State を `useState` の初期値にコピーしている。
`useState` の初期値は初回レンダリング時にしか評価されないため、
その時点でまだ取得が終わっていない（`undefined`）→ 0 のまま二度と変わらない。

**合格ライン**
「サーバーから来た値を useState にコピーしてはいけない」と言えること。
`useEffect` で同期させる案を出した場合は、**それでも真実が2つになる**ことを指摘してください。

**発展の問い**: 「では商品一覧の検索キーワードはなぜ `useState` でよいのか」

---

## #05 通信に失敗したのに「該当する商品がありません」と表示される

**仕込み**: `isSuccess && items.length === 0` を `!isPending && (data?.items.length ?? 0) === 0` に変えている。

**原因**: 「データが無い」を `undefined`（未取得）と `[]`（0件）で区別していない。

**合格ライン**
- 「0件」と「取得失敗」が別の状態であることを説明できる
- `isPending` / `isError` / `isSuccess` の3つを使い分ける理由を言える

**発展の問い**: このバグは既存テストで検出されます。
**なぜそのテストが書かれていたのか**（＝壊れやすいと分かっていたから）を考えさせてください。

---

## #06 正しい価格を入力しているのに登録できない

**仕込み**: Zod schema の `.transform(Number)` を外し、`refine` を文字列向けに書き換えている。

**原因**: フォームの値が string のままサーバーへ送られ、サーバーの型チェックで弾かれている。
フロントのバリデーションは通っているので、エラーは**サーバー由来**。

**合格ライン**
- Network タブで `"priceInclTax": "1980"`（文字列）を見つけられた
- 「Form Input 型と API Request 型が別物であり、その変換を schema がやっている」と説明できる
- `z.input` と `z.output` の違いに気づけたら十分に良い

**発展の問い**: この設計だと変換用の Mapper 関数を書かずに済んでいる。それはなぜか

---

## #07 会員登録でメール重複時に何も表示されない

**仕込み**: `applyServerFieldErrors(setError, error)` を `setError('root', ...)` に変えている。

**原因**: `root` に入れたエラーを画面のどこでも描画していない。
またサーバーは `fieldErrors` 付きの 409 を返すため、フォーム全体のエラー表示（`formError`）にも該当しない。
結果、どこにも出ない。

**合格ライン**
- 「サーバーは正しくエラーを返している」ことを Network タブで確認した
- **フロントのバリデーションでは絶対に検出できないエラーがある**（メール重複）と説明できる
- したがって「サーバーのエラーを項目に流し込む経路」が必須である、と言える

**発展の問い**: `SignInForm` と `SignUpForm` の `onError` を並べて読ませる

---

## #08 ログアウトしても画面が変わらない

**仕込み**: `useSignOut` の `authToken.clear()` を削除している。

**原因**: サーバー側のセッションは消えたが、端末のトークンが残っている。
ヘッダは `useAuthToken()` を見ているので、トークンがある限りログイン中の表示のまま。
カートを開くと 401 → interceptor がトークンを捨てる → そこで初めてログイン画面へ飛ぶ。

**合格ライン**
- 「ヘッダの表示はトークンの有無だけで決まる」と説明できる
- 「あとから飛ばされた」のは interceptor の働きだと気づける（＝#10 と繋がっている）

**発展の問い**: なぜ `onSuccess` ではなく `onSettled` で消しているのか

---

## #09 別アカウントで前のユーザーのカートが見える

**仕込み**: `queryClient.clear()` を `queryClient.cancelQueries()` に変えている。

**原因**: キャッシュが残ったまま次のユーザーがログインする。
Query Cache は「このデータが誰のものか」を知らないので、明示的に捨てないと残る。

**合格ライン**
- 「ログアウトで消すべきものは、トークンとキャッシュの2つ」と言える
- `cancelQueries`（実行中の取得を止める）と `clear`（キャッシュを捨てる）の違いを説明できる

**注意**: これは**情報漏洩**につながるバグです。演習として重みを持たせてください。

---

## #10 トークンを書き換えるとログイン画面に戻れない

**仕込み**: interceptor の `authToken.clear()` を `console.warn` に置き換えている。

**原因**: 401 を受けても無効なトークンが残り続けるため、
`RequireAuth`（トークンの有無を見ている）が「ログイン済み」と判断し続ける。

**合格ライン**
「無効なトークンを捨てる」「キャッシュを捨てる」「画面を移す」の3つが
別々の場所にあることを説明できること。

| 仕事 | 場所 |
|---|---|
| トークンを捨てる | `shared/api/httpClient.ts` の interceptor（React の外） |
| キャッシュを捨てる | `app/providers/AuthSessionProvider.tsx`（React の中） |
| ログイン画面へ送る | `app/router/RequireAuth.tsx`（ルーティング） |

**発展の問い**: なぜ interceptor が直接 `navigate()` を呼ばないのか

---

## #11 未ログインで管理画面が「読み込み中…」で止まる

**仕込み**: `AppRouter` で `RequireAdmin` と `RequireAuth` の入れ子順を入れ替えている。

**原因**: `RequireAdmin` は `useCurrentUser()` の結果を待つが、
未ログインでは `enabled: false` なので取得が始まらず、`isPending` のまま止まる。
本来は先に `RequireAuth` がトークンの有無で弾くべき。

**合格ライン**
- 「トークンの有無は同期的に分かる／権限はサーバーに聞かないと分からない」という違いを説明できる
- 「未ログイン」と「権限なし」で出すべき画面が違う理由を言える

**発展の問い**: `RequireAdmin` の `isPending` に `enabled: false` の場合が含まれることに気づけたか
（TanStack Query では取得が無効な間も `isPending` は `true`）

---

## #12 数量変更が失敗しても数字が変わったまま

**仕込み**: `useState` でセレクトの値を持ち、`onChange` で先に更新している。

**原因**: サーバーが正解を持つ値を、画面がローカルにコピーしている。
mutation が失敗しても、コピーした値は元に戻らない。

**合格ライン**
- 「表示している値の正解を持っているのは誰か」を説明できる
- 同じ画面の「削除」ボタンには同じ問題が無い理由（ローカルに state を持っていない）を言える
- 「入力フォーム（商品編集）は state を持っているのに、なぜこちらは持たないのか」に答えられたら非常に良い
  → 確定操作（送信ボタン）があるかどうかで、一時的な入力状態を持つべきかが変わる

---

## 講評時に使える総括

12個のバグは、大きく4種類に分かれます。研修生に分類させると理解が定着します。

| 種類 | 該当 | 共通する原因 |
|---|---|---|
| キャッシュの繋がりが切れた | 01, 02, 09 | 「何が古くなったか」の宣言が正しくない |
| Server State を複製した | 04, 12 | サーバーが持つべき値を画面が持った |
| 変換の境界が壊れた | 03, 06 | レスポンス／入力を変換する場所のミス |
| 状態が3箇所に分かれている前提が崩れた | 08, 10, 11 | 認証の後始末が1つ欠けた |

（05 と 07 は「状態の区別」と「エラー経路」の話で、上のどれとも少し違います。
どこに分類するかを議論させるのも有効です）
