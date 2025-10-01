import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IDEA HUB - Share and Collaborate on Ideas',
  description: 'A platform for sharing, discovering, and collaborating on ideas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
