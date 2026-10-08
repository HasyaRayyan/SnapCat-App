import { Component, type ReactNode } from 'react'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { routes } from './routes'
import { Button } from './components/ui/Button'
import './index.css'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('Application Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          background: 'var(--bg)',
          color: 'var(--text-h)',
          fontFamily: 'var(--sans)',
        }}>
          <span style={{ fontSize: 48, marginBottom: 16 }}>🐱</span>
          <h2 style={{ fontSize: 22, margin: '0 0 8px' }}>Terjadi Kesalahan Tampilan</h2>
          <p style={{ color: 'var(--text)', maxWidth: 420, margin: '0 0 20px', fontSize: 14 }}>
            {this.state.error?.message || 'Gagal memuat komponen aplikasi.'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Muat Ulang Halaman
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

function AppRoutes() {
  const element = useRoutes(routes)
  return element
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
