'use client'

import { Intervention } from '@/types'

interface PhotosSectionProps {
  intervention: Intervention
  editing: boolean
  onPhotoUpload: (files: FileList | null, type: 'avant' | 'apres') => void
  uploading: boolean
}

export default function PhotosSection({
  intervention: _intervention,
  editing,
  onPhotoUpload,
  uploading,
}: PhotosSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Photos</h3>
      {editing && (
        <div className="flex gap-4">
          <div>
            <label className="block mb-2">Photos avant</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPhotoUpload(e.target.files, 'avant')}
              disabled={uploading}
            />
          </div>
          <div>
            <label className="block mb-2">Photos après</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPhotoUpload(e.target.files, 'apres')}
              disabled={uploading}
            />
          </div>
        </div>
      )}
    </div>
  )
} 