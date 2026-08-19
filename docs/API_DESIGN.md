# EC バックエンドAPI 設計（フロントエンド側からの提案）

> バックエンドが未提供のため、**このフロントエンドが接続するAPI契約をこちらで定義**しています。
> 開発中は MSW（Mock Service Worker）が、この契約に沿って応答する「開発用バックエンド」として動きます。
> 実バックエンドができたら、`VITE_API_BASE_URL` を差し替えるだけで接続できます。

* ベースURL: `VITE_API_BASE_URL`（例 `http://localhost:8080/api`）
* 認証: `Authorization: Bearer <token>`
* Content-Type: `application/json`
* 日時: ISO 8601 UTC 文字列
* 金額: **税込・円・整数**（小数を持たない。丸め誤差の議論を持ち込まないため）

---

## 1. 共通エラーレスポンス

**すべてのエラーを同じ形で返します。**

ここを固定しておくことで、フロント側ではエラーを1箇所に正規化できます。

```json
{
  "code": "VALIDATION_ERROR",
  "message": "入力内容を確認してください",
  "fieldErrors": [
    { "field": "name",  "message": "商品名は必須です" },
    { "field": "price", "message": "価格は0以上の整数で入力してください" }
  ]
}
```

`fieldErrors` は **バリデーションエラーの場合だけ**存在します。

| HTTP | `code`                           | 意味                       | フロントの扱い                                       |
| ---- | -------------------------------- | ------------------------ | --------------------------------------------- |
| 400  | `VALIDATION_ERROR`               | 入力値不正（`fieldErrors` あり）  | フォームの各項目にエラー表示（RHF `setError`）                |
| 400  | `OUT_OF_STOCK` 他                 | 業務エラー（`fieldErrors` なし）  | 画面上部にメッセージ表示                                  |
| 401  | `UNAUTHORIZED` / `TOKEN_EXPIRED` | 未認証・トークン不正/期限切れ          | **interceptor が一括処理**：トークン破棄→キャッシュ破棄→サインイン画面へ |
| 403  | `FORBIDDEN`                      | 権限不足（一般ユーザーが管理者APIを叩いた等） | 「権限がありません」表示。ログアウトはしない                        |
| 404  | `NOT_FOUND`                      | 対象なし                     | 「見つかりません」画面                                   |
| 409  | `DUPLICATE_EMAIL` 他              | 競合系の業務エラー                | 該当項目にエラー表示                                    |
| 500  | `INTERNAL_ERROR`                 | 想定外                      | 共通エラー表示 + 再試行導線                               |

> **401 と 403 を分けている理由**：401 は「ログインし直せば解決する」、403 は「ログインし直しても解決しない」ためです。
> 同じ扱いにすると、トークン改ざん時などに無限リダイレクトや不要なログアウトが起きます。

---

## 2. 認証

### `POST /auth/sign-up`

```jsonc
// Request
{ "email": "user@example.com", "password": "Password1", "name": "山田太郎" }

// 201 Response
{ "token": "eyJ...", "user": { "id": "u_01", "email": "user@example.com", "name": "山田太郎", "role": "USER" } }
```

エラー: 400 `VALIDATION_ERROR` / 409 `DUPLICATE_EMAIL`

### `POST /auth/sign-in`

```jsonc
// Request
{ "email": "user@example.com", "password": "Password1" }

// 200 Response
{ "token": "eyJ...", "user": { "id": "u_01", "email": "...", "name": "...", "role": "USER" } }
```

エラー: 400 `VALIDATION_ERROR` / 401 `INVALID_CREDENTIALS`

> **401 `INVALID_CREDENTIALS` は、interceptor の一括ログアウト処理から例外的に除外します。**
> まだログインしていない人をログアウトさせても意味がありません。
> 「メールアドレスまたはパスワードが違います」というエラーを、そのまま画面に表示するためです。
>
> この例外処理は `httpClient.ts` の中で明示されています。

### `POST /auth/sign-out`

`204 No Content`。サーバー側でトークンを無効化します。

### `GET /auth/me`

```jsonc
// 200 Response
{ "id": "u_01", "email": "user@example.com", "name": "山田太郎", "role": "USER" }  // role: "USER" | "ADMIN"
```

エラー: 401

