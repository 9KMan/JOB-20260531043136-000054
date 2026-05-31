import { createContext, useContext, useState, useCallback } from 'react'
import { getCreditBalance, purchaseCredits } from '../api/credits'

const CreditContext = createContext(null)

export function CreditProvider({ children }) {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchBalance = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCreditBalance()
      setBalance(data.balance || data.credits || 0)
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const purchase = useCallback(async (packageId) => {
    setLoading(true)
    try {
      const result = await purchaseCredits(packageId)
      if (result.checkout_url) {
        window.location.href = result.checkout_url
      }
      return result
    } finally {
      setLoading(false)
    }
  }, [])

  const deductCredits = useCallback((amount) => {
    setBalance(prev => Math.max(0, prev - amount))
  }, [])

  const value = {
    balance,
    loading,
    fetchBalance,
    purchase,
    deductCredits
  }

  return <CreditContext.Provider value={value}>{children}</CreditContext.Provider>
}

export function useCredits() {
  const context = useContext(CreditContext)
  if (!context) {
    throw new Error('useCredits must be used within a CreditProvider')
  }
  return context
}
