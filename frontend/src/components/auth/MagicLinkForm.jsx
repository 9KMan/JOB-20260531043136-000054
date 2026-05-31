import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import { Alert } from '../ui/Alert'
import toast from 'react-hot-toast'

export function MagicLinkForm() {
  const { loginWithMagicLink, magicLinkSent } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await loginWithMagicLink(email)
      toast.success('Magic link sent! Check your email.')
    } catch (err) {
      setError(err.message || 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h3>
          <p className="text-gray-500">
            We've sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Click the link in the email to sign in.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in with Magic Link</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a secure sign-in link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          
          <Input
            type="email"
            label="Email address"
            placeholder="you@rto.edu.au"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit" loading={loading} className="w-full">
            Send Magic Link
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
