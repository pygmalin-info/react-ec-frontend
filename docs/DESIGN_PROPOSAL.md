# React EC フロントエンド 設計提案（実装前レビュー用）

> この文書は **実装前の設計案** です。承認後に実装を開始します。
> 完成後に別途 `ARCHITECTURE.md`（研修生向け／答えを書かないリーディングガイド）を作成します。

---

## 1. 現在のディレクトリ構成

**結論：このECフロントエンドの既存コードは存在しません。ゼロからの新規作成です。**

調査したもの:

| 場所 | 内容 | 本件との関係 |
|---|---|---|
| `~/Desktop/react-ec-frontend/` | 今回作成した空フォルダ | 実装先 |
| `~/Desktop/デスクトップ - Canty's MacBook Pro/React_EC_面談道場テスト.pdf` | **EC課題の設問集（Q1〜Q19）** | ★ 要件の一次情報。後述 |
| `~/Desktop/デスクトップ - Canty's MacBook Pro/learning-ops-ui/` | 別プロジェクト（React 19 + Vite + TS + TanStack Query + React Router） | 社内の技術選定・ESLint設定の前例として参照 |
| `~/Desktop/デスクトップ - Canty's MacBook Pro/learning-ops/` | Spring Boot（別ドメイン、EC ではない） | 参考にならず |
| `~/Desktop/performance-training/`, `chat-support-assignment/` 他 | 別題材 | 参考にならず |

`ProductController` / `/api/products` / `/api/cart` 等でホームディレクトリ全体を検索しましたが、
**EC用バックエンドAPIのソースはこのマシン上に存在しません**（→ 6章末の確認事項）。

### PDF から読み取れた「この課題が要求している画面・機能」

設問がそのまま仕様になっています。設計はこれに合わせます。

- **Q2** ログイン → 一覧画面遷移。バリデーション / トークンの処理 / バリデーションエラー / APIエラー(400,401,403,500)
- **Q3** ユーザー側と管理者側で **header レイアウトが違う**
- **Q4** 一覧画面の表示。APIエラー時 **と 0件時**
- **Q5** ユーザー側 header の **カート個数バッジ**（追加した瞬間に数字が変わるロジックを含む）
- **Q6** 一覧 → 詳細への遷移で叩くAPI
- **Q7** 詳細画面の「カート追加」ボタン押下時の処理
- **Q8** カート一覧の **合計金額**
- **Q9** **同じ商品を再度カート追加**したときのカート一覧の表示
- **Q10** ログアウト処理
- **Q11** 管理者画面 header の **メールアドレス表示**
- **Q12/Q13/Q14** 管理者の商品 **新規登録 / 編集 / 削除**（バリデーション + APIエラー）
- **Q15** **トークンを画面から削除・改ざんして API を叩いた**ときの処理
- **Q17** **画面リロード時**の懸念と対処
- **Q18** ページ遷移のルーティング
- **Q19** APIエラー全般の対処

> 設計の狙い：**Q1〜Q19 の答えが、コードを追えば必ず1箇所に見つかる**構造にします。
> 「その処理がどこにあるか探し回る」状態を作らないことを、教材としての第一目標にします。

---

## 2. 現在使用しているライブラリ

新規プロジェクトのため既存依存はありません。ご指定のスタックを採用します。

| ライブラリ | 用途 |
|---|---|
| React 19 / TypeScript / Vite | 基盤（社内 `learning-ops-ui` と同構成） |
| React Router v7 | ルーティング（Q18）、レイアウト分岐（Q3）、ガード |
| TanStack Query v5 | Server State |
| React Hook Form + Zod | フォーム状態とバリデーション |
| Axios | HTTP |

### 追加を提案するライブラリ（理由付き）

