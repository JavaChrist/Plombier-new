"use client";

import { useState, useEffect } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import Image from "next/image";

const MAX_WIDTH = 800; // Largeur maximale
const MAX_HEIGHT = 600; // Hauteur maximale
const QUALITY = 0.8; // Qualité de compression

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculer les nouvelles dimensions
      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width;
        width = MAX_WIDTH;
      }
      if (height > MAX_HEIGHT) {
        width = (width * MAX_HEIGHT) / height;
        height = MAX_HEIGHT;
      }

      // Créer un canvas pour le redimensionnement
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);

      // Convertir en PNG
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Échec de la conversion en PNG"));
          }
        },
        "image/png",
        QUALITY
      );
    };

    img.onerror = reject;
  });
}

export default function ParametresPage() {
  const [uploading, setUploading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);

  // Charger le logo actuel
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const docRef = doc(db, "entreprise", "info");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().logo) {
          const storage = getStorage();
          const logoRef = ref(storage, docSnap.data().logo);
          const url = await getDownloadURL(logoRef);
          setCurrentLogo(url);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du logo:", error);
      }
    };
    fetchLogo();
  }, []);

  const uploadLogo = async (file: File) => {
    try {
      setUploading(true);

      // Redimensionner l'image
      console.log("📏 Redimensionnement de l&apos;image...");
      const resizedBlob = await resizeImage(file);

      // Upload vers Firebase Storage
      console.log("📤 Upload vers Firebase Storage...");
      const storage = getStorage();
      const logoRef = ref(storage, `entreprise/logo.png`);
      await uploadBytes(logoRef, resizedBlob);

      // Récupérer l'URL
      console.log("🔗 Récupération URL...");
      const logoUrl = await getDownloadURL(logoRef);
      console.log("✅ URL obtenue:", logoUrl);

      // Mettre à jour le document entreprise
      console.log("💾 Mise à jour Firestore...");
      await updateDoc(doc(db, "entreprise", "info"), {
        logo: `entreprise/logo.png`,
      });

      // Mettre à jour la prévisualisation
      setCurrentLogo(logoUrl);

      alert("✅ Logo mis à jour avec succès !");
    } catch (error) {
      console.error("❌ Erreur détaillée:", error);
      alert("❌ Erreur lors de l&apos;upload du logo");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadLogo(file);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Logo entreprise</h2>

        {/* Prévisualisation du logo */}
        {currentLogo && (
          <div className="mb-4">
            <Image
              src={currentLogo}
              alt="Logo actuel"
              width={200}
              height={200}
              className="max-w-[200px] h-auto mb-2"
            />
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />

        {uploading && (
          <p className="mt-2 text-sm text-blue-600">Chargement en cours...</p>
        )}
      </div>
    </div>
  );
}
