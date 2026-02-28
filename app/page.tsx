'use client'

import { ScreeningWorkflow } from '@/components/screening-workflow'
import { Zap } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="h-10 w-10 text-blue-600" />
            LinkedIn AI Screener
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            AI-powered candidate screening with N8N integration
          </p>
        </div>

        <ScreeningWorkflow />
      </div>
    </main>
  )
}
