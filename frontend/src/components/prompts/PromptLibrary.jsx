import { useState, useEffect } from 'react'
import { getPrompts, searchPrompts, getPromptCategories } from '../../api/prompts'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Input'
import { Card, CardContent } from '../ui/Card'
import { PromptCard } from './PromptCard'
import { Spinner } from '../ui/Loading'

export function PromptLibrary() {
  const [prompts, setPrompts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    Promise.all([
      getPrompts(),
      getPromptCategories()
    ])
      .then(([promptsData, categoriesData]) => {
        setPrompts(promptsData.prompts || promptsData || [])
        setCategories(categoriesData.categories || categoriesData || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    try {
      const results = await searchPrompts(query)
      setPrompts(results.prompts || results || [])
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleCategoryChange = async (category) => {
    setSelectedCategory(category)
    setLoading(true)
    try {
      const params = category ? { category } : {}
      const data = await getPrompts(params)
      setPrompts(data.prompts || data || [])
    } catch (error) {
      console.error('Failed to load prompts:', error)
    } finally {
      setLoading(false)
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
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prompt Library</h1>
          <p className="text-gray-500 mt-1">Browse AI prompts for compliance tasks</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <Input
            placeholder="Search prompts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" loading={searching}>Search</Button>
        </form>

        <Select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="md:w-48"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id || cat} value={cat.id || cat}>
              {cat.name || cat}
            </option>
          ))}
        </Select>
      </div>

      {prompts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No prompts found. Try a different search.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      )}
    </div>
  )
}
