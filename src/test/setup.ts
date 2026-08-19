import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

/**
 * findBy* の待ち時間を既定の 1 秒から延ばす。
 *
 * テストファイルは複数のワーカーで同時に実行されるため、
 * マシンが混んでいると「描画されるのを待つ」だけで1秒を超えることがある。
 * 待ち時間が短いと、コードは正しいのに落ちるテストになってしまう。
 */
configure({ asyncUtilTimeout: 5000 })
import { authToken } from '@/shared/api/authToken'
import { db } from '@/mocks/db'
import { server } from '@/mocks/server'

/**
 * テスト全体の準備。
 *
 * ■ なぜ axios をモックせず、HTTP のレベル（MSW）でモックするのか
 *   axios をモックすると、httpClient の interceptor（トークン付与・エラー正規化）が
 *   丸ごと飛ばされる。それはこのアプリで最も検証したい部分。
 *   HTTP のレベルで差し替えれば、
 *     API関数 → Mapper → interceptor → Query → 画面
 *   の経路を通したまま、成功/失敗を作り分けられる。
 */
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  server.resetHandlers()
  db.reset()
  // authToken.clear() が localStorage からも消すので、これだけでよい
  authToken.clear()
})

afterAll(() => server.close())
