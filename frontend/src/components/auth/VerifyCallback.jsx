import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { MagicLinkForm } from './MagicLinkForm'
import { Card, CardContent } from '../ui/Card'
import { Spinner } from '../ui/Loading'

export default function VerifyCallback() {
  const [searchParams] = useSearchParams()
  const { verifyToken } = useAuth()
  const [status, setStatus] = useState('verifying')
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      verifyToken(token)
        .then(() => setStatus('success'))
        .catch((err) => {
          setError(err.message)
          setStatus('error')
        })
    } else {
      setError('No token provided')
      setStatus('error')
    }
  }, [searchParams, verifyToken])

  if (status === 'verifying') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Verifying your link...</p>
        </CardContent>
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Failed</h3>
          <p className="text-gray-500">{error || 'The link may have expired. Please try again.'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
        <p className="text-gray-500">Redirecting to dashboard...</p>
      </CardContent>
    </Card>
  )
}
