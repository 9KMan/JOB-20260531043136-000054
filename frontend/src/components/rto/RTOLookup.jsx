import { useState } from 'react'
import { useRTOLookup } from '../../hooks/useRTOLookup'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Spinner } from '../ui/Loading'

export function RTOLookup() {
  const { results, loading, error, searchRTO, clearResults } = useRTOLookup()
  const [rtpId, setRtpId] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rtpId.trim()) {
      await searchRTO(rtpId.trim())
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RTO Lookup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Enter RTO ID (e.g., 12345)"
            value={rtpId}
            onChange={(e) => setRtpId(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" loading={loading}>Search</Button>
          {results.length > 0 && (
            <Button type="button" variant="ghost" onClick={clearResults}>Clear</Button>
          )}
        </form>

        {loading && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((rto) => (
              <div key={rto.rtp_id || rto.rtpId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{rto.legal_name || rto.legalName}</h4>
                    <p className="text-sm text-gray-500">RTO ID: {rto.rtp_id || rto.rtpId}</p>
                    {rto.trading_name && rto.trading_name !== rto.legal_name && (
                      <p className="text-sm text-gray-500">Trading as: {rto.trading_name}</p>
                    )}
                  </div>
                  <Badge variant={rto.status === 'Current' ? 'success' : 'warning'}>
                    {rto.status || 'Active'}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {rto.abn && (
                    <div>
                      <span className="text-gray-500">ABN: </span>
                      <span className="text-gray-900">{rto.abn}</span>
                    </div>
                  )}
                  {rto.state && (
                    <div>
                      <span className="text-gray-500">State: </span>
                      <span className="text-gray-900">{rto.state}</span>
                    </div>
                  )}
                </div>
                {rto.address && (
                  <p className="mt-2 text-sm text-gray-500">{rto.address}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
