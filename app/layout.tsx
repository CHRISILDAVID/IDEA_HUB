import type { Metadata } from 'next'
import '../src/index.css'

export const metadata: Metadata = {
  title: 'IdeaHub - Share and Collaborate on Ideas',
  description: 'A platform for sharing, discovering, and collaborating on innovative ideas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
