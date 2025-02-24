'use client'

interface HistoriqueItem {
  date: string
  action: string
  description: string
  utilisateur: string
}

interface HistoriqueSectionProps {
  historique?: HistoriqueItem[]
}

export default function HistoriqueSection({ historique }: HistoriqueSectionProps) {
  if (!historique?.length) return null

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Historique</h3>
      <div className="space-y-2">
        {historique.map((item, index) => (
          <div key={index} className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-500">{new Date(item.date).toLocaleString()}</p>
            <p className="font-medium">{item.action}</p>
            <p>{item.description}</p>
            <p className="text-sm text-gray-600">Par: {item.utilisateur}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
