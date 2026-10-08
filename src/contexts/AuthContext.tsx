import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<{ error: Error | null; session?: Session | null }>
  signIn: (identifier: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session with fallback to prevent stuck loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 3000)

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        clearTimeout(timer)
      })
      .catch((err) => {
        console.error('Failed to get session:', err)
        setLoading(false)
        clearTimeout(timer)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      clearTimeout(timer)
    })

    return () => {
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, username: string, fullName?: string) => {
    const cleanUsername = username.trim().toLowerCase().replace(/\s/g, '_')
    const cleanEmail = email.trim()

    // Check if username is already taken
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (existingProfile) {
      return { error: new Error('Username sudah digunakan, gunakan username lain.'), session: null }
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
          full_name: fullName?.trim() || cleanUsername,
        },
      },
    })

    return { error: error as Error | null, session: data?.session }
  }

  const signIn = async (identifier: string, password: string) => {
    let emailToUse = identifier.trim()

    // Jika input bukan format email (tidak ada '@'), cari email berdasarkan username
    if (!emailToUse.includes('@')) {
      const cleanUsername = emailToUse.toLowerCase()
      const { data: foundEmail, error: rpcError } = await supabase.rpc('get_email_by_username', {
        p_username: cleanUsername,
      })

      if (rpcError || !foundEmail) {
        return { error: new Error('Username tidak ditemukan. Periksa kembali atau gunakan email.') }
      }

      emailToUse = foundEmail
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    })

    return { error: error as Error | null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    return { error: error as Error | null }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error as Error | null }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
