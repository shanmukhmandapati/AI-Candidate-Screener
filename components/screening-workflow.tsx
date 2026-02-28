'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Upload, Download, Loader2, Link as LinkIcon } from 'lucide-react'
import { parseFile } from '@/lib/parse-candidates'
import { parseCSVContent } from '@/lib/parse-candidates'
import { fetchGoogleSheet, isValidGoogleSheetsUrl } from '@/lib/google-sheets'
import {
  sendToN8N,
  mergeCandidatesWithResults,
  getTopStats,
  type MergedCandidate,
} from '@/lib/n8n-integration'
import { downloadCSV, downloadExcel } from '@/lib/download-results'

interface LoadingStep {
  label: string
  icon: string
  completed: boolean
}

export function ScreeningWorkflow() {
  const [step, setStep] = useState<'upload' | 'config' | 'results'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [results, setResults] = useState<MergedCandidate[]>([])
  const [sheetUrl, setSheetUrl] = useState('')
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([
    { label: 'Parsing file...', icon: '📂', completed: false },
    { label: 'Sending to AI...', icon: '📤', completed: false },
    { label: 'Scoring candidates...', icon: '🤖', completed: false },
    { label: 'Done!', icon: '✅', completed: false },
  ])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setError(null)
    setFile(selectedFile)

    try {
      console.log('[v0] Parsing file:', selectedFile.name, 'Size:', selectedFile.size)
      const result = await parseFile(selectedFile)
      console.log('[v0] Parse result:', result)

      if (result.errors.length > 0) {
        console.log('[v0] Parse errors:', result.errors)
        toast.warning(`${result.candidates.length} candidates loaded with ${result.errors.length} rows skipped`)
      }

      if (result.candidates.length === 0) {
        const errorMsg = result.errors.length > 0
          ? result.errors[0]
          : 'No valid candidates found in file. Ensure file has an Email column.'
        setError(errorMsg)
        toast.error(errorMsg)
        return
      }

      setCandidates(result.candidates)
      setStep('config')
      toast.success(`✅ ${result.candidates.length} candidates loaded`)
    } catch (err) {
      const errorMsg = `Failed to parse file: ${err instanceof Error ? err.message : String(err)}`
      console.error('[v0] Parse error:', err)
      setError(errorMsg)
      toast.error(errorMsg)
    }
  }

  const handleGoogleSheetSubmit = async () => {
    if (!sheetUrl.trim()) {
      setError('Please enter a Google Sheets URL or ID')
      return
    }

    if (!isValidGoogleSheetsUrl(sheetUrl)) {
      setError('Invalid Google Sheets URL. Please provide a valid link or sheet ID.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      console.log('[v0] Fetching Google Sheet')
      const csvContent = await fetchGoogleSheet(sheetUrl)
      const result = parseCSVContent(csvContent)

      if (result.candidates.length === 0) {
        setError('No valid candidates found in sheet. Ensure it has an Email column.')
        toast.error('No candidates found')
        return
      }

      setCandidates(result.candidates)
      setSheetUrl('')
      setStep('config')
      toast.success(`✅ ${result.candidates.length} candidates loaded from Google Sheet`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load Google Sheet'
      console.error('[v0] Google Sheet error:', err)
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleScreening = async () => {
    if (!candidates.length || !jobDescription.trim()) {
      setError('Please upload file and enter job description')
      return
    }

    setLoading(true)
    setError(null)
    setLoadingSteps((steps) =>
      steps.map((s) => ({ ...s, completed: false }))
    )

    try {
      // Step 1: Parsing (already done)
      setLoadingSteps((steps) => [
        { ...steps[0], completed: true },
        steps[1],
        steps[2],
        steps[3],
      ])
      await new Promise((r) => setTimeout(r, 500))

      // Step 2: Sending to AI
      setLoadingSteps((steps) => [
        steps[0],
        { ...steps[1], completed: true },
        steps[2],
        steps[3],
      ])

      const screeningResults = await sendToN8N(candidates, jobDescription)

      // Step 3: Scoring candidates
      setLoadingSteps((steps) => [
        steps[0],
        steps[1],
        { ...steps[2], completed: true },
        steps[3],
      ])
      await new Promise((r) => setTimeout(r, 500))

      const merged = mergeCandidatesWithResults(candidates, screeningResults)
      setResults(merged)

      // Step 4: Done
      setLoadingSteps((steps) => [
        steps[0],
        steps[1],
        steps[2],
        { ...steps[3], completed: true },
      ])

      setStep('results')
      toast.success('Screening completed!')
    } catch (err) {
      setError(String(err) || 'Failed to screen candidates')
      toast.error('Something went wrong, please try again')
      setLoadingSteps((steps) =>
        steps.map((s) => ({ ...s, completed: false }))
      )
    } finally {
      setLoading(false)
    }
  }

  if (step === 'upload') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload Candidates</CardTitle>
          <p className="text-sm text-gray-600 mt-2">Support for CSV, Excel, or Google Sheets</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Tab */}
          <div>
            <p className="text-sm font-medium mb-3">Option 1: Upload File</p>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <label className="cursor-pointer">
                <span className="text-sm font-medium">
                  Click to upload or drag and drop
                </span>
                <p className="text-xs text-gray-500 mt-1">CSV, Excel, or Numbers format</p>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls,.numbers"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {file && (
              <div className="text-sm bg-blue-50 p-3 rounded border border-blue-200 mt-3">
                <p className="font-medium text-blue-900">Selected: {file.name}</p>
                {candidates.length > 0 && (
                  <p className="text-blue-700 mt-1">
                    ✓ {candidates.length} candidates ready
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Google Sheets Tab */}
          <div className="border-t pt-6">
            <p className="text-sm font-medium mb-3">Option 2: Use Google Sheet</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Google Sheets URL or ID
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste Google Sheets URL or Sheet ID..."
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleGoogleSheetSubmit}
                    disabled={!sheetUrl.trim() || loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="text-xs text-gray-600 mt-3 space-y-2 bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="font-medium text-blue-900">How to share your Google Sheet:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Open your Google Sheet</li>
                    <li>Click Share button (top right)</li>
                    <li>Change to "Anyone with the link can view"</li>
                    <li>Copy the URL and paste it here</li>
                  </ol>
                  <p className="text-blue-700 mt-2">URL format: https://docs.google.com/spreadsheets/d/SHEET_ID/edit</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700 space-y-3">
              <p className="font-medium">Error loading file:</p>
              <p className="whitespace-pre-wrap text-red-800">{error}</p>
              {error.includes('HTTP 502') && (
                <div className="text-xs text-red-600 mt-3 space-y-2 bg-red-100 p-2 rounded">
                  <p className="font-medium">Quick fixes for 502 error:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Wait 30 seconds and try again (Google may be rate-limiting)</li>
                    <li>Verify sheet is shared: "Anyone with the link" access</li>
                    <li>Use the exact URL format: docs.google.com/spreadsheets/d/SHEET_ID/edit</li>
                    <li>Try uploading CSV/Excel file instead (Option 1)</li>
                  </ul>
                </div>
              )}
              {error.includes('Anyone with the link') && (
                <div className="text-xs text-red-600 mt-3 space-y-1">
                  <p className="font-medium">Common issues:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Sharing permission set to "Viewer" instead of "Editor"? Try Editor.</li>
                    <li>File is a Google Sheet (not Excel shared in Drive)?</li>
                    <li>URL should be: docs.google.com/spreadsheets/d/...</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => setStep('config')}
            disabled={!candidates.length}
            className="w-full"
            size="lg"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === 'config') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configure Screening</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Job Description
            </label>
            <Textarea
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep('upload')
                setCandidates([])
                setFile(null)
              }}
            >
              Back
            </Button>
            <Button
              onClick={handleScreening}
              disabled={!jobDescription.trim() || loading}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Start Screening
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'results') {
    const stats = getTopStats(results)

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Candidates</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {stats.shortlisted}
                </div>
                <div className="text-sm text-gray-600">Shortlisted</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {stats.rejected}
                </div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.avgScore}%</div>
                <div className="text-sm text-gray-600">Avg. Score</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Screening Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4">Rank</th>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Match Score</th>
                    <th className="text-left py-3 px-4">Decision</th>
                    <th className="text-left py-3 px-4">Skills</th>
                    <th className="text-left py-3 px-4">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((candidate) => (
                    <tr
                      key={candidate.email}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        {candidate.rank === 1 && '🥇'}
                        {candidate.rank === 2 && '🥈'}
                        {candidate.rank === 3 && '🥉'}
                        {candidate.rank && candidate.rank > 3 && candidate.rank}
                      </td>
                      <td className="py-3 px-4">{candidate.name}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {candidate.email}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold">
                            {candidate.match_score}%
                          </div>
                          <Progress
                            value={candidate.match_score}
                            className="w-24"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            candidate.decision === 'Shortlist'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {candidate.decision}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap max-w-xs">
                          {candidate.matching_skills
                            .slice(0, 2)
                            .map((skill, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="bg-green-50 border-green-200 text-green-700"
                              >
                                {skill}
                              </Badge>
                            ))}
                          {candidate.matching_skills.length > 2 && (
                            <Badge variant="outline">
                              +{candidate.matching_skills.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {candidate.ai_summary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Download Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setStep('upload')
              setResults([])
              setCandidates([])
              setFile(null)
              setJobDescription('')
            }}
          >
            Start New Screening
          </Button>
          <Button
            onClick={() => downloadCSV(results)}
            className="flex-1"
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Download as CSV
          </Button>
          <Button
            onClick={() => downloadExcel(results)}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download as Excel
          </Button>
        </div>
      </div>
    )
  }

  // Loading state
  return (
    <Card>
      <CardHeader>
        <CardTitle>Screening in Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {loadingSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-2xl">{step.icon}</div>
              <div className="flex-1">
                <p className="font-medium">{step.label}</p>
                {step.completed && (
                  <div className="text-xs text-green-600">Complete</div>
                )}
              </div>
              {!step.completed && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
