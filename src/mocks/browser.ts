import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/** ブラウザ（開発サーバー）用。src/app/main.tsx から起動する */
export const worker = setupWorker(...handlers)
