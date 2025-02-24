"use client";

import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { Client, Intervention } from "@/types";
import { useRouter } from "next/navigation";
import DeleteModal from "@/components/DeleteModal";
import Link from "next/link";

interface ClientDetailsProps {
  id: string;
}

export default function ClientDetails({ id }: ClientDetailsProps) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [interventions, setInterventions] = useState<Intervention[]>([]);

  useEffect(() => {
    const fetchClient = async () => {
      if (!id) return;

      try {
        console.log("🔍 Chargement du client:", id);
        const docRef = doc(db, "clients", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const clientData = docSnap.data();
          setClient({
            id: docSnap.id,
            ...clientData,
          } as Client);
          setLoading(false);
        } else {
          console.error("❌ Client non trouvé");
          router.push("/list");
        }
      } catch (error) {
        console.error("❌ Erreur lors du chargement:", error);
        router.push("/list");
      }
    };

    fetchClient();
  }, [id, router]);

  useEffect(() => {
    const fetchInterventions = async () => {
      if (!client?.idClient) {
        console.warn("⚠️ ID Client manquant");
        return;
      }

      try {
        // Log du client actuel
        console.warn("�� Client actuel:", {
          id: client.id,
          idClient: client.idClient,
          nom: client.nom,
        });

        // Récupérer toutes les interventions d'abord
        const interventionsRef = collection(db, "interventions");
        const querySnapshot = await getDocs(interventionsRef);

        // Log de toutes les interventions
        console.warn(
          "📊 Toutes les interventions:",
          querySnapshot.docs.map((doc) => ({
            id: doc.id,
            idClient: doc.data().idClient,
            description: doc.data().description,
          }))
        );

        // Filtrer manuellement
        const interventionsData = querySnapshot.docs
          .filter((doc) => doc.data().idClient === client.idClient)
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Intervention[];

        // Log des interventions filtrées
        console.warn("✅ Interventions filtrées:", interventionsData);

        // Trier par date
        interventionsData.sort(
          (a, b) =>
            new Date(b.dateIntervention).getTime() -
            new Date(a.dateIntervention).getTime()
        );

        setInterventions(interventionsData);
      } catch (error) {
        console.error("❌ Erreur:", error);
      }
    };

    fetchInterventions();
  }, [client?.idClient, client?.id, client?.nom]);

  const handleUpdate = async () => {
    if (!client || !id) return;

    setUpdateLoading(true);
    try {
      const docRef = doc(db, "clients", id);
      await updateDoc(docRef, {
        ...client,
        dateModification: new Date().toISOString(),
      });
      setEditing(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      router.push("/list");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!client) return;

    const { name, value } = e.target;
    setClient((prev) => {
      if (!prev) return prev;
      if (name.startsWith("adresse.")) {
        const field = name.split(".")[1];
        return {
          ...prev,
          adresse: {
            ...prev.adresse,
            [field]: value,
          },
        };
      }
      return { ...prev, [name]: value };
    });
  };

  if (loading) return <div className="text-center py-8">Chargement...</div>;
  if (!client) return <div className="text-center py-8">Client non trouvé</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {editing ? "Modifier le client" : "Détails du client"}
        </h1>
        <div className="space-x-4">
          {editing ? (
            <>
              <button
                onClick={handleUpdate}
                disabled={updateLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                {updateLoading ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Modifier
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        <div className="w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Client
            </label>
            {editing ? (
              <input
                type="text"
                name="idClient"
                value={client.idClient}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded-lg">{client.idClient}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom
            </label>
            {editing ? (
              <input
                type="text"
                name="nom"
                value={client.nom}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded-lg">{client.nom}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prénom
            </label>
            {editing ? (
              <input
                type="text"
                name="prenom"
                value={client.prenom}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded-lg">{client.prenom}</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Adresse</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rue
              </label>
              {editing ? (
                <input
                  type="text"
                  name="adresse.rue"
                  value={client.adresse.rue}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded-lg">
                  {client.adresse.rue}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code postal
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="adresse.codePostal"
                    value={client.adresse.codePostal}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded-lg">
                    {client.adresse.codePostal}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="adresse.ville"
                    value={client.adresse.ville}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded-lg">
                    {client.adresse.ville}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            {editing ? (
              <input
                type="email"
                name="email"
                value={client.email}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded-lg">{client.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            {editing ? (
              <input
                type="tel"
                name="telephone"
                value={client.telephone}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded-lg">{client.telephone}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          {editing ? (
            <textarea
              name="notes"
              value={client.notes || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              rows={4}
            />
          ) : (
            <p className="p-2 bg-gray-50 rounded-lg whitespace-pre-wrap">
              {client.notes}
            </p>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">
              Interventions ({interventions.length})
            </h2>
            <p className="text-sm text-gray-500">
              {interventions.filter((i) => i.statut === "planifiee").length}{" "}
              planifiée(s),{" "}
              {interventions.filter((i) => i.statut === "en_cours").length} en
              cours,{" "}
              {interventions.filter((i) => i.statut === "terminee").length}{" "}
              terminée(s)
            </p>
          </div>
          <Link
            href={`/interventions?clientId=${client.idClient}`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Voir les interventions
          </Link>
        </div>

        {interventions.length > 0 ? (
          <div className="grid gap-4">
            {interventions.map((intervention) => (
              <div key={intervention.id} className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      Date: {new Date(intervention.dateIntervention).toLocaleDateString()}
                    </p>
                    <p>Type: {intervention.type}</p>
                    <p>Statut: {intervention.statut}</p>
                    <p>Montant: {(
                      intervention.montantHT * (1 + intervention.tva / 100)
                    ).toFixed(2)}€ TTC</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/interventions/${intervention.id}`}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Voir détails
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Aucune intervention pour ce client</p>
        )}
      </div>
    </div>
  );
}
