import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
}

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    set({ user: { id: data.user.id, email: data.user.email! } })
    return {}
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    if (data.user) {
      set({ user: { id: data.user.id, email: data.user.email! } })
    }
    return {}
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      set({
        user: { id: session.user.id, email: session.user.email! },
        loading: false,
      })
    } else {
      set({ loading: false })
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({
          user: { id: session.user.id, email: session.user.email! },
          loading: false,
        })
      } else {
        set({ user: null, loading: false })
      }
    })
  },
}))
