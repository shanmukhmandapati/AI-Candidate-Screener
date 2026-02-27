'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface FieldMappingProps {
  headers: string[]
  onMappingComplete: (mapping: Record<string, string>) => void
}

const DEFAULT_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'linkedin_url', label: 'LinkedIn URL', required: false },
  { key: 'resume_text', label: 'Resume Text', required: false },
  { key: 'skills', label: 'Skills', required: false },
  { key: 'experience_years', label: 'Experience (Years)', required: false },
]

export function FieldMapping({ headers, onMappingComplete }: FieldMappingProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: headers[0] || '',
    email: headers.find((h) => h.toLowerCase().includes('email')) || '',
    phone: headers.find((h) => h.toLowerCase().includes('phone')) || '',
    linkedin_url: headers.find((h) => h.toLowerCase().includes('linkedin')) || '',
    resume_text: headers.find((h) => h.toLowerCase().includes('resume')) || '',
    skills: headers.find((h) => h.toLowerCase().includes('skill')) || '',
    experience_years: headers.find((h) => h.toLowerCase().includes('experience')) || '',
  })

  const handleMappingChange = (key: string, value: string) => {
    setMapping((prev) => ({ ...prev, [key]: value }))
  }

  const requiredFieldsFilled = DEFAULT_FIELDS.every(
    (field) => !field.required || mapping[field.key]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map CSV Columns</CardTitle>
        <CardDescription>
          Select which columns correspond to each candidate field
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {DEFAULT_FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={mapping[field.key] || ''}
              onValueChange={(value) => handleMappingChange(field.key, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Skip --</SelectItem>
                {headers.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <Button
          onClick={() => onMappingComplete(mapping)}
          disabled={!requiredFieldsFilled}
          className="w-full mt-6"
        >
          Continue with Mapping
        </Button>
      </CardContent>
    </Card>
  )
}
