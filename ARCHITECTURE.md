# ARCHITECTURE

このプロジェクトは 2つの目的を持っています。

1. React 研修生が EC サイトを題材にフロントエンド開発を行うための土台
2. React 経験者が「なぜこの設計になっているのか」を考えるためのコードリーディング教材

**この文書は地図であって、答えではありません。**
「なぜそうしたのか」はコード側のコメントに書いてあります。
先に答えを読まず、まず自分で追いかけてみてください。

追いかけ方（grep のしかた、Devtools の使い方、型のたどり方）は
**[docs/READING_GUIDE.md](./docs/READING_GUIDE.md)** にまとめてあります。
読んだあとの練習には **[docs/DEBUG_EXERCISES.md](./docs/DEBUG_EXERCISES.md)**（バグ改修演習12問）を使ってください。

---

## 1. Architecture

### ディレクトリ構成

```
src/
├── app/          アプリ全体の配線（Router / Provider / レイアウト / エラー境界）
├── pages/        画面の組み立て
├── features/     ユーザーが行う操作（ユースケース）
├── entities/     EC サイトの主要な概念（商品・カート・ユーザー・カテゴリ）
├── shared/       ドメインを知らない共通処理（HTTP 基盤・汎用UI・設定）
├── mocks/        開発用モックバックエンド（MSW）
└── test/         テスト用のセットアップとユーティリティ
```

### 各レイヤーの責務

| レイヤー | 担当すること | 置いてはいけないもの |
|---|---|---|
| `app` | 起動、Provider の合成、ルーティング、レイアウト、想定外エラーの受け皿 | 個別機能の業務ロジック |
| `pages` | 「この画面が何でできているか」を示す組み立て | API 呼び出し、バリデーション、大量の state |
| `features` | 1つの操作（ログインする、カートに追加する、商品を登録する…） | 他の feature への依存 |
| `entities` | ドメインのモデル・取得 Query・表示部品・ドメインの計算 | 「操作」の実装 |
| `shared` | HTTP クライアント、エラーの型、汎用 UI、設定 | Product / Cart 固有の知識 |

### 依存方向

```
app / pages
     ↓
  features
     ↓
  entities
     ↓
   shared
```

- 上から下への参照のみ許可
- **feature 同士・entity 同士の横断参照も禁止**
- 循環依存禁止

このルールは `eslint.config.js` が機械的に検査します（Java の ArchUnit と同じ考え方）。
`npm run lint` で違反が検出されます。**破ってみて、どんなメッセージが出るか確かめてみてください。**

例外が1つだけあります。どこで、なぜ許可されているかは `eslint.config.js` を読んでください。

### 主要ライブラリ

| ライブラリ | 用途 |
|---|---|
| React 19 / TypeScript / Vite | 基盤 |
| React Router v7 | ルーティング、レイアウト切り替え、画面の保護 |
| TanStack Query v5 | Server State（サーバーから取得したデータ） |
| React Hook Form + Zod | フォームの状態管理とバリデーション |
| Axios | HTTP 通信 |
| TanStack Query Devtools | Query Cache の中身を目で確認する（開発時のみ・画面左下） |
| MSW | 開発用モックバックエンド、テストでの API 差し替え |
| Vitest + Testing Library | テスト |
| eslint-plugin-boundaries | 依存方向の検査 |

### API 仕様

このフロントエンドが前提としている API の契約は **[`docs/API_DESIGN.md`](./docs/API_DESIGN.md)** にあります。
開発中は `src/mocks/` がその契約どおりに応答します。

---

## 2. Reading Guide

### 入口：「商品をカートに追加する」を1本追いかける

以下のファイルを **この順番で** 開いてください。
各ステップに問いを置いてあります。答えは書いていません。

```
① src/pages/ProductDetailPage.tsx
        ↓
② src/features/add-to-cart/ui/AddToCartButton.tsx
        ↓
③ src/features/add-to-cart/api/useAddToCart.ts
        ↓
④ src/entities/cart/api/cartApi.ts
        ↓
⑤ src/shared/api/httpClient.ts
        ↓
⑥ src/mocks/handlers/cart.ts        （バックエンドの代役）
        ↓
⑦ src/entities/cart/api/cartQueries.ts
        ↓
⑧ src/app/layouts/ShopLayout.tsx     （ヘッダのカートバッジ）
```

| ステップ | 見るもの | 問い |
|---|---|---|
| ① | ページが何を組み立てているか | このページに API 呼び出しが1行も無いのはなぜ？ |
| ② | ボタンが受け取っている props | なぜ `product` 全体ではなく `productId` だけ？ |
| ③ | `onSuccess` の中身 | `invalidateQueries` は「何を」しているのか？ |
| ④ | 送信している内容 | 「同じ商品なら数量を足す」処理はどこにも無い。誰がやっている？ |
| ⑤ | interceptor 2つ | トークンはどこで載っている？ エラーはどこで形が変わる？ |
| ⑥ | `addCartItem` | ここでの判断がフロントの実装をどう単純にしている？ |
| ⑦ | `useCart` と `useCartItemCount` | 2つの hook が同じ `queryKey` を使っているのはなぜ？ |
| ⑧ | バッジの数字 | ②と⑧は親子でも兄弟でもない。なぜ片方の操作でもう片方が変わる？ |

