import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { supabase } from '@/lib/supabase'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''
const API = `${BACKEND_URL}/api`

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const token = session?.access_token || null

  const api = useMemo(() => {
    return axios.create({
      baseURL: API,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  }, [token])

  // Fetch public.users profile from Supabase
  const fetchProfile = async (authUser) => {
    if (!authUser) return null
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()
    if (error || !data) return null
    return {
      id: data.id,
      auth_id: data.auth_id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role,
      hotel_id: data.hotel_id,
      phone: data.phone,
      avatar_url: data.avatar_url,
      is_active: data.is_active,
    }
  }

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
      if (currentSession?.user) {
        const profile = await fetchProfile(currentSession.user)
        setUser(profile)
      }
      setLoading(false)
    }
    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        if (newSession?.user) {
          const profile = await fetchProfile(newSession.user)
          setUser(profile)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    const profile = await fetchProfile(data.user)
    setUser(profile)
    return { user: profile, token: data.session.access_token }
  }

  const register = async (userData) => {
    const { email, password, first_name, last_name, role } = userData
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name, last_name, role }
      }
    })
    if (error) throw new Error(error.message)
    const profile = await fetchProfile(data.user)
    setUser(profile)
    return profile
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
  }

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }))
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!session && !!user,
    login,
    register,
    logout,
    updateUser,
    api,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