| ライブラリ | 追加理由 | 無いとどうなるか |
|---|---|---|
| `@hookform/resolvers` | RHF と Zod の接続に必須（実質 RHF の一部） | 手書き resolver が必要 |
| `eslint-plugin-boundaries` | **依存方向をESLintで機械的に守る**（ArchUnit相当）。レイヤーを宣言的に定義でき、`import/no-restricted-paths` より設定が読みやすい | 「app→features→entities→shared」が人間のレビュー頼みになり、教材のルールが半年で崩れる |
| `eslint-plugin-import`（`import/no-cycle`） | 循環依存の検出 | 循環に気付けない |
| `vitest` + `@testing-library/react` | テスト基盤 | — |
| `msw` | **API成功時/失敗時のUI**をHTTP境界でモック。axios を jest.mock するのと違い、`API関数 → mapper → Query → UI` の結線ごと検証できる | エラー分類（401/422/500）ごとのUI差分をテストできない |

### UIライブラリ：導入しない（決定）

CSS Modules + `shared/ui` の最小限コンポーネント（Button / TextField / Modal / ErrorMessage）で構成します。
理由：UIライブラリ固有の流儀（例：MUI の `Controller` ラップ）が、
学ばせたい「コンポーネントの責務」「フォーム状態の所有者」の議論に混ざるのを避けるためです。
既存社内プロジェクト `learning-ops-ui` にもUIライブラリは入っておらず、前例とも整合します。

---

## 3. APIとの接続方法

**バックエンドが存在しないため、API契約もこちらで設計します。**
→ 詳細は **[`docs/API_DESIGN.md`](./API_DESIGN.md)**

開発中は **MSW（Mock Service Worker）** がこの契約どおりに応答する開発用バックエンドとして動きます
（カートの数量集約・在庫チェック・403判定・各種エラーも実装するので、エラー系UIを実際に触って確認できます）。
実バックエンドができたら `VITE_API_BASE_URL` / `VITE_USE_MOCK` の切り替えだけで繋がります。

**API設計時に意図的に入れた仕掛け**（詳細は API_DESIGN.md）:

- `ProductResponse` を**あえてフロントが使いにくい形**にした（相対パス画像 / フラットなカテゴリ / 日時文字列 / `priceInclTax` という命名）→ **Mapper を作る理由が実在する**
- `CategoryResponse` は**フロントのモデルと完全に同一**にした → **Mapper を作らない判断**の実例
- カートの合計金額・合計点数を**サーバーが返さない** → フロントで導出（Q5/Q8 の答えが純粋関数と `select` に集約される）
- 同一商品のカート追加は**サーバーが集約** → フロントは `invalidateQueries` だけ（Q9）
- エラーレスポンスの形を**全エンドポイントで統一** → フロント側で1箇所に正規化できる根拠

以下を前提として設計します。

想定する接続の骨格：

```
VITE_API_BASE_URL (.env)
  → shared/api/httpClient.ts  … axios instance を1つだけ生成
      ├ request interceptor : Authorization ヘッダにトークン付与     ← Q2, Q15
      └ response interceptor: 生の AxiosError → ApiError に正規化    ← Q19
```

**このプロジェクトで axios を import してよいのは `shared/api/httpClient.ts` だけ** にします（ESLintで禁止）。
これがご指摘の「コンポーネントから直接 Axios を呼ばない」を、規約ではなくツールで担保する形です。

---

## 4. 現在の state 管理

新規のため既存なし。**設計方針として以下を明確に線引きします。**

| 状態 | 所有者 | 理由 |
|---|---|---|
| 商品一覧 / 商品詳細 / カート / ログインユーザー | **TanStack Query（Server State）** | サーバーが真実。`useState` へコピーしない |
| カート個数バッジ（Q5） | カートQueryの `select` で件数だけ導出 | 独立した state にすると「カート追加後にバッジだけ古い」が起きる |
| 合計金額（Q8） | `calcCartTotal()` **純粋関数で導出**（APIは返さない） | state を増やさない。純粋関数なのでテストできる |
| 認証トークン | **`localStorage` が唯一の保管場所**。React は購読するだけ | Q17（リロード）と Q15（改ざん）の答えが1箇所に集まる |
| ログインユーザーのメールアドレス（Q11） | `useCurrentUser()`（Server State） | Context に複製しない。「トークン」と「ユーザー情報」を別物として扱う |
| モーダル開閉 / 削除確認ダイアログ | ローカル `useState` | 本当にクライアントだけの状態 |
| フォーム入力途中の値 | React Hook Form | 同上 |

