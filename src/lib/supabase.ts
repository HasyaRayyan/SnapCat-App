import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://goendgtmalzxsbhdpwxz.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZW5kZ3RtYWx6eHNiaGRwd3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyOTY4MTMsImV4cCI6MjEwNjg3MjgxM30.9tvm0tSs15GPVzFrlzI-qSFlQ1LeA5TvsCjgAhIHb20'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
