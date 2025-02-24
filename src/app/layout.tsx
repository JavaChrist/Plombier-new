import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Plombier',
  description: 'Application de gestion plomberie',
  icons: {
    icon: '/assets/favicon.ico'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='fr' className={inter.className}>
      <body className='flex min-h-screen flex-col'>
        <Header />
        <main className='flex flex-grow flex-col'>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