追いかけ終わったら、`src/features/add-to-cart/ui/AddToCartButton.test.tsx` を読んでください。
上の流れがそのままテストになっています。

---

## 3. 自分で考えてほしい問い

コードを読んで、**自分の言葉で説明できるか**を試してください。
（社内の「React EC 課題テスト」の設問に対応しています）

### 状態の持ち主について

1. ヘッダのカート個数は、なぜ `useState` で持っていないのか
2. ログイン中のユーザーのメールアドレスは、なぜ Context にもグローバル state にも入っていないのか
3. トークンは React の state ではなくどこにあるか。なぜそこなのか
4. 商品一覧の検索キーワードは `useState`。カート個数は `useState` ではない。何が違うのか
5. カート内の数量変更に `useState` が無いのに、商品編集フォームには入力途中の状態がある。何が違うのか

### 型について

6. `ProductResponse` と `Product` が別の型なのはなぜか
7. `ProductFormValues` の `price` は `string`、`ProductInput` の `price` は `number`。どこで変わるのか
8. `ProductId` がただの `string` ではないのはなぜか
9. `entities/category` には Mapper が無い。`entities/product` にはある。判断の基準は何か
10. `useQuery` の `error` が `ApiError` 型になっているのはなぜか。誰がその型を保証しているのか

### 置き場所について

11. `calcCartTotal` が `shared/lib` ではなく `entities/cart/lib` にあるのはなぜか
12. `formatYen` は `shared/lib` にある。`calcCartTotal` との違いは何か
13. 商品の入力制約（`productFields`）が `entities` にあり、ログインフォームの schema が `features` にあるのはなぜか
14. `ProductFormFields` が `entities/product/ui` にあるのはなぜか
15. `src/mocks` が `shared` に入っていないのはなぜか
16. カート追加ボタンが `ProductCard` の中に無いのはなぜか

### エラーと認証について

17. トークンを書き換えて API を叩くと何が起きるか。処理が3箇所に分かれている理由は何か
18. 401 のうち1つだけ、自動ログアウトの対象外になっている。どれで、なぜか
19. 画面をリロードしてもログイン状態が続くのはなぜか。ユーザー情報はどこから復元されるか
20. フロントでバリデーションしているのに、サーバーのエラーを表示する仕組みがあるのはなぜか
21. 商品削除にはフォームが無いのに、エラー表示がある。どんなエラーか
22. 「取得に失敗した」と「0件だった」を別々に扱っているのはなぜか

### 更新について

23. 商品を編集したあと、詳細は `setQueryData`、一覧は `invalidateQueries`。使い分けの基準は何か
24. ログイン成功時は `invalidateQueries` ではなく `setQueryData`。なぜか
25. ログアウトが `onSuccess` ではなく `onSettled` なのはなぜか。`queryClient.clear()` を消すと何が起きるか

---

## 4. 演習課題

研修で手を動かす場合の題材です。難易度順に並んでいます。

1. **商品一覧にページネーションを追加する**
   `GET /products` は `page` と `totalCount` を返します。
   `queryKey` に何を含めるべきか、が考えどころです。

2. **カート追加を Optimistic Update に書き換える**
   現在は `invalidateQueries` のみです。
   `onMutate` / `onError` / `onSettled` を使って書き換え、
   **書き換えたあとに読みやすくなったか / 読みにくくなったか**を議論してください。
   （この教材ではあえて使っていません。その判断が妥当かを検証する課題です）

3. **お気に入り機能（`toggle-product-like`）を追加する**
   API から作る必要があります。`docs/API_DESIGN.md` に追記してから、
   `src/mocks` → `entities` → `features` の順に実装してください。
   新しい feature を作るとき、どこに何を置くか迷ったら
   「2つ以上の feature が欲しがるか？」を基準にしてください。

4. **依存方向をわざと破る**
   `src/entities/product` から `src/features/add-to-cart` を import して `npm run lint` を実行し、
   何が起きるか確認してください。そのうえで「なぜこの向きが禁止されているのか」を説明してください。

5. **バックエンドを差し替える**
   `.env` の `VITE_USE_MOCK=false` にして、実際の API に繋いでください。
   変更が必要になったファイルが何個あったかを数えてください。
   （それがこの設計で「守れたもの」の大きさです）

---

## 5. この設計であえて採用しなかったもの

理由を考えながら読んでください。必要になったら採用してよい、という前提です。

- Repository パターン / DI コンテナ
- Redux / Zustand などのグローバル state ライブラリ
- Atomic Design（atoms / molecules / organisms）
- すべてのレスポンスに Mapper を作ること
- すべての `useQuery` を custom hook にすること
- Optimistic Update の全面採用
- `Result` 型 / neverthrow
- すべてのフォルダへの barrel（`index.ts`）
- Suspense + ErrorBoundary の全面採用
- UI ライブラリ

---

## 6. ESLint が守っているルール

`eslint.config.js` に3つだけ書いてあります。

1. **レイヤーの依存方向**（`boundaries/dependencies`）
2. **循環依存の禁止**（`import-x/no-cycle`）
3. **`axios` を import できる場所の限定**（`no-restricted-imports`）

ルールを増やしすぎると「ESLint を黙らせる作業」になるため、この3つに絞っています。
それぞれが「何を守っているのか」を、設定ファイルのコメントと合わせて確認してください。