> 教材ポイント：**「トークンは Client State、ユーザー情報は Server State」** という分割を意図的に作ります。
> 「ログイン中のユーザー」を丸ごと Context に入れる実装との違いを、Q11 と Q17 の答えで比較させられます。

---

## 5. 現在の問題点（＝この設計で防ぎたいこと）

研修教材としてよく壊れるポイントを、あらかじめ構造で潰します。

1. **API呼び出しがコンポーネントに散る** → axios の import を1ファイルに制限
2. **同じデータを2箇所が別々に持つ** → カート個数を独立 state にしない
3. **エラー処理が画面ごとにバラバラ** → `ApiError` 判別共用体に1箇所で正規化
4. **バックエンドの型がそのままUIまで届く** → Response 型と Model 型を分離（ただし**変換の必要がある箇所だけ**）
5. **「とりあえず Context」「とりあえず custom hook」** → 依存方向ルールと命名規約で抑止
6. **リロードで壊れる**（Q17） → トークンの真実を localStorage に1本化
7. **どこに置けばいいか分からないから `shared`** → `shared` は「Product/Cart を知らないもの」だけ、をESLintで機械判定できる粒度に

---

## 6. 提案するアーキテクチャ

### 6.1 レイヤーと責務

| レイヤー | 責務 | 置いてはいけないもの |
|---|---|---|
| `app` | 起動・配線。Router / Provider / QueryClient設定 / axios初期化 / レイアウト / ErrorBoundary | 個別機能の業務ロジック |
| `pages` | **画面の組み立てだけ**。どのfeature/entityで構成されるかを示す | API呼び出し、バリデーション、大量のstate |
| `features` | **ユーザーの操作1つ**（=ユースケース）。mutation・フォーム・操作UI | 他featureへの依存 |
| `entities` | **ECのドメイン概念**（Product/Cart/User）。モデル型・取得Query・表示UI | 「操作」の実装 |
| `shared` | **ドメインを知らない**汎用処理。http基盤・汎用UI・設定 | Product/Cart 固有の知識 |

### 6.2 依存方向

```
app  ─┐
       ├→ features ─→ entities ─→ shared
pages ─┘         ↘_____________↗
```

- 上位は下位を import してよい。**逆は禁止**（ESLintで機械的に検出）
- **features 同士 / entities 同士の横断 import は禁止**（`add-to-cart` が `sign-in` を知る必要はない）
- 各 `features/*` と `entities/*` は **ルートの `index.ts` を Public API** とし、内部ファイルへの直 import を禁止
- `import/no-cycle` で循環依存を検出

> ArchUnit と同じ思想です。「設計ルールを人間の注意だけに頼らない」を、`eslint.config.js` に落とします。
> **ルール違反そのものが教材**になります（研修生が `entities` から `features` を import して怒られる → なぜ怒られるかを考える）。

### 6.3 コアとなる設計判断

#### (a) エラーの正規化境界（Q2, Q19, Q12〜Q14）

`shared/api/apiError.ts` で、axios の生エラーを **判別可能な共用体** に変換します。

```ts
export type ApiError =
  | { kind: 'unauthorized' }                                   // 401
  | { kind: 'forbidden' }                                      // 403
  | { kind: 'validation'; fieldErrors: Record<string, string> } // 400 / 422
  | { kind: 'business'; code: string; message: string }         // 409 等
  | { kind: 'network' }                                         // レスポンス無し
  | { kind: 'unexpected'; message: string }                     // 500 / 未知
```

- **401 は interceptor が一括処理**：トークン破棄 → Queryキャッシュ破棄 → サインイン画面へ（Q15の答え）
- **validation は feature が処理**：`applyServerFieldErrors(form, error)` で RHF の `setError` に流す（Q12/Q13）
- **network / unexpected は画面共通の表示**へ

> 教材ポイント：`switch (error.kind)` で **網羅性チェックが効く**ようにします。
> 新しいエラー種別を足すとコンパイルエラーで漏れが分かる。これが「型で守る」の実例になります。

#### (b) 型の分離（どこで分け、どこで分けないか）

