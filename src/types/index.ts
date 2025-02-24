export interface Client {
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
  notes?: string
}

interface HistoriqueItem {
  date: string
  action: string
  description: string
  utilisateur: string
}

export interface Intervention {
  id: string
  idClient: string
  dateIntervention: string
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'annulee'
  type: string
  description: string
  montantHT: number
  tva: number
  montantTTC?: number
  dateCreation?: string
  photosAvant?: string[]
  photosApres?: string[]
  historique?: HistoriqueItem[]
}

export interface Article {
  id: string
  nom: string
  prix: number
  categorie: string
  description?: string
}
