import { useState, useCallback } from 'react'
import { lookupRTO, lookupCRICOS } from '../api/rto'

export function useRTOLookup() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const searchRTO = useCallback(async (rtpId) => {
    setLoading(true)
    setError(null)
    try {
      const data = await lookupRTO(rtpId)
      setResults(Array.isArray(data) ? data : [data])
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const searchCRICOS = useCallback(async (code) => {
    setLoading(true)
    setError(null)
    try {
      const data = await lookupCRICOS(code)
      setResults(Array.isArray(data) ? data : [data])
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return {
    results,
    loading,
    error,
    searchRTO,
    searchCRICOS,
    clearResults
  }
}
