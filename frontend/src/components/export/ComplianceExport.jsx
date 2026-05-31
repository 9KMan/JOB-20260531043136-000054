import { useState } from 'react'
import { api } from '../../api/client'
import { Button } from '../ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import { Select } from '../ui/Input'
import { Alert } from '../ui/Alert'
import toast from 'react-hot-toast'

const EXPORT_FORMATS = [
  { id: 'pdf', label: 'PDF Report' },
  { id: 'csv', label: 'CSV Data' },
  { id: 'xlsx', label: 'Excel Spreadsheet' },
  { id: 'json', label: 'JSON' }
]

const REPORT_TYPES = [
  { id: 'compliance_summary', label: 'Compliance Summary' },
  { id: 'audit_trail', label: 'Audit Trail' },
  { id: 'assessment_records', label: 'Assessment Records' },
  { id: 'student_analytics', label: 'Student Analytics' }
]

export function ComplianceExport() {
  const [format, setFormat] = useState('pdf')
  const [reportType, setReportType] = useState('compliance_summary')
  const [dateRange, setDateRange] = useState('last_30_days')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleExport = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/export/${reportType}?format=${format}&range=${dateRange}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compliance-export-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Export downloaded successfully')
    } catch (err) {
      setError(err.message || 'Failed to generate export')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compliance Export</h1>
        <p className="text-gray-500 mt-1">Export compliance data in various formats</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Settings</CardTitle>
          <CardDescription>Configure your export parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            {REPORT_TYPES.map((type) => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </Select>

          <Select
            label="Export Format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            {EXPORT_FORMATS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </Select>

          <Select
            label="Date Range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="this_year">This Year</option>
            <option value="all_time">All Time</option>
          </Select>

          <Button onClick={handleExport} loading={loading} className="w-full">
            Generate Export
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• All exports comply with Australian privacy regulations</li>
            <li>• PDF reports include digital signatures for audit purposes</li>
            <li>• CSV/Excel exports are formatted for direct import into compliance systems</li>
            <li>• Large exports may take a few minutes to generate</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