| 型 | 例 | 分ける／分けない |
|---|---|---|
| API Response | `ProductResponse` | 分ける（バックエンドの都合） |
| Domain Model | `Product` | 分ける（フロントの都合） |
| Form Input | `ProductFormValues`（`price` は **string**） | 分ける（`<input>` は文字列を返す） |
| API Request | `CreateProductRequest`（`price` は **number**） | 分ける（送信形） |
| Component Props | `ProductCardProps` | 分ける（表示に必要な最小限だけ） |

**Mapper は変換が必要な箇所だけ**作ります。API設計が確定したので、作る／作らないを明示します。

| 変換 | 作る？ | 中身 |
|---|---|---|
| `ProductResponse → Product` | **作る** | `imagePath`(相対) → `imageUrl`(絶対) / `categoryId`+`categoryName` → `category:{id,name}` / `publishedAt` 文字列 → `Date` / `priceInclTax` → `price` |
| `CartItemResponse → CartLine` | **作る** | ネストした `product` に `toProduct()` を適用（**Mapper の合成**の実例） |
| `CategoryResponse → Category` | **作らない** | `{id, name}` で構造が完全に同一。素通し |
| `ProductFormValues → ProductRequest` | **作る** | `price: string` → `priceInclTax: number`（`<input>` は文字列を返すため） |

> 「作らなかった Category」を残すのが重要です。**Mapper は義務ではなく手段**である、という判断が
> 同じコードベースの中で対比できます。

#### (c) ID の取り違え防止

```ts
export type ProductId = string & { readonly __brand: 'ProductId' };
```

`getProduct(userId)` のような取り違えをコンパイルエラーにします。
**Product / User / CartItem の3つだけ**に留め、全部の型をブランド化はしません。

#### (d) Zod スキーマの置き場所（ここが一番の読みどころ）

「商品名は1〜100文字、価格は0以上の整数」は **商品というドメインの制約** です。
一方「新規登録フォームは全項目必須／編集フォームは一部のみ」は **操作(feature)の都合** です。

```
entities/product/model/productFields.ts   … productName, productPrice などフィールド単位のZod
features/create-product/model/schema.ts   … 上を組み合わせた「新規登録フォーム」のスキーマ
features/update-product/model/schema.ts   … 上を組み合わせた「編集フォーム」のスキーマ
```

`create-product` と `update-product` は互いを import せず、**共通部分は entity に落ちる**。
「feature 同士で共有したくなったら、それは entity の知識だったのでは？」を体験させます。

#### (e) Mutation 後になぜ画面が更新されるのか（Q5, Q7, Q9）

```
AddToCartButton (features/add-to-cart/ui)
  → useAddToCart()  (features/add-to-cart/api)
      → cartApi.addItem()  (entities/cart/api)
          → httpClient.post()  (shared/api)
              → Backend
  onSuccess → queryClient.invalidateQueries({ queryKey: cartKeys.all })
      → useCart() を使う「header のバッジ」と「カート画面」が同時に再取得・再描画
```

**基本方針は invalidate のみ**。Optimistic Update は最初は使いません。
理由：教材として「なぜ画面が更新されたか」を1本の線で追えることを優先するためです。
ただし **カートバッジ1箇所だけ** を、後から Optimistic に書き換える **演習課題** として `docs/` に残す想定です（比較で学べるため）。

#### (f) 認証（Q2, Q10, Q11, Q15, Q17）

```
localStorage (唯一の保管場所)
   ↕ shared/api/authToken.ts   … get / set / clear / subscribe
   ├→ httpClient の interceptor が get() してヘッダに付与        （Reactの外）
   └→ app/providers/AuthTokenProvider が useSyncExternalStore で購読（Reactの中）
         ├→ RequireAuth / RequireAdmin （ルートガード）
         └→ entities/user: useCurrentUser() = useQuery(['me'], { enabled: トークンあり })
               └→ AdminLayout の header がメールアドレスを表示  ← Q11
```

