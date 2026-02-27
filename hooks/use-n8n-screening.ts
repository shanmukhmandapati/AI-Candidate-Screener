'use client'

import { useState, useCallback } from 'react'

interface ScreeningPayload {
  candidate_id: string
  name: string
  email: string
  phone: string
  linkedin_url: string
  resume_text: string
  skills: string[]
  experience_years: number
}

interface ScreeningResult {
  score: number
  rating: 'green' | 'yellow' | 'red'
  summary: string
  strengths: string[]
  weaknesses: string[]
  recommendation: string
}

export function useN8NScreening() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const screenCandidates = useCallback(
    async (
      candidates: ScreeningPayload[],
      webhookUrl: string,
      onResultCallback?: (result: ScreeningResult) => void
    ) => {
      setLoading(true)
      setError('')

      try {
        for (const candidate of candidates) {
          try {
            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(candidate),
            })

            if (!response.ok) {
              console.error(`Failed to screen ${candidate.name}`)
              continue
            }

            const result: ScreeningResult = await response.json()

            // Save result to database
            await fetch('/api/screening-results', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                candidate_id: candidate.candidate_id,
                batch_id: '', // Will be set by the component
                results: result,
              }),
            })

            if (onResultCallback) {
              onResultCallback(result)
            }
          } catch (candidateError) {
            console.error(`Error screening candidate ${candidate.name}:`, candidateError)
          }
        }
      } catch (err) {
        setError('Failed to screen candidates')
        console.error(err)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { screenCandidates, loading, error }
}
