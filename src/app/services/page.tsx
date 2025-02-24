export default function Services() {
  return (
    <div className='flex-grow bg-gray-50'>
      <div className='container mx-auto py-12'>
        <div className='mb-12 text-center'>
          <h1>Nos Services</h1>
          <p className='mx-auto max-w-2xl text-xl text-gray-600'>
            Découvrez nos prestations professionnelles pour tous vos besoins en
            plomberie et chauffage
          </p>
        </div>

        <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
          {/* Installation */}
          <div className='rounded-xl bg-gradient-to-br from-white to-blue-50 p-6 shadow-lg transition-all hover:scale-105 hover:from-blue-50 hover:to-white hover:shadow-2xl'>
            <div className='mb-4 text-center'>
              <span className='text-4xl'>🚿</span>
              <h2>Installation</h2>
            </div>
            <ul className='space-y-2 text-gray-600'>
              <li>• Installation de chaudières</li>
              <li>• Pose de chauffe-eau</li>
              <li>• Équipements sanitaires</li>
              <li>• Rénovation salle de bain</li>
            </ul>
          </div>

          {/* Dépannage */}
          <div className='rounded-xl bg-gradient-to-br from-white to-blue-50 p-6 shadow-lg transition-all hover:scale-105 hover:from-blue-50 hover:to-white hover:shadow-2xl'>
            <div className='mb-4 text-center'>
              <span className='text-4xl'>🛠</span>
              <h2>Dépannage</h2>
            </div>
            <ul className='space-y-2 text-gray-600'>
              <li>• Intervention d&apos;urgence</li>
              <li>• Réparation de fuites</li>
              <li>• Débouchage canalisations</li>
              <li>• Pannes de chauffage</li>
            </ul>
          </div>

          {/* Entretien */}
          <div className='rounded-xl bg-gradient-to-br from-white to-blue-50 p-6 shadow-lg transition-all hover:scale-105 hover:from-blue-50 hover:to-white hover:shadow-2xl'>
            <div className='mb-4 text-center'>
              <span className='text-4xl'>🔧</span>
              <h2>Entretien</h2>
            </div>
            <ul className='space-y-2 text-gray-600'>
              <li>• Maintenance chaudière</li>
              <li>• Contrats d&apos;entretien</li>
              <li>• Détartrage</li>
              <li>• Diagnostic technique</li>
            </ul>
          </div>
        </div>

        {/* Section Contact */}
        <div className='mt-16 text-center'>
          <h2 className='mb-4 text-2xl font-bold text-blue-600'>
            Besoin d&apos;un devis ?
          </h2>
          <p className='mb-6 text-gray-600'>
            Contactez-nous pour obtenir un devis personnalisé gratuit
          </p>
          <a
            href='/contact'
            className='inline-block rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white shadow-md transition-colors duration-300 hover:bg-blue-700'
          >
            Demander un devis
          </a>
        </div>
      </div>
    </div>
  )
}
