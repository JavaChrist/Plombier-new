'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/config/firebase'
import Auth from './Auth'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setIsAuthenticated(!!user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500'></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center bg-gray-50'>
        <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-md'>
          <h1 className='mb-6 text-center text-2xl font-bold'>Connexion</h1>
          <Auth onSuccess={() => setIsAuthenticated(true)} />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
