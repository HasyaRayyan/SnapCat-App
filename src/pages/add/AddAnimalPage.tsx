import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Camera,
  MapPin,
  Save,
  Plus,
  Scissors,
  Type,
  FileText,
  Tag,
  Image as ImageIcon,
  ExternalLink,
  AlertTriangle,
  Clock,
  Crop,
  Square,
  RectangleHorizontal,
  Maximize2,
  RotateCcw,
} from 'lucide-react'
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
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)
  const [activeCropRatio, setActiveCropRatio] = useState<'original' | '1:1' | '4:3' | '16:9' | 'custom'>('original')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationName, setLocationName] = useState('')
  const [existingCapturedAt, setExistingCapturedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingEdit, setLoadingEdit] = useState(false)

  // Camera in-app modal
  const [showCameraModal, setShowCameraModal] = useState(false)

  // New type modal
  const [showNewType, setShowNewType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
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
            setOriginalPhoto(animal.photo_url)
            setActiveCropRatio('original')
            setLatitude(animal.latitude)
            setLongitude(animal.longitude)
            setLocationName(animal.location_name ?? '')
            setExistingCapturedAt(animal.captured_at)
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
    setActiveCropRatio('original')
    const reader = new FileReader()
    reader.onloadend = () => {
      const url = reader.result as string
      setPhotoPreview(url)
      setOriginalPhoto(url)
    }
    reader.readAsDataURL(file)

    if (!latitude && !locationName) {
      handleGetLocation()
    }
  }

  const handleCameraCapture = (blob: Blob, previewUrl: string) => {
    const file = new File([blob], `straycat-${Date.now()}.jpg`, { type: 'image/jpeg' })
    setPhotoFile(file)
    setCroppedBlob(null)
    setPhotoPreview(previewUrl)
    setOriginalPhoto(previewUrl)
    setActiveCropRatio('original')

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
  const handleAutoCrop = (ratioKey: '1:1' | '4:3' | '16:9' | 'original') => {
    const sourceUrl = originalPhoto || photoPreview
    if (!sourceUrl) return

    if (ratioKey === 'original') {
      setCroppedBlob(null)
      if (originalPhoto) {
        setPhotoPreview(originalPhoto)
      }
      setActiveCropRatio('original')
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const targetRatio = ratioKey === '1:1' ? 1 : ratioKey === '4:3' ? 4 / 3 : 16 / 9
      const imgRatio = img.width / img.height

      let cropW = img.width
      let cropH = img.height
      let cropX = 0
      let cropY = 0

      if (imgRatio > targetRatio) {
        cropH = img.height
        cropW = img.height * targetRatio
        cropX = (img.width - cropW) / 2
        cropY = 0
      } else {
        cropW = img.width
        cropH = img.width / targetRatio
        cropX = 0
        cropY = (img.height - cropH) / 2
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(cropW)
      canvas.height = Math.round(cropH)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(
        img,
        Math.round(cropX),
        Math.round(cropY),
        Math.round(cropW),
        Math.round(cropH),
        0,
        0,
        canvas.width,
        canvas.height
      )

      canvas.toBlob((blob) => {
        if (blob) {
          setCroppedBlob(blob)
          setPhotoPreview(URL.createObjectURL(blob))
          setActiveCropRatio(ratioKey)
        }
      }, 'image/jpeg', 0.92)
    }
    img.src = sourceUrl
  }

  const openCropModal = () => {
    const sourceUrl = originalPhoto || photoPreview
    if (!sourceUrl) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setCropImage(img)
      setShowCrop(true)
      const w = img.width * 0.8
      const h = img.height * 0.8
      setCropStart({ x: (img.width - w) / 2, y: (img.height - h) / 2 })
      setCropEnd({ x: (img.width + w) / 2, y: (img.height + h) / 2 })
    }
    img.src = sourceUrl
  }

  const applyPresetToCropModal = (ratio: number | null) => {
    if (!cropImage) return
    if (!ratio) {
      setCropStart({ x: 0, y: 0 })
      setCropEnd({ x: cropImage.width, y: cropImage.height })
      return
    }
    const imgRatio = cropImage.width / cropImage.height
    let w = cropImage.width
    let h = cropImage.height
    if (imgRatio > ratio) {
      w = cropImage.height * ratio
      h = cropImage.height
    } else {
      w = cropImage.width
      h = cropImage.width / ratio
    }
    const x = (cropImage.width - w) / 2
    const y = (cropImage.height - h) / 2
    setCropStart({ x, y })
    setCropEnd({ x: x + w, y: y + h })
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

  useEffect(() => {
    if (!showCrop || !cropImage || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = cropImage.width
    canvas.height = cropImage.height
    ctx.drawImage(cropImage, 0, 0)

    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const x = Math.min(cropStart.x, cropEnd.x)
    const y = Math.min(cropStart.y, cropEnd.y)
    const w = Math.abs(cropEnd.x - cropStart.x)
    const h = Math.abs(cropEnd.y - cropStart.y)

    ctx.clearRect(x, y, w, h)
    ctx.drawImage(cropImage, x, y, w, h, x, y, w, h)

    ctx.strokeStyle = '#15803d'
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

    tempCanvas.width = Math.max(1, w)
    tempCanvas.height = Math.max(1, h)
    const ctx = tempCanvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(cropImage, x, y, w, h, 0, 0, tempCanvas.width, tempCanvas.height)
    tempCanvas.toBlob((blob) => {
      if (blob) {
        setCroppedBlob(blob)
        setPhotoPreview(URL.createObjectURL(blob))
        setActiveCropRatio('custom')
        setShowCrop(false)
      }
    }, 'image/jpeg', 0.92)
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

      // 2. Upload foto
      let photoUrl = photoPreview ?? ''
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

      if (!photoUrl) {
        setError('Foto anabul wajib diisi! Ambil foto via kamera atau galeri.')
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
          {isEdit ? 'Perbarui informasi anabul' : 'Abadikan kucing liar yang kamu temui. Waktu & lokasi dicatat otomatis!'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="add-form">
        {error && <div className="auth-error">{error}</div>}

        {/* Photo Section */}
        <div className="photo-card-section">
          <label className="input-label">Foto Anabul *</label>

          {photoPreview ? (
            <div className="photo-preview-wrapper">
              <div className="photo-preview-container">
                <img src={photoPreview} alt="Preview Anabul" className="photo-preview" />
                <span className="photo-ratio-badge">
                  {activeCropRatio === '1:1' && '1:1'}
                  {activeCropRatio === '4:3' && '4:3'}
                  {activeCropRatio === '16:9' && '16:9'}
                  {activeCropRatio === 'custom' && 'Kustom'}
                  {activeCropRatio === 'original' && 'Asli'}
                </span>
              </div>

              {/* Section Crop Otomatis */}
              <div className="auto-crop-section">
                <div className="auto-crop-header">
                  <div className="auto-crop-title">
                    <Crop size={16} />
                    <span>Crop & Rasio Otomatis</span>
                  </div>
                  <span className="auto-crop-status">
                    Rasio aktif: <strong>{activeCropRatio === '1:1' ? '1:1 Persegi' : activeCropRatio === '4:3' ? '4:3 Standar' : activeCropRatio === '16:9' ? '16:9 Lebar' : activeCropRatio === 'custom' ? 'Kustom' : 'Foto Asli'}</strong>
                  </span>
                </div>

                <div className="auto-crop-buttons-grid">
                  <button
                    type="button"
                    className={`crop-ratio-btn ${activeCropRatio === '1:1' ? 'active' : ''}`}
                    onClick={() => handleAutoCrop('1:1')}
                    title="Crop otomatis tengah rasio 1:1 persegi"
                  >
                    <Square size={16} />
                    <span className="crop-btn-label">1:1</span>
                    <span className="crop-btn-sub">Persegi</span>
                  </button>

                  <button
                    type="button"
                    className={`crop-ratio-btn ${activeCropRatio === '4:3' ? 'active' : ''}`}
                    onClick={() => handleAutoCrop('4:3')}
                    title="Crop otomatis tengah rasio 4:3 kartu"
                  >
                    <RectangleHorizontal size={16} />
                    <span className="crop-btn-label">4:3</span>
                    <span className="crop-btn-sub">Kartu</span>
                  </button>

                  <button
                    type="button"
                    className={`crop-ratio-btn ${activeCropRatio === '16:9' ? 'active' : ''}`}
                    onClick={() => handleAutoCrop('16:9')}
                    title="Crop otomatis tengah rasio 16:9 lebar"
                  >
                    <Maximize2 size={16} />
                    <span className="crop-btn-label">16:9</span>
                    <span className="crop-btn-sub">Lansekap</span>
                  </button>

                  <button
                    type="button"
                    className={`crop-ratio-btn ${activeCropRatio === 'original' ? 'active' : ''}`}
                    onClick={() => handleAutoCrop('original')}
                    title="Kembalikan ke ukuran foto asli"
                  >
                    <RotateCcw size={16} />
                    <span className="crop-btn-label">Asli</span>
                    <span className="crop-btn-sub">Reset</span>
                  </button>

                  <button
                    type="button"
                    className={`crop-ratio-btn manual ${activeCropRatio === 'custom' ? 'active' : ''}`}
                    onClick={openCropModal}
                    title="Atur area crop manual dengan kursor"
                  >
                    <Scissors size={16} />
                    <span className="crop-btn-label">Manual</span>
                    <span className="crop-btn-sub">Atur Geser</span>
                  </button>
                </div>
              </div>

              <div className="photo-actions-bar">
                <Button
                  type="button"
                  variant="secondary"
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
              </div>
            </div>
          ) : (
            <div className="photo-uploader-box">
              <div className="photo-camera-trigger" onClick={() => setShowCameraModal(true)}>
                <div className="camera-icon-bubble">
                  <Camera size={32} />
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
          <Button onClick={handleAddType} loading={addingType} fullWidth icon={<Plus size={18} />}>
            Simpan Jenis
          </Button>
        </div>
      </Modal>

      {/* Crop Modal */}
      <Modal isOpen={showCrop} onClose={() => setShowCrop(false)} title="Crop Foto Anabul" size="lg">
        <div className="crop-container">
          <div className="crop-modal-presets">
            <span className="crop-presets-label">Preset Rasio Cepat:</span>
            <div className="crop-presets-buttons">
              <Button type="button" variant="secondary" size="sm" onClick={() => applyPresetToCropModal(1)}>
                1:1 Persegi
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => applyPresetToCropModal(4 / 3)}>
                4:3 Standar
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => applyPresetToCropModal(16 / 9)}>
                16:9 Lebar
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => applyPresetToCropModal(null)}>
                Penuh
              </Button>
            </div>
          </div>
          <p className="crop-hint">Tarik atau geser area seleksi pada foto untuk menyesuaikan area potong:</p>
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
