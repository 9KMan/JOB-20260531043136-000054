import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { CreditBalance } from '../credits/CreditBalance'
import { Button } from '../ui/Button'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="AI Compliance" className="h-8 w-8" />
          <span className="text-lg font-semibold text-gray-900">AI Compliance</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <Link to="/prompts" className="text-sm text-gray-600 hover:text-gray-900">
            Prompts
          </Link>
          <Link to="/review" className="text-sm text-gray-600 hover:text-gray-900">
            Review Queue
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <CreditBalance />
          
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
