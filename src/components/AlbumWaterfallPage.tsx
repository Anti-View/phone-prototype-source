import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FloatInGroup, FloatInItem } from './FloatIn'

const pastelColors = [
  '#F4D8D8',
  '#F7E6C9',
  '#DDEED6',
  '#D8E8F4',
  '#E5DDF4',
  '#F2D9EA',
  '#D9EFEA',
  '#F1E4D4',
]

const POLAROID_PREVIEW_LAYOUT_SPRING = {
  type: 'spring' as const,
  stiffness: 360,
  damping: 22,
  mass: 0.86,
}

const POLAROID_PREVIEW_BACKDROP_TRANSITION = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1] as const,
}

type PreviewCard = {
  id: number
  color: string
  src?: string
  rotation: number
}

function PolaroidVisual({
  color,
  src,
  rotation,
  preview = false,
}: {
  color: string
  src?: string
  rotation: number
  preview?: boolean
}) {
  const scale = preview ? 1.8 : 1

  return (
    <div
      className="bg-white"
      style={{
        width: 144 * scale,
        height: 198 * scale,
        paddingTop: 9 * scale,
        paddingLeft: 9 * scale,
        paddingRight: 9 * scale,
        paddingBottom: 63 * scale,
        boxShadow: preview
          ? '0px 24px 80px rgba(0, 0, 0, 0.28)'
          : '0px 8px 16px rgba(0, 0, 0, 0.04)',
        borderRadius: 6.55 * scale,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
      }}
    >
      <div
        style={{
          width: 126 * scale,
          height: 126 * scale,
          borderRadius: 3.27 * scale,
          background: color,
          overflow: 'hidden',
        }}
      >
        {src && (
          <img
            src={src}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            draggable={false}
          />
        )}
      </div>
    </div>
  )
}

function PolaroidCard({
  id,
  color,
  src,
  left,
  top,
  rotation,
  revealIndex,
}: {
  id: number
  color: string
  src?: string
  left: number
  top: number
  rotation: number
  revealIndex: number
}) {
  return (
    <FloatInItem
      index={revealIndex}
      kind="card"
      className="absolute"
      style={{ left, top }}
      data-polaroid-card-id={id}
    >
      <motion.div
        layoutId={`polaroid-${id}`}
        transition={{
          layout: POLAROID_PREVIEW_LAYOUT_SPRING,
        }}
        style={{
          cursor: 'pointer',
          willChange: 'transform',
        }}
      >
        <PolaroidVisual
          color={color}
          src={src}
          rotation={rotation}
        />
      </motion.div>
    </FloatInItem>
  )
}

