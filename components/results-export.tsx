'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  createResultsCSV,
  createResultsTSV,
  downloadFile,
  matchResultsToCandidates,
  type CandidateWithResults,
} from '@/lib/export-results'
import { Download, FileJson, File } from 'lucide-react'

interface ResultsExportProps {
  originalCandidates: Record<string, string>[]
  screeningResults: Array<{
    candidate_email: string
    match_score: number
    decision: string
    matching_skills: string[]
    missing_skills: string[]
    summary: string
    score_breakdown: any
  }>
  fileName?: string
}

export function ResultsExport({
  originalCandidates,
  screeningResults,
  fileName = 'screening-results',
}: ResultsExportProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const matchedResults = matchResultsToCandidates(
    originalCandidates,
    screeningResults
  )

  const handleDownloadCSV = async () => {
    setIsDownloading(true)
    try {
      const csv = createResultsCSV(matchedResults)
      downloadFile(csv, `${fileName}-${new Date().toISOString().split('T')[0]}.csv`)
    } catch (error) {
      console.error('Error downloading CSV:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadExcel = async () => {
    setIsDownloading(true)
    try {
      const tsv = createResultsTSV(matchedResults)
      // Excel can read TSV as tab-separated
      downloadFile(
        tsv,
        `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
    } catch (error) {
      console.error('Error downloading Excel:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Screening Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Total Candidates Screened: <span className="font-semibold">{matchedResults.length}</span>
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Strong Matches (80%+):</span>
                  <span className="font-semibold text-green-600">
                    {matchedResults.filter(
                      (c) => c.match_score >= 80
                    ).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Potential Matches (60-79%):</span>
                  <span className="font-semibold text-yellow-600">
                    {matchedResults.filter(
                      (c) => c.match_score >= 60 && c.match_score < 80
                    ).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Weak Matches (&lt;60%):</span>
                  <span className="font-semibold text-red-600">
                    {matchedResults.filter(
                      (c) => c.match_score < 60
                    ).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Download Results With All Scoring Data:
              </p>
              <Button
                onClick={handleDownloadCSV}
                disabled={isDownloading || matchedResults.length === 0}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
              <Button
                onClick={handleDownloadExcel}
                disabled={isDownloading || matchedResults.length === 0}
                className="w-full"
              >
                <FileJson className="h-4 w-4 mr-2" />
                Download Excel
              </Button>
            </div>
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Note:</span> The downloaded file includes all original columns (A-H) plus AI scoring data (I-O):
            </p>
            <ul className="text-sm text-blue-700 mt-2 ml-4 space-y-1">
              <li>• I: Match Score %</li>
              <li>• J: Decision (Strong/Potential/Not a Match)</li>
              <li>• K: Matching Skills</li>
              <li>• L: Missing Skills</li>
              <li>• M: AI Summary</li>
              <li>• N: Score Breakdown</li>
              <li>• O: Screened Date</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
