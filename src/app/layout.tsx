import type { Metadata, Viewport } from 'next'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'browserOS',
  description: 'A web operating system — windows, apps, a filesystem, and themes.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased overflow-hidden">{children}</body>
    </html>
  )
}