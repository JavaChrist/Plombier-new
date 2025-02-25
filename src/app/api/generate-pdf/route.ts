export const dynamic = 'force-dynamic'; // Empêche la mise en cache des requêtes API
export const runtime = 'nodejs'; // ⚠️ Assure l'exécution en Node.js (obligatoire pour Puppeteer)

import { NextResponse } from 'next/server';
import { generateFacturePDF } from '@/utils/generatePDF';

export async function POST(request: Request) {
  try {
    console.log("🔍 [API] Requête reçue pour générer un PDF...");

    // Lire les données envoyées
    const { facture, entreprise } = await request.json();

    // Vérifier que les données sont bien reçues
    if (!facture || !facture.numeroFacture) {
      throw new Error("❌ Données de facture invalides ou numéro manquant !");
    }

    console.log("📄 [API] Génération du PDF pour la facture :", facture.numeroFacture);

    // Générer le PDF avec Puppeteer
    const pdfBuffer = await generateFacturePDF(facture, entreprise);
    
    console.log("✅ [API] PDF généré avec succès !");

    // Retourner le PDF sous forme de réponse
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Facture_${facture.numeroFacture}.pdf"`,
      },
    });

  } catch (error) {
    console.error("❌ [API] Erreur détaillée :", error);

    return NextResponse.json(
      {
        error: "Erreur lors de la génération du PDF",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// 🚨 Gestion des autres méthodes HTTP (évite les erreurs 405)
export function GET() {
  return NextResponse.json({ error: "Méthode GET non autorisée" }, { status: 405 });
}

export function PUT() {
  return NextResponse.json({ error: "Méthode PUT non autorisée" }, { status: 405 });
}

export function DELETE() {
  return NextResponse.json({ error: "Méthode DELETE non autorisée" }, { status: 405 });
}
