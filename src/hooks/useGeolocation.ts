import { useState, useCallback } from 'react'

export interface LocationData {
  latitude: number
  longitude: number
  locationName: string
  accuracy?: number
}

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    setLoading(true)
    setError(null)

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const errMsg = 'GPS / Geolocation tidak didukung di browser ini.'
        setError(errMsg)
        setLoading(false)
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords
          let locationName = `Koordinat: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`

          // Reverse geocoding via OpenStreetMap Nominatim
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 6000)

            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=17&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'id, en',
                },
                signal: controller.signal,
              }
            )
            clearTimeout(timeoutId)

            if (response.ok) {
              const data = await response.json()
              const addr = data.address
              if (addr) {
                // Susun nama lokasi yang rapi dan mudah dibaca
                const parts: string[] = []
                if (addr.road || addr.pedestrian || addr.building) {
                  parts.push(addr.road || addr.pedestrian || addr.building)
                }
                if (addr.neighbourhood || addr.suburb || addr.village) {
                  parts.push(addr.neighbourhood || addr.suburb || addr.village)
                }
                if (addr.city || addr.town || addr.county || addr.city_district) {
                  parts.push(addr.city || addr.town || addr.county || addr.city_district)
                }
                if (parts.length > 0) {
                  locationName = parts.join(', ')
                } else if (data.display_name) {
                  locationName = data.display_name.split(',').slice(0, 3).join(',')
                }
              } else if (data.display_name) {
                locationName = data.display_name
              }
            }
          } catch {
            // Fallback ke koordinat
          }

          const locationData: LocationData = {
            latitude,
            longitude,
            locationName,
            accuracy: Math.round(accuracy),
          }
          setLocation(locationData)
          setLoading(false)
          resolve(locationData)
        },
        (err) => {
          let userMsg = `Gagal mendapatkan lokasi: ${err.message}`
          if (err.code === err.PERMISSION_DENIED) {
            userMsg = 'Akses lokasi ditolak. Harap izinkan akses lokasi (GPS) pada pengaturan browser/perangkat Anda.'
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            userMsg = 'Informasi lokasi tidak tersedia saat ini. Pastikan GPS perangkat aktif.'
          } else if (err.code === err.TIMEOUT) {
            userMsg = 'Waktu pencarian lokasi habis. Coba klik ambil lokasi lagi.'
          }

          setError(userMsg)
          setLoading(false)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 10000,
        }
      )
    })
  }, [])

  return { location, loading, error, getCurrentLocation, setLocation, setError }
}
