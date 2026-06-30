import { useEffect, useState, type ReactNode } from 'react'
import TouchCursor from './TouchCursor'
import { publicAsset } from '../utils/assets'

const PHONE_WIDTH = 402
const PHONE_HEIGHT = 874
const MAX_PHONE_SCALE = 1

function getViewportSize() {
  if (typeof window === 'undefined') {
    return { width: PHONE_WIDTH, height: PHONE_HEIGHT }
  }

  const visualViewport = window.visualViewport

  return {
    width: visualViewport?.width ?? window.innerWidth,
    height: visualViewport?.height ?? window.innerHeight,
  }
}

function getPhoneScale() {
  if (typeof window === 'undefined') return MAX_PHONE_SCALE

  const { width, height } = getViewportSize()

  if (width <= 0 || height <= 0) return MAX_PHONE_SCALE

  return Math.min(width / PHONE_WIDTH, height / PHONE_HEIGHT, MAX_PHONE_SCALE)
}

export default function PhoneFrame({ children }: { children: ReactNode }) {
  const [isMobile] = useState(() =>
    typeof window !== 'undefined' && 'ontouchstart' in window,
  )

  const [scale, setScale] = useState(() => getPhoneScale())

  useEffect(() => {
    const updateScale = () => {
      setScale(getPhoneScale())
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
          width: PHONE_WIDTH * scale,
          height: PHONE_HEIGHT * scale,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <img
          src={publicAsset('bg.jpg')}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: PHONE_WIDTH * scale,
            height: PHONE_HEIGHT * scale,
            objectFit: 'cover',
            display: 'block',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          draggable={false}
        />

        <div
          className="rounded-[64px] overflow-hidden bg-white relative"
          style={{
            width: PHONE_WIDTH,
            height: PHONE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )

  return isMobile ? content : <TouchCursor>{content}</TouchCursor>
}
