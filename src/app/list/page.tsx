"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import Link from 'next/link';

interface Client {
  id: string;
  idClient: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: {
    rue: string;
    codePostal: string;
    ville: string;
  };
  notes?: string;
}

export default function ClientsList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'clients'));
        const clientsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Client[];

        setClients(clientsData);
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
        setError('Erreur lors du chargement des clients'); 
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-xl">Chargement...</div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-red-600">{error}</div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Liste des Clients</h1>
        <Link
          href="/clients/nouveau"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Nouveau Client
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">
                {client.nom} {client.prenom}
              </h2>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                {client.idClient}
              </span>
            </div>

            <div className="space-y-2 text-gray-600">
              <p>📧 {client.email}</p>
              <p>📞 {client.telephone}</p>
              <p className="text-sm">
                📍 {client.adresse.rue}<br />
                {client.adresse.codePostal} {client.adresse.ville}
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                href={`/clients/${client.id}`}
                className="flex-1 text-center bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200"
              >
                Détails
              </Link>
              <Link
                href={`/interventions?clientId=${client.idClient}`}
                className="flex-1 text-center bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
              >
                Interventions
              </Link>
              <Link
                href={`/facture?clientId=${client.idClient}`}
                className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
              >
              Facture
              </Link>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucun client trouvé. Commencez par en créer un !
        </div>
      )}
    </div>
  );
}
