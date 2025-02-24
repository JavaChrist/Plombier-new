"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";

interface Article {
  id?: string;
  reference: string;
  designation: string;
  prix: number;
  tva: 5.5 | 10 | 20;
}

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [nouvelArticle, setNouvelArticle] = useState<Article>({
    reference: "",
    designation: "",
    prix: 0,
    tva: 20,
  });
  const [loading, setLoading] = useState(true);

  // Charger les articles
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "articles"));
        const articlesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Article[];
        setArticles(articlesData);
      } catch (error) {
        console.error("Erreur lors du chargement des articles:", error);
      }
    };

    fetchArticles();
  }, []);

  // Ajouter un article
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, "articles"), nouvelArticle);
      setArticles([...articles, { ...nouvelArticle, id: docRef.id }]);
      setNouvelArticle({ reference: "", designation: "", prix: 0, tva: 20 });
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'article:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des Articles</h1>

      {/* Formulaire d'ajout */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Nouvel Article</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Référence
              </label>
              <input
                type="text"
                value={nouvelArticle.reference}
                onChange={(e) =>
                  setNouvelArticle({
                    ...nouvelArticle,
                    reference: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Désignation
              </label>
              <input
                type="text"
                value={nouvelArticle.designation}
                onChange={(e) =>
                  setNouvelArticle({
                    ...nouvelArticle,
                    designation: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix HT
              </label>
              <input
                type="number"
                value={nouvelArticle.prix}
                onChange={(e) =>
                  setNouvelArticle({
                    ...nouvelArticle,
                    prix: Number(e.target.value),
                  })
                }
                className="w-full p-2 border rounded-lg"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TVA
              </label>
              <select
                value={nouvelArticle.tva}
                onChange={(e) =>
                  setNouvelArticle({
                    ...nouvelArticle,
                    tva: Number(e.target.value) as 5.5 | 10 | 20,
                  })
                }
                className="w-full p-2 border rounded-lg"
              >
                <option value="5.5">5.5%</option>
                <option value="10">10%</option>
                <option value="20">20%</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Ajouter l'article"}
            </button>
          </div>
        </form>
      </div>

      {/* Liste des articles */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Liste des Articles</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Désignation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix HT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TVA
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {articles.map((article) => (
                <tr key={article.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {article.reference}
                  </td>
                  <td className="px-6 py-4">{article.designation}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {article.prix.toFixed(2)} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {article.tva}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}