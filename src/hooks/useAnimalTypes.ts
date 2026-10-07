import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { AnimalType, AnimalTypeInsert } from '../types'

export function useAnimalTypes() {
  const { user } = useAuth()
  const [types, setTypes] = useState<AnimalType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTypes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('animal_types')
      .select('*')
      .order('name')

    if (!error && data) {
      setTypes(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTypes()
  }, [fetchTypes])

  const addType = async (type: AnimalTypeInsert) => {
    if (!user) return { error: new Error('Not authenticated') }
    const { data, error } = await supabase
      .from('animal_types')
      .insert({ ...type, user_id: user.id })
      .select()
      .single()

    if (!error) {
      await fetchTypes()
    }
    return { data, error }
  }

  return { types, loading, addType, refetch: fetchTypes }
}
