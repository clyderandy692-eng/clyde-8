'use client'

import { useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  ChevronDown,
  ChevronUp,
  Circle,
  CopyIcon,
  Eye,
  FileClock,
  GripVertical,
  LayoutGrid,
  Monitor,
  Paintbrush,
  Plus,
  Settings2,
  Smartphone,
  Trash2,
  Upload,
  WifiOff,
} from 'lucide-react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { PageRenderer } from '@/components/clyde/page/renderer'
import { EditorToolbar } from './editor/editor-toolbar'
import { SortableBlockRow } from './editor/sortable-block-row'
import { BlockSettings } from './editor/block-settings'
import { StorefrontIdentity } from './editor/identity'
import { ICONS, LABELS } from './editor/labels'
import { PageStyleSettings } from './editor/page-style'
import { BLOCK_LIBRARY, BLOCK_META, createBlock, publicBlocks } from '@/lib/clyde/blocks'
import { useEditorDock } from '@/lib/clyde/editor-dock'
import { layoutPersisted, useEditorSession, useEditorSessionReady } from '@/lib/clyde/editor-session'
import {
  duplicateEditorBlock,
  moveEditorBlock,
  removeEditorBlock,
  reorderEditorBlock,
  updateEditorBlock,
} from '@/lib/clyde/editor-layout'
import { useLocale } from '@/lib/clyde/i18n'
import { effectiveLayout, effectiveTheme, hasPendingDraft } from '@/lib/clyde/page-draft'
import { useClyde } from '@/lib/clyde/store'
import { useOwnerContext } from './use-owner'
import { resetBlockColors } from '@/lib/clyde/ambiances'
import type {
  Block,
  BlockStyle,
  Business,
  CatalogueBlock,
  ContactBlock,
  HeroBlock,
  HoursLocationBlock,
  PageTheme,
  BookingBlock,
  CategoriesBlock,
  CarouselBlock,
  PromoBlock,
  Product,
  SearchBlock,
  ReviewBlock,
  FaqBlock,
  BottomNavBlock,
  ImageGalleryBlock,
  VideoBlock,
  IdentityMediaBlock,
} from '@/lib/clyde/types'

/** Aperçu miniature : reconnaître une couverture ou un catalogue va plus vite
 * que relire huit libellés lors d'un réordonnancement. */
function BlockThumbnail({ type }: { type: Block['type'] }) {
  const catalogue = type === 'catalogue' || type === 'categories'
  const editorial = type === 'hero' || type === 'identity_media'

  return (
    <span
      className="flex size-10 shrink-0 flex-col justify-center gap-1 overflow-hidden rounded-md border border-border bg-background p-1"
      aria-hidden="true"
    >
      {catalogue ? (
        <>
          <span className="h-1 w-5 rounded-full bg-brand/60" />
          <span className="grid grid-cols-2 gap-0.5">
            <span className="h-3 rounded-sm bg-muted-foreground/20" />
            <span className="h-3 rounded-sm bg-muted-foreground/20" />
          </span>
        </>
      ) : editorial ? (
        <>
          <span className="h-4 rounded-sm bg-brand/20" />
          <span className="h-1 w-6 rounded-full bg-foreground/40" />
        </>
      ) : (
        <>
          <span className="h-1 w-4 rounded-full bg-brand/60" />
          <span className="h-1 rounded-full bg-muted-foreground/20" />
          <span className="h-1 w-6 rounded-full bg-muted-foreground/20" />
        </>
      )}
    </span>
  )
}

