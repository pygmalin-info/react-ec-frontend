import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'
import importX from 'eslint-plugin-import-x'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * このファイルは「設計ルールを人間の注意だけに頼らない」ための仕組みです。
 * Java の ArchUnit がテストで設計違反を落とすのと同じ役割を、フロントエンドでは ESLint が担います。
 *
 * 守っているルールは3つだけです。
 *   1. レイヤーの依存方向          … boundaries/element-types
 *   2. 循環依存の禁止              … import-x/no-cycle
 *   3. axios を直接使える場所の限定 … no-restricted-imports
 *
 * ルールを増やしすぎると「ESLint を黙らせる作業」になるため、この3つに絞っています。
 */
export default defineConfig([
  globalIgnores([
    'dist',
    'node_modules',
    'coverage',
    'public/mockServiceWorker.js',
    // iCloud Drive 上で作業すると「vite.config 2.ts」のような複製が作られることがある。
    // 中身は同じでも tsconfig に含まれないため、パースエラーで lint 全体が落ちる。
    '**/* [0-9].*',
  ]),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { boundaries, 'import-x': importX },
    settings: {
      // "@/..." エイリアスを解決できないと、boundaries は依存先を "unknown" として素通ししてしまう。
      'import-x/resolver': { typescript: { project: './tsconfig.app.json' } },
      'import/resolver': { typescript: { project: './tsconfig.app.json' } },
      'boundaries/include': ['src/**/*'],
      // レイヤー = ディレクトリ。
      // features と entities は「src/features/*」と1つ下まで要素として切り出しているので、
      // add-to-cart と sign-in は別々の要素になる（= 横断 import を検出できる）。
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        // pages は1画面1ファイル。フォルダを切るほどの中身が無いので、まとめて1つの要素として扱う
        { type: 'pages', pattern: 'src/pages' },
        { type: 'features', pattern: 'src/features/*', capture: ['feature'] },
        { type: 'entities', pattern: 'src/entities/*', capture: ['entity'] },
        { type: 'shared', pattern: 'src/shared' },
        { type: 'mocks', pattern: 'src/mocks' },
        { type: 'test', pattern: 'src/test' },
      ],
      // テストファイルは「どのレイヤーにあるか」より「テストであること」を優先して扱う
      'boundaries/files': [{ category: 'test', pattern: '**/*.test.{ts,tsx}' }],
    },
    rules: {
      /* ------------------------------------------------------------------
       * 1. 依存方向
       *
       *      app / pages
       *           ↓
       *        features
       *           ↓
       *        entities
       *           ↓
       *         shared
       *
       * 上から下へは参照してよい。下から上は禁止。
       * さらに feature 同士 / entity 同士の横断参照も禁止している。
       * 「2つの feature が同じものを欲しがったら、それは entity の知識だった」に気付かせるため。
       * ------------------------------------------------------------------ */
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            '{{from.element.type}} から {{to.element.type}} は import できません（依存方向: app/pages → features → entities → shared）',
          policies: [
            // app は全体の配線係なので、すべてを知ってよい唯一のレイヤー。
            {
              from: { element: { type: 'app' } },
              allow: {
                to: {
                  element: { types: { anyOf: ['app', 'pages', 'features', 'entities', 'shared', 'mocks'] } },
                },
              },
            },
            {
              from: { element: { type: 'pages' } },
              allow: { to: { element: { types: { anyOf: ['features', 'entities', 'shared'] } } } },
            },
            // features → entities / shared のみ。
            // features → features を許していないので、add-to-cart が sign-in を import すると落ちる。
            {
              from: { element: { type: 'features' } },
              allow: { to: { element: { types: { anyOf: ['entities', 'shared'] } } } },
            },
            // entities → shared のみ。entities 同士の横断も同様に落ちる。
            {
              from: { element: { type: 'entities' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            // ただし cart → product だけは例外として許可する。
            //
            // 「カートは商品を含む」はこのECサイトのドメインそのもので、
            // 禁止すると Product の項目を写した劣化コピーが cart 側にできるだけ。
            // ルールは目的（結合を減らす）のためにあるので、目的に反する場合は例外を作る。
            // ただし例外は「明示」する。逆方向（product → cart）は許可していない。
            {
              from: { element: { type: 'entities', captured: { entity: 'cart' } } },
              allow: { to: { element: { type: 'entities', captured: { entity: 'product' } } } },
            },
            // テストは検証対象を自由に import してよい（モックサーバーやテスト用ユーティリティを含む）
            {
              from: { file: { categories: 'test' } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ['app', 'pages', 'features', 'entities', 'shared', 'mocks', 'test'] },
                  },
                },
              },
            },
            { from: { element: { type: 'shared' } }, allow: { to: { element: { type: 'shared' } } } },
            // mocks は「バックエンドの代役」。フロントの型を知らない独立した存在にしておく。
            // shared/config だけを参照させることで、フロントの都合がモックに漏れない。
            { from: { element: { type: 'mocks' } }, allow: { to: { element: { type: 'shared' } } } },
            {
              from: { element: { type: 'test' } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ['app', 'pages', 'features', 'entities', 'shared', 'mocks', 'test'] },
                  },
                },
              },
            },
          ],
        },
      ],

      /* 2. 循環依存の禁止 */
      'import-x/no-cycle': ['error', { maxDepth: 10 }],

      /* ------------------------------------------------------------------
       * 3. axios を import してよいのは shared/api/httpClient.ts だけ
       *
       * 「コンポーネントから直接 axios を呼ばない」という規約を、レビューではなくツールで守る。
       * ここが崩れると、API 呼び出しが画面に散り、エラー処理も散る。
       * ------------------------------------------------------------------ */
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'axios',
              message:
                'axios を直接 import できるのは shared/api/httpClient.ts だけです。API 呼び出しは entities/*/api を経由してください。',
            },
          ],
        },
      ],

      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // httpClient だけは axios を使ってよい（上のルールの唯一の出口）
  {
    files: ['src/shared/api/httpClient.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },

  // テストとモックでは表現の自由度を上げる
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*', 'src/mocks/**/*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])
