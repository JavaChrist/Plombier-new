import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

export async function getClientByID(idClient: string) {
  try {
    const q = query(
      collection(db, "clients"),
      where("idClient", "==", idClient)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }

    return null;
  } catch (error) {
    console.error("Erreur lors de la recherche du client:", error);
    throw error;
  }
}