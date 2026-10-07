import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { AnimalWithType, AnimalInsert, AnimalUpdate } from '../types'

type SortField = 'captured_at' | 'name'
type SortOrder = 'asc' | 'desc'

interface UseAnimalsOptions {
  typeId?: string
  searchQuery?: string
  sortField?: SortField
  sortOrder?: SortOrder
}

export function useAnimals(options: UseAnimalsOptions = {}) {
  const { user } = useAuth()
  const [animals, setAnimals] = useState<AnimalWithType[]>([])
  const [loading, setLoading] = useState(true)
  const { typeId, searchQuery, sortField = 'captured_at', sortOrder = 'desc' } = options

  const fetchAnimals = useCallback(async () => {
    if (!user) return
    setLoading(true)

    let query = supabase
      .from('animals')
      .select('*, animal_types(*)')
      .eq('user_id', user.id)

    if (typeId) {
      query = query.eq('type_id', typeId)
    }

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`)
    }

    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    const { data, error } = await query

    if (!error && data) {
      setAnimals(data as unknown as AnimalWithType[])
    }
    setLoading(false)
  }, [user, typeId, searchQuery, sortField, sortOrder])

  useEffect(() => {
    fetchAnimals()
  }, [fetchAnimals])

  const addAnimal = async (animal: AnimalInsert) => {
    const { data, error } = await supabase
      .from('animals')
      .insert(animal)
      .select('*, animal_types(*)')
      .single()

    if (!error && data) {
      await fetchAnimals()
    }
    return { data, error }
  }

  const updateAnimal = async (id: string, updates: AnimalUpdate) => {
    const { error } = await supabase
      .from('animals')
      .update(updates)
      .eq('id', id)

    if (!error) {
      await fetchAnimals()
    }
    return { error }
  }

  const deleteAnimal = async (id: string) => {
    const { error } = await supabase
      .from('animals')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchAnimals()
    }
    return { error }
  }

  const getRandomAnimal = useCallback(async (): Promise<AnimalWithType | null> => {
    if (!user) return null
    const { data, error } = await supabase
      .from('animals')
      .select('*, animal_types(*)')
      .eq('user_id', user.id)
    
    if (error || !data || data.length === 0) return null
    const randomIndex = Math.floor(Math.random() * data.length)
    return data[randomIndex] as unknown as AnimalWithType
  }, [user])

  return { animals, loading, addAnimal, updateAnimal, deleteAnimal, getRandomAnimal, refetch: fetchAnimals }
}
