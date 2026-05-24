import { useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useCardStore } from '../../store/cardStore'
import { toast } from '../../hooks/useToast'

export default function CardImageUpload({ cardId, onUploaded }) {
  const inputRef = useRef()
  const { cards } = useCardStore()
  const card = cards[cardId]

  const upload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const path = `${cardId}.${ext}`
    const { error } = await supabase.storage
      .from('card-images')
      .upload(path, file, { upsert: true })
    if (error) { toast.error(error.message); return }
    const { data: { publicUrl } } = supabase.storage.from('card-images').getPublicUrl(path)
    await supabase.from('cards').update({ image_url: publicUrl }).eq('id', cardId)
    onUploaded?.(publicUrl)
    toast.success(`Immagine caricata per ${card?.name_it || cardId}`)
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={upload} />
      <button
        onClick={() => inputRef.current.click()}
        className="text-xs px-2 py-1 border border-hogwarts-gold/30 rounded hover:bg-hogwarts-gold/10"
      >
        📷 Carica immagine
      </button>
    </div>
  )
}
