'use client'

import { useState, useEffect } from 'react'
import { useN8NScreening } from '@/hooks/use-n8n-screening'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScreeningResult } from '@/components/screening-result'
import { Loader2 } from 'lucide-react'

interface ScreeningWorkflowProps {
  batchId: string
  candidates: any[]
  webhookUrl: string
  onComplete: (results: any[]) => void
}

export function ScreeningWorkflow({
  batchId,
  candidates,
  webhookUrl,
  onComplete,
}: ScreeningWorkflowProps) {
  const [results, setResults] = useState<any[]>([])
  const [processedCount, setProcessedCount] = useState(0)
  const [isStarted, setIsStarted] = useState(false)
  const { screenCandidates, loading, error } = useN8NScreening()

  const startScreening = async () => {
    setIsStarted(true)

    const candidatePayloads = candidates.map((candidate) => ({
      candidate_id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      linkedin_url: candidate.linkedin_url,
      resume_text: candidate.resume_text,
      skills: candidate.skills || [],
      experience_years: candidate.experience_years || 0,
    }))

    await screenCandidates(
      candidatePayloads,
      webhookUrl,
      (result) => {
        setResults((prev) => [...prev, result])
        setProcessedCount((prev) => prev + 1)

        // Update batch progress
        fetch(`/api/batches/${batchId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'processing',
            processed_count: processedCount + 1,
          }),
        })
      }
    )

    // Mark batch as completed
    await fetch(`/api/batches/${batchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        processed_count: candidates.length,
      }),
    })

    onComplete(results)
  }

  const progress = candidates.length > 0 ? (processedCount / candidates.length) * 100 : 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Screening Progress</CardTitle>
          <CardDescription>
            {processedCount} of {candidates.length} candidates processed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-2" />

          {!isStarted && (
            <Button onClick={startScreening} size="lg" className="w-full">
              Start Screening
            </Button>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Screening candidates...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Screening results from N8N workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded border ${
                    result.rating === 'green'
                      ? 'bg-green-50 border-green-200'
                      : result.rating === 'yellow'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Candidate {idx + 1}</span>
                    <span className="text-sm font-bold">{result.score}/100</span>
                  </div>
                  <p className="text-sm text-gray-600">{result.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
