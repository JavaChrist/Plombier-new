export interface Client {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    adresse: string;
  }
  
  export interface Intervention {
    id: string;
    clientId: string;
    date: Date;
    status: 'planifié' | 'en_cours' | 'terminé';
    description: string;
    montantHT: number;
  }
  
  export interface Article {
    id: string;
    nom: string;
    prix: number;
    categorie: string;
    description?: string;
  }
  