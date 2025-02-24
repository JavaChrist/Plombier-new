"use client";

import { useState } from "react";
import { doc, collection, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/config/firebase";

export default function NouvelleIntervention() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "depannage",
    description: "",
    dateIntervention: new Date().toISOString().split("T")[0], // Format YYYY-MM-DD pour l'input date
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert("ID client requis");
      return;
    }

    setLoading(true);
    try {
      const newInterventionRef = doc(collection(db, "interventions"));
      const newIntervention = {
        id: newInterventionRef.id,
        idClient: clientId,
        dateIntervention: new Date(formData.dateIntervention).toISOString(),
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString(),
        type: formData.type,
        statut: "planifiee",
        description: formData.description,
        montantHT: 0,
        tva: 20,
        montantTTC: 0,
        photosAvant: [],
        photosApres: [],
        historique: [
          {
            date: new Date().toISOString(),
            action: "Création",
            description: "Création de l&apos;intervention",
            utilisateur: auth.currentUser?.email || "Utilisateur anonyme",
          },
        ],
      };

      await setDoc(newInterventionRef, newIntervention);
      router.push(`/interventions/${newInterventionRef.id}`);
    } catch (error) {
      console.error("❌ Erreur création intervention:", error);
      alert("Erreur lors de la création de l&apos;intervention");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Nouvelle Intervention</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        {!clientId ? (
          <div className="text-red-600">
            Veuillez accéder à cette page depuis la fiche client.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d&apos;intervention
              </label>
              <input
                type="date"
                name="dateIntervention"
                value={formData.dateIntervention}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d&apos;intervention
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="depannage">Dépannage</option>
                <option value="installation">Installation</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                rows={4}
                placeholder="Décrivez l&apos;intervention..."

              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? "Création en cours..." : "Créer l&apos;intervention"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
