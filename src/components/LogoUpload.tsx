'use client'

import { useState } from 'react';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { db } from '@/config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function LogoUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadLogo = async (file: File) => {
    const storage = getStorage();
    const logoRef = ref(storage, 'entreprise/logo.png');
    await uploadBytes(logoRef, file);
    await updateDoc(doc(db, 'entreprise', 'info'), {
      logo: 'entreprise/logo.png'
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await uploadLogo(file);
      alert('✅ Logo mis à jour avec succès !');
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur lors de l\'upload du logo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700">Logo</label>
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
      {uploading && <p className="mt-2 text-sm text-gray-500">Chargement...</p>}
    </div>
  );
} 