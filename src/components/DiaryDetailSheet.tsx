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
  const detailMomentumRef = useRef<number | null>(null)
  const [showTopFade, setShowTopFade] = useState(false)

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
        detailMomentumRef.current = null
        return
      }

      if (next > maxScroll) {
        el.scrollTop = maxScroll
        updateTopFade()
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
  }, [getDetailMaxScroll, updateTopFade])

  const handleDetailPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    if (e.button !== 0) return

    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return

    const el = detailScrollRef.current
    if (!el) return
    if (el.scrollHeight <= el.clientHeight) return

    cancelDetailMomentum()

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
  }, [cancelDetailMomentum])

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

    el.scrollTop = Math.max(0, Math.min(maxScroll, rawScrollTop))
    updateTopFade()

    e.preventDefault()
  }, [getDetailMaxScroll, updateTopFade])

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

    if (Math.abs(releaseVelocity) > 0.08) {
      startDetailMomentum(releaseVelocity)
    }
  }, [startDetailMomentum])

  useEffect(() => {
    return () => {
      cancelDetailMomentum()
    }
  }, [cancelDetailMomentum])

  useEffect(() => {
    const el = detailScrollRef.current
    if (el) {
      el.scrollTop = 0
    }
    setShowTopFade(false)
  }, [entry.id])

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

      {/* Animated sheet — spring directly positioned, top can overshoot freely */}
      <motion.div
        className="absolute left-0 right-0 top-[62px] bottom-0 z-[60] pointer-events-auto"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{
          type: 'spring',
          damping: 28,
          stiffness: 280,
          mass: 1.1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
          {/* Real visible sheet */}
          <div
            className="relative w-full h-full bg-white rounded-t-[38px] flex flex-col overflow-hidden"
            style={{
              boxShadow: '0px 15px 75px rgba(0, 0, 0, 0.18)',
              fontFamily: 'var(--font-ui)',
            }}
          >
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
                paddingBottom: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
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
                }}
                draggable={false}
              />
            </div>
          </div>
        </div>
        </div>
        {/* Bottom bleed: fills gap during spring overshoot */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-full h-[120px] bg-white"
        />
      </motion.div>
    </>
  )
}