- **トークンは React state に複製しない**。localStorage が真実、React は購読するだけ
- **ユーザー情報は保存しない**。リロード後はトークンから再取得（Q17 の答え）
- ログアウト（Q10）：API 呼び出し → `authToken.clear()` → `queryClient.clear()` → サインイン画面へ
  （`queryClient.clear()` を忘れると次のユーザーに前のカートが見える、が読みどころ）

> `useSyncExternalStore` は少し高度ですが、**「React の外にある状態を、複製せずに React へ繋ぐ」** 唯一素直な方法なので採用します。10行程度です。

#### (g) props / Context / Query Cache の使い分け

| 手段 | 使う場面 | 本プロジェクトでの実例 |
|---|---|---|
| props | 1〜2階層。呼び出し元が明示的に渡せる | `ProductCard` に `product` を渡す |
| Query Cache | **離れた複数箇所が同じサーバーデータを見る** | header のカート個数 と カート画面（Q5） |
| Context | React外の状態をReactに繋ぐ / 全画面で必要 | トークンの購読のみ |

Props drilling を無条件に避けません。**まず props、共有が必要なら Query Cache、最後の手段が Context** の順で判断した痕跡を残します。

---

## 7. ディレクトリ構成案

```
react-ec-frontend/
├── ARCHITECTURE.md              # 研修生向けリーディングガイド（答えは書かない）
├── README.md                    # 起動手順・環境変数
├── eslint.config.js             # ★ 依存方向ルール（boundaries + no-cycle）
├── .env.example                 # VITE_API_BASE_URL
└── src/
    ├── app/
    │   ├── main.tsx
    │   ├── providers/
    │   │   ├── AppProviders.tsx        # 合成するだけ
    │   │   ├── QueryProvider.tsx       # QueryClient生成・retry/staleTime方針
    │   │   ├── AuthTokenProvider.tsx   # トークンの購読のみ
    │   │   └── AppErrorBoundary.tsx    # unexpected の最後の砦（Q19）
    │   ├── router/
    │   │   ├── AppRouter.tsx           # Q18
    │   │   ├── RequireAuth.tsx
    │   │   └── RequireAdmin.tsx
    │   └── layouts/
    │       ├── ShopLayout.tsx          # ユーザー側header（カートバッジ）  Q3, Q5
    │       └── AdminLayout.tsx         # 管理者側header（メールアドレス）  Q3, Q11
    │
    ├── pages/                          # 画面の組み立てのみ。読めば構成要素が分かる
    │   ├── sign-in/SignInPage.tsx
    │   ├── sign-up/SignUpPage.tsx
    │   ├── product-list/ProductListPage.tsx
    │   ├── product-detail/ProductDetailPage.tsx
    │   ├── cart/CartPage.tsx
    │   └── admin/
    │       ├── AdminProductListPage.tsx
    │       ├── AdminProductNewPage.tsx
    │       └── AdminProductEditPage.tsx
    │
    ├── features/                       # ユーザーの操作 = ユースケース
    │   ├── sign-in/          { model/schema.ts, api/useSignIn.ts, ui/SignInForm.tsx, index.ts }
    │   ├── sign-up/          { 同上 }
    │   ├── sign-out/         { api/useSignOut.ts, ui/SignOutButton.tsx, index.ts }
    │   ├── add-to-cart/      { api/useAddToCart.ts, ui/AddToCartButton.tsx, index.ts }
    │   ├── update-cart-item-quantity/
    │   ├── remove-from-cart/
    │   ├── create-product/   { model/schema.ts, model/toRequest.ts, api/, ui/ProductCreateForm.tsx }
    │   ├── update-product/
    │   └── delete-product/   { api/useDeleteProduct.ts, ui/DeleteProductButton.tsx }
    │
    ├── entities/                       # ECのドメイン概念
    │   ├── product/
    │   │   ├── model/product.ts        # Product, ProductId
    │   │   ├── model/productFields.ts  # ドメイン制約のZod（6.3-d）
    │   │   ├── api/productApi.ts       # Response型 + mapper + HTTP呼び出し
    │   │   ├── api/productQueries.ts   # queryKey / useProducts / useProduct
    │   │   ├── ui/ProductCard.tsx
    │   │   └── index.ts
    │   ├── cart/
    │   │   ├── model/cart.ts           # Cart, CartLine
    │   │   ├── lib/calcCartTotal.ts    # Q8（純粋関数・テスト対象）
    │   │   ├── api/cartApi.ts, api/cartQueries.ts   # useCart / useCartItemCount(select) Q5
    │   │   ├── ui/CartLineItem.tsx
    │   │   └── index.ts
    │   ├── user/
    │   │   ├── model/user.ts           # AuthUser, UserRole
    │   │   ├── api/userQueries.ts      # useCurrentUser()  Q11
    │   │   └── index.ts
    │   └── category/
    │       ├── model/category.ts       # Category（Mapperは作らない：構造が同一）
    │       ├── api/categoryQueries.ts  # useCategories()（商品フォームの選択肢）
    │       └── index.ts
    │
    ├── mocks/                          # MSW（開発用バックエンド）。shared には入れない
    │   ├── handlers/{auth,products,categories,cart}.ts
    │   ├── db.ts                       # メモリ上の状態。カート集約・在庫チェックもここ
    │   └── browser.ts / server.ts      # 開発用 / テスト用
    │
    └── shared/                         # ドメインを知らないもののみ
        ├── api/
        │   ├── httpClient.ts           # ★ axios を import する唯一のファイル
        │   ├── apiError.ts             # ApiError 判別共用体 + 正規化  Q19
        │   └── authToken.ts            # localStorage の唯一の出入り口  Q15, Q17
        ├── lib/
        │   ├── useDisclosure.ts        # モーダル開閉（Client State）
        │   └── applyServerFieldErrors.ts  # validation → RHF setError
        ├── ui/
        │   ├── Button.tsx / TextField.tsx / Modal.tsx
        │   └── ErrorMessage.tsx
        └── config/
            ├── env.ts
            └── routes.ts               # パス定数（Q18）
```

