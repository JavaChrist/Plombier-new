'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { Intervention } from '@/types'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function InterventionsClient() {
  const params = useParams()
  const clientId = params?.id as string
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInterventions = async () => {
      if (!clientId) return

      try {
        const interventionsRef = collection(db, 'interventions')
        const q = query(
          interventionsRef,
          where('idClient', '==', clientId),
          orderBy('dateIntervention', 'desc')
        )

        const querySnapshot = await getDocs(q)
        const interventionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Intervention[]

        setInterventions(interventionsData)
      } catch (error) {
        console.error('❌ Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInterventions()
  }, [clientId])

  if (loading) return <div className='py-8 text-center'>Chargement...</div>

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Interventions du client</h1>
        <Link href='/list' className='text-blue-500 hover:text-blue-700'>
          ← Retour à la liste
        </Link>
      </div>

      <div className='rounded-lg bg-white p-6 shadow-lg'>
        <div className='mb-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-semibold'>
                Liste des interventions ({interventions.length})
              </h2>
              <p className='text-sm text-gray-500'>
                {interventions.filter(i => i.status === 'planifiee').length}{' '}
                planifiée(s),{' '}
                {interventions.filter(i => i.status === 'en_cours').length} en
                cours,{' '}
                {interventions.filter(i => i.status === 'terminee').length}{' '}
                terminée(s)
              </p>
            </div>
          </div>
        </div>

        {interventions.length > 0 ? (
          <div className='space-y-4'>
            {interventions.map(intervention => (
              <div
                key={intervention.id}
                className='rounded-lg border p-4 transition-shadow hover:shadow-md'
              >
                <div className='flex items-start justify-between'>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-4'>
                      <span className='font-semibold'>
                        {new Date(
                          intervention.dateIntervention
                        ).toLocaleDateString()}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-sm ${
                          intervention.status === 'planifiee'
                            ? 'bg-blue-100 text-blue-800'
                            : intervention.status === 'en_cours'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {intervention.status.toUpperCase()}
                      </span>
                    </div>
                    <p className='text-gray-600'>{intervention.description}</p>
                    <p className='font-medium'>
                      Montant:{' '}
                      {(
                        intervention.montantHT *
                        (1 + intervention.tva / 100)
                      ).toFixed(2)}
                      € TTC
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <Link
                      href={`/interventions/${intervention.id}`}
                      className='rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600'
                    >
                      Modifier
                    </Link>
                    {intervention.status === 'terminee' && (
                      <Link
                        href={`/facture?interventionId=${intervention.id}`}
                        className='rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600'
                      >
                        Facturer
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='py-4 text-center text-gray-500'>
            Aucune intervention pour ce client
          </p>
        )}
      </div>
    </div>
  )
}
