'use client'

import { useState, useEffect } from 'react'
import { FileUpload } from '@/components/file-upload'
import { FieldMapping } from '@/components/field-mapping'
import { BatchConfig } from '@/components/batch-config'
import { CandidatePreview } from '@/components/candidate-preview'
import { ScreeningResult } from '@/components/screening-result'
import { ResultsExport } from '@/components/results-export'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { parseCSV, mapCandidateFields } from '@/lib/file-parser'
import { ArrowLeft, Zap } from 'lucide-react'

type Step = 'upload' | 'config' | 'mapping' | 'preview' | 'screening' | 'results' | 'history'

export default function Home() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [candidates, setCandidates] = useState<Record<string, string>[]>([])
  const [batchId, setBatchId] = useState('')
  const [batchName, setBatchName] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [screeningResults, setScreeningResults] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])

  useEffect(() => {
    if (step === 'history') {
      fetchBatches()
    }
  }, [step])

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches')
      const data = await response.json()
      setBatches(data)
    } catch (err) {
      setError('Failed to fetch batches')
    }
  }

  const handleFileSelect = (selectedFile: File, content: string) => {
    setFile(selectedFile)
    setFileContent(content)

    try {
      const { headers: parsedHeaders, rows } = parseCSV(content)
      setHeaders(parsedHeaders)
      setCandidates(rows)
      setStep('config')
    } catch (err) {
      setError('Failed to parse file. Please check the format.')
    }
  }

  const handleBatchConfig = async (config: {
    name: string
    description: string
    n8n_webhook_url: string
  }) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) throw new Error('Failed to create batch')

      const batch = await response.json()
      setBatchId(batch.id)
      setBatchName(batch.name)
      setWebhookUrl(config.n8n_webhook_url)
      setStep('mapping')
    } catch (err) {
      setError('Failed to create batch')
    } finally {
      setLoading(false)
    }
  }

  const handleMappingComplete = (fieldMapping: Record<string, string>) => {
    setStep('preview')
  }

  const handleCandidatesUpload = async () => {
    setLoading(true)
    setError('')

    try {
      const mappedCandidates = candidates.map((row) =>
        mapCandidateFields(row, {
          name: 'name',
          email: 'email',
          phone: 'phone',
          linkedin_url: 'linkedin_url',
          resume_text: 'resume_text',
          skills: 'skills',
          experience_years: 'experience_years',
        })
      )

      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batchId,
          candidates: mappedCandidates,
        }),
      })

      if (!response.ok) throw new Error('Failed to upload candidates')

      setStep('screening')
    } catch (err) {
      setError('Failed to upload candidates')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    if (step === 'config') setStep('upload')
    else if (step === 'mapping') setStep('config')
    else if (step === 'preview') setStep('mapping')
    else if (step === 'screening') setStep('preview')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-600" />
            LinkedIn AI Screener
          </h1>
          <p className="text-gray-600 mt-2">
            AI-powered candidate screening powered by N8N
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs value={step} onValueChange={(val) => setStep(val as Step)} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="upload" disabled={step !== 'upload' && step !== 'config' && step !== 'mapping' && step !== 'preview'}>
              Upload
            </TabsTrigger>
            <TabsTrigger value="config" disabled={!batchId && step !== 'config'}>
              Config
            </TabsTrigger>
            <TabsTrigger value="mapping" disabled={!headers.length && step !== 'mapping'}>
              Map
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!candidates.length && step !== 'preview'}>
              Preview
            </TabsTrigger>
            <TabsTrigger value="screening" disabled={!batchId && step !== 'screening'}>
              Screen
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!screeningResults.length && step !== 'results'}>
              Results
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <FileUpload onFileSelect={handleFileSelect} />
          </TabsContent>

          <TabsContent value="config">
            {step === 'config' && (
              <div className="space-y-4">
                <BatchConfig onConfigComplete={handleBatchConfig} />
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="mapping">
            {step === 'mapping' && headers.length > 0 && (
              <div className="space-y-4">
                <FieldMapping
                  headers={headers}
                  onMappingComplete={() => setStep('preview')}
                />
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview">
            {step === 'preview' && (
              <div className="space-y-4">
                <CandidatePreview
                  candidates={candidates}
                  onConfirm={handleCandidatesUpload}
                />
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="screening">
            <Card>
              <CardHeader>
                <CardTitle>Screening in Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sending {candidates.length} candidates to N8N for analysis...
                </p>
                <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-blue-700">
                    Webhook URL: {webhookUrl}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <div className="space-y-4">
              {screeningResults.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-600">No results available yet</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <ResultsExport
                    originalCandidates={candidates}
                    screeningResults={screeningResults.map((result) => ({
                      candidate_email: result.candidate?.email || '',
                      match_score: result.score || 0,
                      decision: result.rating === 'green' ? 'Strong Match' : result.rating === 'yellow' ? 'Potential Match' : 'Not a Match',
                      matching_skills: result.strengths || [],
                      missing_skills: result.weaknesses || [],
                      summary: result.summary || '',
                      score_breakdown: result,
                    }))}
                    fileName={batchName || 'screening-results'}
                  />
                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {screeningResults.map((result) => (
                          <ScreeningResult
                            key={result.id}
                            result={result}
                            candidate={result.candidate}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Screening History</CardTitle>
              </CardHeader>
              <CardContent>
                {batches.length === 0 ? (
                  <p className="text-gray-600">No screening batches yet</p>
                ) : (
                  <div className="space-y-2">
                    {batches.map((batch) => (
                      <div
                        key={batch.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <p className="font-medium">{batch.name}</p>
                        <p className="text-sm text-gray-600">
                          {batch.total_candidates} candidates
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
