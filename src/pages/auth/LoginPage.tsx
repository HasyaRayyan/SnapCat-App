import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { User, Lock, LogIn } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import './Auth.css'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
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
        setError('Email/Username atau password salah.')
      } else if (signInError.message.toLowerCase().includes('email not confirmed')) {
        setError('Email belum dikonfirmasi. Silakan periksa inbox email kamu atau matikan "Confirm email" di Supabase Dashboard.')
      } else {
        setError(signInError.message)
      }
    }
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🐾</span>
          <h1>StrayDex</h1>
          <p>Masuk menggunakan Email atau Username</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <Input
            label="Email atau Username"
            type="text"
            placeholder="contoh@email.com atau nama_user"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            icon={<User size={18} />}
            required
            autoComplete="username"
          />

          <Input
            label="Password"
            type="password"
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={18} />}
            required
            autoComplete="current-password"
          />

          <div className="auth-forgot">
            <Link to="/forgot-password">Lupa password?</Link>
          </div>

          <Button type="submit" loading={loading} fullWidth icon={<LogIn size={18} />}>
            Masuk
          </Button>
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
