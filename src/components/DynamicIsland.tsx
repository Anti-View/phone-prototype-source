import { type ReactNode, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type IslandVariant = 'square' | 'wide'

const VARIANTS = {
  square: { w: 264, h: 264, left: 69,  radius: 56 },
  wide:   { w: 370, h: 240, left: 16,  radius: 56 },
} as const

const ISLAND_EXPAND_SPRING = {
  type: 'spring' as const,
  stiffness: 170,
  damping: 18,
  mass: 1,
}

const ISLAND_COLLAPSE_SPRING = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 32,
  mass: 1,
}

const ISLAND_EXPAND_BLUR_TRANSITION = {
  duration: 0.28,
  times: [0, 0.45, 1],
  ease: [0.22, 1, 0.36, 1] as const,
}

const ISLAND_COLLAPSE_BLUR_TRANSITION = {
  duration: 0.2,
  times: [0, 0.45, 1],
  ease: [0.22, 1, 0.36, 1] as const,
}

interface DynamicIslandProps {
  expanded: boolean
  variant?: IslandVariant
  onClose: () => void
  children?: ReactNode
  style?: CSSProperties
}

export default function DynamicIsland({ expanded, variant = 'square', onClose, children, style }: DynamicIslandProps) {
  const v = VARIANTS[variant]

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: expanded ? 50 : 40 }}>
      {/* Backdrop — tap to dismiss */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="absolute inset-0 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Island shell */}
      <motion.div
        className="absolute pointer-events-auto overflow-hidden bg-black"
        initial={false}
        style={{
          ...style,
          willChange: 'left, top, width, height, border-radius, filter',
        }}
        animate={{
          left: expanded ? v.left : 186,
          top: 16,
          width: expanded ? v.w : 30,
          height: expanded ? v.h : 30,
          borderRadius: expanded ? v.radius : 30,
          filter: expanded
            ? ['blur(0px)', 'blur(3px)', 'blur(0px)']
            : ['blur(0px)', 'blur(2px)', 'blur(0px)'],
        }}
        transition={{
          left: expanded ? ISLAND_EXPAND_SPRING : ISLAND_COLLAPSE_SPRING,
          top: expanded ? ISLAND_EXPAND_SPRING : ISLAND_COLLAPSE_SPRING,
          width: expanded ? ISLAND_EXPAND_SPRING : ISLAND_COLLAPSE_SPRING,
          height: expanded ? ISLAND_EXPAND_SPRING : ISLAND_COLLAPSE_SPRING,
          borderRadius: expanded ? ISLAND_EXPAND_SPRING : ISLAND_COLLAPSE_SPRING,
          filter: expanded
            ? ISLAND_EXPAND_BLUR_TRANSITION
            : ISLAND_COLLAPSE_BLUR_TRANSITION,
        }}
      >
        {/* UI content — individual items animate with FloatIn */}
        {expanded && (
          <div className="w-full h-full">
            {children}
          </div>
        )}
      </motion.div>
    </div>
  )
}
