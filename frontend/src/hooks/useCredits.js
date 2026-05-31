import { useContext } from 'react'
import { CreditContext } from '../context/CreditContext'

export function useCredits() {
  return useContext(CreditContext)
}
