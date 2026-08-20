'use client'

import { Play } from 'lucide-react'
import { frameSurface, insetFill, tint } from '@/lib/clyde/theme'
import { Shell, BlockTitle, type RenderCtx } from './shared'
import { type Block } from '@/lib/clyde/types'

/* Bloc 11 — Vidéo. */

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)
  return m ? m[1] : null
}

/* Une URL de fichier vidéo direct (téléversée via l'éditeur ou collée) se lit
   dans un <video> natif — le bloc n'est plus limité à YouTube. */
function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url) || url.includes('blob.vercel-storage.com')
}

export function VideoRender({ block, ctx }: { block: Extract<Block, { type: 'video' }>; ctx: RenderCtx }) {
  const id = youtubeId(block.url)
  const direct = !id && block.url ? isDirectVideo(block.url) : false
  /* Même règle que la galerie : pas de lien vidéo valide, pas de bloc sur la
     page publique. Un cadre vide portant une consigne de configuration
     décrédibilise la vitrine aux yeux du client. */
  if (!id && !direct && ctx.interactive) return null
  return (
    <Shell block={block} ctx={ctx}>
      <div className="flex flex-col gap-3">
        {block.title && <BlockTitle>{block.title}</BlockTitle>}
        <div
          className="relative aspect-video w-full overflow-hidden"
          style={{ ...frameSurface(ctx.theme), background: insetFill(ctx.theme) }}
        >
          {id ? (
            <iframe
              title={block.title || 'Vidéo'}
              src={`https://www.youtube.com/embed/${id}`}
              allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : direct ? (
            <video
              src={block.url}
              controls
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-50">
              <span
                className="flex size-12 items-center justify-center rounded-full"
                style={{ background: tint(ctx.theme.brand, 0.2), color: 'var(--p-brand)' }}
              >
                <Play size={20} className="fill-current" />
              </span>
              <p className="text-[12px] font-medium">Téléversez une vidéo ou collez un lien YouTube dans les réglages</p>
            </div>
          )}
        </div>
        {block.caption && <p className="text-[12px] opacity-55">{block.caption}</p>}
      </div>
    </Shell>
  )
}
