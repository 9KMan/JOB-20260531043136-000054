import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { sendMagicLink, verifyMagicLink, logout, getCurrentUser } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      getCurrentUser()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('auth_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const loginWithMagicLink = useCallback(async (email) => {
    await sendMagicLink(email)
    setMagicLinkSent(true)
  }, [])

  const verifyToken = useCallback(async (token) => {
    const userData = await verifyMagicLink(token)
    setUser(userData.user || userData)
    return userData
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logout()
    } finally {
      localStorage.removeItem('auth_token')
      setUser(null)
    }
  }, [])

  const value = {
    user,
    loading,
    magicLinkSent,
    loginWithMagicLink,
    verifyToken,
    signOut,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
