import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera, MapPin, Save, Plus, Scissors, Type, FileText, Tag, Image as ImageIcon, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale/id'
import { useAuth } from '../../contexts/AuthContext'
import { useAnimals } from '../../hooks/useAnimals'
import { useAnimalTypes } from '../../hooks/useAnimalTypes'
import { useGeolocation } from '../../hooks/useGeolocation'
import { uploadAnimalPhoto } from '../../lib/storage'
import { supabase } from '../../lib/supabase'
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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Form state
  const [name, setName] = useState('')
  const [typeId, setTypeId] = useState('')
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationName, setLocationName] = useState('')
  const [capturedAt, setCapturedAt] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingEdit, setLoadingEdit] = useState(false)

  // Camera in-app modal
  const [showCameraModal, setShowCameraModal] = useState(false)

  // New type modal
  const [showNewType, setShowNewType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeIcon, setNewTypeIcon] = useState('')
  const [addingType, setAddingType] = useState(false)

  // Crop modal
  const [showCrop, setShowCrop] = useState(false)
  const [cropImage, setCropImage] = useState<HTMLImageElement | null>(null)
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 })
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 })
  const [isCropping, setIsCropping] = useState(false)

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
            setLatitude(animal.latitude)
            setLongitude(animal.longitude)
            setLocationName(animal.location_name ?? '')
            setCapturedAt(format(new Date(animal.captured_at), "yyyy-MM-dd'T'HH:mm"))
          }
          setLoadingEdit(false)
        })
    }
  }, [editId])

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoFile(file)
    setCroppedBlob(null)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Auto-fetch location if not set yet
    if (!latitude && !locationName) {
      handleGetLocation()
    }
  }

  const handleCameraCapture = (blob: Blob, previewUrl: string) => {
    const file = new File([blob], `straycat-${Date.now()}.jpg`, { type: 'image/jpeg' })
    setPhotoFile(file)
    setCroppedBlob(null)
    setPhotoPreview(previewUrl)

    // Auto-fetch location when taking photo
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

  // Crop functionality
  const openCropModal = () => {
    if (!photoPreview) return
    const img = new Image()
    img.onload = () => {
      setCropImage(img)
      setShowCrop(true)
      setCropStart({ x: img.width * 0.1, y: img.height * 0.1 })
      setCropEnd({ x: img.width * 0.9, y: img.height * 0.9 })
    }
    img.src = photoPreview
  }

  const handleCropMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !cropImage) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = cropImage.width / rect.width
    const scaleY = cropImage.height / rect.height
    setCropStart({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    })
    setIsCropping(true)
  }

  const handleCropMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping || !canvasRef.current || !cropImage) return
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = cropImage.width / rect.width
    const scaleY = cropImage.height / rect.height
    setCropEnd({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    })
  }

  const handleCropMouseUp = () => {
    setIsCropping(false)
  }

  // Draw crop overlay
  useEffect(() => {
    if (!showCrop || !cropImage || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = cropImage.width
    canvas.height = cropImage.height
    ctx.drawImage(cropImage, 0, 0)

    // Darken outside crop area
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const x = Math.min(cropStart.x, cropEnd.x)
    const y = Math.min(cropStart.y, cropEnd.y)
    const w = Math.abs(cropEnd.x - cropStart.x)
    const h = Math.abs(cropEnd.y - cropStart.y)

    // Draw crop area
    ctx.clearRect(x, y, w, h)
    ctx.drawImage(cropImage, x, y, w, h, x, y, w, h)

    // Border
    ctx.strokeStyle = '#a78bfa'
    ctx.lineWidth = 3
    ctx.strokeRect(x, y, w, h)
  }, [showCrop, cropImage, cropStart, cropEnd])

  const applyCrop = () => {
    if (!cropImage) return
    const tempCanvas = document.createElement('canvas')
    const x = Math.min(cropStart.x, cropEnd.x)
    const y = Math.min(cropStart.y, cropEnd.y)
    const w = Math.abs(cropEnd.x - cropStart.x)
    const h = Math.abs(cropEnd.y - cropStart.y)

    tempCanvas.width = w
    tempCanvas.height = h
    const ctx = tempCanvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(cropImage, x, y, w, h, 0, 0, w, h)
    tempCanvas.toBlob((blob) => {
      if (blob) {
        setCroppedBlob(blob)
        setPhotoPreview(URL.createObjectURL(blob))
        setShowCrop(false)
      }
    }, 'image/jpeg', 0.9)
  }

  const handleAddType = async () => {
    if (!newTypeName.trim()) return
    setAddingType(true)
    const { data } = await addType({ name: newTypeName.trim(), icon: newTypeIcon || '🐾' })
    if (data && 'id' in data) {
      setTypeId(data.id)
    }
    setNewTypeName('')
    setNewTypeIcon('')
    setShowNewType(false)
    setAddingType(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)

    try {
      let photoUrl = photoPreview ?? ''

      // Upload photo if new file
      if (photoFile || croppedBlob) {
        const fileToUpload = croppedBlob ?? photoFile!
        const { url, error: uploadError } = await uploadAnimalPhoto(user.id, fileToUpload)
        if (uploadError || !url) {
          setError('Gagal mengupload foto: ' + (uploadError?.message ?? 'Unknown error'))
          setLoading(false)
          return
        }
        photoUrl = url
      }

      if (isEdit && editId) {
        const { error: updateErr } = await updateAnimal(editId, {
          name,
          type_id: typeId,
          description: description || null,
          photo_url: photoUrl,
          latitude,
          longitude,
          location_name: locationName || null,
          captured_at: new Date(capturedAt).toISOString(),
        })
        if (updateErr) {
          setError(updateErr.message)
        } else {
          navigate('/dashboard')
        }
      } else {
        if (!photoUrl) {
          setError('Foto anabul wajib diisi! Ambil foto via kamera atau galeri.')
          setLoading(false)
          return
        }

        const { error: insertErr } = await addAnimal({
          user_id: user.id,
          name,
          type_id: typeId,
          description: description || null,
          photo_url: photoUrl,
          latitude,
          longitude,
          location_name: locationName || null,
          captured_at: new Date(capturedAt).toISOString(),
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
        <h1>{isEdit ? '✏️ Edit Data Anabul' : '📸 Tambah Anabul Baru'}</h1>
        <p className="page-subtitle">
          {isEdit ? 'Perbarui informasi dan lokasi anabul' : 'Abadikan kucing liar yang kamu temui dan simpan lokasinya!'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="add-form">
        {error && <div className="auth-error">{error}</div>}

        {/* Photo Section */}
        <div className="photo-card-section">
          <label className="input-label">Foto Anabul *</label>

          {photoPreview ? (
            <div className="photo-preview-wrapper">
              <img src={photoPreview} alt="Preview Anabul" className="photo-preview" />
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
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<ImageIcon size={16} />}
                >
                  Pilih Galeri
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={openCropModal}
                  icon={<Scissors size={16} />}
                >
                  Crop
                </Button>
              </div>
            </div>
          ) : (
            <div className="photo-uploader-box">
              <div className="photo-camera-trigger" onClick={() => setShowCameraModal(true)}>
                <div className="camera-icon-bubble">
                  <Camera size={36} />
                </div>
                <h3>Ambil Foto via Kamera</h3>
                <p>Klik di sini untuk membuka kamera langsung</p>
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
          icon={<Type size={18} />}
          required
        />

        {/* Type */}
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
                  {t.icon} {t.name}
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

        {/* Date/Time */}
        <div className="input-group">
          <label className="input-label">Tanggal & Jam Ditemukan</label>
          <input
            type="datetime-local"
            className="input-field"
            value={capturedAt}
            onChange={(e) => setCapturedAt(e.target.value)}
          />
          <span className="input-hint">
            🗓️ {format(new Date(capturedAt), 'EEEE, dd MMMM yyyy • HH:mm', { locale: idLocale })}
          </span>
        </div>

        {/* Location Section */}
        <div className="location-card-section">
          <div className="location-header-row">
            <label className="input-label">📍 Lokasi Anabul</label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleGetLocation}
              loading={locationLoading}
              icon={<MapPin size={16} />}
            >
              {latitude ? 'Perbarui Lokasi GPS' : 'Ambil Lokasi GPS Sekarang'}
            </Button>
          </div>

          {locationError && (
            <div className="location-error-alert">
              <AlertTriangle size={18} />
              <span>{locationError}</span>
            </div>
          )}

          <div className="input-group">
            <Input
              placeholder="Nama lokasi / alamat (misal: Jl. Mawar No. 5, depan warung)"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              icon={<MapPin size={18} />}
            />
          </div>

          {latitude && longitude && (
            <div className="location-badge-box">
              <div className="location-status-badge">
                <CheckCircle size={15} />
                <span>GPS Tersimpan ({latitude.toFixed(5)}, {longitude.toFixed(5)})</span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="location-maps-link"
              >
                <span>Lihat di Google Maps</span>
                <ExternalLink size={14} />
              </a>
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
          {isEdit ? 'Simpan Perubahan' : 'Simpan ke StrayCat 🐾'}
        </Button>
      </form>

      {/* In-App Camera Modal */}
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
          <Input
            label="Emoji Icon"
            placeholder="🐱"
            value={newTypeIcon}
            onChange={(e) => setNewTypeIcon(e.target.value)}
            maxLength={4}
          />
          <Button onClick={handleAddType} loading={addingType} fullWidth icon={<Plus size={18} />}>
            Simpan Jenis
          </Button>
        </div>
      </Modal>

      {/* Crop Modal */}
      <Modal isOpen={showCrop} onClose={() => setShowCrop(false)} title="Crop Foto Anabul" size="lg">
        <div className="crop-container">
          <p className="crop-hint">Geser kursor untuk menentukan area crop:</p>
          <canvas
            ref={canvasRef}
            className="crop-canvas"
            onMouseDown={handleCropMouseDown}
            onMouseMove={handleCropMouseMove}
            onMouseUp={handleCropMouseUp}
            onMouseLeave={handleCropMouseUp}
          />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="ghost" onClick={() => setShowCrop(false)}>Batal</Button>
            <Button onClick={applyCrop} icon={<Scissors size={16} />}>Terapkan Crop</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
