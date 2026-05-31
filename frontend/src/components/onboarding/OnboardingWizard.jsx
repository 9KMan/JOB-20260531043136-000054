import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card'
import { Alert } from '../ui/Alert'
import { useRTOLookup } from '../../hooks/useRTOLookup'
import { completeOnboarding } from '../../api/rto'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 1, title: 'RTO Lookup', description: 'Verify your RTO details' },
  { id: 2, title: 'Organisation Details', description: 'Basic information' },
  { id: 3, title: 'Compliance Setup', description: 'Configure compliance settings' },
  { id: 4, title: 'Review& Complete', description: 'Confirm your setup' }
]

export function OnboardingWizard() {
  const navigate = useNavigate()
  const { results: rtoResults, searchRTO, loading: rtoLoading } = useRTOLookup()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    rtpId: '',
    legalName: '',
    tradingName: '',
    abn: '',
    address: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    scope: ''
  })

  const handleRTOlookup = async (e) => {
    e.preventDefault()
    if (!formData.rtpId) return
    await searchRTO(formData.rtpId)
  }

  const selectRTO = (rto) => {
    setFormData(prev => ({
      ...prev,
      rtpId: rto.rtp_id || rto.rtpId,
      legalName: rto.legal_name || rto.legalName,
      tradingName: rto.trading_name || rto.tradingName,
      abn: rto.abn,
      address: rto.address
    }))
    setCurrentStep(2)
  }

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await completeOnboarding(formData.rtpId, formData)
      toast.success('Onboarding complete!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to complete onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">RTO Onboarding</h1>
        <p className="text-gray-500 mt-1">Set up your RTO for AI-powered compliance</p>
      </div>

      <div className="flex mb-8">
        {STEPS.map((step) => (
          <div key={step.id} className="flex-1 flex items-center">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
              ${currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
            `}>
              {currentStep > step.id ? '✓' : step.id}
            </div>
            {step.id < STEPS.length && (
              <div className={`flex-1 h-1 mx-2 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      <Card>
        {currentStep === 1 && (
          <>
            <CardHeader>
              <CardTitle>Step 1: RTO Lookup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Enter your RTO ID (e.g., 12345) to verify your registration with training.gov.au
              </p>
              <form onSubmit={handleRTOlookup} className="flex gap-2">
                <Input
                  placeholder="RTO ID (e.g., 12345)"
                  value={formData.rtpId}
                  onChange={(e) => setFormData(prev => ({ ...prev, rtpId: e.target.value }))}
                  className="flex-1"
                />
                <Button type="submit" loading={rtoLoading}>Lookup</Button>
              </form>

              {rtoResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Found RTOs:</p>
                  {rtoResults.map((rto) => (
                    <button
                      key={rto.rtp_id || rto.rtpId}
                      onClick={() => selectRTO(rto)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{rto.legal_name || rto.legalName}</p>
                      <p className="text-sm text-gray-500">RTO ID: {rto.rtp_id || rto.rtpId}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </>
        )}

        {currentStep === 2 && (
          <>
            <CardHeader>
              <CardTitle>Step 2: Organisation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Legal Name"
                value={formData.legalName}
                onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
              />
              <Input
                label="Trading Name"
                value={formData.tradingName}
                onChange={(e) => setFormData(prev => ({ ...prev, tradingName: e.target.value }))}
              />
              <Input
                label="ABN"
                value={formData.abn}
                onChange={(e) => setFormData(prev => ({ ...prev, abn: e.target.value }))}
              />
              <Input
                label="Street Address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact Name"
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                />
                <Input
                  label="Contact Email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                />
              </div>
              <Input
                label="Phone"
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={handleBack}>Back</Button>
              <Button onClick={handleNext}>Next</Button>
            </CardFooter>
          </>
        )}

        {currentStep === 3 && (
          <>
            <CardHeader>
              <CardTitle>Step 3: Compliance Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://"
              />
              <Textarea
                label="Training & Assessment Scope"
                value={formData.scope}
                onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
                placeholder="List your training packages and qualification codes..."
                rows={4}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={handleBack}>Back</Button>
              <Button onClick={handleNext}>Next</Button>
            </CardFooter>
          </>
        )}

        {currentStep === 4 && (
          <>
            <CardHeader>
              <CardTitle>Step 4: Review & Complete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">RTO ID:</span>
                  <span className="font-medium">{formData.rtpId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Legal Name:</span>
                  <span className="font-medium">{formData.legalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ABN:</span>
                  <span className="font-medium">{formData.abn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact:</span>
                  <span className="font-medium">{formData.contactEmail}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={handleBack}>Back</Button>
              <Button onClick={handleSubmit} loading={loading}>Complete Setup</Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}
