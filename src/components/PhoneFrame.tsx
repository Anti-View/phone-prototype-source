import { useEffect, useState, type ReactNode } from 'react'
import TouchCursor from './TouchCursor'
import { publicAsset } from '../utils/assets'

const PHONE_WIDTH = 402
const PHONE_HEIGHT = 874
const STAGE_WIDTH = 1920
const STAGE_HEIGHT = 1080
const MAX_STAGE_SCALE = 1

function getViewportSize() {
  if (typeof window === 'undefined') {
    return { width: STAGE_WIDTH, height: STAGE_HEIGHT }
  }

  const visualViewport = window.visualViewport

  return {
    width: visualViewport?.width ?? window.innerWidth,
    height: visualViewport?.height ?? window.innerHeight,
  }
}

function getStageScale() {
  if (typeof window === 'undefined') return MAX_STAGE_SCALE

  const { height } = getViewportSize()

  if (height <= 0) return MAX_STAGE_SCALE

  return Math.min(
    height / STAGE_HEIGHT,
    MAX_STAGE_SCALE,
  )
}

export default function PhoneFrame({ children }: { children: ReactNode }) {
  const [isMobile] = useState(() =>
    typeof window !== 'undefined' && 'ontouchstart' in window,
  )

  const [scale, setScale] = useState(() => getStageScale())

  useEffect(() => {
    const updateScale = () => {
      setScale(getStageScale())
    }

    updateScale()

    window.addEventListener('resize', updateScale)
    window.addEventListener('orientationchange', updateScale)
    window.visualViewport?.addEventListener('resize', updateScale)

    return () => {
      window.removeEventListener('resize', updateScale)
      window.removeEventListener('orientationchange', updateScale)
      window.visualViewport?.removeEventListener('resize', updateScale)
    }
  }, [])

  const phoneLeft = (STAGE_WIDTH - PHONE_WIDTH) / 2
  const phoneTop = (STAGE_HEIGHT - PHONE_HEIGHT) / 2

  const content = (
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        minHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overscrollBehavior: 'none',
        background: '#D8E2FF',
      }}
    >
      <div
        style={{
          width: STAGE_WIDTH * scale,
          height: STAGE_HEIGHT * scale,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            position: 'relative',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <img
            src={publicAsset('img/bg.jpg')}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: STAGE_WIDTH,
              height: STAGE_HEIGHT,
              display: 'block',
              objectFit: 'fill',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            draggable={false}
          />

          <div
            style={{
              position: 'absolute',
              left: phoneLeft,
              top: phoneTop,
              width: PHONE_WIDTH,
              height: PHONE_HEIGHT,
              zIndex: 1,
              borderRadius: 64,
              boxShadow: '0 0 0 12px rgba(255, 255, 255, 0.50)',
              background: '#FFFFFF',
              isolation: 'isolate',
              transform: 'translateZ(0)',
              WebkitTransform: 'translateZ(0)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: PHONE_WIDTH,
                height: PHONE_HEIGHT,
                borderRadius: 64,
                overflow: 'hidden',
                background: '#FFFFFF',
                clipPath: 'inset(0 round 64px)',
                WebkitClipPath: 'inset(0 round 64px)',
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {children}
            </div>

            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 64,
                pointerEvents: 'none',
                zIndex: 2,
                boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.95)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )

  return isMobile ? content : <TouchCursor>{content}</TouchCursor>
}
