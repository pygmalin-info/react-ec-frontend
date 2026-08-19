import { BrowserRouter } from 'react-router-dom'
import { AppErrorBoundary } from './AppErrorBoundary'
import { AuthSessionProvider } from './AuthSessionProvider'
import { QueryProvider } from './QueryProvider'

/**
 * アプリ全体の配線。
 *
 * 入れ子の順序には理由がある:
 *   AppErrorBoundary … 一番外。中で何が壊れても受け止められるように
 *     QueryProvider  … AuthSessionProvider が useQueryClient を使うので、その外側
 *       AuthSessionProvider
 *         BrowserRouter … 画面に関わる部分だけを包む
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppErrorBoundary>
      <QueryProvider>
        <AuthSessionProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </AuthSessionProvider>
      </QueryProvider>
    </AppErrorBoundary>
  )
}
