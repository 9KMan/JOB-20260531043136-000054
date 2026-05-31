import { useState } from 'react'
import { useRTOLookup } from '../../hooks/useRTOLookup'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Spinner } from '../ui/Loading'

export function CRICOSLookup() {
  const { results, loading, error, searchCRICOS, clearResults } = useRTOLookup()
  const [code, setCode] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.trim()) {
      await searchCRICOS(code.trim())
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CRICOS Lookup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-500">
          Search the CRICOS register for registered training organisations offering courses to international students.
</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Enter CRICOS code (e.g., 01234A)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
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
            {results.map((provider) => (
              <div key={provider.cricos_code || provider.code} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                    <p className="text-sm text-gray-500">CRICOS: {provider.cricos_code || provider.code}</p>
                  </div>
                  <Badge variant={provider.registration_status === 'Registered' ? 'success' : 'warning'}>
                    {provider.registration_status || 'Active'}
                  </Badge>
                </div>
                {provider.courses && provider.courses.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Registered Courses:</p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      {provider.courses.map((course, idx) => (
                        <li key={idx}>{course}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
