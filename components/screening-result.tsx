'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

interface ScreeningResultProps {
  result: {
    score: number
    rating: 'green' | 'yellow' | 'red'
    summary: string
    strengths: string[]
    weaknesses: string[]
    recommendation: string
  }
  candidate: {
    name: string
    email: string
  }
}

export function ScreeningResult({ result, candidate }: ScreeningResultProps) {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'green':
        return 'bg-green-50 border-green-200'
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200'
      case 'red':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'green':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'yellow':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'red':
        return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  return (
    <Card className={`border ${getRatingColor(result.rating)}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{candidate.name}</CardTitle>
            <p className="text-sm text-gray-600">{candidate.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {getRatingIcon(result.rating)}
            <div className="text-right">
              <div className="text-2xl font-bold">{result.score}</div>
              <Badge variant="outline" className="mt-1">
                {result.rating.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm mb-2">Summary</h3>
          <p className="text-sm text-gray-700">{result.summary}</p>
        </div>

        {result.strengths && result.strengths.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2 text-green-700">Strengths</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              {result.strengths.map((strength, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-green-600 font-bold">•</span> {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.weaknesses && result.weaknesses.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2 text-red-700">Weaknesses</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              {result.weaknesses.map((weakness, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-red-600 font-bold">•</span> {weakness}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.recommendation && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Recommendation</h3>
            <p className="text-sm text-gray-700 italic">{result.recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
