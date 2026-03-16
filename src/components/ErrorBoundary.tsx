import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', padding: 32, color: 'var(--text-muted)',
        }}>
          <h3 style={{ marginBottom: 8, color: 'var(--text-high)' }}>Something went wrong</h3>
          <p style={{ fontSize: 13, marginBottom: 16, textAlign: 'center', maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '6px 16px', borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
