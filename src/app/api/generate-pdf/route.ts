import { NextResponse } from 'next/server'
import { generateFacturePDF } from '@/utils/generatePDF'
import { initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Vérifier que toutes les variables d'environnement sont définies
if (!firebaseConfig.projectId) {
  throw new Error('Configuration Firebase incomplète : projectId manquant')
}

const app = initializeApp(firebaseConfig, 'pdf-generation')

export async function POST(request: Request) {
  try {
    console.log('📝 Début de la génération du PDF')
    const data = await request.json()

    // Validation des données
    if (!data.facture || !data.entreprise) {
      console.error('❌ Données manquantes:', data)
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: 'Facture ou entreprise manquante',
        },
        { status: 400 }
      )
    }

    console.log('✅ Données reçues:', {
      facture: {
        numero: data.facture.numeroFacture,
        client: `${data.facture.client.nom} ${data.facture.client.prenom}`,
      },
      entreprise: {
        siret: data.entreprise.siret,
      },
    })

    const pdfBuffer = await generateFacturePDF(
      data.facture,
      data.entreprise,
      app
    )
    console.log('✅ PDF généré avec succès')

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Facture_${data.facture.numeroFacture}.pdf"`,
      },
    })
  } catch (error) {
    console.error('❌ Erreur détaillée:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de la génération du PDF',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
