import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCredits } from '../hooks/useCredits'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { CreditBalance } from '../components/credits/CreditBalance'
import { Spinner } from '../components/ui/Loading'
import { CheckCircle, AlertCircle, FileText, MessageSquare } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const { balance, fetchBalance } = useCredits()

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  const stats = [
    { label: 'Credit Balance', value: balance, icon: '💰', color: 'text-blue-600' },
    { label: 'Pending Reviews', value: 3, icon: '📋', color: 'text-amber-600' },
    { label: 'Active Prompts', value: 12, icon: '💬', color: 'text-green-600' },
    { label: 'Exports', value: 5, icon: '📄', color: 'text-purple-600' }
  ]

  const recentActivity = [
    { type: 'review', message: 'Compliance document approved', time: '2 hours ago' },
    { type: 'prompt', message: 'New prompt added to library', time: '5 hours ago' },
    { type: 'export', message: 'Monthly report exported', time: '1 day ago' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.email || 'User'}</p>
        </div>
        <CreditBalance />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4">
              <div className="text-2xl">{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/prompts">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Browse Prompt Library
              </Button>
            </Link>
            <Link to="/review">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="h-4 w-4 mr-2" />
                Review Pending Items
              </Button>
            </Link>
            <Link to="/onboarding">
              <Button variant="outline" className="w-full justify-start">
                <AlertCircle className="h-4 w-4 mr-2" />
                Complete RTO Setup
              </Button>
            </Link>
            <Link to="/export">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Export Compliance Data
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                    <div>
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
