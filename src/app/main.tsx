import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { env } from '@/shared/config/env'
import '@/shared/ui/ui.css'
import { AppProviders } from './providers/AppProviders'
import { AppRouter } from './router/AppRouter'

/**
 * アプリの起動。
 *
 * モックバックエンド（MSW）を使う場合は、必ず起動を待ってから render する。
 * 先に render すると、最初の API 呼び出しがモックに捕まらず本当に外へ出ていく。
 */
async function bootstrap() {
  if (env.useMock) {
    const { worker } = await import('@/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }

  const container = document.getElementById('root')
  if (container === null) throw new Error('#root が見つかりません')

  createRoot(container).render(
    <StrictMode>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </StrictMode>,
  )
}

void bootstrap()
