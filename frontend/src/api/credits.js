import { api } from './client'

export async function getCreditBalance() {
  return api.get('/credits/balance')
}

export async function getCreditTransactions() {
  return api.get('/credits/transactions')
}

export async function purchaseCredits(packageId) {
  return api.post('/credits/purchase', { package_id: packageId })
}

export async function getCreditPackages() {
  return api.get('/credits/packages')
}

export async function createCheckoutSession(packageId) {
  return api.post('/credits/checkout', { package_id: packageId })
}

export async function verifyStripeWebhook(payload, signature) {
  return api.post('/credits/webhook/verify', { payload, signature })
}
