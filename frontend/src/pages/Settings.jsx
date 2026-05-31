import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setSuccess(true)
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </div>

     <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {success && <Alert variant="success">Settings saved successfully</Alert>}

            <Input
              label="Full Name"
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
            />

            <Input
              label="Email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
            />

            <Input
              label="Phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
            />

            <Button type="submit" loading={saving}>Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Email notifications for review queue items</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Email notifications for approved prompts</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Marketing and product updates</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="danger" onClick={signOut}>Sign Out</Button>
        </CardContent>
      </Card>
    </div>
  )
}