> **サインイン時に `user` を返しているのに `/auth/me` も用意する理由**
>
> リロードすると React の状態は消え、残るのは `localStorage` のトークンだけです。
> ユーザー情報を `localStorage` に保存せず、`/auth/me` で取り直すことで、
> 「トークンは有効だけどユーザーは削除されている」「権限が変わっている」といったズレを避けられます。

---

## 3. 商品

### `GET /products`

クエリ: `keyword`（部分一致・任意） / `page`（1始まり・既定1） / `size`（既定20）

```jsonc
// 200 Response
{
  "items": [ /* ProductResponse */ ],
  "page": 1,
  "size": 20,
  "totalCount": 37
}
```

**ProductResponse**

```jsonc
{
  "id": "p_01",
  "name": "ステンレスマグカップ",
  "description": "保温保冷に優れた……",
  "priceInclTax": 1980,
  "imagePath": "/images/p_01.jpg",
  "stock": 12,
  "categoryId": "c_01",
  "categoryName": "キッチン",
  "isPublished": true,
  "publishedAt": "2026-07-01T00:00:00Z",
  "updatedAt": "2026-07-20T09:30:00Z"
}
```

> **ここでは、あえてフロントから少し使いにくい形にしています。**
> Mapper を作る理由を、実際のデータで確認できるようにするためです。
>
> * `imagePath` が**相対パス** → フロントでは絶対URLにしたい
> * `categoryId` / `categoryName` が**フラット** → フロントでは `category: { id, name }` にまとめたい
> * `publishedAt` が**文字列** → フロントでは `Date` として扱いたい
> * `priceInclTax` という**バックエンド都合の名前** → フロントのモデルでは `price`
>
> 一方、`stock` や `isPublished` はそのまま使います。
> 「全部変換する」のではなく、「必要なものだけ変換する」例です。

一覧が0件の場合も **200 + `items: []`** を返します。404 にはしません。

「取得に失敗した」と「0件だった」は別の状態なので、ここは意識しておいてください。

### `GET /products/{id}`

`200` で `ProductResponse` 単体。エラー: 404 `NOT_FOUND`

### `POST /products` （ADMIN のみ）

```jsonc
// Request
{
  "name": "ステンレスマグカップ",
  "description": "……",
  "priceInclTax": 1980,
  "stock": 12,
  "categoryId": "c_01",
  "imagePath": "/images/p_01.jpg",
  "isPublished": true
}
// 201 Response: ProductResponse
```

エラー: 400 `VALIDATION_ERROR` / 401 / 403 `FORBIDDEN`

**サーバー側バリデーション**（フロントの Zod と同じ制約）

| 項目             | 制約                         |
| -------------- | -------------------------- |
| `name`         | 必須 / 1〜100文字               |
| `description`  | 任意 / 1000文字以内              |
| `priceInclTax` | 必須 / 0以上の整数 / 10,000,000以下 |
| `stock`        | 必須 / 0以上の整数                |
| `categoryId`   | 必須 / 存在するID                |

> **同じバリデーションを両側に置く理由**
>
> フロントは「すぐにユーザーへフィードバックするため」、サーバーは「最後の砦として」使います。
> 役割が違うので、単純な重複ではありません。
>
> フロントのバリデーションを通ったとしても、サーバーが400を返すことはあります。
> そのため、`fieldErrors` を画面に反映する経路（`applyServerFieldErrors`）も用意しています。
>
> 「フロントで弾いているのに、なぜサーバーエラー表示のコードが必要なのか？」という点も、この設計を読むときのポイントです。

### `PUT /products/{id}` （ADMIN のみ）

Request は `POST /products` と同じ。`200` で `ProductResponse`。

エラー: 400 / 401 / 403 / 404

### `DELETE /products/{id}` （ADMIN のみ）

`204 No Content`。

エラー: 401 / 403 / 404 / **409 `PRODUCT_IN_CART`**（誰かのカートに入っている商品は削除不可）

> 409 を用意しているのは、削除には入力フォームがないためです。
> つまり、フォームのフィールドエラーではなく、**業務上のエラー**をどう画面に表示するかを見るためのケースです。

---

## 4. カテゴリ

### `GET /categories`

