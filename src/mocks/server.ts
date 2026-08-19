import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * テスト（Vitest）用。
 *
 * ブラウザ用と同じ handlers を使い回すのが重要。
 * 「テストのときだけ都合よく動くモック」だと、テストが通ってもアプリは動かない。
 */
export const server = setupServer(...handlers)