export default function AlbumWaterfallPage({
  onBack,
  photos,
}: {
  onBack: () => void
  photos: string[]
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const momentumRef = useRef<number | null>(null)
  const rubberOffsetRef = useRef(0)
  const rubberReturnRef = useRef<number | null>(null)

  const [previewCard, setPreviewCard] = useState<PreviewCard | null>(null)
  const suppressPreviewClickRef = useRef(false)

  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startY: 0,
    startScrollTop: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    moved: false,
    tapCardId: null as number | null,
  })

  const getStableRotation = (index: number) => {
    const value = Math.sin(index * 999.37) * 10000
    const fraction = value - Math.floor(value)
    return Number((fraction * 10 - 5).toFixed(2))
  }

  const cards = useMemo(() => {
    const placeholderCount = Math.max(20, photos.length)

    return Array.from({ length: placeholderCount }, (_, index) => {
      const isLeft = index % 2 === 0
      const columnIndex = Math.floor(index / 2)

      return {
        id: index,
        left: isLeft ? 32 : 226,
        top: (isLeft ? 138 : 84) + columnIndex * 230,
        color: pastelColors[index % pastelColors.length],
        rotation: getStableRotation(index),
        src: photos[index],
      }
    })
  }, [photos])

  const cardRevealOrder = useMemo(() => {
    return new Map(
      [...cards]
        .sort((a, b) => {
          if (a.top !== b.top) return a.top - b.top
          return a.left - b.left
        })
        .map((card, index) => [card.id, index]),
    )
  }, [cards])

  const cardsById = useMemo(() => {
    return new Map(cards.map(card => [card.id, card]))
  }, [cards])

  const getMaxScroll = useCallback((el: HTMLDivElement) => {
    return Math.max(0, el.scrollHeight - el.clientHeight)
  }, [])

  const RUBBER_SPRING = 0.18
  const RUBBER_DAMPING = 0.72
  const MOMENTUM_TO_RUBBER = 0.42
  const RELEASE_TO_RUBBER = 0.35

  const cancelRubberReturn = useCallback(() => {
    if (rubberReturnRef.current !== null) {
      cancelAnimationFrame(rubberReturnRef.current)
      rubberReturnRef.current = null
    }
  }, [])

  const setRubberOffset = useCallback((offset: number) => {
    const content = contentRef.current
    rubberOffsetRef.current = offset

    if (!content) return

    if (Math.abs(offset) < 0.1) {
      content.style.transform = ''
      return
    }

    content.style.transform = `translateY(${offset}px)`
  }, [])

  const resetRubberOffset = useCallback((initialVelocity = 0) => {
    const content = contentRef.current
    if (!content) return

    cancelRubberReturn()

    let offset = rubberOffsetRef.current
    let velocity = initialVelocity * 16.67
    let lastTime = performance.now()

    const step = (now: number) => {
      const dt = Math.min(32, now - lastTime) / 16.67
      lastTime = now

      velocity += -offset * RUBBER_SPRING * dt
      velocity *= Math.pow(RUBBER_DAMPING, dt)
      offset += velocity * dt

      rubberOffsetRef.current = offset

      if (Math.abs(offset) < 0.25 && Math.abs(velocity) < 0.25) {
        rubberOffsetRef.current = 0
        content.style.transform = ''
        rubberReturnRef.current = null
        return
      }

      content.style.transform = `translateY(${offset}px)`
      rubberReturnRef.current = requestAnimationFrame(step)
    }

    rubberReturnRef.current = requestAnimationFrame(step)
  }, [cancelRubberReturn])

  const cancelMomentum = useCallback(() => {
    if (momentumRef.current !== null) {
      cancelAnimationFrame(momentumRef.current)
      momentumRef.current = null
    }
  }, [])

  const startMomentum = useCallback((initialVelocity: number) => {
    const el = scrollRef.current
    if (!el) return

    let velocity = initialVelocity
    let lastTime = performance.now()

    const step = (now: number) => {
      const dt = Math.min(32, now - lastTime)
      lastTime = now

      const maxScroll = getMaxScroll(el)
      const next = el.scrollTop + velocity * dt

      if (next < 0) {
        el.scrollTop = 0
        resetRubberOffset(-velocity * MOMENTUM_TO_RUBBER)
        momentumRef.current = null
        return
      }

      if (next > maxScroll) {
        el.scrollTop = maxScroll
        resetRubberOffset(-velocity * MOMENTUM_TO_RUBBER)
        momentumRef.current = null
        return
      }

      el.scrollTop = next
      velocity *= Math.pow(0.95, dt / 16.67)

      if (Math.abs(velocity) < 0.02) {
        momentumRef.current = null
        return
      }

      momentumRef.current = requestAnimationFrame(step)
    }

    momentumRef.current = requestAnimationFrame(step)
  }, [getMaxScroll, resetRubberOffset])

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    if (e.button !== 0) return

    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return

    const el = scrollRef.current
    if (!el) return
    if (el.scrollHeight <= el.clientHeight) return

    const cardEl = target.closest<HTMLElement>('[data-polaroid-card-id]')
    const tapCardIdValue = cardEl?.dataset.polaroidCardId
    const tapCardId = tapCardIdValue == null ? null : Number(tapCardIdValue)

    cancelMomentum()
    cancelRubberReturn()
    setRubberOffset(0)

    suppressPreviewClickRef.current = false

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      startScrollTop: el.scrollTop,
      lastY: e.clientY,
      lastTime: performance.now(),
      velocity: 0,
      moved: false,
      tapCardId: Number.isFinite(tapCardId) ? tapCardId : null,
    }

    el.setPointerCapture(e.pointerId)
  }, [cancelMomentum, cancelRubberReturn, setRubberOffset])

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current
    if (!state.active) return
    if (state.pointerId !== e.pointerId) return

    const el = scrollRef.current
    if (!el) return

    const now = performance.now()
    const dt = Math.max(1, now - state.lastTime)
    const dy = e.clientY - state.lastY

    const instantVelocity = -dy / dt
    state.velocity = state.velocity * 0.7 + instantVelocity * 0.3
    state.lastY = e.clientY
    state.lastTime = now

    const totalDeltaY = e.clientY - state.startY

    if (Math.abs(totalDeltaY) > 5) {
      state.moved = true
      suppressPreviewClickRef.current = true
    }

    const rawScrollTop = state.startScrollTop - totalDeltaY
    const maxScroll = getMaxScroll(el)

    if (rawScrollTop < 0) {
      el.scrollTop = 0
      setRubberOffset(-rawScrollTop * 0.35)
    } else if (rawScrollTop > maxScroll) {
      el.scrollTop = maxScroll
      setRubberOffset(-(rawScrollTop - maxScroll) * 0.35)
    } else {
      el.scrollTop = rawScrollTop
      setRubberOffset(0)
    }

    e.preventDefault()
  }, [getMaxScroll, setRubberOffset])

  const stopDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current
    if (!state.active) return
    if (state.pointerId !== e.pointerId) return

    const el = scrollRef.current
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }

    const releaseVelocity = state.velocity

    const wasTap = !state.moved && state.tapCardId !== null
    const tappedCard = wasTap ? cardsById.get(state.tapCardId!) : null

    dragRef.current.active = false
    dragRef.current.pointerId = -1
    dragRef.current.tapCardId = null
    dragRef.current.moved = false

    if (tappedCard) {
      cancelMomentum()
      cancelRubberReturn()
      setRubberOffset(0)

      setPreviewCard({
        id: tappedCard.id,
        color: tappedCard.color,
        src: tappedCard.src,
        rotation: tappedCard.rotation,
      })

      suppressPreviewClickRef.current = false
      return
    }

    const maxScroll = el ? getMaxScroll(el) : 0
    const atTop = !!el && el.scrollTop <= 0
    const atBottom = !!el && el.scrollTop >= maxScroll
    const flingOutward =
      (atTop && releaseVelocity < 0) ||
      (atBottom && releaseVelocity > 0)

    if (flingOutward) {
      resetRubberOffset(-releaseVelocity * RELEASE_TO_RUBBER)
    } else {
      resetRubberOffset()

      if (Math.abs(releaseVelocity) > 0.08) {
        startMomentum(releaseVelocity)
      }
    }

    requestAnimationFrame(() => {
      suppressPreviewClickRef.current = false
    })
  }, [
    resetRubberOffset,
    startMomentum,
    getMaxScroll,
    cardsById,
    cancelMomentum,
    cancelRubberReturn,
    setRubberOffset,
  ])

  useEffect(() => {
    return () => {
      cancelMomentum()
      cancelRubberReturn()
    }
  }, [cancelMomentum, cancelRubberReturn])

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#EEEFF4' }}>
      {/* Back button — floats above scroll */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 62,
          width: 402,
          paddingLeft: 16,
          paddingRight: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: 44,
            height: 44,
            borderRadius: 296,
            border: 'none',
            background: 'rgba(255, 255, 255, 0.65)',
            boxShadow: '0px 8px 40px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          <span
            style={{
              color: '#1A1A1A',
              fontSize: 17,
              fontFamily: 'SF Pro, SF Pro Display, -apple-system',
              fontWeight: 510,
            }}
          >
            􀯶
          </span>
        </button>
        <div style={{ width: 8, alignSelf: 'stretch', position: 'relative' }} />
      </div>

      {/* Full-screen scroll container with mouse drag-to-scroll */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          cursor: 'grab',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onLostPointerCapture={stopDrag}
      >
        <div
          ref={contentRef}
          style={{
            position: 'relative',
            width: 402,
            height: 138 + Math.ceil(cards.length / 2) * 230 + 80,
            minHeight: '100%',
            willChange: 'transform',
          }}
        >
          <FloatInGroup startDelay={100} resetKey={photos.length} step={0.18}>
            {cards.map(card => {
              const visualOrder = cardRevealOrder.get(card.id) ?? card.id
              const rowRevealIndex = Math.floor(visualOrder / 2)
              return (
                <PolaroidCard
                  key={card.id}
                  id={card.id}
                  color={card.color}
                  src={card.src}
                  left={card.left}
                  top={card.top}
                  rotation={card.rotation}
                  revealIndex={rowRevealIndex}
                />
              )
            })}
          </FloatInGroup>
        </div>
      </div>

      {/* Preview overlay */}
      <AnimatePresence>
        {previewCard && (
          <>
            <motion.div
              className="absolute inset-0 z-30 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={POLAROID_PREVIEW_BACKDROP_TRANSITION}
              onClick={() => setPreviewCard(null)}
            />

            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
              <motion.div
                layoutId={`polaroid-${previewCard.id}`}
                transition={{
                  layout: POLAROID_PREVIEW_LAYOUT_SPRING,
                }}
                style={{
                  pointerEvents: 'auto',
                  willChange: 'transform',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <PolaroidVisual
                  color={previewCard.color}
                  src={previewCard.src}
                  rotation={previewCard.rotation}
                  preview
                />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
