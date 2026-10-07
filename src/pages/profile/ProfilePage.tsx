import { useState, type FormEvent } from 'react'
import { User, Mail, FileText, Lock, Save, Info, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { useAnimals } from '../../hooks/useAnimals'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import './Profile.css'

const APP_VERSION = '1.0.0'

export default function ProfilePage() {
  const { user, updatePassword, signOut } = useAuth()
  const { profile, loading, updateProfile } = useProfile()
  const { animals } = useAnimals()

  // Edit profile
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  // Password
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // About
  const [showAbout, setShowAbout] = useState(false)

  const startEditing = () => {
    if (profile) {
      setFullName(profile.full_name)
      setUsername(profile.username)
      setBio(profile.bio ?? '')
    }
    setEditing(true)
    setProfileError('')
    setProfileSuccess('')
  }

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setProfileError('')
    setProfileSuccess('')

    const { error } = await updateProfile({
      full_name: fullName,
      username,
      bio: bio || null,
    })

    if (error) {
      setProfileError(error.message)
    } else {
      setProfileSuccess('Profil berhasil diperbarui!')
      setEditing(false)
    }
    setSaving(false)
  }

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('Password tidak cocok!')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password minimal 6 karakter')
      return
    }

    setPasswordLoading(true)
    const { error } = await updatePassword(newPassword)
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess('Password berhasil diubah!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setShowPasswordModal(false), 1500)
    }
    setPasswordLoading(false)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="profile-page">
      <h1>👤 Profil Saya</h1>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar">
          {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
        </div>

        {editing ? (
          <form onSubmit={handleSaveProfile} className="profile-form">
            {profileError && <div className="auth-error">{profileError}</div>}

            <Input
              label="Nama Lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<User size={18} />}
              required
            />
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
              icon={<User size={18} />}
              required
            />
            <div className="input-group">
              <label className="input-label">Bio</label>
              <div className="input-wrapper">
                <span className="input-icon"><FileText size={18} /></span>
                <textarea
                  className="input-field has-icon textarea-field"
                  placeholder="Ceritakan tentang diri kamu..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="profile-form-actions">
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Batal</Button>
              <Button type="submit" loading={saving} icon={<Save size={16} />}>Simpan</Button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            {profileSuccess && <div className="success-msg">{profileSuccess}</div>}
            <h2>{profile?.full_name}</h2>
            <p className="profile-username">@{profile?.username}</p>
            {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
            <p className="profile-email">
              <Mail size={14} /> {user?.email}
            </p>
            <div className="profile-stats">
              <div className="stat">
                <strong>{animals.length}</strong>
                <span>Anabul</span>
              </div>
              <div className="stat">
                <strong>{new Set(animals.map(a => a.type_id)).size}</strong>
                <span>Jenis</span>
              </div>
              <div className="stat">
                <strong>{new Set(animals.filter(a => a.location_name).map(a => a.location_name)).size}</strong>
                <span>Lokasi</span>
              </div>
            </div>
            <Button variant="secondary" onClick={startEditing} icon={<User size={16} />}>
              Edit Profil
            </Button>
          </div>
        )}
      </div>

      {/* Settings Section */}
      <div className="settings-section">
        <h3>Pengaturan</h3>
        <div className="settings-list">
          <button type="button" className="setting-item" onClick={() => setShowPasswordModal(true)}>
            <Lock size={20} />
            <div>
              <strong>Ganti Password</strong>
              <span>Ubah password akun kamu</span>
            </div>
          </button>
          <button type="button" className="setting-item" onClick={() => setShowAbout(true)}>
            <Info size={20} />
            <div>
              <strong>Tentang Aplikasi</strong>
              <span>Versi dan informasi StrayDex</span>
            </div>
          </button>
          <button type="button" className="setting-item danger" onClick={signOut}>
            <Shield size={20} />
            <div>
              <strong>Keluar</strong>
              <span>Logout dari akun kamu</span>
            </div>
          </button>
        </div>
      </div>

      {/* Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess('') }} title="Ganti Password" size="sm">
        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {passwordError && <div className="auth-error">{passwordError}</div>}
          {passwordSuccess && <div className="success-msg">{passwordSuccess}</div>}

          <Input
            label="Password Baru"
            type="password"
            placeholder="Minimal 6 karakter"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            icon={<Lock size={18} />}
            required
          />
          <Input
            label="Konfirmasi Password Baru"
            type="password"
            placeholder="Ulangi password baru"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock size={18} />}
            required
          />
          <Button type="submit" loading={passwordLoading} fullWidth icon={<Save size={16} />}>
            Simpan Password
          </Button>
        </form>
      </Modal>

      {/* About Modal */}
      <Modal isOpen={showAbout} onClose={() => setShowAbout(false)} title="Tentang StrayCat" size="sm">
        <div className="about-content">
          <span className="about-logo">🐱</span>
          <h2>StrayCat</h2>
          <p className="about-tagline">Koleksi Kucing & Anabul Liar yang Kamu Temui</p>
          <div className="about-details">
            <div className="about-row">
              <span>Versi</span>
              <strong>{APP_VERSION}</strong>
            </div>
            <div className="about-row">
              <span>Framework</span>
              <strong>React 19 + Vite</strong>
            </div>
            <div className="about-row">
              <span>Database</span>
              <strong>Supabase</strong>
            </div>
            <div className="about-row">
              <span>Fitur</span>
              <strong>Kamera & GPS Lokasi</strong>
            </div>
          </div>
          <p className="about-footer">
            Dibuat dengan 💜 untuk para pecinta kucing liar
          </p>
        </div>
      </Modal>
    </div>
  )
}
