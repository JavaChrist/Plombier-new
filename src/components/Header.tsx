'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { auth } from '@/config/firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { useState, useEffect, useRef } from 'react'
import Modal from './Modal'
import Auth from './Auth'

export default function Header() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setIsAuthenticated(!!user)
    })

    // Fermer le menu si on clique en dehors
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      unsubscribe()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut(auth)
      console.log('Déconnexion réussie')
      setIsMenuOpen(false)
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      setLoading(false)
    }
  }

  // Liens publics toujours visibles
  const publicLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/services', label: 'Services' },
    { href: '/contact', label: 'Contact' },
  ]

  // Liens privés dans le menu hamburger
  const privateLinks = [
    { href: '/admin', label: 'Entreprise' },
    { href: '/interventions', label: 'Interventions' },
    { href: '/list', label: 'Clients' },
    { href: '/factures', label: 'Factures' },
    { href: '/familles', label: 'Familles' },
    { href: '/parametres', label: 'Paramètres' },
  ]

  return (
    <>
      <header className='bg-blue-600 text-white'>
        <div className='mx-4 flex flex-col items-center justify-between py-3 md:flex-row'>
          <div className='flex items-center space-x-3'>
            <Image
              src='/assets/favicon.ico'
              alt='Logo Plombier'
              width={50}
              height={50}
              className='rounded-full'
              style={{ width: '50px', height: '50px' }}
            />
            <h1 className='text-xl font-bold'>Plombier Chauffagiste</h1>
          </div>

          <nav className='flex items-center gap-2'>
            {/* Liens publics */}
            {publicLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 transition-colors hover:bg-blue-700 ${
                  pathname === link.href ? 'bg-blue-700' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Menu hamburger */}
            {isAuthenticated && (
              <div className='relative ml-2' ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className='rounded-lg p-2 transition-colors hover:bg-blue-700'
                >
                  <svg
                    className='h-6 w-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 6h16M4 12h16M4 18h16'
                    />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className='absolute right-0 z-50 mt-2 w-48 rounded-lg bg-white shadow-xl'>
                    {privateLinks.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block px-4 py-2 text-gray-800 hover:bg-gray-100 ${
                          pathname.startsWith(link.href) ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <button
                      onClick={handleSignOut}
                      disabled={loading}
                      className='w-full border-t px-4 py-2 text-left text-red-600 hover:bg-gray-100'
                    >
                      {loading ? 'Déconnexion...' : 'Se déconnecter'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bouton de connexion */}
            {!isAuthenticated && (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className='rounded-md bg-green-500 px-3 py-2 text-white transition-colors hover:bg-green-600'
              >
                Se connecter
              </button>
            )}
          </nav>
        </div>
      </header>

      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      >
        <div className='p-6'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-2xl font-bold'>Connexion</h2>
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className='text-gray-500 hover:text-gray-700'
            >
              ✕
            </button>
          </div>
          <Auth onSuccess={() => setIsLoginModalOpen(false)} />
        </div>
      </Modal>
    </>
  )
}
