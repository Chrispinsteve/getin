'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Booking } from '@/lib/types/booking'

export function useBookings(filters?: {
  host_id?: string
  guest_id?: string
  listing_id?: string
  status?: Booking['status']
}) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true)
        const supabase = createClient()
        
        let query = supabase.from('bookings').select('*')

        if (filters?.host_id) {
          query = query.eq('host_id', filters.host_id)
        }

        if (filters?.guest_id) {
          query = query.eq('guest_id', filters.guest_id)
        }

        if (filters?.listing_id) {
          query = query.eq('listing_id', filters.listing_id)
        }

        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) throw error
        setBookings(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch bookings'))
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [filters?.host_id, filters?.guest_id, filters?.listing_id, filters?.status])

  return { bookings, loading, error }
}

export function useBooking(id: string | null) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    async function fetchBooking() {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setBooking(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch booking'))
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [id])

  return { booking, loading, error }
}

