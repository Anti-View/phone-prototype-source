import { useState, type ReactNode } from 'react'
import TouchCursor from './TouchCursor'

export default function PhoneFrame({ children }: { children: ReactNode }) {
  const [isMobile] = useState(() =>
    typeof window !== 'undefined' && 'ontouchstart' in window,
  )

  const content = (
    <div
      className="w-screen h-screen flex items-center justify-center bg-black"
      style={{ touchAction: 'none' }}
    >
      <div
        className="w-[402px] h-[874px] rounded-[64px] overflow-hidden bg-white relative flex-shrink-0"
        style={{ touchAction: 'none' }}
      >
        {children}
      </div>
    </div>
  )

  return isMobile ? content : <TouchCursor>{content}</TouchCursor>
}
