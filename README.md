# Training EC – React フロントエンド

React 研修用の EC サイトフロントエンドです。

| 読むもの | 内容 |
|---|---|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | 設計の全体像と、考えてほしい問い |
| **[docs/READING_GUIDE.md](./docs/READING_GUIDE.md)** | コードの追い方（grep / Devtools / 型のたどり方） |
| **[docs/DEBUG_EXERCISES.md](./docs/DEBUG_EXERCISES.md)** | バグ改修演習（12問） |
| [docs/API_DESIGN.md](./docs/API_DESIGN.md) | 接続する API の契約 |

**進め方の目安**: ARCHITECTURE → READING_GUIDE → 実際にコードを追う → DEBUG_EXERCISES

## セットアップ

```bash
npm install
cp .env.example .env
npm run dev
```

<http://localhost:5173/> が開きます。

## 動作確認用アカウント

| 役割 | メールアドレス | パスワード |
|---|---|---|
| 一般ユーザー | `user@example.com` | `Password1` |
| 管理者 | `admin@example.com` | `Password1` |

## バックエンドについて

実バックエンドが未提供のため、**API の契約をこちら側で定義**しています。

- 契約: [`docs/API_DESIGN.md`](./docs/API_DESIGN.md)
- 実装（開発用モックバックエンド）: `src/mocks/`

MSW（Mock Service Worker）がブラウザのリクエストを横取りして、この契約どおりに応答します。
在庫チェック・カートの数量集約・権限チェック・各種エラーもモック側で実装しているので、
エラー時の画面も実際に触って確認できます。

実バックエンドに繋ぐときは `.env` を変更してください。

```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_USE_MOCK=false
```

## スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | 型チェック + 本番ビルド |
| `npm run typecheck` | 型チェックのみ |
| `npm run lint` | ESLint（**依存方向の検査を含む**） |
| `npm run test` | テスト |
| `npm run test:watch` | テスト（ウォッチ） |
| `npm run bug -- list` | バグ改修演習の問題一覧 |
| `npm run bug -- apply 03` | 3番のバグを仕込む |
| `npm run bug -- reset` | 仕込んだバグをすべて元に戻す |

`npm run lint` は文法だけでなく、**レイヤー間の依存方向**も検査します。
`entities` から `features` を import する、`shared` から `entities` を import する、
`axios` を `httpClient.ts` 以外で import する、といった設計違反はここで落ちます。

## ディレクトリ構成（概要）

```
src/
├── app/          Router / Provider / レイアウト / エラー境界
├── pages/        画面の組み立て
├── features/     ユーザーの操作（sign-in, add-to-cart, create-product …）
├── entities/     ドメインの概念（product, cart, user, category）
├── shared/       ドメインを知らない共通処理
├── mocks/        開発用モックバックエンド
└── test/         テストのセットアップ
```

依存方向は `app / pages → features → entities → shared` です。
詳しくは [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。

## テストで検証していること

「カバレッジを上げるためのテスト」は書いていません。壊れたら困るものだけを対象にしています。

| 対象 | ファイル |
|---|---|
| ドメインの計算（カート合計） | `src/entities/cart/lib/calcCartTotal.test.ts` |
| Mapper（API レスポンス → フロントのモデル） | `src/entities/product/api/productApi.test.ts` |
| Zod schema（入力検証と型変換） | `src/entities/product/model/productFields.test.ts` |
| エラーの分類 | `src/shared/api/apiError.test.ts` |
| 重要な操作（カート追加 → 画面更新） | `src/features/add-to-cart/ui/AddToCartButton.test.tsx` |
| フォームの成功 / 失敗 | `src/features/sign-in/ui/SignInForm.test.tsx` |
| 一覧の成功 / 0件 / 失敗 | `src/pages/ProductListPage.test.tsx` |
