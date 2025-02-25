'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore'
import { db } from '@/config/firebase'
import ArticlesNav from '@/components/navigation/articles-nav'

interface FamilleArticle {
  id: string
  nom: string
  code: string
  coefficient: number
  description?: string
}

export default function FamillesArticles() {
  // États
  const [familles, setFamilles] = useState<FamilleArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingFamille, setEditingFamille] = useState<FamilleArticle | null>(
    null
  )
  const [formData, setFormData] = useState<Omit<FamilleArticle, 'id'>>({
    nom: '',
    code: '',
    coefficient: 1.0,
    description: '', // sera undefined si non renseigné
  })

  // Chargement des familles
  useEffect(() => {
    const fetchFamilles = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'famillesArticles'))
        const famillesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as FamilleArticle[]
        setFamilles(famillesData)
      } catch (error) {
        console.error('Erreur chargement familles:', error)
        setError('Erreur lors du chargement des familles')
      } finally {
        setLoading(false)
      }
    }

    fetchFamilles()
  }, [])

  // Gestion du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingFamille) {
        // Mise à jour
        await updateDoc(
          doc(db, 'famillesArticles', editingFamille.id),
          formData
        )
        setFamilles(
          familles.map(f =>
            f.id === editingFamille.id ? { ...f, ...formData } : f
          )
        )
      } else {
        // Création
        const docRef = await addDoc(
          collection(db, 'famillesArticles'),
          formData
        )
        setFamilles([...familles, { id: docRef.id, ...formData }])
      }
      resetForm()
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      setError('Erreur lors de la sauvegarde')
    }
  }

  const resetForm = () => {
    setFormData({ nom: '', code: '', coefficient: 1.0, description: '' })
    setEditingFamille(null)
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='mb-6 text-2xl font-bold'>Gestion des Articles</h1>

      <ArticlesNav />

      {error && (
        <div className='mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
          {error}
        </div>
      )}

      {/* Formulaire */}
      <form
        onSubmit={handleSubmit}
        className='mb-8 rounded-lg bg-white p-6 shadow-lg'
      >
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div>
            <label className='mb-1 block text-sm font-medium'>Nom</label>
            <input
              type='text'
              value={formData.nom}
              onChange={e => setFormData({ ...formData, nom: e.target.value })}
              className='w-full rounded border px-3 py-2'
              required
            />
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium'>Code</label>
            <input
              type='text'
              value={formData.code}
              onChange={e =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              className='w-full rounded border px-3 py-2'
              required
            />
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium'>
              Coefficient
            </label>
            <input
              type='number'
              step='0.01'
              min='1'
              value={formData.coefficient}
              onChange={e =>
                setFormData({
                  ...formData,
                  coefficient: parseFloat(e.target.value),
                })
              }
              className='w-full rounded border px-3 py-2'
              required
            />
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium'>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              className='w-full rounded border px-3 py-2'
            />
          </div>
        </div>
        <div className='mt-4 flex justify-end gap-2'>
          <button
            type='button'
            onClick={resetForm}
            className='px-4 py-2 text-gray-600 hover:text-gray-800'
          >
            Annuler
          </button>
          <button
            type='submit'
            className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
          >
            {editingFamille ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </form>

      {/* Liste des familles */}
      {loading ? (
        <div className='py-4 text-center'>Chargement...</div>
      ) : (
        <div className='overflow-hidden rounded-lg bg-white shadow'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium uppercase text-gray-500'>
                  Code
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium uppercase text-gray-500'>
                  Nom
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium uppercase text-gray-500'>
                  Coefficient
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium uppercase text-gray-500'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {familles.map(famille => (
                <tr key={famille.id} className='hover:bg-gray-50'>
                  <td className='whitespace-nowrap px-6 py-4'>
                    {famille.code}
                  </td>
                  <td className='px-6 py-4'>{famille.nom}</td>
                  <td className='px-6 py-4 text-right'>
                    {famille.coefficient}
                  </td>
                  <td className='space-x-2 px-6 py-4 text-right'>
                    <button
                      onClick={() => {
                        setEditingFamille(famille)

                        setFormData({
                          nom: famille.nom,
                          code: famille.code,
                          coefficient: famille.coefficient,
                          description: famille.description || '',
                        })
                      }}
                      className='text-blue-600 hover:text-blue-800'
                      type='button'
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
