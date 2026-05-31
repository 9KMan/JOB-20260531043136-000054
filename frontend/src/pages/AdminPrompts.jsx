import { useState, useEffect } from 'react'
import { getPrompts, approvePrompt, rejectPrompt } from '../api/prompts'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Textarea } from '../components/ui/Input'
import { Spinner } from '../components/ui/Loading'
import { Alert } from '../components/ui/Alert'
import toast from 'react-hot-toast'

export default function AdminPrompts() {
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadPendingPrompts()
  }, [])

  const loadPendingPrompts = async () => {
    try {
      const data = await getPrompts({ status: 'pending' })
      setPrompts(data.prompts || data || [])
    } catch (error) {
      console.error('Failed to load prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    setProcessing(true)
    try {
      await approvePrompt(id)
      toast.success('Prompt approved')
      setSelectedPrompt(null)
      loadPendingPrompts()
    } catch (error) {
      toast.error(error.message || 'Failed to approve prompt')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    setProcessing(true)
    try {
      await rejectPrompt(id, rejectReason)
      toast.success('Prompt rejected')
      setSelectedPrompt(null)
      setRejectReason('')
      loadPendingPrompts()
    } catch (error) {
      toast.error(error.message || 'Failed to reject prompt')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin: Prompt Approval</h1>
        <p className="text-gray-500 mt-1">Review and approve user-submitted prompts</p>
      </div>

      {prompts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No prompts pending approval</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <Card
                key={prompt.id}
                className={`cursor-pointer transition-colors ${selectedPrompt?.id === prompt.id ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setSelectedPrompt(prompt)}
              >
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{prompt.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{prompt.content || prompt.text}</p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-gray-400">
                    <span>By {prompt.submitted_by || prompt.submitter || 'Anonymous'}</span>
                    <span>{prompt.category}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            {selectedPrompt ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedPrompt.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Category</p>
                    <Badge variant="primary" className="mt-1">{selectedPrompt.category}</Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Prompt Content</p>
                    <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded-lg">
                      {selectedPrompt.content || selectedPrompt.text}
                    </p>
                  </div>

                  {selectedPrompt.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Description</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedPrompt.description}</p>
                    </div>
                  )}

                  <Textarea
                    label="Rejection Reason (required for rejection)"
                    placeholder="Explain why this prompt is being rejected..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                  />

                  <div className="flex gap-3">
                    <Button
                      variant="danger"
                      className="flex-1"
                      onClick={() => handleReject(selectedPrompt.id)}
                      loading={processing}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => handleApprove(selectedPrompt.id)}
                      loading={processing}
                    >
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12 text-gray-500">
                  Select a prompt to review
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
