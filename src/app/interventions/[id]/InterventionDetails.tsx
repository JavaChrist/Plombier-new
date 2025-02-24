'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { Intervention } from '@/types'

export default function InterventionDetails() {
  const params = useParams()
  const [intervention, setIntervention] = useState<Intervention | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ... logique de chargement de l'intervention
  }, [params.id])

  if (loading) return <div>Chargement...</div>
  if (!intervention) return <div>Intervention non trouvée</div>

  return (
    <div>
      {/* Affichage des détails de l'intervention */}
    </div>
  )
} 