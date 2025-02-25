import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              Accueil
            </Link>
            <Link
              href="/clients"
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              Clients
            </Link>
            <Link
              href="/factures"
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              Factures
            </Link>
            <Link
              href="/articles"
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              Articles
            </Link>
            <Link
              href="/parametres"
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              Paramètres
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 