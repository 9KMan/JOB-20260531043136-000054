import { useSearchParams } from 'react-router-dom'
import { MagicLinkForm } from '../components/auth/MagicLinkForm'
import VerifyCallback from '../components/auth/VerifyCallback'

export default function Login() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <VerifyCallback />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/favicon.svg" alt="AI Compliance" className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">AI Compliance</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>
        <MagicLinkForm />
      </div>
    </div>
  )
}
