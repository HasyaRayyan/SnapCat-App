import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Send, KeyRound } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import './Auth.css'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await resetPassword(email)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo-badge">
              <Mail size={24} color="#ffffff" strokeWidth={1.75} />
            </div>
            <h1 className="auth-brand-name">Email Terkirim</h1>
            <p className="auth-brand-desc">Cek inbox email <strong>{email}</strong> untuk link reset password.</p>
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
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <KeyRound size={24} color="#ffffff" strokeWidth={1.75} />
          </div>
          <h1 className="auth-brand-name">Lupa Password</h1>
          <p className="auth-brand-desc">Masukkan email kamu untuk reset password</p>
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
          />

          <Button type="submit" loading={loading} fullWidth icon={<Send size={18} />}>
            Kirim Link Reset
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Ingat password? <Link to="/login">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
