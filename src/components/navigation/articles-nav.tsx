'use client'

import Link from 'next/link'

export default function ArticlesNav() {
  return (
    <nav className="mb-6 flex gap-4">
      <Link href="/articles" className="text-blue-600 hover:text-blue-800">Articles</Link>
      <Link href="/familles" className="text-blue-600 hover:text-blue-800">Familles</Link>
    </nav>
  )
} 