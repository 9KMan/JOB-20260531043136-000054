import { api } from './client'

export async function getReviewQueue(params = {}) {
  return api.get('/review/queue', params)
}

export async function getReviewItem(id) {
  return api.get(`/review/${id}`)
}

export async function submitReview(id, data) {
  return api.post(`/review/${id}`, data)
}

export async function escalateReview(id, reason) {
  return api.post(`/review/${id}/escalate`, { reason })
}

export async function getReviewStats() {
  return api.get('/review/stats')
}

export async function claimReviewItem(id) {
  return api.post(`/review/${id}/claim`)
}

export async function releaseReviewItem(id) {
  return api.post(`/review/${id}/release`)
}
