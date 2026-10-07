import { useState, useCallback } from 'react'

interface LocationData {
  latitude: number
  longitude: number
  locationName: string
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
        setError('Geolocation tidak didukung di browser ini')
        setLoading(false)
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          let locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`

          // Try reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
              { headers: { 'Accept-Language': 'id' } }
            )
            const data = await response.json()
            if (data.display_name) {
              locationName = data.display_name
            }
          } catch {
            // Use coordinate string as fallback
          }

          const locationData = { latitude, longitude, locationName }
          setLocation(locationData)
          setLoading(false)
          resolve(locationData)
        },
        (err) => {
          setError(`Gagal mendapatkan lokasi: ${err.message}`)
          setLoading(false)
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    })
  }, [])

  return { location, loading, error, getCurrentLocation }
}
