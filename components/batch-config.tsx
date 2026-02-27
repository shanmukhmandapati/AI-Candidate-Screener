'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface BatchConfigProps {
  onConfigComplete: (config: {
    name: string
    description: string
    n8n_webhook_url: string
  }) => void
}

export function BatchConfig({ onConfigComplete }: BatchConfigProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Batch name is required')
      return
    }

    if (!webhookUrl.trim()) {
      setError('N8N webhook URL is required')
      return
    }

    try {
      new URL(webhookUrl)
    } catch {
      setError('Invalid webhook URL format')
      return
    }

    setError('')
    onConfigComplete({
      name,
      description,
      n8n_webhook_url: webhookUrl,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Screening Batch</CardTitle>
        <CardDescription>
          Set up your screening session and N8N workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="batch-name">Batch Name</Label>
          <Input
            id="batch-name"
            placeholder="e.g., Senior Engineer Screening Q1 2024"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="batch-description">Description (Optional)</Label>
          <Textarea
            id="batch-description"
            placeholder="Add notes about this screening batch"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook-url">N8N Webhook URL</Label>
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://your-n8n-instance.com/webhook/your-webhook-id"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Copy the webhook URL from your N8N workflow
          </p>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">{error}</div>}

        <Button onClick={handleSubmit} className="w-full">
          Create Batch
        </Button>
      </CardContent>
    </Card>
  )
}
