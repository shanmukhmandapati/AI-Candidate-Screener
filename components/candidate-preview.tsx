'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface CandidatePreviewProps {
  candidates: Record<string, string>[]
  onConfirm: () => void
}

export function CandidatePreview({ candidates, onConfirm }: CandidatePreviewProps) {
  if (candidates.length === 0) {
    return null
  }

  const columns = Object.keys(candidates[0])
  const displayColumns = columns.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview Candidates</CardTitle>
        <CardDescription>
          {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} found
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {displayColumns.map((col) => (
                  <TableHead key={col} className="text-xs">
                    {col}
                  </TableHead>
                ))}
                {columns.length > 5 && (
                  <TableHead className="text-xs">+{columns.length - 5} more</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.slice(0, 5).map((candidate, idx) => (
                <TableRow key={idx}>
                  {displayColumns.map((col) => (
                    <TableCell key={col} className="text-xs">
                      {candidate[col]?.substring(0, 30)}
                      {candidate[col]?.length > 30 ? '...' : ''}
                    </TableCell>
                  ))}
                  {columns.length > 5 && <TableCell className="text-xs text-gray-500">...</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {candidates.length > 5 && (
          <p className="text-sm text-gray-600">
            Showing 5 of {candidates.length} candidates
          </p>
        )}

        <Button onClick={onConfirm} className="w-full">
          Upload Candidates
        </Button>
      </CardContent>
    </Card>
  )
}
