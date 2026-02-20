import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Balboa Media OS - Issue Operations',
  description: 'Command center for managing newsletter publication deadlines',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Balboa Media OS
            </h1>
            <p className="text-sm text-slate-600">
              Newsletter Issue Operations Command Center
            </p>
          </div>
        </header>

        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-6">
              <a
                href="/"
                className="border-b-2 border-transparent px-1 py-4 text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600"
              >
                Command Center
              </a>
              <a
                href="/planning"
                className="border-b-2 border-transparent px-1 py-4 text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600"
              >
                Weekly Planning
              </a>
              <a
                href="/analytics"
                className="border-b-2 border-transparent px-1 py-4 text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600"
              >
                Analytics & KPIs
              </a>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-600">
          <p>© 2026 Balboa Media Company. Issue Operations System.</p>
        </footer>
      </body>
    </html>
  )
}
