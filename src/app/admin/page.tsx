"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface EntrepriseInfo {
  raisonSociale: string;
  siret: string;
  adresse: {
    rue: string;
    codePostal: string;
    ville: string;
  };
  telephone: string;
  email: string;
  tvaIntracommunautaire: string;
  rcs: string;
  capital?: string;
}

export interface FamilleArticle {
  id: string;
  nom: string;
  code: string;
  coefficient: number;
  description?: string;
}

export interface Article {
  id: string;
  reference: string;
  designation: string;
  familleId: string;
  prixAchat: number;
  prixVente: number;
  tva: 5.5 | 10 | 20;
  actif: boolean;
  description?: string;
  dateCreation: string;
  dateModification: string;
}

export default function EntrepriseInfos() {
  const [info, setInfo] = useState<EntrepriseInfo>({
    raisonSociale: '',
    siret: '',
    adresse: {
      rue: '',
      codePostal: '',
      ville: ''
    },
    telephone: '',
    email: '',
    tvaIntracommunautaire: '',
    rcs: '',
    capital: ''
  });


  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchEntrepriseInfo = async () => {
      try {
        const docRef = doc(db, 'entreprise', 'info');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setInfo(docSnap.data() as EntrepriseInfo);
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setError('Erreur lors du chargement des informations');
      } finally {
        setLoading(false);
      }
    };

    fetchEntrepriseInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await setDoc(doc(db, 'entreprise', 'info'), info);
      setSuccess(true);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Erreur lors de la sauvegarde des informations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-4">Chargement...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Informations de l&apos;entreprise</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Informations sauvegardées avec succès
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison sociale
            </label>
            <input
              type="text"
              value={info.raisonSociale}
              onChange={(e) => setInfo({ ...info, raisonSociale: e.target.value })}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SIRET
            </label>
            <input
              type="text"
              value={info.siret}
              onChange={(e) => setInfo({ ...info, siret: e.target.value })}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={info.adresse.rue}
              onChange={(e) => setInfo({
                ...info,
                adresse: { ...info.adresse, rue: e.target.value }
              })}
              className="w-full p-2 border rounded-lg mb-2"
              placeholder="Rue"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={info.adresse.codePostal}
                onChange={(e) => setInfo({
                  ...info,
                  adresse: { ...info.adresse, codePostal: e.target.value }
                })}
                className="w-full p-2 border rounded-lg"
                placeholder="Code postal"
                required
              />
              <input
                type="text"
                value={info.adresse.ville}
                onChange={(e) => setInfo({
                  ...info,
                  adresse: { ...info.adresse, ville: e.target.value }
                })}
                className="w-full p-2 border rounded-lg"
                placeholder="Ville"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact
            </label>
            <input
              type="tel"
              value={info.telephone}
              onChange={(e) => setInfo({ ...info, telephone: e.target.value })}
              className="w-full p-2 border rounded-lg mb-2"
              placeholder="Téléphone"
              required
            />
            <input
              type="email"
              value={info.email}
              onChange={(e) => setInfo({ ...info, email: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="Email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              N° TVA Intracommunautaire
            </label>
            <input
              type="text"
              value={info.tvaIntracommunautaire}
              onChange={(e) => setInfo({ ...info, tvaIntracommunautaire: e.target.value })}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RCS
            </label>
            <input
              type="text"
              value={info.rcs}
              onChange={(e) => setInfo({ ...info, rcs: e.target.value })}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capital social
            </label>
            <input
              type="text"
              value={info.capital || ''}
              onChange={(e) => setInfo({ ...info, capital: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
