'use client'

import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { Intervention } from '@/types'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type InterventionStatus = 'planifiee' | 'en_cours' | 'terminee' | 'annulee'

export default function InterventionsList() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('clientId')
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingDescription, setEditingDescription] = useState<string | null>(
    null
  )
  const [newDescription, setNewDescription] = useState('')

  useEffect(() => {
    const fetchInterventions = async () => {
      try {
        const interventionsRef = collection(db, 'interventions')
        let q

        if (clientId) {
          // Utiliser une requête simple pour le client spécifique
          q = query(interventionsRef, where('idClient', '==', clientId))

          const querySnapshot = await getDocs(q)
          console.log('📊 Requête pour le client:', clientId)

          const interventionsData = querySnapshot.docs
            .map(doc => {
              const data = doc.data()
              // Log détaillé de chaque intervention
              console.log('📝 Intervention trouvée:', {
                id: doc.id,
                idClient: data.idClient,
                description: data.description || 'Pas de description',
                statut: data.statut,
              })
              return {
                id: doc.id,
                ...data,
              } as Intervention
            })
            .sort(
              (a, b) =>
                new Date(b.dateIntervention).getTime() -
                new Date(a.dateIntervention).getTime()
            )

          console.log(
            `✅ Total interventions pour client ${clientId}:`,
            interventionsData.length
          )
          setInterventions(interventionsData)
        } else {
          // Pour toutes les interventions
          q = query(interventionsRef, orderBy('dateIntervention', 'desc'))
          const querySnapshot = await getDocs(q)
          const interventionsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Intervention[]

          setInterventions(interventionsData)
        }
      } catch (error) {
        console.error('❌ Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInterventions()
  }, [clientId])

  const handleStatusChange = async (
    interventionId: string,
    newStatus: InterventionStatus
  ) => {
    try {
      const docRef = doc(db, 'interventions', interventionId)
      await updateDoc(docRef, {
        statut: newStatus,
        dateModification: new Date().toISOString(),
      })

      // Mettre à jour l'état local
      setInterventions(prevInterventions =>
        prevInterventions.map(intervention =>
          intervention.id === interventionId
            ? { ...intervention, statut: newStatus as InterventionStatus }
            : intervention
        )
      )
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du statut:', error)
    }
  }

  const handleDescriptionUpdate = async (
    interventionId: string,
    description: string
  ) => {
    try {
      const docRef = doc(db, 'interventions', interventionId)
      await updateDoc(docRef, {
        description,
        dateModification: new Date().toISOString(),
      })

      // Mettre à jour l'état local
      setInterventions(prevInterventions =>
        prevInterventions.map(intervention =>
          intervention.id === interventionId
            ? { ...intervention, description }
            : intervention
        )
      )
      setEditingDescription(null)
    } catch (error) {
      console.error(
        '❌ Erreur lors de la mise à jour de la description:',
        error
      )
    }
  }

  // Fonction de filtrage
  const filteredInterventions = interventions.filter(intervention => {
    const searchLower = searchTerm.toLowerCase()
    return (
      intervention.idClient?.toLowerCase().includes(searchLower) ||
      intervention.description?.toLowerCase().includes(searchLower) ||
      intervention.type.toLowerCase().includes(searchLower)
    )
  })

  if (loading) return <div className='py-8 text-center'>Chargement...</div>

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Liste des Interventions</h1>
        {clientId && (
          <Link
            href={`/interventions/nouveau?clientId=${clientId}`}
            className='rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
          >
            Nouvelle Intervention
          </Link>
        )}
      </div>

      {/* Barre de recherche */}
      <div className='mb-6'>
        <input
          type='text'
          placeholder='Rechercher par ID client, description ou type...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className='w-full rounded border p-2 shadow-sm'
        />
      </div>

      <div className='rounded-lg bg-white p-6 shadow-lg'>
        <div className='mb-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-semibold'>
                Liste des interventions ({interventions.length})
              </h2>
              <p className='text-sm text-gray-500'>
                {interventions.filter(i => i.statut === 'planifiee').length}{' '}
                planifiée(s),{' '}
                {interventions.filter(i => i.statut === 'en_cours').length} en
                cours,{' '}
                {interventions.filter(i => i.statut === 'terminee').length}{' '}
                terminée(s)
                {interventions.filter(i => i.statut === 'terminee').length}{' '}
                annulé(s)
              </p>
            </div>
          </div>
        </div>

        {filteredInterventions.length > 0 ? (
          <div className='space-y-4'>
            {filteredInterventions.map(intervention => (
              <div
                key={intervention.id}
                className='rounded-lg border p-4 transition-shadow hover:shadow-md'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-grow space-y-2'>
                    <div className='mb-2 flex items-center gap-2 text-sm text-gray-500'>
                      <span>Client ID:</span>
                      <Link
                        href={`/clients/${intervention.idClient}`}
                        className='text-blue-500 hover:text-blue-700'
                      >
                        {intervention.idClient}
                      </Link>
                    </div>
                    <div className='flex items-center gap-4'>
                      <span className='font-semibold'>
                        {new Date(
                          intervention.dateIntervention
                        ).toLocaleDateString()}
                      </span>
                      <select
                        value={intervention.statut}
                        onChange={e =>
                          handleStatusChange(
                            intervention.id,
                            e.target.value as InterventionStatus
                          )
                        }
                        className={`rounded-full border px-2 py-1 text-sm ${
                          intervention.statut === 'planifiee'
                            ? 'border-blue-200 bg-blue-100 text-blue-800'
                            : intervention.statut === 'en_cours'
                              ? 'border-yellow-200 bg-yellow-100 text-yellow-800'
                              : 'border-green-200 bg-green-100 text-green-800'
                        }`}
                      >
                        <option value='planifiee'>PLANIFIÉE</option>
                        <option value='en_cours'>EN COURS</option>
                        <option value='terminee'>TERMINÉE</option>
                        <option value='annulee'>ANNULÉE</option>
                      </select>
                    </div>
                    <div className='rounded-lg bg-gray-50 p-3'>
                      {editingDescription === intervention.id ? (
                        <div className='flex gap-2'>
                          <textarea
                            value={newDescription}
                            onChange={e => setNewDescription(e.target.value)}
                            className='flex-grow rounded border p-2'
                            placeholder='Entrez une description...'
                          />
                          <div className='flex flex-col gap-2'>
                            <button
                              onClick={() =>
                                handleDescriptionUpdate(
                                  intervention.id,
                                  newDescription
                                )
                              }
                              className='rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600'
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setEditingDescription(null)
                                setNewDescription('')
                              }}
                              className='rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600'
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className='flex items-start justify-between'>
                          <p className='text-gray-600'>
                            {intervention.description ? (
                              intervention.description
                            ) : (
                              <span className='flex items-center gap-2 italic text-gray-400'>
                                Aucune description
                                <button
                                  onClick={() => {
                                    setEditingDescription(intervention.id)
                                    setNewDescription(
                                      intervention.description || ''
                                    )
                                  }}
                                  className='text-sm text-blue-500 hover:text-blue-700'
                                >
                                  Ajouter
                                </button>
                              </span>
                            )}
                          </p>
                          {intervention.description && (
                            <button
                              onClick={() => {
                                setEditingDescription(intervention.id)
                                setNewDescription(intervention.description)
                              }}
                              className='text-blue-500 hover:text-blue-700'
                            >
                              Modifier
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className='flex items-center justify-between'>
                      <p className='font-medium'>
                        Montant:{' '}
                        {(
                          intervention.montantHT *
                          (1 + intervention.tva / 100)
                        ).toFixed(2)}
                        € TTC
                      </p>
                      <div className='flex gap-2'>
                        <Link
                          href={`/interventions/${intervention.id}`}
                          className='rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600'
                        >
                          Modifier
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='py-4 text-center text-gray-500'>
            Aucune intervention trouvée
          </p>
        )}
      </div>
    </div>
  )
}
