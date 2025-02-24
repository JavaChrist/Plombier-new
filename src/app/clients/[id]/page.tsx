import { Suspense } from 'react';
import ClientDetails from './client-details';
import Link from 'next/link';

type PageProps = {
  params: { id: string };
};

export default function ClientPage({ params }: PageProps) {
  if (!params || !params.id) {
    return <div>Erreur : ID de client manquant</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Chargement du client...</div>
        </div>
      }>
        <ClientDetails id={params.id} />
      </Suspense>
      <Link
        href={`/interventions/nouveau?clientId=${params.id}`}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Nouvelle intervention
      </Link>
    </div>
  );
}
