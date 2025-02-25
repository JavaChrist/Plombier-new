import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { generateFacturePDF } from '@/utils/generatePDF'
import { initializeApp } from 'firebase/app'

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig, 'pdf-generation')

export async function POST(request: Request) {
  try {
    const { facture, entreprise } = await request.json()

    // Vérification des variables d'environnement
    const requiredEnvVars = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD,
      SMTP_FROM: process.env.SMTP_FROM,
    }

    // Vérifier si toutes les variables d'environnement sont définies
    Object.entries(requiredEnvVars).forEach(([key, value]) => {
      if (!value) {
        throw new Error(`Variable d'environnement manquante: ${key}`)
      }
    })

    // Test de la configuration SMTP
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    }

    console.log('📧 Configuration SMTP:', {
      ...smtpConfig,
      auth: { ...smtpConfig.auth, pass: '****' }, // Masquer le mot de passe dans les logs
    })

    // Vérifier les données de la facture
    if (!facture.client?.email) {
      throw new Error('Email du client manquant')
    }

    const transporter = nodemailer.createTransport(smtpConfig)

    try {
      // Tester la connexion SMTP
      await transporter.verify()
      console.log('✅ Connexion SMTP vérifiée avec succès')
    } catch (verifyError: unknown) {
      const error = verifyError as Error
      console.error('❌ Erreur de vérification SMTP:', error)
      throw new Error(`Erreur de connexion SMTP: ${error.message}`)
    }

    const pdfBuffer = await generateFacturePDF(facture, entreprise)

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: facture.client.email,
      subject: `Facture N° ${facture.numeroFacture}`,
      html: `
        <h1>Facture N° ${facture.numeroFacture}</h1>
        <p>Bonjour ${facture.client.prenom} ${facture.client.nom},</p>
        <p>Veuillez trouver ci-joint votre facture.</p>
        <p>Cordialement,<br>${entreprise.raisonSociale}</p>
      `,
      attachments: [
        {
          filename: `Facture_${facture.numeroFacture}.pdf`,
          content: pdfBuffer,
        },
      ],
    }

    console.log("📧 Options d'envoi:", {
      ...mailOptions,
      to: '***@***', // Masquer l'email dans les logs
    })

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email envoyé avec succès:', info)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('❌ Erreur détaillée:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    })

    return NextResponse.json(
      {
        error: "Erreur lors de l'envoi de l'email",
        details: err.message,
        type: err.name,
      },
      { status: 500 }
    )
  }
}
