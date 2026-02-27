'use client'

import { useState, useCallback } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface FileUploadProps {
  onFileSelect: (file: File, content: string) => void
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (
        !file.name.endsWith('.csv') &&
        !file.name.endsWith('.xlsx') &&
        !file.name.endsWith('.xls')
      ) {
        alert('Please upload a CSV or Excel file')
        return
      }

      setSelectedFile(file)

      const content = await file.text()
      onFileSelect(file, content)
    },
    [onFileSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files
      if (files && files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Candidates</CardTitle>
        <CardDescription>
          Upload a CSV or Excel file containing candidate information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Drag and drop your file here
          </p>
          <p className="text-xs text-gray-500 mb-4">or click to select</p>

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleInputChange}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input">
            <Button variant="outline" asChild>
              <span>Select File</span>
            </Button>
          </label>
        </div>

        {selectedFile && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-700">{selectedFile.name}</span>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
