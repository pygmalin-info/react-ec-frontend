# コードの追い方

このコードベースを読むときの手順と、使う道具をまとめています。

**何が正しいか**は [ARCHITECTURE.md](../ARCHITECTURE.md) に、
**どうやって見つけるか**はこの文書に書いてあります。

---

## 0. 最初に覚える3つの入口

どこから読み始めるかは、「何を知りたいか」で変わります。

| 知りたいこと          | 入口                             | 例                                   |
| --------------- | ------------------------------ | ----------------------------------- |
| この画面は何でできているか   | `src/pages/` の該当ファイル           | カート画面 → `src/pages/CartPage.tsx`    |
| この URL は何を表示するか | `src/app/router/AppRouter.tsx` | `/admin/products/xxx/edit` の行を探す    |
| このボタンを押すと何が起きるか | `src/features/<操作名>/`          | カート追加 → `src/features/add-to-cart/` |

**迷ったら、まず `AppRouter.tsx` から読んでください。**

アプリの全画面が1ファイルに並んでいるので、入口として使いやすいです。

---

## 1. import 文を見ればレイヤーが分かる

このプロジェクトでは、import は基本的に `@/` から始まります。
相対パスの `../../` は同じ機能の中で使うものです。

つまり、ファイルの先頭を見るだけでも、**そのファイルがどのレイヤーに依存しているか**が分かります。

```ts id="k1y8qj"
import { addCartItem, cartKeys } from '@/entities/cart'   // ← ドメインを触っている
import { Button } from '@/shared/ui/Button'               // ← 汎用UI
import { useAddToCart } from '../api/useAddToCart'        // ← 同じ feature の中
```

読み方のコツ:

* `@/entities/...` が出てきたら **ドメインの話**
* `@/shared/...` しか無いなら **ドメインを知らない部品**
* `@/features/...` が出てきたら、そのファイルは `pages` か `app` にいるはず

逆に言えば、**import 文を見るだけで「このファイルは何をする階層なのか」をある程度判断できます。**

もし判断できないファイルがあれば、それは置き場所を見直すサインかもしれません。

---

## 2. 「データがどこから来たか」を追う：4つの層をたどる

画面に表示されている値は、基本的に次の順番で流れています。

```text id="q8a4mu"
①コンポーネント  ←  ②hook（useQuery / useMutation）  ←  ③API関数  ←  ④httpClient（axios）
```

たとえば、商品一覧の商品名がどこから来ているのかを追う場合:

| 段 | 探し方                     | 着地点                                                      |
| - | ----------------------- | -------------------------------------------------------- |
| ① | 画面に出ている変数名を見る           | `productsQuery.data.items`                               |
| ② | その変数を作っている hook に飛ぶ     | `useProducts` → `entities/product/api/productQueries.ts` |
| ③ | `queryFn` に指定されている関数に飛ぶ | `fetchProducts` → `entities/product/api/productApi.ts`   |
| ④ | `httpClient.get` の行を見る  | `GET /products`                                          |

**逆方向、つまり API から画面まで追いたい場合は、パス文字列で grep すると早いです。**

```bash
grep -rn "'/products'" src/
```

---

## 3. 「なぜ画面が更新されたか」を追う：queryKey で grep する

TanStack Query では、**同じ queryKey のものを同じデータとして扱います。**

なので、「更新した側」と「表示している側」を繋いでいるのが queryKey です。

```bash
# カートのキーを使っている場所をすべて出す
grep -rn "cartKeys" src/
```

出てきた場所は、大きく3種類に分かれます。

| 出てきた場所                                   | 意味                         |
| ---------------------------------------- | -------------------------- |
| `queryKey:` の中                           | **読んでいる**（このキーのデータを表示している） |
| `invalidateQueries` / `removeQueries` の中 | **捨てている**（もう古い、と宣言している）    |
| `setQueryData` の中                        | **書いている**（取り直さずに直接更新している）  |

「カートに追加したらヘッダの数字が増える」という動きも、
この grep の結果を並べていけば仕組みが見えてきます。

> **道具**: 画面左下の React Query Devtools も使ってみてください。
> 今どのキーにどんなデータが入っているのか、`fresh` / `stale` / `fetching` の状態まで確認できます。
> ボタンを押す前後で見比べると、`invalidate` が何をしているのか分かりやすいです。

---

## 4. 「この state は誰が持っているか」を見分ける

このコードベースでは、状態の持ち主は大きく3種類です。

**まず、どれに当てはまるかを考えてみてください。**

| 見つけたもの          | 持ち主  | 意味                         |
| --------------- | ---- | -------------------------- |
| `useQuery(...)` | サーバー | サーバーが正解を持っている。画面はそれを見ているだけ |
| `useState(...)` | この画面 | リロードしたら消えて当然のもの            |
| `useForm(...)`  | フォーム | 確定操作（送信）があるまでの一時的な入力       |

判定するときは、たとえばこんな grep が使えます。

```bash
# 画面に useState がいくつあるか数える
grep -rn "useState" src/pages/
```

`src/pages/` の中に `useState` はほとんど出てきません（検索キーワードくらいです）。

**「ページに state が無い」こと自体が、この設計の主張になっています。**

