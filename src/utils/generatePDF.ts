import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

interface LigneFacture {
  reference: string
  designation: string
  quantite: number
  prixUnitaire: number
  tva: 5.5 | 10 | 20
}

interface Facture {
  numeroFacture: string
  dateFacture: string
  client: {
    nom: string
    prenom: string
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
}

interface EntrepriseInfo {
  raisonSociale: string
  siret: string
  adresse: {
    rue: string
    codePostal: string
    ville: string
  }
  tvaIntracommunautaire: string
  logo?: string
}

async function getImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const contentType = response.headers.get('content-type') || 'image/png'
    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error('❌ Erreur lors de la conversion en base64:', error)
    return ''
  }
}

export async function generateFacturePDF(
  facture: Facture,
  entreprise: EntrepriseInfo
): Promise<Buffer> {
  try {
    console.log('🚀 Initialisation de Puppeteer avec Chromium...')

    let executablePath: string | null = null
    try {
      executablePath = await chromium.executablePath // Pas de parenthèses, c'est une promesse
      console.log('🔍 Chemin Chromium détecté:', executablePath)
    } catch (error) {
      console.error("❌ Impossible d'obtenir le chemin de Chromium :", error)
      executablePath = null
    }

    const browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath || undefined, // Si Chromium est absent, Puppeteer essaiera une autre méthode
      ignoreHTTPSErrors: true,
      headless: chromium.headless,
    })

    console.log('✅ Navigateur Puppeteer lancé avec succès !')

    // Vérification et conversion du logo en base64
    let logoBase64 = ''
    if (entreprise.logo) {
      try {
        console.log('🔍 Chargement du logo:', entreprise.logo)
        logoBase64 = await getImageAsBase64(entreprise.logo)
        console.log('🖼️ Logo converti en base64, taille:', logoBase64.length)
      } catch (error) {
        console.error('❌ Erreur lors du chargement du logo:', error)
      }
    }

    // Contenu HTML de la facture
    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2563eb; }
            .company-info, .client-info { margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #2563eb; color: white; }
            .totals { margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="company-info">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="max-width:100px;"/>` : ''}
            <h1>${entreprise.raisonSociale}</h1>
            <p>${entreprise.adresse.rue}, ${entreprise.adresse.codePostal} ${entreprise.adresse.ville}</p>
            <p>SIRET: ${entreprise.siret}, TVA: ${entreprise.tvaIntracommunautaire}</p>
          </div>

          <div class="client-info">
            <h2>Client</h2>
            <p>${facture.client.nom} ${facture.client.prenom}</p>
            <p>${facture.client.adresse.rue}, ${facture.client.adresse.codePostal} ${facture.client.adresse.ville}</p>
          </div>

          <h2>Facture N° ${facture.numeroFacture}</h2>
          <p>Date: ${new Date(facture.dateFacture).toLocaleDateString('fr-FR')}</p>

          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Prix unitaire</th>
                <th>Quantité</th>
                <th>TVA</th>
                <th>Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${facture.lignes
                .map(
                  ligne => `
                  <tr>
                    <td>${ligne.reference}</td>
                    <td>${ligne.designation}</td>
                    <td>${ligne.prixUnitaire.toFixed(2)} €</td>
                    <td>${ligne.quantite}</td>
                    <td>${ligne.tva}%</td>
                    <td>${(ligne.prixUnitaire * ligne.quantite).toFixed(2)} €</td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>

          <div class="totals">
            <p>Total HT: ${facture.totaux.totalHT.toFixed(2)} €</p>
            <p>TVA: ${facture.totaux.totalTVA.toFixed(2)} €</p>
            <p>Total TTC: ${facture.totaux.totalTTC.toFixed(2)} €</p>
          </div>
        </body>
      </html>
    `

    const page = await browser.newPage()
    await page.setContent(html)
    await page.waitForTimeout(500) // Ajout d'un délai pour s'assurer du rendu du HTML

    console.log('📄 Génération du PDF...')
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '10mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true,
    })

    console.log('✅ PDF généré avec succès !')

    await browser.close()
    return Buffer.from(pdf)
  } catch (error) {
    console.error(
      '❌ [ERREUR Puppeteer] Problème lors de la génération du PDF :',
      error
    )
    throw error
  }
}
