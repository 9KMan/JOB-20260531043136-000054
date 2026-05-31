import { api } from './client'

export async function lookupRTO(rtpId) {
  return api.get('/rto/lookup', { rtp_id: rtpId })
}

export async function lookupCRICOS(cricosCode) {
  return api.get('/rto/cricos', { code: cricosCode })
}

export async function getRTOs() {
  return api.get('/rto')
}

export async function getRTOById(id) {
  return api.get(`/rto/${id}`)
}

export async function createRTO(data) {
  return api.post('/rto', data)
}

export async function updateRTO(id, data) {
  return api.put(`/rto/${id}`, data)
}

export async function completeOnboarding(rtoId, data) {
  return api.post(`/rto/${rtoId}/onboarding`, data)
}
