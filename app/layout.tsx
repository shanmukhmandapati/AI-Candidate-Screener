import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Candidate Screener',
  description: 'Screening application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
