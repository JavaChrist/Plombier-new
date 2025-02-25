import puppeteer from 'puppeteer'
import { FirebaseApp } from 'firebase/app'
import { getStorage, ref, getDownloadURL } from 'firebase/storage'
import { ConsoleMessage, HTTPRequest } from 'puppeteer'

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
  logo: string
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
    throw error
  }
}

export async function generateFacturePDF(
  facture: Facture,
  entreprise: EntrepriseInfo,
  firebaseApp: FirebaseApp
) {
  // Récupérer le logo en base64
  let logoBase64 = ''
  if (entreprise.logo) {
    try {
      console.log('🔍 Tentative de chargement du logo depuis:', entreprise.logo)
      const storage = getStorage(firebaseApp)
      const logoRef = ref(storage, 'entreprise/logo.png')
      const logoUrl = await getDownloadURL(logoRef)
      console.log('📥 URL du logo obtenue:', logoUrl)

      logoBase64 = await getImageAsBase64(logoUrl)
      console.log('🖼️ Logo converti en base64, taille:', logoBase64.length)

      // Vérifier que nous avons bien l'image en base64
      if (!logoBase64.startsWith('data:image')) {
        console.error('❌ Format de logo invalide')
        logoBase64 = ''
      } else {
        console.log('✅ Logo chargé avec succès')
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement du logo:', error)
    }
  } else {
    console.log('ℹ️ Pas de logo configuré dans entreprise.logo')
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        :root {
          --primary: #2563eb;
          --primary-light: #3b82f6;
          --gray-100: #f3f4f6;
          --gray-200: #e5e7eb;
          --gray-700: #374151;
        }
        
        body {
          font-family: Arial, sans-serif;
          padding: 10px;
          color: var(--gray-700);
        }

        .header { 
          display: flex;
          flex-direction: column;
          margin-bottom: 5px;
        }

        .logo-container {
          margin-bottom: 10px;
          margin-top: 5px;
          height: 80px;
        }

        .logo-image {
          max-width: 100px;
          height: auto;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin-top: 10px;
        }

        .company-info, .client-info {
          padding: 15px;
          background-color: var(--gray-100);
          border-radius: 8px;
          width: 45%;
        }

        .company-info h2, .client-info h3 {
          color: var(--primary);
          margin: 0 0 10px 0;
          font-size: 1.2em;
        }

        .company-info p, .client-info p {
          margin: 5px 0;
          font-size: 0.9em;
        }

        .facture-details {
          margin: 20px 0;
          padding: 15px;
          background-color: var(--gray-100);
          border-left: 4px solid var(--primary);
        }

        .content-wrapper {
          display: flex;
          flex-direction: column;
          min-height: 900px;  /* Hauteur approximative pour une page A4 */
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 0.9em;
        }

        .table-container {
          flex: 1;  /* Prend l'espace disponible */
          margin-bottom: 30px;  /* Espace avant les totaux */
        }

        thead {
          background-color: var(--primary);
          color: white;
        }

        th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }

        td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--gray-200);
        }

        tr:nth-child(even) {
          background-color: var(--gray-100);
        }

        .totals {
          margin-bottom: 30px;  /* Espace avant le footer */
          padding: 20px;
          background-color: var(--gray-100);
          border-radius: 8px;
          text-align: right;
        }

        .totals p {
          margin: 5px 0;
          font-size: 0.9em;
        }

        .total-ttc {
          font-size: 1.2em;
          font-weight: bold;
          color: var(--primary);
          padding-top: 10px;
          margin-top: 10px;
          border-top: 2px solid var(--primary);
        }

        .footer {
          padding-top: 20px;
          border-top: 1px solid var(--gray-200);
          font-size: 0.8em;
          color: var(--gray-700);
        }

        .footer p {
          margin: 5px 0;
        }

        .mentions-legales {
          margin-top: 15px;
          padding: 15px;
          background-color: var(--gray-100);
          border-radius: 8px;
          font-style: italic;
          font-size: 0.85em;
        }
      </style>
    </head>
    <body>
      <div class="content-wrapper">
        <div class="header">
          ${
            logoBase64
              ? `
            <div class="logo-container">
              <img 
                src="${logoBase64}"
                class="logo-image"
                alt="Logo entreprise"
              />
            </div>
          `
              : '<!-- Pas de logo -->'
          } 

          <div class="header-content">
            <div class="company-info">
              <h2>${entreprise.raisonSociale}</h2>
              <p>${entreprise.adresse.rue}</p>
              <p>${entreprise.adresse.codePostal} ${
                entreprise.adresse.ville
              }</p>
              <p>SIRET : ${entreprise.siret}</p>
              <p>TVA : ${entreprise.tvaIntracommunautaire}</p>
            </div>
            <div class="client-info">
              <h3>Client</h3>
              <p>${facture.client.nom} ${facture.client.prenom}</p>
              <p>${facture.client.adresse.rue}</p>
              <p>${facture.client.adresse.codePostal} ${
                facture.client.adresse.ville
              }</p>
            </div>
          </div>
        </div>

        <div class="facture-details">
          <h1>Facture N° ${facture.numeroFacture}</h1>
          <p>Date : ${new Date(facture.dateFacture).toLocaleDateString(
            'fr-FR'
          )}</p>
        </div>

        <div class="table-container">
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
        </div>

        <div class="totals">
          <p>Total HT : ${facture.totaux.totalHT.toFixed(2)} €</p>
          <p>TVA : ${facture.totaux.totalTVA.toFixed(2)} €</p>
          <p class="total-ttc">Total TTC : ${facture.totaux.totalTTC.toFixed(
            2
          )} €</p>
        </div>

        <div class="footer">
          <p>${entreprise.raisonSociale} - SIRET : ${entreprise.siret}</p>
          <p>TVA Intracommunautaire : ${entreprise.tvaIntracommunautaire}</p>
          <p class="mentions-legales">
            En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée.
            Une indemnité forfaitaire de 40€ pour frais de recouvrement sera due.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  })

  const page = await browser.newPage()

  // Ajouter plus de logs pour le débogage
  page.on('console', (msg: ConsoleMessage) =>
    console.log('Page log:', msg.text())
  )
  page.on('pageerror', (error: Error) => console.error('Page error:', error))
  page.on('requestfailed', (request: HTTPRequest) =>
    console.error('Request failed:', request.url())
  )

  await page.setContent(html)

  // Attendre que les images soient chargées
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(
          img =>
            new Promise(resolve => {
              img.onload = img.onerror = resolve
            })
        )
    )
  })

  const pdf = await page.pdf({
    format: 'A4',
    margin: {
      top: '10mm',
      right: '15mm',
      bottom: '15mm',
      left: '15mm',
    },
    printBackground: true,
  })

  await browser.close()
  return pdf
}
