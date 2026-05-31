import { api } from './client'

export async function sendMagicLink(email) {
  return api.post('/auth/magic-link', { email })
}

export async function verifyMagicLink(token) {
  const res = await api.post('/auth/verify', { token })
  if (res.token) {
    localStorage.setItem('auth_token', res.token)
  }
  return res
}

export async function logout() {
  localStorage.removeItem('auth_token')
  return api.post('/auth/logout')
}

export async function getCurrentUser() {
  return api.get('/auth/me')
}
