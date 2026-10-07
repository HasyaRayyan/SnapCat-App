import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, RefreshCw, X, Check, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import './CameraModal.css'

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (blob: Blob, previewUrl: string) => void
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    stopStream()
    setError(null)
    setIsInitializing(true)

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung pada browser ini.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err)
      const e = err as Error
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError('Izin akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.')
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        setError('Kamera tidak ditemukan pada perangkat Anda.')
      } else {
        setError(e.message || 'Gagal membuka kamera.')
      }
    } finally {
      setIsInitializing(false)
    }
  }, [facingMode, stopStream])

  useEffect(() => {
    if (isOpen) {
      setCapturedPreview(null)
      setCapturedBlob(null)
      startCamera()
    } else {
      stopStream()
    }

    return () => {
      stopStream()
    }
  }, [isOpen, startCamera, stopStream])

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return

    setFlash(true)
    setTimeout(() => setFlash(false), 200)

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // If front camera, flip horizontally for natural mirror feel
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob)
          setCapturedBlob(blob)
          setCapturedPreview(previewUrl)
          stopStream()
        }
      },
      'image/jpeg',
      0.92
    )
  }

  const handleRetake = () => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview)
    }
    setCapturedPreview(null)
    setCapturedBlob(null)
    startCamera()
  }

  const handleConfirm = () => {
    if (capturedBlob && capturedPreview) {
      onCapture(capturedBlob, capturedPreview)
      stopStream()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="camera-modal-overlay">
      <div className="camera-modal-container">
        {/* Top Header */}
        <div className="camera-modal-header">
          <div className="camera-title-badge">
            <Camera size={18} />
            <span>Kamera StrayCat</span>
          </div>
          <button type="button" className="camera-close-btn" onClick={onClose} aria-label="Tutup Kamera">
            <X size={22} />
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="camera-viewfinder-wrapper">
          {flash && <div className="camera-flash-overlay" />}

          {capturedPreview ? (
            <img src={capturedPreview} alt="Hasil Foto Anabul" className="camera-preview-img" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`camera-video-feed ${facingMode === 'user' ? 'mirrored' : ''}`}
              />
              {/* Camera grid guide */}
              <div className="camera-grid">
                <div className="grid-line horizontal top" />
                <div className="grid-line horizontal bottom" />
                <div className="grid-line vertical left" />
                <div className="grid-line vertical right" />
              </div>
            </>
          )}

          {isInitializing && (
            <div className="camera-loading">
              <div className="camera-spinner" />
              <span>Menyiapkan kamera...</span>
            </div>
          )}

          {error && (
            <div className="camera-error-box">
              <AlertCircle size={28} />
              <p>{error}</p>
              <Button size="sm" variant="secondary" onClick={() => startCamera()}>
                Coba Lagi
              </Button>
            </div>
          )}
        </div>

        {/* Controls bottom bar */}
        <div className="camera-controls-bar">
          {capturedPreview ? (
            <div className="camera-preview-actions">
              <Button variant="ghost" onClick={handleRetake} icon={<RefreshCw size={16} />}>
                Ulangi
              </Button>
              <Button variant="primary" onClick={handleConfirm} icon={<Check size={18} />}>
                Gunakan Foto
              </Button>
            </div>
          ) : (
            <div className="camera-live-actions">
              <button
                type="button"
                className="camera-tool-btn"
                onClick={handleSwitchCamera}
                title="Ganti Kamera Depan/Belakang"
                disabled={!!error || isInitializing}
              >
                <RefreshCw size={22} />
              </button>

              <button
                type="button"
                className="camera-shutter-btn"
                onClick={handleTakeSnapshot}
                disabled={!!error || isInitializing}
                title="Ambil Foto"
              >
                <div className="shutter-inner" />
              </button>

              <div style={{ width: 44 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
