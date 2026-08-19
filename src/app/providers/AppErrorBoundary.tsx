import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'

type Props = { children: ReactNode }
type State = { hasError: boolean }

/**
 * 想定外エラーの最後の受け皿（PDF Q19）。
 *
 * ■ なぜここだけクラスコンポーネントなのか
 *   レンダリング中に投げられた例外を捕まえる仕組みは、現状クラスにしか無い。
 *   「React で Java 風のクラス設計をしない」という方針と矛盾しないのは、
 *   これが設計上の選択ではなく React の制約だから。
 *
 * ■ ここで捕まるもの / 捕まらないもの
 *   捕まる  : レンダリング中の例外（undefined のプロパティ参照など）
 *   捕まらない: API エラー
 *              API エラーは Promise の中で起きるのでここには来ない。
 *              そちらは useQuery / useMutation の error として各画面が受け取る。
 *   つまりこの境界は「バグの受け皿」であって、「エラー処理の本体」ではない。
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 実プロジェクトではここで監視サービスへ送る
    console.error('[AppErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="layout__main">
        <Alert>
          <p>予期しないエラーが発生しました。</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            再読み込み
          </Button>
        </Alert>
      </div>
    )
  }
}
