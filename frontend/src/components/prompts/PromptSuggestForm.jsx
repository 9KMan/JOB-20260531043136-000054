import { useState } from 'react'
import { suggestPrompt } from '../../api/prompts'
import { Button } from '../ui/Button'
import { Input, Textarea, Select } from '../ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import { Alert } from '../ui/Alert'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Compliance Review',
  'Assessment Validation',
  'Student Support',
  'Documentation',
  'Reporting',
  'Other'
]

export function PromptSuggestForm() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await suggestPrompt(formData)
      setSuccess(true)
      toast.success('Thank you! Your prompt has been submitted for review.')
      setFormData({ title: '', content: '', category: '', description: '' })
    } catch (err) {
      setError(err.message || 'Failed to submit prompt')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Prompt Submitted</h3>
          <p className="text-gray-500">Thank you for your contribution! Our team will review it shortly.</p>
          <Button className="mt-4" onClick={() => setSuccess(false)}>Submit Another</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggest a Prompt</CardTitle>
        <CardDescription>
          Contribute an AI prompt that has worked well for your RTO compliance needs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            label="Prompt Title"
            placeholder="e.g., Assessment Validation Checklist"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />

          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            required
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>

          <Textarea
            label="Prompt Content"
            placeholder="Enter the full prompt text including any variables in braces {like_this}..."
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={6}
            required
          />

          <Textarea
            label="Description (optional)"
            placeholder="Explain when and how to use this prompt..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />

          <Button type="submit" loading={loading} className="w-full">
            Submit for Review
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
