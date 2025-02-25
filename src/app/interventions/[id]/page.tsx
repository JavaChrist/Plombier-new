import { Suspense } from 'react'
import InterventionDetails from './intervention-details'

// Added for deployment - v1.0.1
export default function InterventionPage() {
  return (
    <div className='container mx-auto px-4'>
      <Suspense
        fallback={
          <div className='flex min-h-screen items-center justify-center'>
            <div className='text-lg'>Chargement de l&apos;intervention...</div>
          </div>
        }
      >
        <InterventionDetails />
      </Suspense>
    </div>
  )
}
