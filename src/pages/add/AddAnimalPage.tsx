import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera, MapPin, Save, Plus, Scissors, Type, FileText, Tag } from 'lucide-react'
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
  const { getCurrentLocation, loading: locationLoading } = useGeolocation()
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
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const x = Math.min(cropStart.x, cropEnd.x)
    const y = Math.min(cropStart.y, cropEnd.y)
    const w = Math.abs(cropEnd.x - cropStart.x)
    const h = Math.abs(cropEnd.y - cropStart.y)

    // Draw crop area
    ctx.clearRect(x, y, w, h)
    ctx.drawImage(cropImage, x, y, w, h, x, y, w, h)

    // Border
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
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
          setError('Gagal upload foto: ' + (uploadError?.message ?? 'Unknown error'))
          setLoading(false)
          return
        }
        photoUrl = url
      }

      if (isEdit && editId) {
        const { error } = await updateAnimal(editId, {
          name,
          type_id: typeId,
          description: description || null,
          photo_url: photoUrl,
          latitude,
          longitude,
          location_name: locationName || null,
          captured_at: new Date(capturedAt).toISOString(),
        })
        if (error) {
          setError(error.message)
        } else {
          navigate('/dashboard')
        }
      } else {
        if (!photoUrl) {
          setError('Foto anabul wajib diisi!')
          setLoading(false)
          return
        }

        const { error } = await addAnimal({
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
        if (error) {
          setError(error.message)
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan')
      console.error(err)
    }
    setLoading(false)
  }

  if (loadingEdit) return <LoadingSpinner />

  return (
    <div className="add-animal">
      <h1>{isEdit ? '✏️ Edit Anabul' : '📸 Tambah Anabul Baru'}</h1>
      <p className="page-subtitle">
        {isEdit ? 'Ubah data anabul kamu' : 'Foto dan catat anabul yang kamu temui!'}
      </p>

      <form onSubmit={handleSubmit} className="add-form">
        {error && <div className="auth-error">{error}</div>}

        {/* Photo Section */}
        <div className="photo-section">
          <label className="input-label">Foto Anabul *</label>
          {photoPreview ? (
            <div className="photo-preview-wrapper">
              <img src={photoPreview} alt="Preview" className="photo-preview" />
              <div className="photo-actions">
                <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} icon={<Camera size={16} />}>
                  Ganti Foto
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={openCropModal} icon={<Scissors size={16} />}>
                  Crop
                </Button>
              </div>
            </div>
          ) : (
            <div className="photo-upload" onClick={() => fileInputRef.current?.click()}>
              <Camera size={40} />
              <p>Klik untuk memfoto / pilih foto anabul</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Name */}
        <Input
          label="Nama Anabul *"
          placeholder="Kasih nama anabulnya..."
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
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowNewType(true)} icon={<Plus size={16} />}>
              Jenis Baru
            </Button>
          </div>
        </div>

        {/* Date/Time */}
        <div className="input-group">
          <label className="input-label">Tanggal & Waktu Foto</label>
          <input
            type="datetime-local"
            className="input-field"
            value={capturedAt}
            onChange={(e) => setCapturedAt(e.target.value)}
          />
          <span className="input-hint">
            {format(new Date(capturedAt), 'EEEE, dd MMMM yyyy • HH:mm', { locale: idLocale })}
          </span>
        </div>

        {/* Description */}
        <div className="input-group">
          <label className="input-label">Deskripsi</label>
          <div className="input-wrapper">
            <span className="input-icon"><FileText size={18} /></span>
            <textarea
              className="input-field has-icon textarea-field"
              placeholder="Ceritakan tentang anabul ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Location */}
        <div className="location-section">
          <label className="input-label">Lokasi</label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleGetLocation}
            loading={locationLoading}
            icon={<MapPin size={16} />}
          >
            Ambil Lokasi Sekarang
          </Button>
          {locationName && (
            <div className="location-info">
              <MapPin size={14} />
              <span>{locationName}</span>
            </div>
          )}
          {latitude && longitude && (
            <span className="coord-text">
              📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </span>
          )}
        </div>

        <Button type="submit" loading={loading} fullWidth size="lg" icon={<Save size={20} />}>
          {isEdit ? 'Simpan Perubahan' : 'Simpan Anabul'}
        </Button>
      </form>

      {/* New Type Modal */}
      <Modal isOpen={showNewType} onClose={() => setShowNewType(false)} title="Tambah Jenis Anabul Baru" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Nama Jenis"
            placeholder="Contoh: Iguana, Musang, dll"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            icon={<Tag size={18} />}
          />
          <Input
            label="Emoji Icon"
            placeholder="🐾"
            value={newTypeIcon}
            onChange={(e) => setNewTypeIcon(e.target.value)}
            maxLength={4}
          />
          <Button onClick={handleAddType} loading={addingType} fullWidth icon={<Plus size={18} />}>
            Tambah Jenis
          </Button>
        </div>
      </Modal>

      {/* Crop Modal */}
      <Modal isOpen={showCrop} onClose={() => setShowCrop(false)} title="Crop Foto" size="lg">
        <div className="crop-container">
          <p className="crop-hint">Klik dan drag untuk memilih area crop</p>
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
