import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            AI-Powered Compliance for Australian RTOs
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your training compliance workflows with intelligent automation,
            built specifically for Registered Training Organisations.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg">Get Started</Button>
              </Link>
            )}
            <Link to="/prompts">
              <Button size="lg" variant="outline">Browse Prompts</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Compliance Review</h3>
              <p className="text-gray-500 mt-2">
                AI-assisted review of compliance documents with human oversight for critical decisions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Prompt Library</h3>
              <p className="text-gray-500 mt-2">
                Browse and use expertly crafted AI prompts for common compliance and training tasks.
</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">RTO Registry</h3>
              <p className="text-gray-500 mt-2">
                Integrated lookup for training.gov.au and CRICOS data to verify provider credentials.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to streamline your compliance?</h2>
          <p className="text-gray-500 mb-8">Join Australian RTOs already using AI Compliance</p>
          <Link to="/login">
            <Button size="lg">Start Free Trial</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
