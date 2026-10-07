import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type AnimalType = Database['public']['Tables']['animal_types']['Row']
export type AnimalTypeInsert = Database['public']['Tables']['animal_types']['Insert']

export type Animal = Database['public']['Tables']['animals']['Row']
export type AnimalInsert = Database['public']['Tables']['animals']['Insert']
export type AnimalUpdate = Database['public']['Tables']['animals']['Update']

export type AnimalWithType = Animal & { animal_types: AnimalType }
