'use client'

import { useState, useEffect } from 'react'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  addDoc,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Interfaces
interface LigneFacture {
  reference: string
  designation: string
  quantite: number
  prixUnitaire: number
  tva: 5.5 | 10 | 20
}

interface Facture {
  id: string
  numeroFacture: string
  dateFacture: string
  client: {
    nom: string
    prenom: string
    idClient: string
    email: string
    adresse: {
      rue: string
      codePostal: string
      ville: string
    }
  }
  lignes: LigneFacture[]
  totaux: {
    totalHT: number
    totalTVA: number
    totalTTC: number
  }
  dateCreation: string
}

interface EntrepriseInfo {
  raisonSociale: string
  siret: string
  adresse: {
    rue: string
    codePostal: string
    ville: string
  }
  telephone: string
  email: string
  tvaIntracommunautaire: string
  rcs: string
}

interface EmailLog {
  date: string
  factureId: string
  email: string
  status: 'success' | 'error'
  error?: string
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig, 'pdf-preview')

export default function ListeFactures() {
  // États
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [entrepriseInfo, setEntrepriseInfo] = useState<EntrepriseInfo | null>(
    null
  )

  // Chargement des factures
  useEffect(() => {
    const fetchFactures = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'factures'))
        const facturesPromises = querySnapshot.docs.map(async doc => {
          const data = doc.data()

          try {
            // Récupérer l'ID du client depuis la facture
            const clientId = data.client.idClient // ou data.clientId selon votre structure

            // Chercher le client par son ID dans la collection clients
            const clientsQuery = await getDocs(
              query(
                collection(db, 'clients'),
                where('idClient', '==', clientId)
              )
            )

            const clientData = clientsQuery.docs[0]?.data()

            return {
              id: doc.id,
              ...data,
              client: {
                ...data.client,
                email: clientData?.email || '', // Utiliser l'email de la fiche client
              },
            }
          } catch (error) {
            console.error('Erreur lors de la récupération du client:', error)
            return {
              id: doc.id,
              ...data,
            }
          }
        })

        const facturesData = (await Promise.all(facturesPromises)) as Facture[]

        // Tri par date décroissante
        facturesData.sort(
          (a, b) =>
            new Date(b.dateCreation).getTime() -
            new Date(a.dateCreation).getTime()
        )

        console.log('📋 Factures chargées:', facturesData)
        setFactures(facturesData)
      } catch (error) {
        console.error('❌ Erreur:', error)
        setError('Erreur lors du chargement des factures')
      } finally {
        setLoading(false)
      }
    }

    fetchFactures()
  }, [])

  // Chargement des informations de l'entreprise
  useEffect(() => {
    const fetchEntrepriseInfo = async () => {
      try {
        const docRef = doc(db, 'entreprise', 'info')
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data() as EntrepriseInfo
          console.log('✅ Informations entreprise chargées:', data)
          setEntrepriseInfo(data)
        } else {
          throw new Error('Document entreprise non trouvé')
        }
      } catch (error) {
        console.error('❌ Erreur:', error)
        setError('Erreur lors du chargement des informations entreprise')
      }
    }

    fetchEntrepriseInfo()
  }, [])

  // Fonction d'envoi d'email
  const envoyerFactureParEmail = async (facture: Facture) => {
    // Ajouter une confirmation
    const confirmer = window.confirm(
      `Voulez-vous envoyer la facture n°${facture.numeroFacture} à ${facture.client.nom} ${facture.client.prenom} (${facture.client.email}) ?`
    )

    if (!confirmer) return

    console.log('🚀 Début envoi email pour facture:', {
      numero: facture.numeroFacture,
      email: facture.client.email,
    })

    if (!facture.client.email || !entrepriseInfo) {
      const erreur = 'Email client ou informations entreprise manquants'
      console.error('❌', erreur)
      alert(erreur)
      return
    }

    setSendingEmail(facture.id)
    try {
      // Vérifier que le serveur est accessible
      const response = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facture,
          entreprise: entrepriseInfo,
        }),
      })

      if (!response.ok) {
        let errorMessage = `Erreur serveur (${response.status}): Erreur inconnue`
        try {
          const errorData = await response.json()
          errorMessage =
            errorData.details ||
            `Erreur serveur (${response.status}): ${errorData.error || 'Erreur inconnue'}`
        } catch (jsonError) {
          console.error(
            "Erreur lors de l'analyse de la réponse JSON:",
            jsonError
          )
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('✅ Email envoyé avec succès:', data)
      alert('✅ Facture envoyée avec succès !')

      await logEmail({
        date: new Date().toISOString(),
        factureId: facture.id,
        email: facture.client.email,
        status: 'success',
      })
    } catch (error) {
      console.error('❌ Erreur détaillée:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue'

      alert(`❌ Erreur: ${errorMessage}`)

      await logEmail({
        date: new Date().toISOString(),
        factureId: facture.id,
        email: facture.client.email,
        status: 'error',
        error: errorMessage,
      })

      if (error instanceof Error) {
        throw error
      }
      throw new Error('Erreur inconnue')
    } finally {
      setSendingEmail(null)
    }
  }

  const handleViewFacture = async (facture: Facture) => {
    try {
      // Récupérer les infos de l'entreprise
      const db = getFirestore(app)
      const entrepriseDoc = await getDoc(doc(db, 'entreprise', 'info'))
      const entrepriseInfo = entrepriseDoc.data() as EntrepriseInfo

      // Générer le PDF
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facture, entreprise: entrepriseInfo }),
      })

      if (!response.ok) throw new Error('Erreur lors de la génération du PDF')

      // Créer un blob et ouvrir dans un nouvel onglet
      const pdfBlob = await response.blob()
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, '_blank')

      // Nettoyer l'URL après ouverture
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100)
    } catch (error) {
      console.error('❌ Erreur:', error)
      alert('Erreur lors de la génération du PDF')
    }
  }

  // Rendu de la page
  return (
    <div className='container mx-auto px-4 py-8'>
      {/* En-tête */}
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Liste des Factures</h1>
      </div>

      {/* Messages d'état */}
      {loading && (
        <div className='py-4 text-center'>Chargement des factures...</div>
      )}

      {error && (
        <div className='mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
          {error}
        </div>
      )}

      {/* Liste des factures */}
      <div className='grid gap-4'>
        {factures.map(facture => (
          <div key={facture.id} className='rounded-lg bg-white p-4 shadow'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-semibold'>
                Facture {facture.numeroFacture}
              </h2>
              <button
                onClick={() => handleViewFacture(facture)}
                className='text-blue-600 hover:text-blue-800'
              >
                Voir PDF
              </button>
            </div>
            <p>Date : {new Date(facture.dateFacture).toLocaleDateString()}</p>
            <p>
              Client : {facture.client.nom} {facture.client.prenom}
            </p>
            <p>Total TTC : {facture.totaux.totalTTC.toFixed(2)} €</p>
            <button
              onClick={() => envoyerFactureParEmail(facture)}
              className={`mt-4 ${
                facture.client.email
                  ? 'text-blue-600 hover:text-blue-800'
                  : 'cursor-not-allowed text-gray-400'
              }`}
              disabled={!facture.client.email || sendingEmail === facture.id}
              title={!facture.client.email ? "Pas d'email client" : ''}
            >
              {sendingEmail === facture.id ? 'Envoi...' : 'Email'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Ajouter dans la fonction d'envoi
const logEmail = async (log: EmailLog) => {
  await addDoc(collection(db, 'email_logs'), log)
}

async function handleGeneratePDF(facture: Facture, entreprise: EntrepriseInfo) {
  try {
    console.log('📤 Envoi de la requête PDF avec:', {
      factureId: facture.numeroFacture,
      entrepriseId: entreprise.siret,
    })

    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facture, entreprise }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Erreur serveur:', error)
      throw new Error(error.details || 'Erreur lors de la génération du PDF')
    }

    console.log('✅ PDF reçu avec succès')
    // ... reste du code
  } catch (error) {
    console.error('❌ Erreur complète:', error)
    throw error
  }
}
