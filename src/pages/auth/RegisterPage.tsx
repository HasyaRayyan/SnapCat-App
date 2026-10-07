import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, UserPlus, CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import './Auth.css'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Validasi password:
  // "password harus lebih dari 6 digit harus ada huruf dan kapital"
  const isLengthValid = password.length > 6
  const hasCapital = /[A-Z]/.test(password)
  const hasLetter = /[a-zA-Z]/.test(password)
  const isPasswordValid = isLengthValid && hasCapital && hasLetter

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanEmail = email.trim()
    const cleanUsername = username.trim().toLowerCase().replace(/\s/g, '_')

    if (!cleanEmail || !cleanUsername || !password) {
      setError('Semua kolom wajib diisi!')
      return
    }

    if (cleanUsername.length < 3) {
      setError('Username minimal 3 karakter')
      return
    }

    if (!isLengthValid) {
      setError('Password harus lebih dari 6 digit (minimal 7 karakter)!')
      return
    }

    if (!hasCapital) {
      setError('Password harus mengandung huruf kapital (A-Z)!')
      return
    }

    if (!hasLetter) {
      setError('Password harus mengandung huruf!')
      return
    }

    setLoading(true)
    const { error: signUpError, session } = await signUp(cleanEmail, password, cleanUsername)

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else {
      if (session) {
        navigate('/dashboard')
      } else {
        setSuccess(true)
        setLoading(false)
      }
    }
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-ambient-glow glow-top" />
        <div className="auth-ambient-glow glow-bottom" />

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo-badge">
              <span className="auth-logo-emoji">🎉</span>
            </div>
            <h1 className="auth-brand-name">Pendaftaran Berhasil!</h1>
            <p className="auth-brand-desc">
              Selamat datang di StrayCat, <strong>@{username}</strong>!
            </p>
          </div>
          <div style={{ padding: '24px 32px' }}>
            <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 20, textAlign: 'center' }}>
              Akun kamu siap digunakan. Silakan masuk untuk mulai mengoleksi kucing yang kamu temui.
            </p>
            <Button fullWidth size="lg" onClick={() => navigate('/login')}>
              Masuk Sekarang
            </Button>
          </div>
          <div className="auth-footer">
            <p>
              <Link to="/login">Kembali ke Login</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-ambient-glow glow-top" />
      <div className="auth-ambient-glow glow-bottom" />

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <span className="auth-logo-emoji">🐱</span>
          </div>
          <h1 className="auth-brand-name">Daftar StrayCat</h1>
          <p className="auth-brand-desc">Mulai petualangan koleksi kucing liar!</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <Input
            label="Email"
            type="email"
            placeholder="email@contoh.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
            required
            autoComplete="email"
          />

          <Input
            label="Username"
            type="text"
            placeholder="username_kamu"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
            icon={<User size={18} />}
            required
            autoComplete="username"
          />

          <div className="password-input-container">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimal 7 digit, ada huruf & kapital"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} />}
              required
              autoComplete="new-password"
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

          {/* Indikator ketentuan password */}
          <div className="password-hints">
            <span className="password-hints-title">Ketentuan Password:</span>
            <div className={`hint-item ${isLengthValid ? 'valid' : ''}`}>
              {isLengthValid ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              <span>Lebih dari 6 digit (minimal 7 karakter)</span>
            </div>
            <div className={`hint-item ${hasCapital ? 'valid' : ''}`}>
              {hasCapital ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              <span>Memiliki huruf kapital (A-Z)</span>
            </div>
            <div className={`hint-item ${hasLetter ? 'valid' : ''}`}>
              {hasLetter ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              <span>Memiliki huruf</span>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="lg"
            icon={<UserPlus size={18} />}
            disabled={password.length > 0 && !isPasswordValid}
          >
            Daftar Akun StrayCat
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Sudah punya akun? <Link to="/login">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
