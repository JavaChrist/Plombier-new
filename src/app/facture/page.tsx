'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore'
import { db } from '@/config/firebase'
import Link from 'next/link'

interface Client {
  id: string
  idClient: string
  nom: string
  prenom: string
  email: string
  telephone: string
  adresse: {
    rue: string
    codePostal: string
    ville: string
  }
}

interface LigneFacture {
  reference: string
  designation: string
  quantite: number
  prixUnitaire: number
  tva: 5.5 | 10 | 20
  montantHT: number
}

interface Article {
  id?: string
  reference: string
  designation: string
  prix: number
  tva: 5.5 | 10 | 20
}

export default function FacturePage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center'>
          <div className='text-lg'>Chargement...</div>
        </div>
      }
    >
      <NouvelleFacture />
    </Suspense>
  )
}

function NouvelleFacture() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = searchParams.get('clientId')
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // États pour la facture
  const [numeroFacture, setNumeroFacture] = useState('')
  const [dateFacture, setDateFacture] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [lignesFacture, setLignesFacture] = useState<LigneFacture[]>([])

  const [showPreview, setShowPreview] = useState(false)

  // Calcul des montants
  const calculerMontants = (ligne: LigneFacture) => {
    const montantHT = ligne.quantite * ligne.prixUnitaire
    const montantTVA = montantHT * (ligne.tva / 100)
    const montantTTC = montantHT + montantTVA
    return { montantHT, montantTVA, montantTTC }
  }

  // Calcul des totaux
  const calculerTotaux = () => {
    return lignesFacture.reduce(
      (acc, ligne) => {
        const { montantHT, montantTVA, montantTTC } = calculerMontants(ligne)
        return {
          totalHT: acc.totalHT + montantHT,
          totalTVA: acc.totalTVA + montantTVA,
          totalTTC: acc.totalTTC + montantTTC,
        }
      },
      { totalHT: 0, totalTVA: 0, totalTTC: 0 }
    )
  }

  // Ajouter une ligne
  const ajouterLigne = () => {
    setLignesFacture([
      ...lignesFacture,
      {
        reference: '',
        designation: '',
        quantite: 1,
        prixUnitaire: 0,
        tva: 20,
        montantHT: 0,
      },
    ])
  }

  // Générer automatiquement le numéro de facture au chargement
  useEffect(() => {
    const generateFactureNumber = async () => {
      try {
        // Récupérer toutes les factures pour trouver le dernier numéro
        const querySnapshot = await getDocs(collection(db, 'factures'))
        const factures = querySnapshot.docs.map(doc => doc.data())

        // Format: FC + AAMM + XXX (ex: FC2402001)
        const today = new Date()
        const prefix = `FC${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}`

        // Trouver le dernier numéro pour ce mois
        const lastNumber = factures
          .filter(f => f.numeroFacture?.startsWith(prefix))
          .map(f => parseInt(f.numeroFacture.slice(-3)))
          .reduce((max, current) => Math.max(max, current), 0)

        // Incrémenter le numéro
        const newNumber = (lastNumber + 1).toString().padStart(3, '0')
        setNumeroFacture(`${prefix}${newNumber}`)
      } catch (error) {
        console.error(
          'Erreur lors de la génération du numéro de facture:',
          error
        )
        setError('Erreur lors de la génération du numéro de facture')
      }
    }

    if (!numeroFacture) {
      generateFactureNumber()
    }
  }, [numeroFacture])

  const sauvegarderFacture = async () => {
    // Validation
    if (!numeroFacture.trim()) {
      setError('Veuillez saisir un numéro de facture')
      return
    }

    if (!client) {
      setError('Informations client manquantes')
      return
    }

    if (lignesFacture.length === 0) {
      setError('Veuillez ajouter au moins une ligne à la facture')
      return
    }

    // Vérifier que toutes les lignes sont complètes
    const lignesIncompletes = lignesFacture.some(
      ligne =>
        !ligne.reference ||
        !ligne.designation ||
        ligne.quantite <= 0 ||
        ligne.prixUnitaire <= 0
    )

    if (lignesIncompletes) {
      setError('Veuillez compléter toutes les lignes de la facture')
      return
    }

    try {
      const totaux = calculerTotaux()

      const factureData = {
        numeroFacture,
        dateFacture,
        dateCreation: new Date().toISOString(),
        client: {
          id: client.id,
          idClient: client.idClient,
          nom: client.nom,
          prenom: client.prenom,
          email: client.email,
          adresse: client.adresse,
        },
        lignes: lignesFacture,
        totaux,
      }

      await addDoc(collection(db, 'factures'), factureData)

      // Redirection vers la liste des factures
      router.push('/factures')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setError('Erreur lors de la sauvegarde de la facture')
    }
  }

  const handleReferenceChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const reference = e.target.value
    const newLignes = [...lignesFacture]
    newLignes[index].reference = reference

    // Recherche de l'article correspondant
    const article = articles.find(a => a.reference === reference)
    if (article) {
      // Auto-complétion des autres champs
      newLignes[index] = {
        ...newLignes[index],
        designation: article.designation,
        prixUnitaire: article.prix,
        tva: article.tva,
      }
    }

    setLignesFacture(newLignes)
  }

  // Ajouter aux imports de facture/page.tsx
  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) return

      try {
        // Utiliser une requête pour trouver le client par idClient
        const clientsRef = collection(db, 'clients')
        const q = query(clientsRef, where('idClient', '==', clientId))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const clientData = querySnapshot.docs[0].data()
          setClient({
            id: querySnapshot.docs[0].id,
            ...clientData,
          } as Client)
        } else {
          setError('Client non trouvé')
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération du client:', error)
        setError('Erreur lors de la récupération du client')
      } finally {
        setLoading(false)
      }
    }

    fetchClient()
  }, [clientId])

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'articles'))
        const articlesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Article[]
        setArticles(articlesData)
      } catch (error) {
        console.error('Erreur lors du chargement des articles:', error)
        setError('Erreur lors du chargement des articles')
      }
    }

    fetchArticles()
  }, [])

  if (!clientId) {
    return <div>Erreur: Aucun client sélectionné</div>
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Nouvelle Facture</h1>
        <Link
          href='/articles'
          className='mb-5 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
        >
          Gérer les Articles
        </Link>
      </div>

      {/* En-tête de facture */}
      <div className='mb-6 rounded-lg bg-white p-6 shadow-lg'>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              N° Facture
            </label>
            <input
              type='text'
              value={numeroFacture}
              onChange={e => setNumeroFacture(e.target.value)}
              className='w-full rounded-lg border p-2'
              required
            />
          </div>
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Date
            </label>
            <input
              type='date'
              value={dateFacture}
              onChange={e => setDateFacture(e.target.value)}
              className='w-full rounded-lg border p-2'
              required
            />
          </div>
        </div>
      </div>

      {/* Section client */}
      <div className='mb-6 rounded-lg bg-white p-6 shadow-lg'>
        <h2 className='mb-4 text-xl font-semibold'>Informations Client</h2>

        {loading && (
          <div className='py-4 text-center'>
            <p>Chargement des données client...</p>
          </div>
        )}

        {error && (
          <div className='mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
            <p>Erreur: {error}</p>
            <p className='text-sm'>ID Client: {clientId}</p>
          </div>
        )}

        {client && (
          <div className='rounded-lg bg-gray-50 p-4'>
            <div className='grid grid-cols-2 gap-4'>
              <p>
                <span className='font-medium'>Nom :</span> {client.nom}{' '}
                {client.prenom}
              </p>
              <p>
                <span className='font-medium'>ID :</span> {client.idClient}
              </p>
              <p>
                <span className='font-medium'>Email :</span> {client.email}
              </p>
              <p>
                <span className='font-medium'>Téléphone :</span>{' '}
                {client.telephone}
              </p>
              <p className='col-span-2'>
                <span className='font-medium'>Adresse :</span>
                <br />
                {client.adresse.rue}
                <br />
                {client.adresse.codePostal} {client.adresse.ville}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Section lignes de facture */}
      <div className='mb-6 rounded-lg bg-white p-6 shadow-lg'>
        <h2 className='mb-4 text-xl font-semibold'>Lignes de facture</h2>
        <div className='space-y-4'>
          {lignesFacture.map((ligne, index) => (
            <div
              key={index}
              className='grid grid-cols-7 items-center gap-4 rounded-lg bg-gray-50 p-4'
            >
              {/* Ajout du champ référence */}
              <div>
                <input
                  type='text'
                  placeholder='Référence'
                  value={ligne.reference}
                  onChange={e => handleReferenceChange(e, index)}
                  list='references'
                  className='w-full rounded-lg border p-2'
                />
                <datalist id='references'>
                  {articles.map(article => (
                    <option key={article.id} value={article.reference}>
                      {article.designation}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className='col-span-2'>
                <input
                  type='text'
                  placeholder='Désignation'
                  value={ligne.designation}
                  onChange={e => {
                    const newLignes = [...lignesFacture]
                    newLignes[index].designation = e.target.value
                    setLignesFacture(newLignes)
                  }}
                  className='w-full rounded-lg border p-2'
                />
              </div>

              <div>
                <input
                  type='number'
                  placeholder='Qté'
                  value={ligne.quantite}
                  onChange={e => {
                    const newLignes = [...lignesFacture]
                    newLignes[index].quantite = Number(e.target.value)
                    setLignesFacture(newLignes)
                  }}
                  className='w-full rounded-lg border p-2'
                  min='1'
                />
              </div>

              <div>
                <input
                  type='number'
                  placeholder='Prix unitaire'
                  value={ligne.prixUnitaire}
                  onChange={e => {
                    const newLignes = [...lignesFacture]
                    newLignes[index].prixUnitaire = Number(e.target.value)
                    setLignesFacture(newLignes)
                  }}
                  className='w-full rounded-lg border p-2'
                  min='0'
                  step='0.01'
                />
              </div>
              <div>
                <select
                  value={ligne.tva}
                  onChange={e => {
                    const newLignes = [...lignesFacture]
                    newLignes[index].tva = Number(e.target.value) as
                      | 5.5
                      | 10
                      | 20
                    setLignesFacture(newLignes)
                  }}
                  className='w-full rounded-lg border p-2'
                >
                  <option value='5.5'>TVA 5.5%</option>
                  <option value='10'>TVA 10%</option>
                  <option value='20'>TVA 20%</option>
                </select>
              </div>
              <div>
                <button
                  onClick={() => {
                    const newLignes = [...lignesFacture]
                    newLignes.splice(index, 1)
                    setLignesFacture(newLignes)
                  }}
                  className='text-red-600 hover:text-red-800'
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={ajouterLigne}
          className='mt-4 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700'
        >
          Ajouter une ligne
        </button>
      </div>

      {/* Section totaux */}
      <div className='rounded-lg bg-white p-6 shadow-lg'>
        <div className='space-y-2 text-right'>
          <p>
            <span className='font-medium'>Total HT :</span>{' '}
            {calculerTotaux().totalHT.toFixed(2)} €
          </p>
          <p>
            <span className='font-medium'>Total TVA :</span>{' '}
            {calculerTotaux().totalTVA.toFixed(2)} €
          </p>
          <p className='text-xl font-bold'>
            <span>Total TTC :</span> {calculerTotaux().totalTTC.toFixed(2)} €
          </p>
        </div>
        <div className='mt-6 flex justify-end'>
          <button
            className='rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700'
            onClick={sauvegarderFacture}
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer la facture'}
          </button>
        </div>
      </div>

      <div className='mt-6 flex justify-end gap-4'>
        <button
          className='rounded-lg bg-gray-600 px-6 py-2 text-white hover:bg-gray-700'
          onClick={() => setShowPreview(true)}
          disabled={loading}
        >
          Aperçu
        </button>
      </div>
      {showPreview && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
          <div className='max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl'>
            <div className='mb-6 flex items-center justify-between'>
              <h2 className='text-2xl font-bold'>Aperçu de la facture</h2>
              <button
                onClick={() => setShowPreview(false)}
                className='text-gray-500 hover:text-gray-700'
              >
                ✕
              </button>
            </div>

            <div className='space-y-6'>
              {/* En-tête de la facture */}
              <div className='flex justify-between'>
                <div>
                  <p className='font-bold'>Facture N° {numeroFacture}</p>
                  <p>Date : {new Date(dateFacture).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className='font-bold'>Client</p>
                  <p>
                    {client?.nom} {client?.prenom}
                  </p>
                  <p>{client?.adresse.rue}</p>
                  <p>
                    {client?.adresse.codePostal} {client?.adresse.ville}
                  </p>
                </div>
              </div>

              {/* Tableau des lignes */}
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='bg-gray-50'>
                    <th className='border p-2 text-left'>Référence</th>
                    <th className='border p-2 text-left'>Désignation</th>
                    <th className='border p-2 text-right'>Prix unitaire</th>
                    <th className='border p-2 text-right'>Quantité</th>
                    <th className='border p-2 text-right'>TVA</th>
                    <th className='border p-2 text-right'>Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {lignesFacture.map((ligne, index) => (
                    <tr key={index}>
                      <td className='border p-2'>{ligne.reference}</td>
                      <td className='border p-2'>{ligne.designation}</td>
                      <td className='border p-2 text-right'>
                        {ligne.prixUnitaire.toFixed(2)} €
                      </td>
                      <td className='border p-2 text-right'>
                        {ligne.quantite}
                      </td>
                      <td className='border p-2 text-right'>{ligne.tva}%</td>
                      <td className='border p-2 text-right'>
                        {(ligne.quantite * ligne.prixUnitaire).toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totaux */}
              <div className='space-y-2 text-right'>
                <p>
                  <span className='font-medium'>Total HT :</span>{' '}
                  {calculerTotaux().totalHT.toFixed(2)} €
                </p>
                <p>
                  <span className='font-medium'>Total TVA :</span>{' '}
                  {calculerTotaux().totalTVA.toFixed(2)} €
                </p>
                <p className='text-xl font-bold'>
                  <span>Total TTC :</span>{' '}
                  {calculerTotaux().totalTTC.toFixed(2)} €
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