なお、トークンだけはこの3種類のどれでもありません。
どこにあるのかは `src/shared/api/useAuthToken.ts` を読んでみてください。

---

## 5. 「この値の型はどこで変わったか」を追う

同じ値でも、レイヤーをまたぐと型が変わることがあります。
このプロジェクトでは、変わる場所もある程度決まっています。

```text id="7qk1za"
ProductResponse   ← バックエンドの形（entities/product/api/productApi.ts）
      ↓ toProduct()
Product           ← 画面が使う形（entities/product/model/product.ts）

ProductFormValues ← 入力中の形（すべて string）
      ↓ Zod の transform
ProductInput      ← 送信する形（数値は number）
```

追い方はシンプルです。

1. VS Code なら、型名の上で **F12（定義へジャンプ）**
2. 型名で grep して、その型を返している関数を探す

```bash
grep -rn "): Product" src/       # Product を作っている関数
grep -rn "ProductResponse" src/  # バックエンドの形が出てくる範囲
```

`ProductResponse` が `entities/product/api/` にしか出てこないことも確認してみてください。

**これが、「バックエンドの形を1箇所に閉じ込めている」という設計の証拠です。**

---

## 6. 「このエラーはどこから来たか」を追う

画面にエラーが出たら、まず **kind** を確認します。

```text id="j9w2se"
ブラウザの Network タブでステータスコードを確認
        ↓
src/shared/api/apiError.ts の kindFromStatus() で kind に変換される
        ↓
その kind をどう表示するかは src/shared/ui/ApiErrorMessage.tsx
```

`try / catch` を grep しても、画面側にはほとんど出てきません。

エラーの形を整える処理を `src/shared/api/httpClient.ts` の interceptor に集約しているからです。

```bash
grep -rn "catch" src/pages src/features   # → 出てこない
```

**「無いこと」を確認するのも、コードを読むときの大事な手がかりです。**

---

## 7. テストを仕様書として読む

「この機能は何を保証しているんだっけ？」となったら、テストを読んでください。

このプロジェクトのテストは、日本語で何を確認しているのか分かるようになっています。

| 知りたいこと            | 読むテスト                                                  |
| ----------------- | ------------------------------------------------------ |
| カート追加で何が更新されるのか   | `src/features/add-to-cart/ui/AddToCartButton.test.tsx` |
| 一覧の3つの状態          | `src/pages/ProductListPage.test.tsx`                   |
| エラーの分類ルール         | `src/shared/api/apiError.test.ts`                      |
| 管理画面の保護           | `src/app/router/AppRouter.test.tsx`                    |
| Mapper が何を変換しているか | `src/entities/product/api/productApi.test.ts`          |

---

## 8. ESLint に聞く

「なぜこのファイルはここにあるんだろう？」と分からなくなったら、**実際にルールを破ってみる**のも手です。

```bash
# 試しに entities から features を import してみる
npm run lint
```

エラーメッセージを見ると、依存方向のルールがどう働いているのか分かります。

確認できたら、変更は元に戻してください。

---

## 9. よく使う grep 集

```bash
# ある queryKey を使っている場所すべて
grep -rn "productKeys" src/

# キャッシュを更新している場所すべて（＝画面が変わるきっかけ）
grep -rn "invalidateQueries\|setQueryData\|removeQueries" src/

# API を叩いている場所すべて（httpClient を使っている場所）
grep -rn "httpClient\." src/

# バックエンドのレスポンス型が漏れていないか
grep -rn "Response\b" src/pages src/features

# ある機能がどこから使われているか（feature の呼び出し元を探す）
grep -rn "AddToCartButton" src/
```

---

## 10. 詰まったときの手順

1. **症状を1文で書く** — 「カートに追加したのにヘッダの数字が増えない」
2. **どの層の話かを決める** — 表示が古い → キャッシュの話。値が変 → Mapper か計算の話。通信が失敗 → API の話
3. **その層のキーワードで grep する** — キャッシュなら `invalidateQueries`、Mapper なら `to〇〇`
4. **Devtools / Network タブで事実を確認する** — 「リクエストは飛んでいるか」「レスポンスは何が返っているか」
5. **仮説を1つだけ立てて、1行だけ変えて確かめる**

3〜5 を繰り返します。

**同時に2箇所直さないでください。**
何が効いたのか分からなくなります。

---

## 11. やりがちな読み方の失敗

| 失敗                      | どうするか                                |
| ----------------------- | ------------------------------------ |
| ファイルを上から順に全部読む          | 入口（§0）を決めてから、その1本だけ追う                |
| コンポーネントの中だけで原因を探す       | データの出どころ（§2）まで遡る                     |
| `useState` を探して見つからず諦める | Server State かもしれない。`useQuery` を探す   |
| エラーの原因を画面のコードで探す        | エラーの形は interceptor で作られている（§6）       |
| コメントの「なぜ」を読まずに実装だけ見る    | このコードベースでは「なぜ」をコメントに書いている。実装だけで判断しない |

---

## 次にやること

読み方が分かったら、今度は**壊れたコードを直してみてください。**

→ [DEBUG_EXERCISES.md](./DEBUG_EXERCISES.md)
