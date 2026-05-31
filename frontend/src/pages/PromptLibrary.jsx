import { PromptLibrary } from '../components/prompts/PromptLibrary'
import { PromptSuggestForm } from '../components/prompts/PromptSuggestForm'
import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'

export default function PromptLibraryPage() {
  const [showSuggest, setShowSuggest] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prompt Library</h1>
          <p className="text-gray-500 mt-1">AI prompts for compliance tasks</p>
        </div>
        <Button onClick={() => setShowSuggest(!showSuggest)}>
          {showSuggest ? 'Browse Prompts' : 'Suggest a Prompt'}
        </Button>
      </div>

      {showSuggest ? (
        <div className="max-w-2xl">
          <PromptSuggestForm />
        </div>
      ) : (
        <PromptLibrary />
      )}
    </div>
  )
}
