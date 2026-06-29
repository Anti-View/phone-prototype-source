import { useCallback, useEffect, useMemo, useRef, type PointerEvent } from 'react'

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

function PolaroidCard({
  color,
  src,
  style,
}: {
  color: string
  src?: string
  style: React.CSSProperties
}) {
  return (
    <div
      className="absolute bg-white"
      style={{
        width: 144,
        height: 198,
        paddingTop: 9,
        paddingLeft: 9,
        paddingRight: 9,
        paddingBottom: 63,
        boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.04)',
        borderRadius: 6.55,
        ...style,
      }}
    >
      <div
        style={{
          width: 126,
          height: 126,
          borderRadius: 3.27,
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

  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startY: 0,
    startScrollTop: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
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

  const getMaxScroll = useCallback((el: HTMLDivElement) => {
    return Math.max(0, el.scrollHeight - el.clientHeight)
  }, [])

  const setRubberOffset = useCallback((offset: number) => {
    const content = contentRef.current
    if (!content) return
    content.style.transform = `translateY(${offset}px)`
  }, [])

  const resetRubberOffset = useCallback(() => {
    const content = contentRef.current
    if (!content) return

    const currentTransform = content.style.transform
    if (!currentTransform || currentTransform === 'translateY(0px)') {
      content.style.transform = ''
      return
    }

    content.animate(
      [
        { transform: currentTransform },
        { transform: 'translateY(0px)' },
      ],
      {
        duration: 420,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    )

    content.style.transform = ''
  }, [])

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
        setRubberOffset(24)
        resetRubberOffset()
        momentumRef.current = null
        return
      }

      if (next > maxScroll) {
        el.scrollTop = maxScroll
        setRubberOffset(-24)
        resetRubberOffset()
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
  }, [getMaxScroll, resetRubberOffset, setRubberOffset])

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    if (e.button !== 0) return

    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return

    const el = scrollRef.current
    if (!el) return
    if (el.scrollHeight <= el.clientHeight) return

    cancelMomentum()
    setRubberOffset(0)

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      startScrollTop: el.scrollTop,
      lastY: e.clientY,
      lastTime: performance.now(),
      velocity: 0,
    }

    el.setPointerCapture(e.pointerId)
  }, [cancelMomentum, setRubberOffset])

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

    dragRef.current.active = false
    dragRef.current.pointerId = -1

    resetRubberOffset()

    if (Math.abs(releaseVelocity) > 0.08) {
      startMomentum(releaseVelocity)
    }
  }, [resetRubberOffset, startMomentum])

  useEffect(() => {
    return () => {
      cancelMomentum()
    }
  }, [cancelMomentum])

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
          {cards.map(card => (
            <PolaroidCard
              key={card.id}
              color={card.color}
              src={card.src}
              style={{
                left: card.left,
                top: card.top,
                transform: `rotate(${card.rotation}deg)`,
                transformOrigin: 'center center',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
