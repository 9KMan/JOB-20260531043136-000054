import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Input'
import toast from 'react-hot-toast'

export function PromptCard({ prompt, showActions = true }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content || prompt.text)
      setCopied(true)
      toast.success('Prompt copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base">{prompt.title}</CardTitle>
          {prompt.category && (
            <Badge variant="primary">{prompt.category}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className={`text-sm text-gray-600 flex-1 ${!expanded && 'line-clamp-3'}`}>
          {prompt.content || prompt.text}
        </p>

        {prompt.variables && prompt.variables.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Variables:</p>
            <div className="flex flex-wrap gap-1">
              {prompt.variables.map((v, i) => (
                <Badge key={i} variant="default" className="text-xs">
                  {v}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {showActions && (
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Less' : 'More'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
