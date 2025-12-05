'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Listing } from '@/lib/types/listing'

export function useListings(filters?: {
  host_id?: string
  status?: 'draft' | 'published'
}) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true)
        const supabase = createClient()
        
        let query = supabase.from('listings').select('*')

        if (filters?.host_id) {
          query = query.eq('host_id', filters.host_id)
        }

        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) throw error
        setListings(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch listings'))
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [filters?.host_id, filters?.status])

  return { listings, loading, error }
}

export function useListing(id: string | null) {
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    async function fetchListing() {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setListing(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch listing'))
      } finally {
        setLoading(false)
      }
    }

    fetchListing()
  }, [id])

  return { listing, loading, error }
}

