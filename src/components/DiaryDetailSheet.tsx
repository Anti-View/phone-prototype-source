import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { motion } from 'framer-motion'
import type { DiaryEntry } from '../types/diary'
import { publicAsset } from '../utils/assets'

function InfoPill({ icon, text }: { icon: string; text: string }) {
  return (
    <div
      style={{
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 10,
        paddingBottom: 10,
        borderRadius: 100,
        outline: '1px rgba(0, 0, 0, 0.10) solid',
        outlineOffset: -1,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: 'rgba(0, 0, 0, 0.50)',
          fontSize: 14,
          fontFamily: 'SF Pro, SF Pro Display, -apple-system',
          fontWeight: 400,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          color: 'rgba(0, 0, 0, 0.50)',
          fontSize: 14,
          fontFamily: 'PingFang SC, sans-serif',
          fontWeight: 400,
        }}
      >
        {text}
      </div>
    </div>
  )
}

export default function DiaryDetailSheet({
  entry,
  onClose,
}: {
  entry: DiaryEntry
  onClose: () => void
}) {
  const detailScrollRef = useRef<HTMLDivElement | null>(null)
  const detailContentRef = useRef<HTMLDivElement | null>(null)
  const detailMomentumRef = useRef<number | null>(null)
  const detailRubberOffsetRef = useRef(0)
  const detailRubberReturnRef = useRef<number | null>(null)
  const layoutFrameRef = useRef<HTMLDivElement | null>(null)
  const [showTopFade, setShowTopFade] = useState(false)

  const RUBBER_SPRING = 0.18
  const RUBBER_DAMPING = 0.72
  const MOMENTUM_TO_RUBBER = 0.42
  const RELEASE_TO_RUBBER = 0.35
  const DETAIL_BOTTOM_SAFE = 40

  const updateTopFade = useCallback(() => {
    const el = detailScrollRef.current
    if (!el) {
      setShowTopFade(false)
      return
    }
    setShowTopFade(el.scrollTop > 1)
  }, [])

  const detailDragRef = useRef({
    active: false,
    pointerId: -1,
    startY: 0,
    startScrollTop: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
  })

  const getDetailMaxScroll = useCallback((el: HTMLDivElement) => {
    return Math.max(0, el.scrollHeight - el.clientHeight)
  }, [])

  const cancelDetailMomentum = useCallback(() => {
    if (detailMomentumRef.current !== null) {
      cancelAnimationFrame(detailMomentumRef.current)
      detailMomentumRef.current = null
    }
  }, [])

  const cancelDetailRubberReturn = useCallback(() => {
    if (detailRubberReturnRef.current !== null) {
      cancelAnimationFrame(detailRubberReturnRef.current)
      detailRubberReturnRef.current = null
    }
  }, [])

  const setDetailRubberOffset = useCallback((offset: number) => {
    const content = detailContentRef.current
    detailRubberOffsetRef.current = offset
    if (!content) return
    if (Math.abs(offset) < 0.1) {
      content.style.transform = ''
      return
    }
    content.style.transform = `translateY(${offset}px)`
  }, [])

  const resetDetailRubberOffset = useCallback((initialVelocity = 0) => {
    const content = detailContentRef.current
    if (!content) return

    cancelDetailRubberReturn()

    let offset = detailRubberOffsetRef.current
    let velocity = initialVelocity * 16.67
    let lastTime = performance.now()

    const step = (now: number) => {
      const dt = Math.min(32, now - lastTime) / 16.67
      lastTime = now

      velocity += -offset * RUBBER_SPRING * dt
      velocity *= Math.pow(RUBBER_DAMPING, dt)
      offset += velocity * dt

      detailRubberOffsetRef.current = offset

      if (Math.abs(offset) < 0.25 && Math.abs(velocity) < 0.25) {
        detailRubberOffsetRef.current = 0
        content.style.transform = ''
        detailRubberReturnRef.current = null
        return
      }

      content.style.transform = `translateY(${offset}px)`
      detailRubberReturnRef.current = requestAnimationFrame(step)
    }

    detailRubberReturnRef.current = requestAnimationFrame(step)
  }, [cancelDetailRubberReturn])

  const startDetailMomentum = useCallback((initialVelocity: number) => {
    const el = detailScrollRef.current
    if (!el) return

    let velocity = initialVelocity
    let lastTime = performance.now()

    const step = (now: number) => {
      const dt = Math.min(32, now - lastTime)
      lastTime = now

      const maxScroll = getDetailMaxScroll(el)
      const next = el.scrollTop + velocity * dt

      if (next < 0) {
        el.scrollTop = 0
        updateTopFade()
        resetDetailRubberOffset(-velocity * MOMENTUM_TO_RUBBER)
        detailMomentumRef.current = null
        return
      }

      if (next > maxScroll) {
        el.scrollTop = maxScroll
        updateTopFade()
        resetDetailRubberOffset(-velocity * MOMENTUM_TO_RUBBER)
        detailMomentumRef.current = null
        return
      }

      el.scrollTop = next
      updateTopFade()
      velocity *= Math.pow(0.95, dt / 16.67)

      if (Math.abs(velocity) < 0.02) {
        detailMomentumRef.current = null
        return
      }

      detailMomentumRef.current = requestAnimationFrame(step)
    }

    detailMomentumRef.current = requestAnimationFrame(step)
  }, [getDetailMaxScroll, updateTopFade, resetDetailRubberOffset])

  const handleDetailPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    if (e.button !== 0) return

    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return

    const el = detailScrollRef.current
    if (!el) return
    if (el.scrollHeight <= el.clientHeight) return

    cancelDetailMomentum()
    cancelDetailRubberReturn()
    setDetailRubberOffset(0)

    detailDragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      startScrollTop: el.scrollTop,
      lastY: e.clientY,
      lastTime: performance.now(),
      velocity: 0,
    }

    el.style.cursor = 'grabbing'
    el.setPointerCapture(e.pointerId)
  }, [cancelDetailMomentum, cancelDetailRubberReturn, setDetailRubberOffset])

  const handleDetailPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = detailDragRef.current
    if (!state.active) return
    if (state.pointerId !== e.pointerId) return

    const el = detailScrollRef.current
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
    const maxScroll = getDetailMaxScroll(el)

    if (rawScrollTop < 0) {
      el.scrollTop = 0
      setDetailRubberOffset(-rawScrollTop * 0.35)
    } else if (rawScrollTop > maxScroll) {
      el.scrollTop = maxScroll
      setDetailRubberOffset(-(rawScrollTop - maxScroll) * 0.35)
    } else {
      el.scrollTop = rawScrollTop
      setDetailRubberOffset(0)
    }

    updateTopFade()

    e.preventDefault()
  }, [getDetailMaxScroll, updateTopFade, setDetailRubberOffset])

  const stopDetailDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = detailDragRef.current
    if (!state.active) return
    if (state.pointerId !== e.pointerId) return

    const el = detailScrollRef.current
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }

    if (el) {
      el.style.cursor = 'grab'
    }

    detailDragRef.current.active = false
    detailDragRef.current.pointerId = -1

    const releaseVelocity = state.velocity
    const maxScroll = el ? getDetailMaxScroll(el) : 0
    const atTop = !!el && el.scrollTop <= 0
    const atBottom = !!el && el.scrollTop >= maxScroll
    const flingOutward =
      (atTop && releaseVelocity < 0) ||
      (atBottom && releaseVelocity > 0)

    if (flingOutward) {
      resetDetailRubberOffset(-releaseVelocity * RELEASE_TO_RUBBER)
    } else {
      resetDetailRubberOffset()

      if (Math.abs(releaseVelocity) > 0.08) {
        startDetailMomentum(releaseVelocity)
      }
    }
  }, [getDetailMaxScroll, resetDetailRubberOffset, startDetailMomentum])

  useEffect(() => {
    return () => {
      cancelDetailMomentum()
      cancelDetailRubberReturn()
    }
  }, [cancelDetailMomentum, cancelDetailRubberReturn])

  useEffect(() => {
    const el = detailScrollRef.current
    if (el) {
      el.scrollTop = 0
    }
    cancelDetailMomentum()
    cancelDetailRubberReturn()
    setDetailRubberOffset(0)
    setShowTopFade(false)
  }, [entry.id, cancelDetailMomentum, cancelDetailRubberReturn, setDetailRubberOffset])

  return (
    <>
      {/* Dark backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />

      {/* Animated sheet — 1000px body, 932px visible, spring overshoot covered */}
      <motion.div
        className="absolute left-0 right-0 top-[62px] z-[60] h-[1000px] pointer-events-auto"
        initial={{ y: 932 }}
        animate={{ y: 0 }}
        exit={{ y: 932 }}
        transition={{
          type: 'spring',
          damping: 28,
          stiffness: 280,
          mass: 1.1,
        }}
        onUpdate={(latest: any) => {
          const rawY = latest.y as number
          const y = typeof rawY === 'number' ? rawY : Number.parseFloat(String(rawY ?? 0))
          const layout = layoutFrameRef.current
          if (!layout) return
          const compensate = Number.isFinite(y) && y < 0 ? -y : 0
          if (compensate > 0.1) {
            layout.style.transform = `translateY(${compensate}px)`
          } else {
            layout.style.transform = ''
          }
        }}
        onAnimationComplete={() => {
          const layout = layoutFrameRef.current
          if (layout) layout.style.transform = ''
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* One continuous white background — no seams */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-white rounded-t-[38px]"
          style={{
            boxShadow: '0px 15px 75px rgba(0, 0, 0, 0.18)',
          }}
        />

        {/* Overshoot-safe visual shell: 932px to avoid clipping during spring */}
        <div
          className="relative z-10 w-full h-[932px] rounded-t-[38px] overflow-hidden"
          style={{
            fontFamily: 'var(--font-ui)',
          }}
        >
          {/* Real layout frame: 812px keeps internal flex math unchanged */}
          <div ref={layoutFrameRef} className="w-full h-[812px] flex flex-col">
        {/* ── Top handle + controls ── */}
        <div
          style={{
            paddingBottom: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              height: 16,
              paddingTop: 5,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 36,
                height: 5,
                borderRadius: 999,
                background: '#CCCCCC',
              }}
            />
          </div>

          <div
            style={{
              alignSelf: 'stretch',
              paddingLeft: 16,
              paddingRight: 16,
              position: 'relative',
              display: 'inline-flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              style={{
                width: 44,
                height: 44,
                paddingLeft: 4,
                paddingRight: 4,
                position: 'relative',
                borderRadius: 296,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                border: 'none',
                background: 'rgba(120, 120, 128, 0.16)',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 36,
                  alignSelf: 'stretch',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  color: '#727272',
                  fontSize: 17,
                  fontFamily: 'SF Pro, SF Pro Display, -apple-system',
                  fontWeight: 510,
                }}
              >
                􀆄
              </span>
            </button>

            <div style={{ width: 8, alignSelf: 'stretch', position: 'relative' }} />
            <div style={{ width: 36, height: 22, left: 183, top: 13, position: 'absolute' }} />
          </div>
        </div>

        {/* ── Content area ── */}
        <div
          style={{
            alignSelf: 'stretch',
            flex: 1,
            minHeight: 0,
            paddingTop: 24,
            paddingLeft: 24,
            paddingRight: 24,
            paddingBottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 24,
            overflow: 'hidden',
          }}
        >
          {/* ── Header: date + time + pills + tags (fixed) ── */}
          <div
            style={{
              alignSelf: 'stretch',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              gap: 24,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                alignSelf: 'stretch',
                display: 'inline-flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  gap: 4,
                }}
              >
                <div
                  style={{
                    color: 'rgba(0, 0, 0, 0.90)',
                    fontSize: 24,
                    fontFamily: 'PingFang SC, sans-serif',
                    fontWeight: 600,
                  }}
                >
                  {entry.date}
                </div>
                <div
                  style={{
                    color: 'rgba(0, 0, 0, 0.50)',
                    fontSize: 15,
                    fontFamily: 'PingFang SC, sans-serif',
                    fontWeight: 400,
                  }}
                >
                  今天 {entry.time}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <InfoPill icon="􀉣" text={`${entry.linkCount}个链接`} />
                <InfoPill icon="􀏅" text={`${entry.imageCount}张配图`} />
              </div>
            </div>

            <div
              style={{
                color: '#605C94',
                fontSize: 15,
                fontFamily: 'PingFang SC, sans-serif',
                fontWeight: 400,
              }}
            >
              {entry.tags.map(tag => `#${tag}`).join('  ')}
            </div>
          </div>

          {/* ── Player (fixed) ── */}
          <img
            src={publicAsset('img/player.png')}
            alt=""
            style={{
              width: 354,
              height: 56,
              flexShrink: 0,
            }}
            draggable={false}
          />

          {/* ── Scroll window: text + image ── */}
          <div
            style={{
              alignSelf: 'stretch',
              position: 'relative',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {/* Top fade mask — only visible when scrolled */}
            <motion.div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: 32,
                pointerEvents: 'none',
                zIndex: 2,
                opacity: showTopFade ? 1 : 0,
                background:
                  'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.72) 42%, rgba(255, 255, 255, 0) 100%)',
              }}
              animate={{ opacity: showTopFade ? 1 : 0 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            />

            <div
              ref={detailScrollRef}
              className="overflow-y-auto overscroll-contain"
              style={{
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                touchAction: 'pan-y',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                cursor: 'grab',
              }}
              onScroll={updateTopFade}
              onPointerDown={handleDetailPointerDown}
              onPointerMove={handleDetailPointerMove}
              onPointerUp={stopDetailDrag}
              onPointerCancel={stopDetailDrag}
              onLostPointerCapture={stopDetailDrag}
            >
              <div
                ref={detailContentRef}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                  willChange: 'transform',
                }}
              >
                {/* Full text */}
                <div
                  style={{
                    alignSelf: 'stretch',
                    color: 'rgba(0, 0, 0, 0.90)',
                    opacity: 0.65,
                    fontSize: 16,
                    fontFamily: 'PingFang SC, sans-serif',
                    fontWeight: 400,
                    lineHeight: '24px',
                    whiteSpace: 'pre-wrap',
                    flexShrink: 0,
                  }}
                >{entry.fullText.trim()}</div>

                {/* Content image */}
                <img
                  src={publicAsset('img/content_image.png')}
                  alt=""
                  style={{
                    alignSelf: 'stretch',
                    height: 200,
                    borderRadius: 32,
                    objectFit: 'cover',
                    flexShrink: 0,
                    display: 'block',
                  }}
                  draggable={false}
                />

                <div
                  aria-hidden="true"
                  style={{
                    height: DETAIL_BOTTOM_SAFE,
                    flexShrink: 0,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        </div>
        </div>
      </motion.div>
    </>
  )
}
