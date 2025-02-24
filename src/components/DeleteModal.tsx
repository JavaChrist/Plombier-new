"use client";

interface DeleteModalProps {
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export default function DeleteModal({ onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-lg bg-white p-6">
        <h3 className="mb-4 text-lg font-bold">Confirmer la suppression</h3>
        <p className="mb-6">Êtes-vous sûr de vouloir supprimer cet élément ?</p>
        <div className="flex justify-end gap-4">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Annuler
          </button>
          <button onClick={onConfirm} className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
} 