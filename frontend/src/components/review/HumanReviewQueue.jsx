import { useState, useEffect } from 'react'
import { getReviewQueue, submitReview, getReviewStats } from '../../api/reviewQueue'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Textarea } from '../ui/Input'
import { Spinner } from '../ui/Loading'
import { Alert } from '../ui/Alert'
import toast from 'react-hot-toast'
import { formatDate } from '../../lib/utils'

export function HumanReviewQueue() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadQueue()
    loadStats()
  }, [])

  const loadQueue = async () => {
    try {
      const data = await getReviewQueue()
      setItems(data.items || data || [])
    } catch (error) {
      console.error('Failed to load queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await getReviewStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleSubmitReview = async (decision) => {
    if (!selectedItem) return
    setSubmitting(true)

    try {
      await submitReview(selectedItem.id, {
        decision,
        notes: reviewNotes
      })
      toast.success(`Review ${decision} submitted`)
      setSelectedItem(null)
      setReviewNotes('')
      loadQueue()
      loadStats()
    } catch (error) {
      toast.error(error.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Human Review Queue</h1>
        <p className="text-gray-500 mt-1">Review flagged items requiring human oversight</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.pending || 0}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.in_progress || 0}</div>
              <div className="text-sm text-gray-500">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approved || 0}</div>
              <div className="text-sm text-gray-500">Approved Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected || 0}</div>
              <div className="text-sm text-gray-500">Rejected Today</div>
            </CardContent>
          </Card>
        </div>
      )}

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No items in the review queue.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Pending Items</h2>
            {items.map((item) => (
              <Card
                key={item.id}
                className={`cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'default'}>
                        {item.priority || 'Normal'}
                      </Badge>
                      <h3 className="font-medium text-gray-900 mt-2">{item.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-gray-400">
                    <span>{item.type || 'Compliance'}</span>
                    <span>{formatDate(item.created_at || item.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            {selectedItem ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedItem.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Description</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedItem.description}</p>
                  </div>

                  {selectedItem.context && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Context</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedItem.context}</p>
                    </div>
                  )}

                  <Textarea
                    label="Review Notes"
                    placeholder="Add notes about your decision..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                  />

                  <div className="flex gap-3">
                    <Button
                      variant="danger"
                      className="flex-1"
                      onClick={() => handleSubmitReview('rejected')}
                      loading={submitting}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => handleSubmitReview('approved')}
                      loading={submitting}
                    >
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12 text-gray-500">
                  Select an item to review
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