> **`entities/category/` を作る理由**：商品の新規登録フォームと編集フォームの両方がカテゴリ一覧を必要とします。
> どちらかの feature に置くと、もう一方が **feature → feature の import**（禁止）になります。
> 「2つの feature が同じものを欲しがったら、それは entity の知識だった」という判断の実例です。
> ただし **Mapper は作りません**（`{id, name}` でレスポンスとモデルの構造が同一のため）。

> **`src/mocks/` を `shared/` に入れない理由**：MSW は Product/Cart の**ドメイン知識を持ちます**
> （在庫チェック、カートの数量集約）。`shared` の定義に反するため独立させます。
> 「どこに置けばいいか分からないから shared」を避ける、という規約が実際に効いている箇所です。

---

## 8. 依存方向（ESLint 設定の骨子）

```js
// eslint.config.js（抜粋イメージ）
boundaries/elements: [
  { type: 'app',      pattern: 'src/app/*' },
  { type: 'pages',    pattern: 'src/pages/*' },
  { type: 'features', pattern: 'src/features/*', capture: ['feature'] },
  { type: 'entities', pattern: 'src/entities/*', capture: ['entity'] },
  { type: 'shared',   pattern: 'src/shared/*' },
]

rules:
  app      → pages, features, entities, shared   ✅
  pages    → features, entities, shared          ✅
  features → entities, shared                    ✅
  entities → shared                              ✅
  shared   → shared のみ                          ✅
  features → 他の features                        ❌
  entities → 他の entities                        ❌（必要になったら個別に議論）
  下位 → 上位                                     ❌

+ no-restricted-imports: 'axios' は shared/api/httpClient.ts 以外で禁止
+ import/no-cycle: 循環依存を禁止
+ boundaries/entry-point: features/* と entities/* は index.ts 経由のみ
```

---

## 9. コードリーディング教材として面白くなるポイント

ご提示の8観点に、PDFの設問を紐付けました。

