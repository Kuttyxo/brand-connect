'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase' // Asegúrate de que esta ruta sea correcta
import { Camera, Loader2, User } from 'lucide-react'
import Image from 'next/image'

interface Props {
  uid: string
  url: string | null
  size: number
  onUpload: (url: string) => void
}

export default function AvatarUpload({ uid, url, size, onUpload }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Efecto para descargar la imagen si ya existe una URL
  useEffect(() => {
    if (url) downloadImage(url)
  }, [url])

  async function downloadImage(path: string) {
    try {
      // Supabase Storage: Descarga la imagen pública
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
    } catch (error) {
      console.log('Error descargando imagen: ', error)
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen para subir.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${uid}-${Math.random()}.${fileExt}` // Nombre único
      const filePath = `${fileName}`

      // 1. Subir al Bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // 2. Avisar al componente padre que la subida fue exitosa
      onUpload(filePath)

    } catch (error) {
      alert('Error subiendo el avatar!')
      console.log(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="relative overflow-hidden rounded-full border-4 border-white shadow-lg bg-gray-100"
        style={{ height: size, width: size }}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Avatar"
            fill // Ocupa todo el contenedor
            className="object-cover"
            unoptimized // Importante para imágenes externas de Supabase
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <User size={size * 0.5} />
          </div>
        )}

        {/* Overlay de carga */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <Loader2 className="animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="relative">
        <label 
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-dark)] text-white rounded-full text-sm font-medium hover:bg-opacity-90 transition-all shadow-md"
          htmlFor="single"
        >
          {uploading ? 'Subiendo...' : (
            <>
              <Camera size={16} />
              Cambiar Foto
            </>
          )}
        </label>
        <input
          style={{
            visibility: 'hidden',
            position: 'absolute',
          }}
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </div>
    </div>
  )
}