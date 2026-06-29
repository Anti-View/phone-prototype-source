import { useCallback, useEffect, useRef, type PointerEvent } from 'react'
import { publicAsset } from '../utils/assets'

interface ThemeDetailProps {
  onApply: () => void
}

export default function ThemeDetail({ onApply }: ThemeDetailProps) {
  const previewScrollRef = useRef<HTMLDivElement | null>(null)
  const previewContentRef = useRef<HTMLDivElement | null>(null)
  const previewMomentumRef = useRef<number | null>(null)
  const previewRubberOffsetRef = useRef(0)
  const previewRubberReturnRef = useRef<number | null>(null)

  const previewDragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
  })

  const getMaxPreviewScroll = useCallback((el: HTMLDivElement) => {
    return Math.max(0, el.scrollWidth - el.clientWidth)
  }, [])

  const RUBBER_SPRING = 0.18
  const RUBBER_DAMPING = 0.72
  const MOMENTUM_TO_RUBBER = 0.42
  const RELEASE_TO_RUBBER = 0.35

  const cancelPreviewRubberReturn = useCallback(() => {
    if (previewRubberReturnRef.current !== null) {
      cancelAnimationFrame(previewRubberReturnRef.current)
      previewRubberReturnRef.current = null
    }
  }, [])

  const setPreviewRubberOffset = useCallback((offset: number) => {
    const content = previewContentRef.current
    previewRubberOffsetRef.current = offset

    if (!content) return

    if (Math.abs(offset) < 0.1) {
      content.style.transform = ''
      return
    }

    content.style.transform = `translateX(${offset}px)`
  }, [])

  const resetPreviewRubberOffset = useCallback((initialVelocity = 0) => {
    const content = previewContentRef.current
    if (!content) return

    cancelPreviewRubberReturn()

    let offset = previewRubberOffsetRef.current
    let velocity = initialVelocity * 16.67
    let lastTime = performance.now()

    const step = (now: number) => {
      const dt = Math.min(32, now - lastTime) / 16.67
      lastTime = now

      velocity += -offset * RUBBER_SPRING * dt
      velocity *= Math.pow(RUBBER_DAMPING, dt)
      offset += velocity * dt

      previewRubberOffsetRef.current = offset

      if (Math.abs(offset) < 0.25 && Math.abs(velocity) < 0.25) {
        previewRubberOffsetRef.current = 0
        content.style.transform = ''
        previewRubberReturnRef.current = null
        return
      }

      content.style.transform = `translateX(${offset}px)`
      previewRubberReturnRef.current = requestAnimationFrame(step)
    }

    previewRubberReturnRef.current = requestAnimationFrame(step)
  }, [cancelPreviewRubberReturn])

  const cancelPreviewMomentum = useCallback(() => {
    if (previewMomentumRef.current !== null) {
      cancelAnimationFrame(previewMomentumRef.current)
      previewMomentumRef.current = null
    }
  }, [])

  const startPreviewMomentum = useCallback((initialVelocity: number) => {
    const el = previewScrollRef.current
    if (!el) return

    let velocity = initialVelocity
    let lastTime = performance.now()

    const step = (now: number) => {
      const dt = Math.min(32, now - lastTime)
      lastTime = now

      const maxScroll = getMaxPreviewScroll(el)
      const next = el.scrollLeft + velocity * dt

      if (next < 0) {
        el.scrollLeft = 0
        resetPreviewRubberOffset(-velocity * MOMENTUM_TO_RUBBER)
        previewMomentumRef.current = null
        return
      }

      if (next > maxScroll) {
        el.scrollLeft = maxScroll
        resetPreviewRubberOffset(-velocity * MOMENTUM_TO_RUBBER)
        previewMomentumRef.current = null
        return
      }

      el.scrollLeft = next
      velocity *= Math.pow(0.95, dt / 16.67)

      if (Math.abs(velocity) < 0.02) {
        previewMomentumRef.current = null
        return
      }

      previewMomentumRef.current = requestAnimationFrame(step)
    }

    previewMomentumRef.current = requestAnimationFrame(step)
  }, [getMaxPreviewScroll, resetPreviewRubberOffset])

  const handlePreviewPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    if (e.button !== 0) return

    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return

    const el = previewScrollRef.current
    if (!el) return
    if (el.scrollWidth <= el.clientWidth) return

    cancelPreviewMomentum()
    cancelPreviewRubberReturn()
    setPreviewRubberOffset(0)

    previewDragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      lastX: e.clientX,
      lastTime: performance.now(),
      velocity: 0,
    }

    el.setPointerCapture(e.pointerId)
    el.style.cursor = 'grabbing'
  }, [cancelPreviewMomentum, cancelPreviewRubberReturn, setPreviewRubberOffset])

  const handlePreviewPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = previewDragRef.current
    if (!state.active) return
    if (state.pointerId !== e.pointerId) return

    const el = previewScrollRef.current
    if (!el) return

    const now = performance.now()
    const dt = Math.max(1, now - state.lastTime)
    const dx = e.clientX - state.lastX

    const instantVelocity = -dx / dt
    state.velocity = state.velocity * 0.7 + instantVelocity * 0.3
    state.lastX = e.clientX
    state.lastTime = now

    const totalDeltaX = e.clientX - state.startX
    const rawScrollLeft = state.startScrollLeft - totalDeltaX
    const maxScroll = getMaxPreviewScroll(el)

    if (rawScrollLeft < 0) {
      el.scrollLeft = 0
      setPreviewRubberOffset(-rawScrollLeft * 0.35)
    } else if (rawScrollLeft > maxScroll) {
      el.scrollLeft = maxScroll
      setPreviewRubberOffset(-(rawScrollLeft - maxScroll) * 0.35)
    } else {
      el.scrollLeft = rawScrollLeft
      setPreviewRubberOffset(0)
    }

    e.preventDefault()
  }, [getMaxPreviewScroll, setPreviewRubberOffset])

  const stopPreviewDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = previewDragRef.current
    if (!state.active) return
    if (state.pointerId !== e.pointerId) return

    const el = previewScrollRef.current
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }

    const releaseVelocity = state.velocity

    previewDragRef.current.active = false
    previewDragRef.current.pointerId = -1

    if (el) {
      el.style.cursor = ''
    }

    const maxScroll = el ? getMaxPreviewScroll(el) : 0
    const atLeft = !!el && el.scrollLeft <= 0
    const atRight = !!el && el.scrollLeft >= maxScroll
    const flingOutward =
      (atLeft && releaseVelocity < 0) ||
      (atRight && releaseVelocity > 0)

    if (flingOutward) {
      resetPreviewRubberOffset(-releaseVelocity * RELEASE_TO_RUBBER)
    } else {
      resetPreviewRubberOffset()

      if (Math.abs(releaseVelocity) > 0.08) {
        startPreviewMomentum(releaseVelocity)
      }
    }
  }, [resetPreviewRubberOffset, startPreviewMomentum, getMaxPreviewScroll])

  useEffect(() => {
    return () => {
      cancelPreviewMomentum()
      cancelPreviewRubberReturn()
    }
  }, [cancelPreviewMomentum, cancelPreviewRubberReturn])

  return (
    <div className="absolute inset-0 z-0 select-none">
      {/* Theme Title + Meta */}
      <div className="absolute left-4 top-[122px] flex flex-col gap-2" style={{ fontFamily: "var(--font-ui)" }}>
        <h1 className="text-[28px] font-semibold text-black leading-tight">主题名称</h1>
        <div className="flex items-center gap-1">
          <span className="text-[15px] text-black/50">150.73MB | 耗电等级</span>
          <span className="w-4 h-4 bg-[#63CC2B] rounded-full flex items-center justify-center">
            <span className="text-white text-[12px] font-medium">1</span>
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="absolute left-4 top-[206px] flex items-center gap-2" style={{ fontFamily: "var(--font-ui)" }}>
        {['趣味', '个性', '3D'].map(tag => (
          <span key={tag} className="px-3 py-1 bg-black/[0.05] rounded-[100px] text-[14px] text-black/50">
            {tag}
          </span>
        ))}
      </div>

      {/* Preview Cards — pointer drag + momentum + rubber band */}
      <div
        ref={previewScrollRef}
        className="absolute top-[258px] left-0 w-full overflow-x-auto overscroll-contain [&::-webkit-scrollbar]:hidden"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          cursor: 'grab',
          touchAction: 'pan-x',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        onPointerDown={handlePreviewPointerDown}
        onPointerMove={handlePreviewPointerMove}
        onPointerUp={stopPreviewDrag}
        onPointerCancel={stopPreviewDrag}
      >
        <div ref={previewContentRef} className="flex gap-[16px] w-max">
          <img src={publicAsset('img/主题详情页1.png')} alt="" className="w-[228px] h-[396px] rounded-[32px] flex-shrink-0 object-cover hover-darken" draggable={false} />
          <img src={publicAsset('img/主题详情页2.png')} alt="" className="w-[228px] h-[396px] rounded-[32px] flex-shrink-0 object-cover hover-darken" draggable={false} />
          <img src={publicAsset('img/主题详情页3.png')} alt="" className="w-[228px] h-[396px] rounded-[32px] flex-shrink-0 object-cover hover-darken" draggable={false} />
        </div>
      </div>

      {/* Content Description */}
      <div className="absolute left-4 top-[678px] flex flex-col gap-2" style={{ fontFamily: "var(--font-ui)" }}>
        <h3 className="text-[17px] font-medium text-black">内容简介</h3>
        <p
          className="w-[370px] text-[14px] text-black/80 leading-relaxed"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          HarmonyOS 6.1 及以上版本适用。萌主全新升级，互动焕新登场！为萌主换上专属套装，一起闯入奇妙小世界
        </p>
      </div>

      {/* CTA Button — Figma shadow: 0px 8px 40px rgba(0,0,0,0.12) */}
      <div className="absolute left-4 right-4 bottom-8 flex justify-center">
        <button
          onClick={onApply}
          className="w-[370px] h-[52px] bg-[#0088FF] text-white text-[17px] font-medium rounded-[1000px] hover-darken active:scale-[0.98] transition-transform cursor-pointer"
          style={{ boxShadow: '0px 8px 40px rgba(0, 0, 0, 0.12)', fontFamily: "var(--font-ui)" }}
        >
          去应用
        </button>
      </div>
    </div>
  )
}
