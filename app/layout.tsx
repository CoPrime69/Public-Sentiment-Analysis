import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import Footer from './components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Public Sentiment Analysis',
  description: 'Analyze public sentiment on governance policies using Twitter data and machine learning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100 min-h-screen flex flex-col`}>
        <Header />
        <div className="flex flex-1">
          <div className="hidden md:block w-64 flex-shrink-0">
            <Sidebar />
          </div>
          <main className="flex-grow">
            {children}
          </main>
        </div>
        <Footer />
      </body>
    </html>
  )
}