| # | 読みどころ | 対応する設問 | どこを読むと分かるか |
|---|---|---|---|
| 1 | なぜAPI処理をコンポーネントから分離したのか | Q1, Q6 | `eslint.config.js` の axios 禁止ルール |
| 2 | なぜ Server / Client State を分けたのか | Q5, Q17 | `authToken.ts`（Client）vs `userQueries.ts`（Server） |
| 3 | なぜこの state をこのコンポーネントが持つのか | Q5 | カート個数が `useState` ではなく `useCart().select` である理由 |
| 4 | なぜこれを feature にしたのか | Q7, Q12 | `add-to-cart/` に mutation とボタンが同居している構造 |
| 5 | なぜこの型を分けたのか | Q12, Q13 | `ProductFormValues.price: string` と `CreateProductRequest.price: number` |
| 6 | なぜ shared ではなく entity/feature にあるのか | Q8, Q12 | `calcCartTotal` が `shared/lib` にない理由 / スキーマの分割（6.3-d） |
| 7 | Mutation 後になぜ画面が更新されるのか | Q5, Q7, Q9 | `useAddToCart` の `onSuccess` → `invalidateQueries` → header と cart 画面が同時更新 |
| 8 | props / Context / Query Cache の判断基準 | Q3, Q5, Q11 | header のバッジは Query、トークンだけ Context、`product` は props |

**追加の仕掛け（この課題ならではのもの）**

- **Q9（同一商品の再追加）**：数量の集約を **サーバーがやるのか、mapper がやるのか、UI がやるのか**。
  どこでやっているかをコードから特定させると、「責務の置き場所」の議論が自然に発生します。
- **Q15（トークン改ざん）**：`try/catch` が画面側に1つも無いのに 401 が正しく処理される。
  「なぜ画面側にエラー処理が書かれていないのか」を追うと interceptor に到達します。
- **Q4（0件表示）**：`isLoading` / `isError` / `data.length === 0` の3分岐がどこにあるか。
  「空配列」と「取得失敗」を別物として扱っている理由を考えさせます。
- **Q17（リロード）**：ユーザー情報をあえて保存していない。「なぜ保存しないほうが安全か」。
- **ESLintエラー自体が教材**：依存方向を破ると落ちるので、「なぜこの向きなのか」を体で覚えます。

---

## 10. あえて採用しないもの（過剰設計の回避）

| 採用しないもの | 理由 |
|---|---|
| Repository パターン / DIコンテナ | `entities/*/api` が既に境界。層を1つ足しても守れるものが増えない |
| Service クラス・Java風のクラス設計 | 関数とhookで十分。Reactの再レンダリングモデルと相性が悪い |
| Redux / Zustand などのグローバルstate | Server State は Query、Client State はローカルで足りる。導入すると「カート個数を二重管理」を誘発する |
| 全 entity に `model/api/ui/lib` を機械的に作る | `user` には `ui/` が不要。**空ディレクトリを作らない** |
| すべてのレスポンスに Mapper | 構造が同じなら素通し。「作らなかった箇所」も設計判断として記録する |
| Atomic Design（atoms/molecules/organisms） | ドメイン知識の有無で分けるほうが、この題材では判断基準として明確 |
| すべての `useQuery` の custom hook 化 | 名前を付ける価値があるものだけ（`useCartItemCount` は付ける、1回しか使わない取得は付けない） |
| Optimistic Update の全面採用 | データフローの追跡性を優先。カートバッジ1箇所のみ**演習課題**として残す |
| `Result` 型 / neverthrow | 判別共用体の `ApiError` で足りる。例外とResultの二重管理は研修生が混乱する |
| 全フォルダへの barrel `index.ts` | Public API の意味がある `features/*` と `entities/*` のルートのみ |
| Suspense + ErrorBoundary の全面採用 | `isLoading`/`isError` を明示的に書くほうが、Q4 の答えがコードから読める |
| i18n / テーマ切替 / デザイントークン | 今回の学習目的に無関係 |
| 汎用 `<QueryBoundary>` コンポーネント | **判断保留**。loading/error/empty を隠蔽すると Q4 が読めなくなる懸念があり、まずは各画面に明示的に書く方針 |

---

## 11. 決定事項と、実装しないもの

### 決定事項

