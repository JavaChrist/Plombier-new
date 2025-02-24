'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/config/firebase'

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login')
      }
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return <div>Chargement...</div>
  }

  return <>{children}</>
}
