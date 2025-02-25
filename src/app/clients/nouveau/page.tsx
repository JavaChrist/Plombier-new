"use client";

import { useState } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useRouter } from 'next/navigation';

const initialClientState = {
  idClient: '',
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  adresse: {
    rue: '',
    codePostal: '',
    ville: ''
  },
  notes: '',
  dateCreation: ''
};

export default function NouveauClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [client, setClient] = useState(initialClientState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Empêche le comportement par défaut du formulaire

    if (!client.idClient || !client.nom || !client.prenom || !client.email || !client.telephone) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      // Vérification de l'ID existant
      const q = query(
        collection(db, "clients"),
        where("idClient", "==", client.idClient)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError(`Un client avec l'ID ${client.idClient} existe déjà`);
        setLoading(false);
        return;
      }

      // Si pas de doublon, afficher la modal de confirmation
      setShowConfirmModal(true);
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setError('Une erreur est survenue lors de la vérification de l\'ID');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = async (confirmed: boolean) => {
    if (!confirmed) {
      setShowConfirmModal(false);
      return;
    }

    setLoading(true);
    try {
      const clientData = {
        ...client,
        dateCreation: new Date().toISOString()
      };

      await addDoc(collection(db, "clients"), clientData);
      router.push('/list');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      setError('Une erreur est survenue lors de la création du client');
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('adresse.')) {
      const field = name.split('.')[1];
      setClient(prev => ({
        ...prev,
        adresse: {
          ...prev.adresse,
          [field]: value
        }
      }));
    } else {
      setClient(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Nouveau Client</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Client
            </label>
            <input
              type="text"
              name="idClient"
              value={client.idClient}
              onChange={handleChange}
              required
              placeholder="Par exemple : CLI001"
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom
              </label>
              <input
                type="text"
                name="nom"
                value={client.nom}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom
              </label>
              <input
                type="text"
                name="prenom"
                value={client.prenom}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Adresse</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rue
                </label>
                <input
                  type="text"
                  name="adresse.rue"
                  value={client.adresse.rue}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal
                  </label>
                  <input
                    type="text"
                    name="adresse.codePostal"
                    value={client.adresse.codePostal}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="adresse.ville"
                    value={client.adresse.ville}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={client.email}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="telephone"
                value={client.telephone}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={client.notes}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {loading ? 'Création en cours...' : 'Créer le client'}
          </button>
        </form>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-blue-600 text-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Confirmer la création du client</h3>
            <div className="space-y-2 mb-6">
              <p><span className="font-semibold">ID Client:</span> {client.idClient}</p>
              <p><span className="font-semibold">Nom:</span> {client.nom}</p>
              <p><span className="font-semibold">Prénom:</span> {client.prenom}</p>
              <p><span className="font-semibold">Email:</span> {client.email}</p>
              <p><span className="font-semibold">Téléphone:</span> {client.telephone}</p>
              <p><span className="font-semibold">Adresse:</span></p>
              <p className="ml-4">
                {client.adresse.rue}<br />
                {client.adresse.codePostal} {client.adresse.ville}
              </p>
              {client.notes && (
                <>
                  <p><span className="font-semibold">Notes:</span></p>
                  <p className="ml-4">{client.notes}</p>
                </>
              )}
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => handleConfirmation(false)}
                className="px-4 py-2 rounded-lg bg-white text-blue-600 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleConfirmation(true)}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}