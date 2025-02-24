import { Suspense } from 'react';
import InterventionDetails from './InterventionDetails';

export default function InterventionPage() {
  return (
    <div className="container mx-auto px-4">
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Chargement de l&apos;intervention...</div>
        </div>
      }>
        <InterventionDetails />
      </Suspense>
    </div>
  );
}