export function PageEditor() {
  const { locale } = useLocale()
  const copy = LABELS[locale]
  const { business, page, catalogWord } = useOwnerContext()
  const updateLayout = useClyde((s) => s.updateLayout)
  const updateTheme = useClyde((s) => s.updateTheme)
  const products = useClyde((s) => s.products)
  const availability = useClyde((s) => s.availability)
  const publishPage = useClyde((s) => s.publishPage)
  const setPublished = useClyde((s) => s.setPublished)
  const updateBusiness = useClyde((s) => s.updateBusiness)
  const [selectedId, setSelectedId] = useState<string | null>(
    page ? effectiveLayout(page)[0]?.id ?? null : null,
  )
  const [addOpen, setAddOpen] = useState(false)
  const [previewWidth, setPreviewWidth] = useState<390 | 856 | 1198>(856)
  const previewDevice = previewWidth === 390 ? 'mobile' : 'desktop'
  /* Mise à l'échelle de l'aperçu. Les boutons 856 et 1198 promettent de juger
     la page à cette largeur ; le simulateur gardait sa largeur CSS réelle et
     le panneau défilait latéralement, si bien qu'un aperçu 1198 dans un
     panneau de 695 px n'en montrait que 58 % à la fois — précisément ce qui
     empêche de juger une mise en page. On réduit donc l'aperçu pour le faire
     tenir en entier, comme une maquette que l'on regarde de plus loin.

     Le mode téléphone (390) est exclu : il reste fluide via `maxWidth: 100%`,
     un comportement vérifié qui n'a pas à changer. */
  const previewViewportRef = useRef<HTMLDivElement | null>(null)
  const [previewViewport, setPreviewViewport] = useState(0)
  useEffect(() => {
    const node = previewViewportRef.current
    if (!node) return
    /* La largeur utile dépend de la fenêtre ET des tiroirs latéraux : un
       ResizeObserver suit les deux, là où un écouteur `resize` manquerait un
       changement de mise en page à fenêtre constante. */
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setPreviewViewport(entry.contentRect.width)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const previewScale =
    previewWidth !== 390 && previewViewport > 0 && previewViewport < previewWidth
      ? previewViewport / previewWidth
      : 1
  /* Sur téléphone, structure et réglages vivent dans des tiroirs bas : la
     page ne montre que l'aperçu — trois cartes empilées noyaient l'écran. */
  const [mobilePanel, setMobilePanel] = useState<'structure' | 'settings' | null>(null)
  const [isPreviewPending, startPreviewTransition] = useTransition()
  /* Dans le tiroir Structure (mobile), les réglages du bloc s'ouvrent en
     accordéon SOUS le bloc touché : pas d'aller-retour entre deux tiroirs. */
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [movementAnnouncement, setMovementAnnouncement] = useState('')
  const historyReady = useEditorSessionReady()
  const session = useEditorSession((state) => business ? state.sessions[business.id] : undefined)
  const ensureSession = useEditorSession((state) => state.ensure)
  const commitSession = useEditorSession((state) => state.commit)
  const undoSession = useEditorSession((state) => state.undo)
  const redoSession = useEditorSession((state) => state.redo)
  const markSaved = useEditorSession((state) => state.markSaved)
  const resetSession = useEditorSession((state) => state.reset)
  const discardPageDraft = useClyde((s) => s.discardDraft)
  const past = session?.past ?? []
  const future = session?.future ?? []
  const dirty = session?.dirty ?? false

  /* Glisser-déposer de la liste de blocs : la souris exige 6 px de mouvement
     avant de saisir (un clic reste un clic), le doigt 200 ms d'appui (un
     défilement reste un défilement). */
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  /* Publie les trois actions du constructeur dans le dock mobile tant que
     l'éditeur est à l'écran, et les retire en partant pour que le dock retrouve
     sa navigation. « Ajouter » ouvre le tiroir Structure directement sur la
     bibliothèque : sur un téléphone, ajouter un bloc est le geste le plus
     fréquent, et il ne doit pas coûter deux appuis. */
  const registerDock = useEditorDock((s) => s.register)
  const setDockActivePanel = useEditorDock((s) => s.setActivePanel)
  useEffect(() => {
    registerDock((panel) => {
      if (panel === 'library') {
        setAddOpen(true)
        setMobilePanel('structure')
        return
      }
      setMobilePanel(panel)
    })
    return () => registerDock(null)
  }, [registerDock])

  useEffect(() => {
    setDockActivePanel(addOpen && mobilePanel === 'structure' ? 'library' : mobilePanel)
  }, [addOpen, mobilePanel, setDockActivePanel])

  useEffect(() => {
    const width = window.innerWidth
    setPreviewWidth(width < 1024 ? 390 : width >= 1536 ? 1198 : 856)
  }, [])

  /* Raccourcis d'annulation. Ignorés pendant une saisie : dans un champ de
     texte, Ctrl+Z doit annuler les caractères tapés, pas la mise en page.
     L'Effect Event lit toujours le dernier historique sans forcer le
     rattachement de l'écouteur à chaque rendu. */
  const handleHistoryShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return
    const target = event.target as HTMLElement | null
    const tag = target?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
    event.preventDefault()
    if (event.shiftKey) redo()
    else undo()
  })

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      handleHistoryShortcut(event)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* Le constructeur travaille sur le BROUILLON quand il en existe un. Les
     surfaces publiques — vitrine, marketplace, page d'accueil — continuent de
     lire `layout_json` sans rien savoir du brouillon : c'est ce qui rend
     structurellement impossible d'exposer un travail non publié. */
  const blocks = page ? effectiveLayout(page) : []
  const workingTheme = page ? effectiveTheme(page) : undefined
  const pendingDraft = page ? hasPendingDraft(page) : false

  /* La première mise en page observée devient la référence enregistrée. Le
     store de session survit aux remontages du constructeur ; `ensure` ne
     remplace donc jamais une session qui possède déjà son historique pour
     cette mise en page.

     L'attente de `historyReady` n'est pas décorative : l'historique est relu
     depuis le stockage après montage, et un `ensure` lancé avant cette
     relecture déclarerait une session neuve sur une page qui avait un passé.
     C'est exactement le défaut qu'on répare ici. */
  useEffect(() => {
    if (historyReady && business && page) ensureSession(business.id, blocks)
  }, [historyReady, business, ensureSession, page])

  /* Réconciliation de l'historique relu, une seule fois par page ouverte.
     L'Effect Event lit la mise en page du moment sans faire de celle-ci une
     dépendance : relancée à chaque frappe, la comparaison effacerait
     l'historique au premier caractère tapé. */
  const reconcileHistory = useEditorSession((state) => state.dropStaleHistory)
  const reconcileOnce = useEffectEvent(() => {
    if (business) reconcileHistory(business.id, blocks)
  })
  useEffect(() => {
    if (historyReady && business?.id) reconcileOnce()
  }, [historyReady, business?.id])

  const selected = blocks.find((block) => block.id === selectedId) ?? null
  const modules = useMemo(
    () => ({ booking: business?.module_booking ?? false, locations: business?.module_locations ?? false }),
    [business?.module_booking, business?.module_locations],
  )
  const liveBlocks = useMemo(
    () => publicBlocks(blocks.filter((block) => !block.hidden), modules),
    [blocks, modules],
  )
  /* Les champs restent instantanés pendant que React diffère le rendu coûteux
     de toute la vitrine. Un glissement de curseur ne bloque donc plus la saisie. */
  const previewBlocks = useDeferredValue(liveBlocks)
  const availableBlocks = useMemo(
    () => BLOCK_LIBRARY.filter((meta) => !meta.unique || !blocks.some((b) => b.type === meta.type)),
    [blocks],
  )

  /* L'indicateur « Enregistré » ne se déclenche que sur une écriture constatée.
     On relit l'instantané du navigateur jusqu'à y retrouver la mise en page
     affichée ; si le stockage refuse (quota atteint, navigation privée), le
     témoin reste sur « Modifications en cours » — un mensonge rassurant coûte
     ici une journée de travail. Le garde `beforeunload` accompagne l'attente. */
  useEffect(() => {
    if (!dirty || !business) return

    let attempts = 0
    const probe = window.setInterval(() => {
      attempts += 1
      if (layoutPersisted(business.id, blocks)) {
        markSaved(business.id, blocks)
        window.clearInterval(probe)
      } else if (attempts >= 12) {
        /* ~3 s sans écriture visible : on abandonne la vérification et on
           laisse l'état « non enregistré » visible. */
        window.clearInterval(probe)
      }
    }, 250)

    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', guard)
    return () => {
      window.clearInterval(probe)
      window.removeEventListener('beforeunload', guard)
    }
  }, [business, blocks, dirty, markSaved])

  if (!business || !page) return null

  function commit(next: Block[], group?: string) {
    commitSession(business.id, blocks, next, group)
    updateLayout(business.id, next)
  }

  /* Restaure un état sans l'empiler à son tour : on déplace entre les deux
     piles au lieu de passer par `commit()`, qui écraserait l'historique. */
  function restore(next: Block[]) {
    updateLayout(business!.id, next)
    /* Le bloc sélectionné peut ne plus exister dans l'état restauré (annulation
       d'un ajout) : la sélection retombe alors sur le style global. */
    setSelectedId((current) =>
      current && next.some((block) => block.id === current) ? current : null,
    )
  }

  function undo() {
    const previous = undoSession(business.id, blocks)
    if (previous) restore(previous)
  }

  function redo() {
    const next = redoSession(business.id, blocks)
    if (next) restore(next)
  }

  function patchSelected(patch: Partial<Block>) {
    if (!selected) return
    const field = Object.keys(patch).sort().join(',')
    commit(updateEditorBlock(blocks, selected.id, patch), `${selected.id}:${field}`)
  }

  function toggleHidden(id: string) {
    const block = blocks.find((item) => item.id === id)
    if (!block) return
    commit(updateEditorBlock(blocks, id, { hidden: !block.hidden }))
  }

  function announceMovement(next: Block[], id: string) {
    const index = next.findIndex((block) => block.id === id)
    const block = next[index]
    if (!block || index < 0) return
    const label = BLOCK_META[block.type]?.label ?? block.type
    setMovementAnnouncement(`${label} ${copy.movedTo} ${index + 1} ${copy.of} ${next.length}.`)
  }

  function move(id: string, direction: -1 | 1) {
    const next = moveEditorBlock(blocks, id, direction)
    if (next !== blocks) {
      commit(next)
      announceMovement(next, id)
    }
  }

  /* Réordonnancement par glisser-déposer — complète les flèches, qui restent
     là pour l'accessibilité et les petits ajustements. */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const id = String(active.id)
    const next = reorderEditorBlock(blocks, id, String(over.id))
    if (next !== blocks) {
      commit(next)
      announceMovement(next, id)
    }
  }

  function add(type: Block['type']) {
    const required = BLOCK_META[type]?.requiresModule
    if (required && !modules[required]) {
      toast(copy.moduleOffLibrary, {
        action: {
          label: copy.activateModule,
          onClick: () =>
            updateBusiness(business.id, {
              [required === 'booking' ? 'module_booking' : 'module_locations']: true,
            }),
        },
      })
      return
    }
    const block = createBlock(type)
    commit([...blocks, block])
    setSelectedId(block.id)
    setAddOpen(false)
  }

  function publish() {
    const result = publishPage(business.id)
    toast(copy.publishSuccess, {
      description:
        result.bonusDays > 0 ? `+${result.bonusDays} ${copy.publishBonus}` : undefined,
    })
  }

  function unpublish() {
    setPublished(business.id, false)
    toast(copy.unpublished)
  }

  /* Abandonner le brouillon revient à la page en ligne. L'historique est vidé
     dans le même geste : ses états décrivent le brouillon qu'on vient de jeter,
     et « Annuler » juste après aurait fait revenir ce que le commerçant venait
     explicitement d'abandonner. */
  function discardDraft() {
    const live = page!.layout_json
    discardPageDraft(business.id)
    resetSession(business.id, live)
    setSelectedId(live[0]?.id ?? null)
    toast(copy.draftDiscarded)
  }

  function duplicateBlock(id: string) {
    const block = blocks.find((item) => item.id === id)
    const meta = block && BLOCK_LIBRARY.find((item) => item.type === block.type)
    if (!block || meta?.unique) return

    const next = duplicateEditorBlock(blocks, id)
    commit(next)
    const duplicateIndex = next.findIndex((item, index) => item.id !== id && index > blocks.findIndex((item) => item.id === id))
    setSelectedId(next[duplicateIndex]?.id ?? id)
  }

  function removeBlock(id: string) {
    const removed = blocks.find((block) => block.id === id)
    if (!removed) return

    const next = removeEditorBlock(blocks, id)
    commit(next)
    if (selectedId === id) setSelectedId(next[0]?.id ?? null)
    setExpandedId(null)

    toast(copy.deleted, {
      description: BLOCK_META[removed.type]?.label ?? removed.type,
      action: { label: copy.restore, onClick: undo },
    })
  }

  function removeSelected() {
    if (selected) removeBlock(selected.id)
  }

  /* Garde-fou de qualité : ce qui manque pour qu'une vitrine soit vendeuse.
     Rien n'est bloqué — on montre. Un commerçant qui publie sans photo ni
     numéro n'a pas fait un choix, il a oublié une étape. Les critères sont
     ceux qui décident d'une commande : voir, comprendre le prix, contacter. */
  const mine = products.filter((p) => p.business_id === business.id && p.active)
  const checks = [
    {
      done: mine.length >= 3,
      /* Le mot du métier, pas « catalogue » : un hôtel a des chambres. */
      label:
        locale === 'fr'
          ? `3 entrées dans ${catalogWord.toLowerCase()}`
          : `3 entries in your ${catalogWord.toLowerCase()}`,
    },
    {
      done: mine.length > 0 && mine.filter((p) => p.media_urls.length > 0).length >= Math.min(3, mine.length),
      label: locale === 'fr' ? 'Une photo par article' : 'A photo on each item',
    },
    {
      done: mine.some((p) => p.price > 0),
      label: locale === 'fr' ? 'Des prix renseignés' : 'Prices filled in',
    },
    {
      done: Boolean(business.whatsapp_number?.trim()),
      label: locale === 'fr' ? 'Un numéro WhatsApp' : 'A WhatsApp number',
    },
    {
      done: blocks.some((b) => b.type === 'catalogue' && !b.hidden),
      label:
        locale === 'fr'
          ? `${catalogWord} affiché sur la page`
          : `${catalogWord} shown on the page`,
    },
    {
      done: blocks.some((b) => b.type === 'contact' && !b.hidden),
      label: locale === 'fr' ? 'Un moyen de vous joindre' : 'A way to reach you',
    },
  ]
  const doneCount = checks.filter((c) => c.done).length
  const readiness = Math.round((doneCount / checks.length) * 100)

  /* Panneaux partagés entre les cartes desktop et les tiroirs mobiles : une
     seule source de vérité pour la liste des blocs et l'inspecteur, deux
     conteneurs différents. */
  const structurePanel = (
    <>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {movementAnnouncement}
      </p>
      {/* Accès permanent au style GLOBAL de la page (fond, ambiance,
          couleurs) : il était introuvable — caché derrière « aucun bloc
          sélectionné ». En tête de liste, il précède les blocs comme la page
          précède ses sections. */}
      <button
        type="button"
        onClick={() => {
          setSelectedId(null)
          if (mobilePanel === 'structure') setMobilePanel('settings')
        }}
        className={`mb-2 flex min-h-11 w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm font-medium ${selectedId === null ? 'border-primary/40 bg-primary/10 text-primary' : 'border-dashed hover:bg-muted'}`}
      >
        <Paintbrush className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{copy.pageStyle}</span>
      </button>
      {addOpen && (
        <div className="mb-2 flex flex-col gap-1 rounded-xl border bg-muted/40 p-2">
          {availableBlocks.map((meta) => {
            const Icon = ICONS[meta.icon as keyof typeof ICONS] ?? LayoutGrid
            const moduleOff = Boolean(meta.requiresModule && !modules[meta.requiresModule])
            return (
              <button
                key={meta.type}
                type="button"
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-background ${moduleOff ? 'text-muted-foreground' : ''}`}
                onClick={() => add(meta.type)}
                title={moduleOff ? copy.moduleOffLibrary : undefined}
              >
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{meta.label}</span>
                {moduleOff ? (
                  <WifiOff className="size-3.5 text-muted-foreground" aria-hidden />
                ) : (
                  <Plus className="size-3.5 text-muted-foreground" aria-hidden />
                )}
              </button>
            )
          })}
        </div>
      )}
      {blocks.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center p-5 text-center text-sm text-muted-foreground">{copy.empty}</div>
      ) : (
        /* Le glisser-déposer complète les flèches : saisir la poignée et poser
           le bloc où l'on veut va plus vite que de le faire monter cran par
           cran. `restrictToVerticalAxis` : la liste est une colonne, le bloc
           ne doit pas partir en diagonale sous le doigt. */
        <DndContext
          sensors={dndSensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1">
              {blocks.map((block, index) => {
                const meta = BLOCK_LIBRARY.find((item) => item.type === block.type)
                const active = selectedId === block.id
                /* Accordéon réservé au tiroir mobile : sur bureau, la colonne
                   Réglages (ou son tiroir) fait déjà ce travail. */
                const expanded = mobilePanel === 'structure' && expandedId === block.id
                return (
                  <SortableBlockRow key={block.id} id={block.id}>
                    {({ handleProps }) => (
                      <>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            {...handleProps}
                            className="flex min-h-9 shrink-0 cursor-grab touch-none items-center rounded p-1 text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground active:cursor-grabbing"
                            aria-label={`${meta?.label ?? block.type} — ${copy.dragHandle}`}
                          >
                            <GripVertical className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(block.id)
                              /* Dans le tiroir mobile, le tap déplie les réglages
                                 SOUS le bloc — pas de second tiroir à ouvrir. */
                              if (mobilePanel === 'structure') {
                                setExpandedId((current) => (current === block.id ? null : block.id))
                              }
                            }}
                            className={`flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${active ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                          >
                            <BlockThumbnail type={block.type} />
                            <span className="min-w-0 flex-1 truncate">{meta?.label ?? block.type}</span>
                            {block.hidden && <span className="text-[11px] text-muted-foreground">{copy.hidden}</span>}
                            {mobilePanel === 'structure' && (
                              <ChevronDown
                                className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
                                aria-hidden
                              />
                            )}
                          </button>
                          <div className="flex shrink-0 items-center">
                            <button type="button" onClick={() => move(block.id, -1)} disabled={index === 0} className="rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label={copy.moveUp}>
                              <ChevronUp className="size-3.5" />
                            </button>
                            <button type="button" onClick={() => move(block.id, 1)} disabled={index === blocks.length - 1} className="rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label={copy.moveDown}>
                              <ChevronDown className="size-3.5" />
                            </button>
                            <Switch checked={!block.hidden} onCheckedChange={() => toggleHidden(block.id)} aria-label={copy.visible} />
                          </div>
                        </div>
                        {expanded && (
                          <div className="mt-1 mb-2 rounded-xl border bg-muted/30 p-3">
                            <BlockSettings
                              block={block}
                              businessId={business.id}
                              products={products}
                              copy={copy}
                              onChange={(patch) => {
                        const field = Object.keys(patch).sort().join(',')
                        commit(updateEditorBlock(blocks, block.id, patch), `${block.id}:${field}`)
                      }}
                            />
                            <div className="mt-3 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                disabled={Boolean(meta?.unique)}
                                title={meta?.unique ? copy.duplicateUnavailable : undefined}
                                onClick={() => duplicateBlock(block.id)}
                              >
                                <CopyIcon data-icon="inline-start" />
                                {copy.duplicate}
                              </Button>
                              <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 justify-center text-destructive hover:text-destructive"
                              onClick={() => removeBlock(block.id)}
                            >
                              <Trash2 data-icon="inline-start" />
                                {copy.delete}
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </SortableBlockRow>
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </>
  )

  /* Sans bloc sélectionné, le panneau montre le STYLE DE LA PAGE (ambiances,
     couleurs globales) puis l'identité de la vitrine — au lieu d'un simple
     « sélectionnez un bloc » : c'est là qu'on cherchait en vain le fond de la
     page entière. */
  const settingsPanel = selected ? (
    <BlockSettings block={selected} businessId={business.id} products={products} copy={copy} onChange={patchSelected} />
  ) : (
    <div className="flex flex-col gap-6">
      <PageStyleSettings
        theme={workingTheme ?? page.theme_json}
        onTheme={(theme, alsoResetBlocks) => {
          updateTheme(business.id, theme)
          if (alsoResetBlocks) commit(resetBlockColors(blocks))
        }}
      />
      <Separator />
      <StorefrontIdentity business={business} locale={locale} />
    </div>
  )

  /* Aucune réserve de bas de page ici : la coque du tableau de bord la pose
     déjà via `DOCK_SAFE_AREA`. La redoubler ouvrait un vide sous le contenu, et
     la maintenir à deux endroits garantissait qu'elles divergent. */
  return (
    <main className="flex min-h-dvh min-w-0 flex-col gap-6">
      {/* Sur téléphone le titre et le bouton partagent la même ligne, et la
          phrase d'explication passe dessous. Empilés, ils poussaient l'aperçu à
          253 px du haut d'un écran de 844 : l'essentiel de l'outil — voir sa
          page changer — commençait sous le premier tiers de l'écran. */}
      <header className="flex flex-col gap-2">
        {/* Titre et bouton sur une seule ligne, la phrase d'explication dessous.
            Un seul bouton pour toutes les tailles : le dupliquer par point de
            rupture laisserait deux copies à maintenir, avec le risque qu'elles
            divergent. */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{copy.title}</h1>
          <div className="flex items-center gap-2">
            <EditorToolbar
              dirty={dirty}
              canUndo={past.length > 0}
              canRedo={future.length > 0}
              undoLabel={copy.undo}
              redoLabel={copy.redo}
              savingLabel={copy.saving}
              savedLabel={copy.saved}
              publicPageLabel={copy.publicPage}
              publicPageUrl={`/r/${business.slug}`}
              onUndo={undo}
              onRedo={redo}
            />
            {page.published ? (
              <Button size="sm" variant="outline" onClick={unpublish} className="hidden sm:inline-flex">
                <WifiOff data-icon="inline-start" />
                {copy.unpublish}
              </Button>
            ) : (
              <Button size="sm" onClick={publish}>
                <Upload data-icon="inline-start" />
                <span className="hidden sm:inline">{copy.publish}</span>
                <span className="sm:hidden">{copy.publishShort}</span>
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{copy.description}</p>

        {/* Brouillon en attente. C'est le seul endroit qui porte « Publier les
            modifications » : le bouton de l'en-tête reste celui de la mise en
            ligne initiale, et n'apparaît que sur une page hors ligne. Deux
            boutons pour publier laisseraient le commerçant deviner lequel
            publie quoi.

            Le bandeau est un `role="status"` en `aria-live="polite"` : sa
            venue signale un travail non publié, ce qui doit s'entendre sans
            interrompre la saisie en cours. */}
        {pendingDraft && (
          <div
            role="status"
            aria-live="polite"
            /* Nommé par son titre : trois `role="status"` cohabitent sur cet
               écran (le témoin d'enregistrement, l'annonce des déplacements au
               lecteur d'écran, et ce bandeau). Sans nom accessible, aucun n'est
               désignable — ni par un lecteur d'écran qui les énumère, ni par un
               test. */
            aria-labelledby="draft-banner-title"
            className="flex flex-col gap-3 rounded-xl border border-brand/30 bg-brand/5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <FileClock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
              <div className="min-w-0">
                <p id="draft-banner-title" className="text-sm font-medium">{copy.draftTitle}</p>
                <p className="text-sm text-muted-foreground">{copy.draftBody}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="ghost" onClick={discardDraft}>
                {copy.draftDiscard}
              </Button>
              <Button size="sm" onClick={publish}>
                <Upload data-icon="inline-start" />
                {copy.draftPublish}
              </Button>
            </div>
          </div>
        )}

        {/* Score de complétion : une jauge et les deux manques les plus
            proches. Complet, le bandeau disparaît — un indicateur toujours
            présent finit par ne plus rien signaler. */}
        {readiness < 100 && (
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <p className="text-sm font-medium">
                {copy.readiness} <span className="font-semibold">{readiness}%</span>
              </p>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-border"
                role="progressbar"
                aria-valuenow={readiness}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${readiness}%` }} />
              </div>
            </div>
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {checks
                .filter((c) => !c.done)
                .slice(0, 3)
                .map((c) => (
                  <li key={c.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Circle className="size-3 shrink-0" aria-hidden="true" />
                    {c.label}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </header>

      {/* `2xl:` (1536px) plutôt que `min-[1600px]:` : les deux variantes ont la
          même spécificité, et Tailwind émet les variantes arbitraires AVANT les
          variantes nommées. La règle à trois colonnes était donc écrasée par le
          `lg:` à deux colonnes qui la suivait dans la feuille de style — la
          troisième colonne ne s'ouvrait à aucune taille d'écran. L'ordre
          lg < xl < 2xl, lui, est garanti. */}
      {/* `lg:h-…` fixe (et non seulement min-h) : les cartes héritent d'une
          hauteur bornée, condition pour que `flex-1` + `overflow-auto` fassent
          défiler l'aperçu et la liste de blocs À L'INTÉRIEUR de leur carte.
          Avec une simple min-height, l'aperçu grandissait à la taille de son
          contenu (page entière) et rien ne défilait en interne. */}
      {/* Sur téléphone, pas de `min-h` calée sur la hauteur d'écran : elle
          forçait la grille (donc l'aperçu) à dépasser sous le dock d'outils
          flottant, qui recouvrait alors la barre basse de la vitrine simulée.
          La grille se dimensionne au contenu, et c'est l'aperçu (ligne
          suivante) qui borne sa propre hauteur pour rester au-dessus du dock.
          Sur grand écran, le dock n'existe pas : la hauteur pleine revient. */}
      <div className="grid min-w-0 gap-5 lg:h-[calc(100dvh-150px)] lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        {/* Structure : carte visible sur grand écran seulement — sur téléphone
            elle vit dans le tiroir bas. */}
        <Card className="hidden min-h-0 min-w-0 flex-col overflow-hidden lg:flex">
          <CardHeader className="gap-3 border-b">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">{copy.structure}</CardTitle>
                <CardDescription>{copy.blockCount(blocks.length)}</CardDescription>
              </div>
              <Button size="icon" variant="outline" aria-label={copy.addBlock} onClick={() => setAddOpen((open) => !open)}>
                <Plus />
              </Button>
            </div>
          </CardHeader>
          {/* `overflow-x-hidden` : la rangée flèches + interrupteur pouvait
              dépasser d'un ou deux pixels et faire apparaître une glissière
              horizontale sous la liste — un défaut visuel sans utilité. */}
          <CardContent className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-2">{structurePanel}</CardContent>
        </Card>

        <Card className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b py-4">
            <CardTitle className="flex items-center gap-2 text-base"><Eye className="size-4" />{copy.preview}</CardTitle>
            <div className="flex items-center rounded-lg bg-muted p-1" role="group" aria-label={copy.preview}>
              {([390, 856, 1198] as const).map((width) => (
                <button
                  key={width}
                  type="button"
                  onClick={() => startPreviewTransition(() => setPreviewWidth(width))}
                  aria-label={`${width === 390 ? copy.previewMobile : copy.previewDesktop} — ${width} px`}
                  aria-pressed={previewWidth === width}
                  className={`flex h-8 items-center gap-1 rounded-md px-2 font-mono text-xs transition-colors ${previewWidth === width ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                >
                  {width === 390 ? <Smartphone className="size-3.5" aria-hidden="true" /> : <Monitor className="size-3.5" aria-hidden="true" />}
                  <span>{width}</span>
                </button>
              ))}
            </div>
          </CardHeader>
          {/* Mêmes proportions que l'aperçu de la page d'accueil : `PageRenderer`
              rendu directement, plafonné à 330 px en mode téléphone. L'iframe
              précédente chargeait la vitrine publique entière, ce qui ajoutait
              sa barre d'actions flottante par-dessus celle du bloc couverture —
              d'où les boutons « S'abonner » et « Partager » en double — et
              écrasait la mise en page dans la largeur du cadre. */}
          {/* `p-1.5` sur téléphone, décoratif `md:p-6` seulement à partir de la
              tablette : sur un écran de 416 px, les marges empilées (page, carte,
              contenu) réduisaient le cadre d'aperçu à 280 px — une largeur
              qu'aucun téléphone réel n'a. Le titre de la couverture s'y repliait
              en plein mot, ce que le commerçant lisait comme « ma page est
              cassée » alors que seule la maquette était trop étroite.

              Même raison pour `max-w-[390px]` au lieu de 330 : c'est la largeur
              d'un téléphone courant, donc ce que la page donnera vraiment. */}
          {/* `flex-1` + `lg:h-full` sur le défilement interne : sur bureau,
              l'aperçu occupe toute la hauteur disponible de la grille (elle-même
              calée sur la hauteur de l'écran) au lieu d'un plafond arbitraire de
              540 px — les réglages de bloc, plus hauts, le dépassaient de loin. */}
          <CardContent
            ref={previewViewportRef}
            className="flex min-h-0 flex-1 justify-start overflow-auto bg-muted/30 p-1.5 md:p-6"
          >
            {/* Enveloppe de mise à l'échelle. Un élément transformé occupe
                toujours sa boîte d'origine dans le flux : sans `overflow-hidden`
                ici, les 1198 px non réduits rouvriraient la glissière
                horizontale que la réduction vient justement supprimer. */}
            {/* Sans réduction, l'enveloppe doit rester transparente pour la
                mise en page : `w-full` pour que le `maxWidth: 100%` de la
                maquette continue de se mesurer sur le panneau et non sur ses
                390 px propres. Sinon l'aperçu téléphone cesse d'être fluide et
                se fait rogner à droite — le défaut que corrigeait déjà
                `maxWidth`. */}
            <div
              className={`flex shrink-0 overflow-hidden ${previewScale < 1 ? 'mx-auto' : 'w-full justify-center'}`}
              style={previewScale < 1 ? { width: previewWidth * previewScale } : undefined}
            >
            <div
              className={`clyde-mock ${previewScale < 1 ? '' : 'mx-auto'} shrink-0 overflow-hidden rounded-xl border shadow-sm transition-[width,opacity] duration-300 ${isPreviewPending ? 'opacity-70' : 'opacity-100'}`}
              style={{
                width: previewWidth,
                maxWidth: previewWidth === 390 ? '100%' : undefined,
                /* `top left` et non `top center` : l'origine doit coïncider
                   avec le coin que l'enveloppe garde en place, sinon la
                   maquette réduite sort du cadre par la gauche. */
                ...(previewScale < 1
                  ? {
                      height: `${100 / previewScale}%`,
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top left',
                    }
                  : {}),
              }}
            >
              {/* Téléphone : le simulateur vise le format d'un vrai écran de
                  téléphone (`75dvh`), et non l'espace laissé libre par le
                  chrome de l'éditeur.

                  La version précédente retranchait `27rem` de chrome à la
                  hauteur de l'écran. Le compte tombait juste sur un grand
                  écran, mais sur un téléphone de 844 px il ne restait que
                  412 px d'aperçu : la vitrine s'arrêtait sous sa couverture et
                  le commerçant jugeait sa mise en page sur un demi-écran. La
                  page de l'éditeur défile déjà — le simulateur n'a aucune
                  raison de tenir dans un seul écran.

                  Sur grand écran, il occupe toute la carte comme avant. */}
              <div className="clyde-no-scrollbar h-[75dvh] min-h-[30rem] overflow-y-auto lg:h-full lg:min-h-[540px]">
                <PageRenderer
                  key={previewWidth}
                  business={business}
                  products={products}
                  availability={availability}
                  theme={workingTheme ?? page.theme_json}
                  blocks={previewBlocks}
                  device={previewDevice}
                  /* Aperçu « en direct » au sens plein : les boutons, filtres
                     et cartes répondent comme sur la page publique, pour que le
                     commerçant teste sa page sans quitter l'éditeur. */
                  interactive
                  /* Sélection au clic DANS l'aperçu — le geste naturel, celui
                     de Framer ou Webflow. La liste latérale restait le seul
                     moyen de désigner une section, alors que le commerçant
                     pointe naturellement ce qu'il voit.

                     Pas de `stopPropagation` : le clic sélectionne ET traverse
                     jusqu'au bouton visé, pour que l'aperçu reste jouable. */
                  wrapBlock={(block, node) => (
                    <div
                      onClick={() => {
                        setSelectedId(block.id)
                        /* Tant que la troisième colonne n'est pas affichée, les réglages
                           vivent dans un tiroir : sélectionner sans l'ouvrir ne
                           montrerait rien. */
                        if (window.innerWidth < 1536) setMobilePanel('settings')
                      }}
                      className={`group/blk relative cursor-pointer ${
                        selectedId === block.id
                          ? 'outline-2 -outline-offset-2 outline-primary'
                          : 'hover:outline-2 hover:-outline-offset-2 hover:outline-primary/40'
                      }`}
                    >
                      {node}
                      <span
                        className={`pointer-events-none absolute top-1 left-1 z-30 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground transition-opacity ${
                          selectedId === block.id ? 'opacity-100' : 'opacity-0 group-hover/blk:opacity-100'
                        }`}
                      >
                        {BLOCK_META[block.type]?.label ?? block.type}
                      </span>
                    </div>
                  )}
                />
              </div>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Réglages : carte seulement là où la grille lui donne vraiment une
            troisième colonne, donc au même seuil `2xl:` que celle-ci.

            Elle s'affichait dès `lg:` (1024px) alors que la grille n'y définit
            que deux colonnes : la carte passait à la ligne suivante, sous
            l'aperçu, dans une colonne de 260px — à plus de 1000px de haut. En
            dessous de `2xl:`, on garde le tiroir bas, qui présente les mêmes
            réglages sur toute la largeur. */}
        <Card className="hidden min-h-0 min-w-0 overflow-hidden 2xl:block">
          <CardHeader className="flex flex-row items-start justify-between gap-3 border-b">
            <div>
              {/* Sans bloc sélectionné, le panneau montre le style GLOBAL :
                  titrer « Réglages du bloc » ferait chercher un bloc qui
                  n'existe pas. */}
              <CardTitle className="text-base">
                {selected ? copy.settings : copy.pageStyle}
              </CardTitle>
              <CardDescription>
                {selected ? (BLOCK_META[selected.type]?.label ?? selected.type) : copy.pageStyleHint}
              </CardDescription>
            </div>
            {selected && (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => duplicateBlock(selected.id)}
                disabled={Boolean(BLOCK_LIBRARY.find((item) => item.type === selected.type)?.unique)}
                aria-label={copy.duplicate}
                title={BLOCK_LIBRARY.find((item) => item.type === selected.type)?.unique ? copy.duplicateUnavailable : copy.duplicate}
              >
                <CopyIcon />
              </Button>
              <Button size="icon" variant="ghost" onClick={removeSelected} aria-label={copy.delete}><Trash2 /></Button>
            </div>
          )}
          </CardHeader>
          <CardContent className="min-h-0 overflow-y-auto p-4">
            {/* Aucun bloc sélectionné : plutôt qu'un panneau vide, on expose
                l'identité de la vitrine — c'est elle qui alimente la vignette
                de la marketplace. */}
            {settingsPanel}
          </CardContent>
        </Card>
      </div>

      {/* Accès aux réglages pour la seule plage `lg` → `2xl`.

          Sur téléphone et tablette (< `lg`), ces outils vivent maintenant dans
          le dock du bas, qui est le repère permanent de l'application : une
          seconde barre flottante juste au-dessus de lui coûtait 157 px de haut à
          elles deux sur un écran de 844, au détriment de l'aperçu.

          Reste la plage `lg` → `2xl` : le dock y est masqué, la carte Structure
          est visible, mais la carte Réglages n'a pas encore sa colonne. Ce
          bouton compact, ancré en bas à droite, est alors le seul accès aux
          réglages. */}
      {/* `right-24` et non `right-6` : le lecteur de musique flottant occupe
          déjà le coin bas-droit (`sm:right-6`, z-60) — les deux se
          chevauchaient. Le bouton se décale à sa gauche. */}
      <div className="fixed right-24 bottom-6 z-40 hidden items-center rounded-2xl border border-border bg-background/95 p-1.5 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:flex 2xl:hidden">
        <button
          type="button"
          onClick={() => setMobilePanel('settings')}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold transition-transform active:scale-95"
        >
          <Settings2 className="size-4" aria-hidden="true" />
          {copy.settingsShort}
        </button>
      </div>

      {/* Tiroir Structure. */}
      <Sheet open={mobilePanel === 'structure'} onOpenChange={(open) => setMobilePanel(open ? 'structure' : null)}>
        {/* Même seuil que la barre qui l'ouvre : en `lg:hidden`, le tiroir était
            masqué alors que son bouton restait cliquable — un tap n'ouvrait rien
            entre 1024 et 1600px. */}
        <SheetContent side="bottom" className="max-h-[78dvh] gap-0 rounded-t-2xl p-0 2xl:hidden">
          {/* pr-12 : la croix de fermeture du Sheet occupe le coin droit. */}
          <SheetHeader className="flex-row items-center justify-between border-b py-3 pr-12 pl-4">
            <SheetTitle className="text-base">{copy.structure} · {blocks.length}</SheetTitle>
            <Button size="sm" variant="outline" onClick={() => setAddOpen((open) => !open)}>
              <Plus data-icon="inline-start" />
              {copy.addBlock}
            </Button>
          </SheetHeader>
          <div className="min-h-0 overflow-x-hidden overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{structurePanel}</div>
        </SheetContent>
      </Sheet>

      {/* Tiroir Réglages. */}
      <Sheet open={mobilePanel === 'settings'} onOpenChange={(open) => setMobilePanel(open ? 'settings' : null)}>
        <SheetContent side="bottom" className="max-h-[78dvh] gap-0 rounded-t-2xl p-0 2xl:hidden">
          <SheetHeader className="flex-row items-center justify-between border-b py-3 pr-12 pl-4">
            <SheetTitle className="text-base">
              {selected ? copy.settings : copy.pageStyle}
              {/* Le nom lisible du bloc, pas son type technique : la liste
                  juste avant affiche « Barre de recherche », afficher ici
                  « search » obligerait à faire le rapprochement soi-même. */}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {selected ? (BLOCK_META[selected.type]?.label ?? selected.type) : ''}
              </span>
            </SheetTitle>
            {selected && (
              <Button size="icon" variant="ghost" onClick={removeSelected} aria-label={copy.delete}>
                <Trash2 />
              </Button>
            )}
          </SheetHeader>
          <div className="min-h-0 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{settingsPanel}</div>
        </SheetContent>
      </Sheet>
    </main>
  )
}
