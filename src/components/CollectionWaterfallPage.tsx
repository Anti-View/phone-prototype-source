import { useCallback, useEffect, useRef, type PointerEvent } from 'react'
import NavBar from './NavBar'

export default function CollectionWaterfallPage({
  onBack,
}: {
  onBack: () => void
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const momentumRef = useRef<number | null>(null)
  const rubberOffsetRef = useRef(0)
  const rubberReturnRef = useRef<number | null>(null)

  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startY: 0,
    startScrollTop: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    moved: false,
  })

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

    cancelMomentum()
    cancelRubberReturn()
    setRubberOffset(0)

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      startScrollTop: el.scrollTop,
      lastY: e.clientY,
      lastTime: performance.now(),
      velocity: 0,
      moved: false,
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
    if (Math.abs(totalDeltaY) > 6) {
      state.moved = true
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

    dragRef.current.active = false
    dragRef.current.pointerId = -1
    dragRef.current.moved = false

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
  }, [resetRubberOffset, startMomentum, getMaxScroll])

  useEffect(() => {
    return () => {
      cancelMomentum()
      cancelRubberReturn()
    }
  }, [cancelMomentum, cancelRubberReturn])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: '#EEEFF4' }} />

      <NavBar onHome={onBack} />

      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onLostPointerCapture={stopDrag}
      >
        <div
          ref={contentRef}
          className="flex flex-col"
          style={{
            paddingTop: 130,
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 40,
            minHeight: '100%',
            willChange: 'transform',
          }}
        >
          {/* Future collection content goes here. */}
        </div>
      </div>
    </div>
  )
}
