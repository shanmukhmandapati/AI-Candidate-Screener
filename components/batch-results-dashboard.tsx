'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScreeningResult } from '@/components/screening-result'
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

interface BatchResultsDashboardProps {
  batchId: string
}

interface Result {
  id: string
  candidate_id: string
  score: number
  rating: 'green' | 'yellow' | 'red'
  summary: string
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  candidates: {
    id: string
    name: string
    email: string
  }
}

export function BatchResultsDashboard({ batchId }: BatchResultsDashboardProps) {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ green: 0, yellow: 0, red: 0, total: 0 })

  useEffect(() => {
    fetchResults()
  }, [batchId])

  const fetchResults = async () => {
    try {
      const response = await fetch(
        `/api/screening-results?batch_id=${batchId}`
      )
      const data = await response.json()
      setResults(data)

      // Calculate stats
      const statsData = {
        green: data.filter((r: Result) => r.rating === 'green').length,
        yellow: data.filter((r: Result) => r.rating === 'yellow').length,
        red: data.filter((r: Result) => r.rating === 'red').length,
        total: data.length,
      }
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-600">Loading results...</p>
        </CardContent>
      </Card>
    )
  }

  const greenPercent = stats.total > 0 ? (stats.green / stats.total) * 100 : 0
  const yellowPercent = stats.total > 0 ? (stats.yellow / stats.total) * 100 : 0
  const redPercent = stats.total > 0 ? (stats.red / stats.total) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Strong Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.green}</div>
            <p className="text-xs text-gray-600 mt-1">
              {greenPercent.toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Potential Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.yellow}</div>
            <p className="text-xs text-gray-600 mt-1">
              {yellowPercent.toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Weak Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.red}</div>
            <p className="text-xs text-gray-600 mt-1">
              {redPercent.toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Results</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-gray-600">No results available</p>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <ScreeningResult
                  key={result.id}
                  result={{
                    score: result.score,
                    rating: result.rating,
                    summary: result.summary,
                    strengths: result.strengths,
                    weaknesses: result.weaknesses,
                    recommendation: result.recommendation,
                  }}
                  candidate={result.candidates}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