```jsonc
// 200 Response
{ "items": [ { "id": "c_01", "name": "キッチン" } ] }
```

> **この構造はフロントのモデルとそのまま一致するので、Mapper は作りません。**
> 「Mapper を作らなかった箇所」も設計上の判断として `ARCHITECTURE.md` に記録しています。

---

## 5. カート（すべて認証必須）

### `GET /cart`

```jsonc
// 200 Response
{
  "items": [
    { "id": "ci_01", "product": { /* ProductResponse */ }, "quantity": 2 }
  ]
}
```

> **合計金額・合計点数はサーバーから返しません。** フロントで導出します。
>
> * ヘッダのカート個数 → カートQueryから `select` で導出
> * 合計金額 → `calcCartTotal()` という純粋関数で導出（テスト対象）
>
> こうしておけば、「同じ数字を2箇所が別々に持つ」という状態が構造的に起きません。
>
> `product` をネストして返しているので、カート画面で商品名や価格を別途取得する必要もありません。

### `POST /cart/items`

```jsonc
// Request
{ "productId": "p_01", "quantity": 1 }
// 201 Response: CartItemResponse
```

**同じ商品がすでにカートにある場合は、行を増やさず `quantity` を加算します（サーバー側で集約）。**

エラー: 400 `VALIDATION_ERROR` / 400 `OUT_OF_STOCK`（在庫超過） / 401 / 404 `NOT_FOUND`

> **サーバー側で集約する理由**
>
> 「カートの中身がどうあるべきか」は、サーバーが持つべき状態だからです。
> フロントで集約すると、複数タブや複数端末で操作したときに表示がズレる可能性があります。
>
> そのため、フロント側の処理は `invalidateQueries` だけで済みます。
>
> **Mutation → invalidate → 再取得 → ヘッダとカート画面が同時に更新**
>
> という一本道で追えるようになっています。

### `PATCH /cart/items/{itemId}`

```jsonc
// Request
{ "quantity": 3 }
// 200 Response: CartItemResponse
```

`quantity` は1以上。0にしたい場合は DELETE を使います。

エラー: 400 `VALIDATION_ERROR` / 400 `OUT_OF_STOCK` / 401 / 404

### `DELETE /cart/items/{itemId}`

`204 No Content`。エラー: 401 / 404

---

## 6. エンドポイント一覧

| Method | Path                   | 認証 | 権限    | 対応する設問   |
| ------ | ---------------------- | -- | ----- | -------- |
| POST   | `/auth/sign-up`        | —  | —     | —        |
| POST   | `/auth/sign-in`        | —  | —     | Q2       |
| POST   | `/auth/sign-out`       | ✓  | —     | Q10      |
| GET    | `/auth/me`             | ✓  | —     | Q11, Q17 |
| GET    | `/products`            | —  | —     | Q4       |
| GET    | `/products/{id}`       | —  | —     | Q6       |
| POST   | `/products`            | ✓  | ADMIN | Q12      |
| PUT    | `/products/{id}`       | ✓  | ADMIN | Q13      |
| DELETE | `/products/{id}`       | ✓  | ADMIN | Q14      |
| GET    | `/categories`          | —  | —     | Q12, Q13 |
| GET    | `/cart`                | ✓  | USER  | Q5, Q8   |
| POST   | `/cart/items`          | ✓  | USER  | Q7, Q9   |
| PATCH  | `/cart/items/{itemId}` | ✓  | USER  | Q9       |
| DELETE | `/cart/items/{itemId}` | ✓  | USER  | —        |

---

## 7. モックバックエンド（MSW）の扱い

* `src/mocks/` に MSW のハンドラを置きます（**`src` 直下の独立ディレクトリ。`shared` には入れません**）
* 開発時のみ起動（`import.meta.env.DEV` かつ `VITE_USE_MOCK=true`）
* 状態はメモリ上に保持し、**カートの集約・在庫チェック・403判定も実装**します
  （エラー系のUIも実際に触って確認できるようにするためです）
* 同じハンドラをテスト（Vitest）でも再利用します

> 実バックエンドが用意できたら、`VITE_USE_MOCK=false` にするだけで切り替えられます。
>
> **この切り替えがそのまま成立すること自体が、「API境界を1箇所に閉じ込めた」ことの確認になります。**
