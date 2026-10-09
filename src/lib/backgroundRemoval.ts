import { removeBackground } from '@imgly/background-removal'

export interface RemoveBgProgress {
  key: string
  current: number
  total: number
  percentage: number
}

async function resizeImageIfNeeded(source: Blob | File | string, maxDimension = 1200): Promise<Blob | string> {
  if (typeof source === 'string') return source
  if (typeof window === 'undefined' || !window.createImageBitmap) return source

  try {
    const bitmap = await createImageBitmap(source)
    const { width, height } = bitmap
    if (width <= maxDimension && height <= maxDimension) {
      bitmap.close?.()
      return source
    }

    const scale = Math.min(maxDimension / width, maxDimension / height)
    const targetW = Math.round(width * scale)
    const targetH = Math.round(height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      return source
    }

    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    bitmap.close?.()

    const resizedBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    )
    return resizedBlob ?? source
  } catch {
    return source
  }
}

/**
 * Otomatis menghapus latar belakang gambar sehingga hanya tersisa tubuh subjek/kucing.
 * Menggunakan model isnet_quint8 terkuantisasi untuk performa cepat di browser.
 */
export async function removeCatBackground(
  imageSource: Blob | File | string,
  onProgress?: (info: RemoveBgProgress) => void
): Promise<Blob> {
  const preparedSource = await resizeImageIfNeeded(imageSource, 1200)

  const resultBlob = await removeBackground(preparedSource, {
    model: 'isnet_quint8',
    output: {
      format: 'image/png',
      quality: 0.92,
    },
    progress: (key: string, current: number, total: number) => {
      const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0
      onProgress?.({ key, current, total, percentage })
    },
  })

  return resultBlob
}
