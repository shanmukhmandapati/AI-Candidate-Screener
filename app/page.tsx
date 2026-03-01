'use client'

import { ScreeningWorkflow } from '@/components/screening-workflow'
import { Brain, Sparkles, Zap } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Animated background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -right-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              LinkedIn AI Screener
            </h1>
          </div>
          
          <p className="text-lg text-gray-600 mb-3 max-w-2xl mx-auto">
            Intelligent candidate screening powered by AI. Upload your candidates and let AI do the work.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 mb-8">
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur px-4 py-2 rounded-full border border-gray-200/50">
              <Zap className="h-4 w-4 text-purple-600" />
              <span>Fast Screening</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur px-4 py-2 rounded-full border border-gray-200/50">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>AI Powered</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur px-4 py-2 rounded-full border border-gray-200/50">
              <Brain className="h-4 w-4 text-cyan-600" />
              <span>Smart Matching</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <ScreeningWorkflow />

        {/* Footer Stats */}
        <div className="mt-12 grid grid-cols-3 gap-4">
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-xl p-4 text-center hover:bg-white/50 transition-all">
            <div className="text-3xl font-bold text-purple-600">1000+</div>
            <div className="text-sm text-gray-600">Candidates Screened</div>
          </div>
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-xl p-4 text-center hover:bg-white/50 transition-all">
            <div className="text-3xl font-bold text-blue-600">95%</div>
            <div className="text-sm text-gray-600">Accuracy Rate</div>
          </div>
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-xl p-4 text-center hover:bg-white/50 transition-all">
            <div className="text-3xl font-bold text-cyan-600">10s</div>
            <div className="text-sm text-gray-600">Average Time</div>
          </div>
        </div>
      </div>
    </main>
  )
}
