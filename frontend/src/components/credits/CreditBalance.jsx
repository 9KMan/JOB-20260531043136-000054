import { useEffect } from 'react'
import { useCredits } from '../../hooks/useCredits'
import { Card, CardContent } from '../ui/Card'
import { Spinner } from '../ui/Loading'

export function CreditBalance() {
  const { balance, loading, fetchBalance } = useCredits()

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Spinner size="sm" />
        <span className="text-gray-500">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full">
        <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-semibold text-blue-700">{balance}</span>
        <span className="text-blue-600 text-sm">credits</span>
      </div>
    </div>
  )
}
