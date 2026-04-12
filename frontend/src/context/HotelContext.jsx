import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const HotelContext = createContext(null)

export const useHotel = () => {
  const context = useContext(HotelContext)
  if (!context) {
    throw new Error('useHotel must be used within a HotelProvider')
  }
  return context
}

export const HotelProvider = ({ children }) => {
  const { api, user, updateUser } = useAuth()
  const [hotels, setHotels] = useState([])
  const [currentHotel, setCurrentHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHotels = useCallback(async () => {
    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('is_active', true)
      
      if (!error && data && data.length > 0) {
        setHotels(data)
        const userHotel = user?.hotel_id
          ? data.find(h => h.id === user.hotel_id)
          : data[0]
        setCurrentHotel(userHotel || data[0])
      } else {
        // Fallback to legacy API
        const response = await api.get('/hotels')
        setHotels(response.data)
        if (response.data.length > 0) {
          const userHotel = user?.hotel_id
            ? response.data.find(h => h.id === user.hotel_id)
            : response.data[0]
          setCurrentHotel(userHotel || response.data[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch hotels:', error)
    } finally {
      setLoading(false)
    }
  }, [api, user?.hotel_id])

  const fetchRooms = useCallback(async () => {
    if (!currentHotel) return
    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', currentHotel.id)
        .eq('is_active', true)
        .order('room_number')

      if (!error && data) {
        setRooms(data)
      } else {
        // Fallback to legacy API
        const response = await api.get(`/hotels/${currentHotel.id}/rooms`)
        setRooms(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    }
  }, [api, currentHotel])

  useEffect(() => {
    fetchHotels()
  }, [fetchHotels])

  useEffect(() => {
    if (currentHotel) {
      fetchRooms()
    }
  }, [currentHotel, fetchRooms])

  const createHotel = async (hotelData) => {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .insert(hotelData)
        .select()
        .single()
      if (error) throw error
      setHotels((prev) => [...prev, data])
      setCurrentHotel(data)
      updateUser({ hotel_id: data.id })
      toast.success('Hôtel créé avec succès')
      return data
    } catch (error) {
      toast.error('Erreur lors de la création de l\'hôtel')
      throw error
    }
  }

  const switchHotel = (hotel) => {
    setCurrentHotel(hotel)
    setRooms([])
  }

  const createRoom = async (roomData) => {
    if (!currentHotel) return
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({ ...roomData, hotel_id: currentHotel.id })
        .select()
        .single()
      if (error) throw error
      setRooms((prev) => [...prev, data])
      toast.success('Chambre créée avec succès')
      return data
    } catch (error) {
      toast.error('Erreur lors de la création de la chambre')
      throw error
    }
  }

  const value = {
    hotels,
    currentHotel,
    rooms,
    loading,
    fetchHotels,
    fetchRooms,
    createHotel,
    switchHotel,
    createRoom,
  }

  return <HotelContext.Provider value={value}>{children}</HotelContext.Provider>
}
