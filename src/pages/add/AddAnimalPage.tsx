import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Camera,
  MapPin,
  Save,
  Plus,
  FileText,
  Tag,
  Image as ImageIcon,
  ExternalLink,
  AlertTriangle,
  Clock,
  Cat,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale/id'
import { useAuth } from '../../contexts/AuthContext'
import { useAnimals } from '../../hooks/useAnimals'
import { useAnimalTypes } from '../../hooks/useAnimalTypes'
import { useGeolocation } from '../../hooks/useGeolocation'
import { uploadAnimalPhoto } from '../../lib/storage'
import { supabase } from '../../lib/supabase'
import { removeCatBackground } from '../../lib/backgroundRemoval'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { CameraModal } from '../../components/camera/CameraModal'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import type { AnimalWithType } from '../../types'
import './AddAnimal.css'

export default function AddAnimalPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id: string }>()
  const isEdit = !!editId

  const { addAnimal, updateAnimal } = useAnimals()
  const { types, addType } = useAnimalTypes()
  const { getCurrentLocation, loading: locationLoading, error: locationError } = useGeolocation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [name, setName] = useState('')
  const [typeId, setTypeId] = useState('')
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationName, setLocationName] = useState('')
  const [existingCapturedAt, setExistingCapturedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingEdit, setLoadingEdit] = useState(false)

  // Background removal states (tinggal tubuh kucing saja)
  const [noBgBlob, setNoBgBlob] = useState<Blob | null>(null)
  const [noBgPreview, setNoBgPreview] = useState<string | null>(null)
  const [removingBg, setRemovingBg] = useState(false)
  const [bgProgress, setBgProgress] = useState(0)
  const [bgError, setBgError] = useState<string | null>(null)
  const [selectedDisplayMode, setSelectedDisplayMode] = useState<'nobg' | 'original'>('nobg')

  // Camera in-app modal
  const [showCameraModal, setShowCameraModal] = useState(false)
  const hasAutoOpenedCamera = useRef(false)

  // New type modal
  const [showNewType, setShowNewType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [addingType, setAddingType] = useState(false)

  // Saat klik +, langsung buka kamera secara otomatis jika belum ada foto
  useEffect(() => {
    if (!isEdit && !photoPreview && !hasAutoOpenedCamera.current) {
      hasAutoOpenedCamera.current = true
      setShowCameraModal(true)
    }
  }, [isEdit, photoPreview])

  // Default selection to "Kucing" if available and not in edit mode
  useEffect(() => {
    if (!typeId && types.length > 0 && !isEdit) {
      const catType = types.find((t) => t.name.toLowerCase().includes('kucing'))
      if (catType) {
        setTypeId(catType.id)
      } else {
        setTypeId(types[0].id)
      }
    }
  }, [types, typeId, isEdit])

  // Automatically fetch GPS location on load for new entry
  useEffect(() => {
    if (!isEdit) {
      getCurrentLocation().then((loc) => {
        if (loc) {
          setLatitude(loc.latitude)
          setLongitude(loc.longitude)
          setLocationName(loc.locationName)
        }
      })
    }
  }, [isEdit, getCurrentLocation])

  // Load data for edit mode
  useEffect(() => {
    if (editId) {
      setLoadingEdit(true)
      supabase
        .from('animals')
        .select('*, animal_types(*)')
        .eq('id', editId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            const animal = data as unknown as AnimalWithType
            setName(animal.name)
            setTypeId(animal.type_id)
            setDescription(animal.description ?? '')
            setPhotoPreview(animal.photo_url)
            if (animal.photo_no_bg_url) {
              setNoBgPreview(animal.photo_no_bg_url)
              setSelectedDisplayMode('nobg')
            } else {
              setSelectedDisplayMode('original')
            }
            setLatitude(animal.latitude)
            setLongitude(animal.longitude)
            setLocationName(animal.location_name ?? '')
            setExistingCapturedAt(animal.captured_at)
          }
          setLoadingEdit(false)
        })
    }
  }, [editId])

  // Proses hapus background otomatis: menghasilkan PNG transparan tubuh kucing saja
  const processBackgroundRemoval = async (source: Blob | File) => {
    setRemovingBg(true)
    setBgProgress(0)
    setBgError(null)

    try {
      const cutoutBlob = await removeCatBackground(source, (info) => {
        setBgProgress(info.percentage)
      })
      setNoBgBlob(cutoutBlob)
      const cutoutUrl = URL.createObjectURL(cutoutBlob)
      setNoBgPreview(cutoutUrl)
      setSelectedDisplayMode('nobg')
    } catch (err: unknown) {
      console.warn('Gagal memisahkan background:', err)
      const detail = err instanceof Error ? err.message : String(err)
      setBgError(`Background belum berhasil dipisahkan (${detail}). Foto asli tetap digunakan.`)
      setSelectedDisplayMode('original')
    } finally {
      setRemovingBg(false)
    }
  }

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoFile(file)
    setNoBgBlob(null)
    setNoBgPreview(null)
    const reader = new FileReader()
    reader.onloadend = () => {
      const url = reader.result as string
      setPhotoPreview(url)
      processBackgroundRemoval(file)
    }
    reader.readAsDataURL(file)

    if (!latitude && !locationName) {
      handleGetLocation()
    }
  }

  // Selesai foto via kamera: langsung pasang preview dan hapus background otomatis
  const handleCameraCapture = (blob: Blob, previewUrl: string) => {
    const file = new File([blob], `straycat-${Date.now()}.jpg`, { type: 'image/jpeg' })
    setPhotoFile(file)
    setPhotoPreview(previewUrl)
    setNoBgBlob(null)
    setNoBgPreview(null)
    setShowCameraModal(false)

    // Jalankan pemotongan background otomatis
    processBackgroundRemoval(blob)

    if (!latitude && !locationName) {
      handleGetLocation()
    }
  }

  const handleGetLocation = async () => {
    const loc = await getCurrentLocation()
    if (loc) {
      setLatitude(loc.latitude)
      setLongitude(loc.longitude)
      setLocationName(loc.locationName)
    }
  }

  const handleAddType = async () => {
    if (!newTypeName.trim()) return
    setAddingType(true)
    const { data } = await addType({ name: newTypeName.trim(), icon: '' })
    if (data && 'id' in data) {
      setTypeId(data.id)
    }
    setNewTypeName('')
    setShowNewType(false)
    setAddingType(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)

    try {
      // 1. Lokasi otomatis diambil saat user klik simpan jika belum ada
      let finalLat = latitude
      let finalLng = longitude
      let finalLocName = locationName

      if (!finalLat || !finalLng) {
        try {
          const loc = await getCurrentLocation()
          if (loc) {
            finalLat = loc.latitude
            finalLng = loc.longitude
            finalLocName = loc.locationName
            setLatitude(loc.latitude)
            setLongitude(loc.longitude)
            setLocationName(loc.locationName)
          }
        } catch {
          // Lanjutkan jika GPS tidak diizinkan di browser
        }
      }

      // 2. Upload foto utama
      let photoUrl = photoPreview ?? ''
      let photoNoBgUrl: string | null = null

      if (photoFile) {
        const { url, error: uploadError } = await uploadAnimalPhoto(user.id, photoFile)
        if (uploadError || !url) {
          setError('Gagal mengupload foto: ' + (uploadError?.message ?? 'Unknown error'))
          setLoading(false)
          return
        }
        photoUrl = url
      }

      // Upload foto tubuh kucing transparan (no background) jika ada
      if (noBgBlob) {
        const noBgFileName = `nobg-${Date.now()}.png`
        const { url: noBgUrl, error: noBgError } = await uploadAnimalPhoto(user.id, noBgBlob, noBgFileName)
        if (!noBgError && noBgUrl) {
          photoNoBgUrl = noBgUrl
        }
      }

      if (!photoUrl) {
        setError('Foto anabul wajib diisi! Ambil foto lewat kamera terlebih dahulu.')
        setLoading(false)
        return
      }

      // 3. Jam & Tanggal diambil saat user klik simpan
      const saveTimestamp = isEdit && existingCapturedAt ? existingCapturedAt : new Date().toISOString()

      if (isEdit && editId) {
        const { error: updateErr } = await updateAnimal(editId, {
          name,
          type_id: typeId,
          description: description || null,
          photo_url: photoUrl,
          photo_no_bg_url: photoNoBgUrl || noBgPreview || null,
          latitude: finalLat,
          longitude: finalLng,
          location_name: finalLocName || null,
          captured_at: saveTimestamp,
        })
        if (updateErr) {
          setError(updateErr.message)
        } else {
          navigate('/dashboard')
        }
      } else {
        const { error: insertErr } = await addAnimal({
          user_id: user.id,
          name,
          type_id: typeId,
          description: description || null,
          photo_url: photoUrl,
          photo_no_bg_url: photoNoBgUrl,
          latitude: finalLat,
          longitude: finalLng,
          location_name: finalLocName || null,
          captured_at: saveTimestamp,
        })
        if (insertErr) {
          setError(insertErr.message)
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menyimpan data.')
      console.error(err)
    }
    setLoading(false)
  }

  if (loadingEdit) return <LoadingSpinner />

  return (
    <div className="add-animal">
      <div className="add-page-header">
        <h1>{isEdit ? 'Edit Data Anabul' : 'Tambah Anabul Baru'}</h1>
        <p className="page-subtitle">
          {photoPreview
            ? 'Foto siap! Lengkapi nama dan data anabul di bawah ini.'
            : 'Langsung foto kucing liar dengan kamera. Background otomatis dihapus!'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="add-form">
        {error && <div className="auth-error">{error}</div>}

        {/* Photo Section */}
        <div className="photo-card-section">
          <div className="photo-header-row">
            <label className="input-label">Foto Anabul *</label>
            {photoPreview && (
              <span className="photo-status-badge">
                {selectedDisplayMode === 'nobg' && noBgPreview ? (
                  <>
                    <CheckCircle2 size={13} /> Tubuh Kucing Saja (Background Dihapus)
                  </>
                ) : removingBg ? (
                  <>
                    <RefreshCw size={13} className="spin-icon" /> Memisahkan background... {bgProgress}%
                  </>
                ) : (
                  'Foto Asli'
                )}
              </span>
            )}
          </div>

          {photoPreview ? (
            <div className="photo-preview-wrapper">
              {/* Mode Tabs: Tubuh Kucing Saja vs Foto Asli */}
              <div className="bg-cutout-tabs">
                <button
                  type="button"
                  className={`bg-tab-btn ${selectedDisplayMode === 'nobg' ? 'active' : ''}`}
                  onClick={() => setSelectedDisplayMode('nobg')}
                  disabled={!noBgPreview && !removingBg}
                >
                  <Cat size={16} />
                  <span>
                    Tubuh Kucing Saja
                    {noBgPreview ? ' (Bersih)' : removingBg ? ` (${bgProgress}%)` : ''}
                  </span>
                </button>
                <button
                  type="button"
                  className={`bg-tab-btn ${selectedDisplayMode === 'original' ? 'active' : ''}`}
                  onClick={() => setSelectedDisplayMode('original')}
                >
                  <ImageIcon size={16} />
                  <span>Foto Asli Lengkap</span>
                </button>
              </div>

              {/* Display Box */}
              <div className={`cutout-display-container ${selectedDisplayMode === 'nobg' ? 'checkered-bg' : ''}`}>
                {removingBg && (
                  <div className="bg-removal-loading-overlay">
                    <LoadingSpinner size={28} />
                    <span className="loading-text">Sedang memisahkan tubuh kucing dari background...</span>
                    {bgProgress > 0 && <span className="loading-percent">{bgProgress}%</span>}
                  </div>
                )}

                <img
                  src={selectedDisplayMode === 'nobg' && noBgPreview ? noBgPreview : photoPreview}
                  alt="Preview Anabul"
                  className={`photo-preview-element ${selectedDisplayMode === 'nobg' ? 'cutout-fit' : 'original-fit'}`}
                />
              </div>

              {bgError && (
                <div className="bg-error-note">
                  <span>{bgError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="photo-actions-bar">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCameraModal(true)}
                  icon={<Camera size={16} />}
                >
                  Foto Ulang (Kamera)
                </Button>
                {photoFile && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => processBackgroundRemoval(photoFile)}
                    loading={removingBg}
                    icon={<RefreshCw size={16} />}
                  >
                    Ulangi Hapus Background
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<ImageIcon size={16} />}
                >
                  Pilih dari Galeri
                </Button>
              </div>
            </div>
          ) : (
            <div className="photo-uploader-box direct-camera-prompt">
              <div className="photo-camera-trigger primary-prompt" onClick={() => setShowCameraModal(true)}>
                <div className="camera-icon-bubble">
                  <Camera size={34} />
                </div>
                <h3>Buka Kamera untuk Foto Kucing</h3>
                <p>Klik di sini untuk langsung mengarahkan kamera ke anabul</p>
              </div>

              <div className="photo-divider">
                <span>atau</span>
              </div>

              <div className="photo-gallery-trigger" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={20} />
                <span>Pilih Foto dari Galeri</span>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Name */}
        <Input
          label="Nama Anabul *"
          placeholder="Contoh: Oyen Depan Indomaret, Si Belang, dll"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus={!!photoPreview}
          required
        />

        {/* Animal Type */}
        <div className="type-select-wrapper">
          <label className="input-label">Jenis Anabul *</label>
          <div className="type-select-row">
            <select
              className="type-select"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              required
            >
              <option value="">Pilih jenis...</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowNewType(true)}
              icon={<Plus size={16} />}
            >
              Jenis Baru
            </Button>
          </div>
        </div>

        {/* Automatic Date/Time (Otomatis diambil saat user klik simpan) */}
        <div className="auto-info-card">
          <div className="auto-info-icon">
            <Clock size={20} />
          </div>
          <div className="auto-info-text">
            <span className="auto-info-title">Waktu & Tanggal Foto</span>
            <span className="auto-info-desc">
              {isEdit && existingCapturedAt
                ? `Tercatat: ${format(new Date(existingCapturedAt), 'EEEE, dd MMMM yyyy • HH:mm', { locale: idLocale })}`
                : 'Otomatis dicatat tepat saat tombol Simpan ditekan'}
            </span>
          </div>
        </div>

        {/* Automatic Location (Otomatis GPS, tidak input manual) */}
        <div className="location-card-section">
          <div className="location-header-row">
            <label className="input-label">Lokasi GPS (Otomatis)</label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleGetLocation}
              loading={locationLoading}
              icon={<MapPin size={16} />}
            >
              {latitude ? 'Perbarui GPS' : 'Deteksi GPS Sekarang'}
            </Button>
          </div>

          {locationError && (
            <div className="location-error-alert">
              <AlertTriangle size={18} />
              <span>{locationError}</span>
            </div>
          )}

          {locationLoading ? (
            <div className="location-detecting-box">
              <LoadingSpinner size={20} />
              <span>Mendeteksi koordinat GPS dan nama lokasi otomatis...</span>
            </div>
          ) : latitude && longitude ? (
            <div className="location-detected-card">
              <div className="location-address-row">
                <MapPin size={20} className="location-pin-icon" />
                <div className="location-address-text">
                  <span className="location-name-bold">{locationName || 'Lokasi terdeteksi'}</span>
                  <span className="location-coords-small">
                    Koordinat: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </span>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="location-maps-link"
              >
                <span>Buka di Google Maps</span>
                <ExternalLink size={14} />
              </a>
            </div>
          ) : (
            <div className="location-pending-box">
              <MapPin size={18} />
              <span>
                Lokasi otomatis dideteksi dari GPS saat Anda menekan tombol Simpan (atau klik tombol Deteksi di atas).
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="input-group">
          <label className="input-label">Deskripsi & Catatan</label>
          <div className="input-wrapper">
            <span className="input-icon"><FileText size={18} /></span>
            <textarea
              className="input-field has-icon textarea-field"
              placeholder="Ceritakan ciri-ciri atau kebiasaan anabul ini (misal: ramah, suka dielus, ekor buntung)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <Button type="submit" loading={loading} fullWidth size="lg" icon={<Save size={20} />}>
          {isEdit ? 'Simpan Perubahan' : 'Simpan ke StrayCat'}
        </Button>
      </form>

      {/* In-App Camera Modal: Otomatis muncul saat klik + */}
      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />

      {/* New Type Modal */}
      <Modal isOpen={showNewType} onClose={() => setShowNewType(false)} title="Tambah Jenis Anabul Baru" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Nama Jenis"
            placeholder="Contoh: Kucing Persia, Kucing Kampung"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            icon={<Tag size={18} />}
          />
          <Button onClick={handleAddType} loading={addingType} fullWidth icon={<Plus size={18} />}>
            Simpan Jenis
          </Button>
        </div>
      </Modal>
    </div>
  )
}
