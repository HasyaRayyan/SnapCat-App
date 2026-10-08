import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { User, Lock, LogIn, Eye, EyeOff, KeyRound } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import './Auth.css'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!identifier.trim() || !password) {
      setError('Harap isi username/email dan password!')
      return
    }

    setLoading(true)

    const { error: signInError } = await signIn(identifier, password)
    if (signInError) {
      if (signInError.message.toLowerCase().includes('invalid login credentials')) {
        setError('Email/Username atau password salah. Cek kembali akun Anda.')
      } else if (signInError.message.toLowerCase().includes('email not confirmed')) {
        setError('Email belum dikonfirmasi. Silakan matikan "Confirm email" di Supabase Dashboard atau periksa inbox Anda.')
      } else {
        setError(signInError.message)
      }
    }
    setLoading(false)
  }

  // Isi otomatis dengan akun demo yang dibuat di SQL
  const handleFillDemo = () => {
    setIdentifier('admin')
    setPassword('Password123')
    setError('')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <span className="auth-logo-emoji">🐱</span>
          </div>
          <h1 className="auth-brand-name">StrayCat</h1>
          <p className="auth-brand-desc">Koleksi & Catat Kucing Liar yang Kamu Temui 🐾</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <Input
            label="Email atau Username"
            type="text"
            placeholder="admin atau email@kamu.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            icon={<User size={18} />}
            required
            autoComplete="username"
          />

          <div className="password-input-container">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan password akun"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} />}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="auth-forgot">
            <Link to="/forgot-password">Lupa password?</Link>
          </div>

          <Button type="submit" loading={loading} fullWidth size="lg" icon={<LogIn size={18} />}>
            Masuk ke StrayCat
          </Button>

          {/* Quick Demo Fill Button */}
          <button
            type="button"
            className="demo-account-chip"
            onClick={handleFillDemo}
            title="Klik untuk otomatis mengisi username & password demo"
          >
            <KeyRound size={15} />
            <span>Pakai Akun Demo (admin / Password123)</span>
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Belum punya akun? <Link to="/register">Daftar sekarang</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
