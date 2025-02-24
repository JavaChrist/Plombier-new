'use client'

import Image from 'next/image'
import Link from 'next/link'

// Ajout des types React
import { FC } from 'react'

const Home: FC = () => {
  return (
    <div className='flex flex-grow flex-col'>
      <div className='container mx-auto flex-grow px-4'>
        <section className='flex h-full flex-col items-center justify-center space-y-8 py-12'>
          <div className='max-w-2xl text-center'>
            <h1 className='mb-4 text-4xl font-bold text-blue-600'>
              Bienvenue chez votre Plombier Chauffagiste
            </h1>
            <p className='text-xl text-gray-700'>
              Interventions rapides et efficaces pour tous vos besoins.
            </p>
          </div>

          <div className='flex w-full max-w-2xl justify-center'>
            <div className='w-[500px]'>
              {' '}
              {/* Ajustez la largeur selon vos besoins */}
              <Image
                src='/assets/Plombier-chauffagiste.jpg'
                alt='Illustration Plombier'
                width={300}
                height={225}
                className='rounded-lg shadow-lg'
                style={{
                  width: '100%',
                  height: 'auto',
                }}
                priority
              />
            </div>
          </div>

          <Link href='/services' className='btn-primary'>
            Découvrir nos services
          </Link>
        </section>
      </div>
    </div>
  )
}

export default Home