| 項目 | 決定 |
|---|---|
| バックエンドAPI | **こちらで契約を設計**（`docs/API_DESIGN.md`）。開発中は MSW が同契約で応答 |
| UIライブラリ | **導入しない**。CSS Modules + `shared/ui` の最小限コンポーネント |
| 認証方式 | `Authorization: Bearer <token>`。トークンは `localStorage` が唯一の保管場所 |
| 権限判定 | `GET /auth/me` の `role: "USER" \| "ADMIN"` |
| カートの数量集約（Q9） | **サーバー側で集約**。フロントは `invalidateQueries` のみ |
| カートの合計金額（Q8） | **APIは返さない**。フロントの純粋関数 `calcCartTotal()` で導出 |
| 金額の表現 | 税込・円・整数（小数を持たない） |

### 実装しないもの

- **お気に入り（`toggle-product-like`）** — PDFの設問（Q1〜Q19）に含まれず、この課題の学習目標に対して追加要素が無いため。
  「機能を足さない」判断も設計の一部として `ARCHITECTURE.md` に記録します。
- **注文・決済フロー** — 同上。カートまでが課題範囲です。
- **商品画像のアップロード** — `imagePath` は文字列入力とします（ファイルアップロードは別テーマ）。

### 実装の進め方（提案）

1. Vite + TS + ESLint（依存方向ルール込み）の土台
2. `shared/api`（httpClient / apiError / authToken）+ MSW モックバックエンド
3. `entities`（product / cart / user / category）とテスト（mapper・純粋関数）
4. `app`（Provider / Router / 2種類のレイアウト）+ 認証まわり
5. `features`（sign-in → add-to-cart → 管理者CRUD の順）
6. 重要操作のテスト（サインイン失敗表示 / カート追加でバッジが増える / バリデーションエラー表示）
7. `ARCHITECTURE.md`（答えを書かないリーディングガイド）

---

## 12. 実装後の差分（この提案から変更した点）

実装しながら「そのほうが良い」と判断して変えた箇所です。理由も併記します。

| 提案時 | 実装 | 変更した理由 |
|---|---|---|
| `pages/<画面名>/XxxPage.tsx` | `pages/XxxPage.tsx`（1画面1ファイル） | 中身が1ファイルしかないフォルダを9個作ることになり、「過剰分割の禁止」に反するため |
| `features/create-product/model/schema.ts` と `features/update-product/model/schema.ts` | `entities/product/model/productFields.ts` に集約 | 新規登録と編集で書き込む項目が完全に同じだった。同じ schema のファイルを2つ置くほうが不誠実 |
| `app/providers/AuthTokenProvider`（Context でトークンを配る） | **Context を作らず** `shared/api/useAuthToken`（`useSyncExternalStore`）を直接呼ぶ | Context を挟むと localStorage → Context → 画面 と真実が2段になる。購読で足りると分かったので Context を1つも作らない構成にした。結果として **このアプリに Context は存在しない** |
| `entities/category/{model,api}/` | `entities/category/index.ts` の1ファイル | 中身が数行ずつになるため。「Mapper を作らない例」としても、1ファイルのほうが対比が見やすい |
| 商品フォームに画像パス項目 | 画像はモック側で固定 | 画像アップロードは学習目標から外れる。フォームの項目を1つ減らして本題を目立たせた |
| `shared/ui/QueryBoundary`（判断保留としていた） | **採用せず** | loading / error / 0件 の分岐を隠すと、PDF Q4 の答えがコードから読めなくなる。各画面に明示的に書く方式にした |
| `entities` 同士は一律禁止 | `cart → product` の1本だけ ESLint で明示的に許可 | 「カートは商品を含む」はドメインそのもの。禁止すると Product の劣化コピーが生まれる。例外を隠さず設定ファイルに書くこと自体を教材にした |
| `boundaries/element-types` | `boundaries/dependencies`（v7 の新API） | 導入した eslint-plugin-boundaries v7 で旧ルール名が非推奨になっていたため |

### 検証結果

```
npm run test       →  7 files / 31 tests passed
npm run typecheck  →  エラーなし（strict + noUncheckedIndexedAccess）
npm run lint       →  エラーなし
npm run build      →  成功
```

依存方向ルールが機能していることは、意図的な違反ファイルを作って確認済みです
（`entities → entities` / `features → features` / `shared → entities` の3種類がいずれも検出されました）。
