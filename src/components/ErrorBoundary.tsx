import { colors } from '../brand'
const S = colors
import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: S.bg,
            padding: 24,
            maxWidth: 390,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minHeight: '100vh',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <p style={{ color: S.red, fontSize: 16, margin: 0, textAlign: 'center' }}>
            Quelque chose s'est mal pass&eacute;.
          </p>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: 14, borderRadius: 12 }}
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/' }}
          >
            Retour &agrave; l'accueil
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
