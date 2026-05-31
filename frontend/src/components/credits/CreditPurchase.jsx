import { useState, useEffect } from 'react'
import { useCredits } from '../../hooks/useCredits'
import { getCreditPackages } from '../../api/credits'
import { Button } from '../ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import { Spinner } from '../ui/Loading'
import { formatCurrency } from '../../lib/utils'
import toast from 'react-hot-toast'

const PACKAGES = [
  { id: 'starter', credits: 100, price: 49, label: 'Starter', description: 'Perfect for small RTOs' },
  { id: 'professional', credits: 500, price: 199, label: 'Professional', description: 'Most popular for medium RTOs', popular: true },
  { id: 'enterprise', credits: 2000, price: 699, label: 'Enterprise', description: 'For large RTOs with high volume' }
]

export function CreditPurchase() {
  const { purchase, loading: purchaseLoading } = useCredits()
  const [packages, setPackages] = useState(PACKAGES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCreditPackages()
      .then(setPackages)
      .catch(() => setPackages(PACKAGES))
      .finally(() => setLoading(false))
  }, [])

  const handlePurchase = async (packageId) => {
    try {
      await purchase(packageId)
    } catch (err) {
      toast.error(err.message || 'Failed to start checkout')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Purchase Credits</h2>
        <p className="text-gray-500 mt-1">Select a package that fits your needs</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={pkg.popular ? 'ring-2 ring-blue-500' : ''}>
            {pkg.popular && (
              <div className="bg-blue-600 text-white text-center py-1 text-sm font-medium">
                Most Popular
              </div>
            )}
            <CardHeader className="text-center">
              <CardTitle>{pkg.label}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(pkg.price)}
              </div>
              <div className="text-gray-500 mt-1">
                {pkg.credits} credits
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {formatCurrency(pkg.price / pkg.credits)} per credit
              </div>
            </CardContent>
            <div className="px-6 pb-6">
              <Button
                onClick={() => handlePurchase(pkg.id)}
                loading={purchaseLoading}
                className="w-full"
                variant={pkg.popular ? 'primary' : 'outline'}
              >
                Purchase
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
